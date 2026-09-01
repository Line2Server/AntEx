from langchain_core.tools import tool
from sqlmodel import Session, select
from src.database import engine
from src.models.products import Produto, TipoFardo


def _get_produtos_ativos() -> list[Produto]:
    with Session(engine) as session:
        return session.exec(select(Produto).where(Produto.ativo == True)).all()


@tool
def consultar_portfolio(tipo: str = "todos") -> str:
    """
    Retorna o portfólio de fardos de café arábico disponíveis para venda.

    Args:
        tipo: 'fardo_30kg', 'fardo_50kg' ou 'todos'.

    Returns:
        Descrição completa dos produtos disponíveis com preços e rendimento.
    """
    produtos = _get_produtos_ativos()
    if not produtos:
        # Portfólio padrão (seed) caso banco esteja vazio
        return """
☕ PORTFÓLIO CAFÉ ARÁBICO — ATACADO B2B

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟤 FARDO 30KG — Café Arábico Premium Torrado e Moído
   📦 Peso: 30kg por fardo
   💵 Preço: R$ 42,00/kg → Total: R$ 1.260,00/fardo
   ☕ Rendimento: ~600 xícaras por fardo
   🌱 Origem: Cerrado Mineiro / Sul de Minas
   🔥 Torra: Média | Moagem: Fina-Média
   ✅ Ideal para: restaurantes, padarias e escritórios

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟤 FARDO 50KG — Café Arábico Premium Torrado e Moído
   📦 Peso: 50kg por fardo
   💵 Preço: R$ 40,00/kg → Total: R$ 2.000,00/fardo
   ☕ Rendimento: ~1.000 xícaras por fardo
   🌱 Origem: Cerrado Mineiro / Sul de Minas
   🔥 Torra: Média | Moagem: Fina-Média
   ✅ Melhor custo-benefício para alto volume

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 DESCONTOS POR VOLUME:
   100kg+: 3% de desconto
   200kg+: 5% de desconto
   500kg+: 8% de desconto

📦 Pedido mínimo: 1 fardo (30kg)
🚚 Frete grátis acima de R$ 3.000,00
"""

    linhas = ["☕ PORTFÓLIO CAFÉ ARÁBICO — ATACADO B2B\n"]
    for p in produtos:
        if tipo != "todos" and p.tipo != tipo:
            continue
        linhas.append(
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🟤 {p.nome.upper()}\n"
            f"   📦 Peso: {p.peso_kg}kg por fardo\n"
            f"   💵 Preço: R$ {p.preco_por_kg:.2f}/kg → Total: R$ {p.preco_total:.2f}/fardo\n"
            f"   ☕ Rendimento: ~{p.rendimento_total} xícaras por fardo\n"
            f"   🌱 Origem: {p.origem}\n"
            f"   🔥 Torra: {p.torra} | Moagem: {p.moagem}\n"
            f"   📊 Estoque: {p.estoque_fardos} fardo(s) disponível(is)\n"
        )
    return "\n".join(linhas)


@tool
def calcular_orcamento(
    quantidade_fardo_30kg: int = 0,
    quantidade_fardo_50kg: int = 0,
) -> str:
    """
    Calcula o orçamento detalhado com base na quantidade de fardos solicitados.

    Args:
        quantidade_fardo_30kg: Número de fardos de 30kg.
        quantidade_fardo_50kg: Número de fardos de 50kg.

    Returns:
        Orçamento detalhado com subtotais, volume total em kg e valor final.
    """
    if quantidade_fardo_30kg < 0 or quantidade_fardo_50kg < 0:
        return "Erro: quantidades não podem ser negativas."

    if quantidade_fardo_30kg == 0 and quantidade_fardo_50kg == 0:
        return "Informe pelo menos 1 fardo para calcular o orçamento."

    produtos = {p.tipo: p for p in _get_produtos_ativos()}

    # Preços padrão se banco vazio
    preco_30 = produtos.get(TipoFardo.FARDO_30KG, None)
    preco_50 = produtos.get(TipoFardo.FARDO_50KG, None)
    p30 = preco_30.preco_por_kg if preco_30 else 42.00
    p50 = preco_50.preco_por_kg if preco_50 else 40.00

    subtotal_30 = quantidade_fardo_30kg * 30 * p30
    subtotal_50 = quantidade_fardo_50kg * 50 * p50
    total_kg = (quantidade_fardo_30kg * 30) + (quantidade_fardo_50kg * 50)
    subtotal = subtotal_30 + subtotal_50

    linhas = ["📋 ORÇAMENTO DETALHADO\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
    if quantidade_fardo_30kg > 0:
        linhas.append(
            f"🟤 Fardo 30kg × {quantidade_fardo_30kg} un.\n"
            f"   {quantidade_fardo_30kg * 30}kg × R$ {p30:.2f}/kg = R$ {subtotal_30:.2f}"
        )
    if quantidade_fardo_50kg > 0:
        linhas.append(
            f"🟤 Fardo 50kg × {quantidade_fardo_50kg} un.\n"
            f"   {quantidade_fardo_50kg * 50}kg × R$ {p50:.2f}/kg = R$ {subtotal_50:.2f}"
        )
    linhas.append(
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"⚖️  Total: {total_kg}kg\n"
        f"💵 Subtotal: R$ {subtotal:.2f}\n"
        f"\n⚠️  Frete calculado após confirmar o endereço de entrega."
    )
    return "\n".join(linhas)
