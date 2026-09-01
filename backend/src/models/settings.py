from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class ConfiguracaoEntrega(SQLModel, table=True):
    """Configurações de entrega e precificação — editável pelo painel admin."""
    __tablename__ = "configuracoes_entrega"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Geolocalização da empresa
    lat_empresa: float = -16.686891
    lon_empresa: float = -49.264794
    cidade_empresa: str = "Goiânia"
    estado_empresa: str = "GO"

    # Regras de entrega
    raio_maximo_km: float = 300.0
    pedido_minimo_kg: float = 30.0
    taxa_frete_por_km: float = 3.50     # R$ por km
    frete_gratis_acima: float = 3000.00 # R$ — frete grátis acima deste valor
    km_frete_gratis: float = 50.0       # frete grátis até esta distância

    # Preços por kg (por tipo de fardo)
    preco_kg_fardo_30: float = 42.00
    preco_kg_fardo_50: float = 40.00

    # Descontos por volume (kg mínimo → desconto %)
    desconto_acima_100kg: float = 3.0   # 3% de desconto
    desconto_acima_200kg: float = 5.0   # 5% de desconto
    desconto_acima_500kg: float = 8.0   # 8% de desconto

    # Controle
    ativo: bool = True
    criado_em: datetime = Field(default_factory=datetime.utcnow)
    atualizado_em: datetime = Field(default_factory=datetime.utcnow)
