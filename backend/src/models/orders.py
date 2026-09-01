from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StatusPedido(str, Enum):
    ORCAMENTO = "orcamento"
    CONFIRMADO = "confirmado"
    EM_SEPARACAO = "em_separacao"
    SAIU_ENTREGA = "saiu_entrega"
    ENTREGUE = "entregue"
    CANCELADO = "cancelado"


class Pedido(SQLModel, table=True):
    __tablename__ = "pedidos"

    id: Optional[int] = Field(default=None, primary_key=True)
    numero: str = Field(unique=True, index=True)   # ex: PED-2026-0001

    # FK
    cliente_id: Optional[int] = Field(default=None, foreign_key="clientes.id")

    # Status e canal
    status: StatusPedido = StatusPedido.ORCAMENTO
    canal: str = "whatsapp"             # whatsapp | dashboard | api

    # Financeiro
    subtotal: float = 0.0
    valor_frete: float = 0.0
    desconto: float = 0.0
    total: float = 0.0

    # Logística
    total_kg: float = 0.0
    distancia_km: Optional[float] = None
    endereco_entrega: Optional[str] = None
    lat_entrega: Optional[float] = None
    lon_entrega: Optional[float] = None

    # Observações
    observacoes: Optional[str] = None
    motivo_cancelamento: Optional[str] = None

    # Rastreabilidade de IA
    sessao_ia: Optional[str] = None     # ID da sessão no Redis
    assumido_por_humano: bool = False

    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)

    # Relacionamentos
    cliente: Optional["ClienteB2B"] = Relationship(back_populates="pedidos")
    itens: List["ItemPedido"] = Relationship(back_populates="pedido")


class ItemPedido(SQLModel, table=True):
    __tablename__ = "itens_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedidos.id")
    produto_id: int = Field(foreign_key="produtos.id")

    quantidade_fardos: int = 1
    peso_kg: float                      # quantidade × peso do fardo
    preco_kg_unitario: float
    subtotal: float

    pedido: Optional[Pedido] = Relationship(back_populates="itens")
    produto: Optional["Produto"] = Relationship(back_populates="itens")
