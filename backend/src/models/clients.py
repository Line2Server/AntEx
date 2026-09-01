from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SegmentoCliente(str, Enum):
    RESTAURANTE = "restaurante"
    HOTEL = "hotel"
    PADARIA = "padaria"
    ESCRITORIO = "escritorio"
    DISTRIBUIDOR = "distribuidor"
    REVENDEDOR = "revendedor"
    OUTRO = "outro"


class ClienteB2B(SQLModel, table=True):
    __tablename__ = "clientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nome: str
    razao_social: Optional[str] = None
    cnpj: Optional[str] = Field(default=None, index=True)
    whatsapp: str = Field(unique=True, index=True)
    email: Optional[str] = None
    segmento: SegmentoCliente = SegmentoCliente.OUTRO

    # Localização
    cidade: Optional[str] = None
    estado: Optional[str] = None
    endereco: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

    # Métricas CRM
    total_pedidos: int = 0
    total_kg_comprado: float = 0.0
    total_faturado: float = 0.0
    ultimo_pedido_em: Optional[datetime] = None

    ativo: bool = True
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)

    # Relacionamentos
    pedidos: List["Pedido"] = Relationship(back_populates="cliente")

    @property
    def ticket_medio(self) -> float:
        if self.total_pedidos == 0:
            return 0.0
        return round(self.total_faturado / self.total_pedidos, 2)
