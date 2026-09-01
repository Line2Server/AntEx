from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class TipoFardo(str, Enum):
    FARDO_30KG = "fardo_30kg"
    FARDO_50KG = "fardo_50kg"


class Produto(SQLModel, table=True):
    __tablename__ = "produtos"

    id: Optional[int] = Field(default=None, primary_key=True)
    sku: str = Field(unique=True, index=True)
    nome: str
    tipo: TipoFardo
    peso_kg: float                      # 30 ou 50
    preco_por_kg: float
    preco_total: float
    descricao: str = ""
    origem: str = "Cerrado Mineiro / Sul de Minas"
    torra: str = "Média"
    moagem: str = "Fina-Média"
    rendimento_xic_por_kg: int = 20     # ~20 xícaras/kg
    ativo: bool = True
    estoque_fardos: int = 0             # quantidade em estoque
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)

    # Relacionamentos
    itens: List["ItemPedido"] = Relationship(back_populates="produto")

    @property
    def rendimento_total(self) -> int:
        return int(self.peso_kg * self.rendimento_xic_por_kg)
