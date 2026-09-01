import math
from typing import Optional
from langchain_core.tools import tool
from sqlmodel import Session, select

from src.database import engine, settings
from src.models.settings import ConfiguracaoEntrega


def _get_config() -> ConfiguracaoEntrega:
    """Busca configuração ativa do banco, ou usa defaults do .env."""
    with Session(engine) as session:
        cfg = session.exec(
            select(ConfiguracaoEntrega).where(ConfiguracaoEntrega.ativo == True)
        ).first()
    if cfg:
        return cfg
    # Fallback: usa settings do .env
    return ConfiguracaoEntrega(
        raio_maximo_km=settings.RAIO_MAXIMO_KM,
        pedido_minimo_kg=settings.PEDIDO_MINIMO_KG,
        taxa_frete_por_km=settings.TAXA_FRETE_KM,
        frete_gratis_acima=settings.FRETE_GRATIS_ACIMA,
        lat_empresa=settings.LAT_EMPRESA,
        lon_empresa=settings.LON_EMPRESA,
        preco_kg_fardo_30=settings.PRECO_KG_FARDO_30,
        preco_kg_fardo_50=settings.PRECO_KG_FARDO_50,
    )


def calcular_distancia_haversine(lat2: float, lon2: float) -> float:
    """Calcula a distância em KM entre a empresa e o cliente usando Haversine."""
    cfg = _get_config()
    R = 6371.0
    lat1, lon1 = math.radians(cfg.lat_empresa), math.radians(cfg.lon_empresa)
    lat2r, lon2r = math.radians(lat2), math.radians(lon2)
    dlat = lat2r - lat1
    dlon = lon2r - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2r) * math.sin(dlon / 2) ** 2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def calcular_frete(distancia_km: float, valor_pedido: float, cfg: ConfiguracaoEntrega) -> float:
    """Calcula a taxa de frete baseada na distância e valor do pedido."""
    if valor_pedido >= cfg.frete_gratis_acima:
        return 0.0
    if distancia_km <= cfg.km_frete_gratis:
        return 0.0
    return round((distancia_km - cfg.km_frete_gratis) * cfg.taxa_frete_por_km, 2)


def calcular_desconto_volume(total_kg: float, cfg: ConfiguracaoEntrega) -> float:
    """Retorna percentual de desconto baseado no volume total em kg."""
    if total_kg >= 500:
        return cfg.desconto_acima_500kg
    if total_kg >= 200:
        return cfg.desconto_acima_200kg
    if total_kg >= 100:
        return cfg.desconto_acima_100kg
    return 0.0


@tool
def verificar_viabilidade_entrega(
    lat_cliente: float,
    lon_cliente: float,
    total_kg: float,
    valor_pedido: float,
) -> str:
    """
    Verifica se a entrega é viável com base em distância (Haversine),
    peso mínimo (kg) e calcula o frete.

    Args:
        lat_cliente: Latitude do endereço de entrega.
        lon_cliente: Longitude do endereço de entrega.
        total_kg: Total de kg do pedido (mínimo: 30kg = 1 fardo de 30kg).
        valor_pedido: Valor total dos produtos em R$.

    Returns:
        String com status APROVADO ou RECUSADO e detalhes.
    """
    cfg = _get_config()
    distancia = calcular_distancia_haversine(lat_cliente, lon_cliente)

    # Validação 1: raio máximo
    if distancia > cfg.raio_maximo_km:
        return (
            f"RECUSADO ❌ — Endereço fora da área de entrega.\n"
            f"Distância: {distancia}km | Raio máximo: {cfg.raio_maximo_km}km.\n"
            f"Entre em contato para verificar frete via transportadora."
        )

    # Validação 2: pedido mínimo em kg
    if total_kg < cfg.pedido_minimo_kg:
        return (
            f"RECUSADO ❌ — Pedido abaixo do mínimo.\n"
            f"Total solicitado: {total_kg}kg | Mínimo: {cfg.pedido_minimo_kg}kg (1 fardo de 30kg)."
        )

    # Cálculos de frete e desconto
    frete = calcular_frete(distancia, valor_pedido, cfg)
    pct_desconto = calcular_desconto_volume(total_kg, cfg)
    desconto_valor = round(valor_pedido * pct_desconto / 100, 2)
    total_final = round(valor_pedido - desconto_valor + frete, 2)

    desconto_info = f"\n💰 Desconto de volume ({pct_desconto}%): -R$ {desconto_valor:.2f}" if pct_desconto > 0 else ""
    frete_info = "🚚 Frete: GRÁTIS" if frete == 0 else f"🚚 Frete: R$ {frete:.2f}"

    return (
        f"APROVADO ✅\n"
        f"📍 Distância: {distancia}km\n"
        f"⚖️  Total: {total_kg}kg\n"
        f"💵 Produtos: R$ {valor_pedido:.2f}"
        f"{desconto_info}\n"
        f"{frete_info}\n"
        f"💳 TOTAL FINAL: R$ {total_final:.2f}"
    )
