Aqui está a especificação arquitetural e técnica completa para o desenvolvimento do seu Agente Vendedor de Café, incluindo a interface de gestão (Dashboard Admin), a lógica de regras de negócio (distância e pedido mínimo) e o módulo de geração de conteúdo por IA baseado em métricas.

Você pode fornecer este documento e os códigos abaixo diretamente para o seu Agente Desenvolvedor (Claude Code, Cursor, Devin, etc.) para que ele crie o repositório e os módulos.

🏗️ 1. Arquitetura Geral do Sistema
                               ┌─────────────────────────────────────────┐
                               │       Canais de Atendimento             │
                               │  (WhatsApp via Evolution API / Web)     │
                               └────────────────────┬────────────────────┘
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │           FastAPI Gateway               │
                               │      (Webhooks / Autenticação)          │
                               └────────────────────┬────────────────────┘
                                                    │
             ┌──────────────────────────────────────┼──────────────────────────────────────┐
             │                                      │                                      │
             ▼                                      ▼                                      ▼
┌─────────────────────────┐            ┌─────────────────────────┐            ┌─────────────────────────┐
│   LangGraph Engine      │            │   Database & Cache      │            │   Dashboard Admin       │
│ - Gestão do Funil       │            │ - PostgreSQL + pgvector │            │   (Next.js / React)     │
│ - Validação de Regras   │            │ - Redis (Sessões)       │            │ - Gestão de Pedidos     │
│ - Tools de Vendas       │            └─────────────────────────┘            │ - Métricas & Gerador IA │
└─────────────────────────┘                                                   └─────────────────────────┘
☕ 2. Regras de Negócio do Café (Tools para o Agente)
O agente deve validar a distância de entrega (usando a API do Google Maps / Haversine) e o valor mínimo do pedido antes de fechar o carrinho.

Código Python (src/tools/cafeteria_tools.py)
Python
import math
from typing import Dict, Any
from langchain_core.tools import tool

# Configurações do Estabelecimento
LAT_CAFETERIA = -16.686891  # Exemplo: Goiânia
LON_CAFETERIA = -49.264794
RAIO_MAXIMO_KM = 8.0        # Limite máximo de entrega
PEDIDO_MINIMO_BRL = 25.0    # Preço mínimo estabelecido

def calcular_distancia_haversine(lat2: float, lon2: float) -> float:
    """Calcula a distância em KM entre a cafeteria e o cliente."""
    R = 6371.0  # Raio da Terra em km
    dlat = math.radians(lat2 - LAT_CAFETERIA)
    dlon = math.radians(lon2 - LON_CAFETERIA)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(LAT_CAFETERIA)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

@tool
def verificar_viabilidade_entrega(lat_cliente: float, lon_cliente: float, valor_carrinho: float) -> str:
    """Verifica se a entrega é possível com base na distância e valor mínimo do pedido."""
    distancia = calcular_distancia_haversine(lat_cliente, lon_cliente)
    
    if distancia > RAIO_MAXIMO_KM:
        return f"RECUSADO: O endereço está a {distancia}km. Nosso limite máximo de entrega é de {RAIO_MAXIMO_KM}km."
    
    if valor_carrinho < PEDIDO_MINIMO_BRL:
        falta = PEDIDO_MINIMO_BRL - valor_carrinho
        return f"RECUSADO: O valor do pedido é R$ {valor_carrinho:.2f}. O pedido mínimo é R$ {PEDIDO_MINIMO_BRL:.2f} (faltam R$ {falta:.2f})."
    
    taxa_entrega = 5.0 + (distancia * 1.5)  # Cálculo dinâmico de taxa
    return f"APROVADO: Distância {distancia}km. Taxa de entrega: R$ {taxa_entrega:.2f}. Pedido liberado!"

@tool
def consultar_cardapio_cafe(categoria: str = "todos") -> str:
    """Retorna os itens do cardápio de cafés, grãos, acompanhamentos e bebidas."""
    cardapio = {
        "cafes": [
            {"nome": "Espresso Duplo", "preco": 10.0, "notas": "Intenso, cacau e nozes"},
            {"nome": "Cappuccino Italiano", "preco": 14.0, "notas": "Espresso, leite vaporizado e crema"},
            {"nome": "Flat White", "preco": 16.0, "notas": "Rigoroso balanceamento de café e leite"}
        ],
        "graos_250g": [
            {"nome": "Grão Bourbon Vermelho (250g)", "preco": 42.0, "notas": "Notas doces, rapadura e frutas amarelas"},
            {"nome": "Grão Catuaí Amarelo (250g)", "preco": 38.0, "notas": "Acidez cítrica e corpo médio"}
        ],
        "acompanhamentos": [
            {"nome": "Pão de Queijo Canastra", "preco": 8.0},
            {"nome": "Croissant de Manteiga", "preco": 15.0},
            {"nome": "Slice Cake Chocoberry", "preco": 18.0}
        ]
    }
    return str(cardapio if categoria == "todos" else cardapio.get(categoria, "Categoria não encontrada."))
📊 3. Gerador de Conteúdo Baseado em Métricas de Vendas
Este módulo analisa o comportamento das vendas (produtos mais vendidos, horários de pico, itens encalhados) e gera posts e campanhas personalizadas para Instagram e WhatsApp.

Código Python (src/services/metrics_content_generator.py)
Python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

def gerar_conteudo_por_metricas(metricas_vendas: dict) -> dict:
    """
    Recebe dados de performance e gera copys promocionais e posts estratégicos.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    
    prompt = ChatPromptTemplate.from_template("""
    Você é um especialista em Copywriting e Marketing para Cafeterias Digitais.
    Analise as seguintes métricas da semana da nossa cafeteria:

    - Produto Campeão de Vendas: {top_seller}
    - Produto com Baixa Saída (Precisa Girar): {low_seller}
    - Horário de Pico de Pedidos: {peak_hours}
    - Ticket Médio Atual: R$ {ticket_medio}

    Crie estratégias de conteúdo baseadas nesses dados:
    1. POST PARA INSTAGRAM (Focado no produto campeão: {top_seller})
    2. OFERTA DE WHATSAPP (Combo para alavancar o produto encalhado: {low_seller} junto com o ticket médio)
    3. SUGESTÃO DE PUSH NOTIFICATION (Para ser enviado antes do horário de pico: {peak_hours})

    Responda em formato estruturado e pronto para publicação.
    """)
    
    chain = prompt | llm
    resultado = chain.invoke(metricas_vendas)
    return {"conteudo_gerado": resultado.content}

# Exemplo de Teste de Execução
if __name__ == "__main__":
    dados_semana = {
        "top_seller": "Flat White + Croissant",
        "low_seller": "Grão Bourbon Vermelho 250g",
        "peak_hours": "14h às 16h",
        "ticket_medio": 34.50
    }
    # print(gerar_conteudo_por_metricas(dados_semana)["conteudo_gerado"])
🖥️ 4. Interface de Gestão (Dashboard Web Frontend)
A interface de gestão em Next.js / Tailwind CSS permite ao operador acompanhar pedidos, alterar o cardápio, configurar o raio de entrega e gerar conteúdos de marketing em 1 clique.

Estrutura dos Componentes do Dashboard:
Painel de Operação Ao Vivo:

Lista de pedidos recebidos via agente de IA.

Status do pedido: Aguardando Aceite ➔ Em Preparo ➔ Saiu para Entrega ➔ Concluído.

Handoff Humano: Botão de "Assumir Conversa" no WhatsApp caso o cliente solicite.

Configuração de Parâmetros de Entrega:

Campo para definir Raio Máximo de Entrega (km).

Campo para definir Pedido Mínimo (R$).

Tabela de taxas por km rodado.

Gerenciador de Cardápio / Estoque:

Botão ON/OFF para pausar itens esgotados (o agente para de oferecer imediatamente).

Aba "Marketing Inteligente (IA)":

Botão "Gerar Posts da Semana com base nas Vendas".

Exibe copys prontas para Instagram e envios no WhatsApp com base nos dados do banco.