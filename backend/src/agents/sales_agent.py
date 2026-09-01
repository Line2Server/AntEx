"""
LangGraph Sales Agent — AntEx B2B Coffee
Grafo de vendas: saudação → qualificação → portfólio → orçamento → entrega → fechamento → handoff
"""
from __future__ import annotations

import json
from typing import Annotated, Sequence, TypedDict, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from src.agents.prompts import SYSTEM_PROMPT
from src.tools.delivery_tools import verificar_viabilidade_entrega
from src.tools.portfolio_tools import consultar_portfolio, calcular_orcamento
from src.database import settings


# ── State ──────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda x, y: list(x) + list(y)]
    session_id: str
    cliente_whatsapp: str
    handoff: bool


# ── Tools & Model ───────────────────────────────────────────────────────────
TOOLS = [verificar_viabilidade_entrega, consultar_portfolio, calcular_orcamento]

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.4,
    api_key=settings.OPENAI_API_KEY,
)

llm_with_tools = llm.bind_tools(TOOLS)
tool_node = ToolNode(TOOLS)


# ── Nodes ───────────────────────────────────────────────────────────────────
def call_model(state: AgentState) -> dict:
    """Chama o LLM com o histórico de mensagens."""
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def check_handoff(state: AgentState) -> dict:
    """Detecta se o agente solicitou handoff humano."""
    last = state["messages"][-1]
    if hasattr(last, "content") and "HANDOFF_HUMANO" in str(last.content):
        return {"handoff": True}
    return {"handoff": False}


# ── Routing ─────────────────────────────────────────────────────────────────
def should_continue(state: AgentState) -> Literal["tools", "check_handoff"]:
    """Roteamento: se há tool_calls, vai para tools; senão, verifica handoff."""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "check_handoff"


def after_handoff_check(state: AgentState) -> Literal["agent", END]:
    """Se handoff foi ativado, encerra; senão volta para o agente."""
    if state.get("handoff"):
        return END
    return "agent"


# ── Build Graph ─────────────────────────────────────────────────────────────
def build_sales_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)
    graph.add_node("check_handoff", check_handoff)

    graph.set_entry_point("agent")

    graph.add_conditional_edges(
        "agent",
        should_continue,
        {"tools": "tools", "check_handoff": "check_handoff"},
    )

    graph.add_edge("tools", "agent")

    graph.add_conditional_edges(
        "check_handoff",
        after_handoff_check,
        {"agent": END, END: END},
    )

    return graph.compile()


# ── Singleton ────────────────────────────────────────────────────────────────
sales_graph = build_sales_graph()


# ── Public API ───────────────────────────────────────────────────────────────
async def process_message(
    session_id: str,
    whatsapp: str,
    message: str,
    history: list[dict],
) -> dict:
    """
    Processa uma mensagem do WhatsApp e retorna a resposta do agente.

    Args:
        session_id: ID único da sessão (armazenada no Redis).
        whatsapp: Número do cliente.
        message: Texto da mensagem recebida.
        history: Histórico de mensagens [{role, content}].

    Returns:
        dict com 'response', 'handoff', 'order_data' (se pedido confirmado).
    """
    # Reconstrói o histórico
    messages: list[BaseMessage] = []
    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=message))

    initial_state: AgentState = {
        "messages": messages,
        "session_id": session_id,
        "cliente_whatsapp": whatsapp,
        "handoff": False,
    }

    result = await sales_graph.ainvoke(initial_state)

    last_msg = result["messages"][-1]
    response_text = str(last_msg.content)

    # Detecta pedido confirmado
    order_data = None
    if "PEDIDO_CONFIRMADO" in response_text:
        order_data = _parse_order(response_text)

    return {
        "response": response_text,
        "handoff": result.get("handoff", False),
        "order_data": order_data,
    }


def _parse_order(text: str) -> dict | None:
    """Extrai dados estruturados do pedido confirmado pelo agente."""
    try:
        lines = text.split("\n")
        data = {}
        for line in lines:
            if ":" in line and not line.startswith("PEDIDO"):
                key, _, value = line.partition(":")
                data[key.strip()] = value.strip()
        return data if data else None
    except Exception:
        return None
