from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime


class MetricaDiaria(SQLModel, table=True):
    """Snapshot diário de métricas de vendas — gerado por job ou on-demand."""
    __tablename__ = "metricas_diarias"

    id: Optional[int] = Field(default=None, primary_key=True)
    data: date = Field(index=True)

    # Volume
    pedidos_total: int = 0
    pedidos_confirmados: int = 0
    pedidos_cancelados: int = 0
    kg_vendidos: float = 0.0

    # Financeiro
    faturamento_bruto: float = 0.0
    faturamento_liquido: float = 0.0    # descontado frete e devoluções
    ticket_medio: float = 0.0
    desconto_total: float = 0.0
    frete_cobrado: float = 0.0

    # Produtos
    fardos_30kg_vendidos: int = 0
    fardos_50kg_vendidos: int = 0

    # Clientes
    novos_clientes: int = 0
    clientes_recorrentes: int = 0

    # Canal / IA
    pedidos_via_whatsapp: int = 0
    pedidos_via_dashboard: int = 0
    handoffs_humanos: int = 0

    criado_em: datetime = Field(default_factory=datetime.utcnow)
