from sqlmodel import create_engine, Session, SQLModel
from pydantic_settings import BaseSettings
from typing import Generator
import redis.asyncio as aioredis
import redis


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://antex_user:antex_pass@localhost:5432/antex_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    OPENAI_API_KEY: str = ""
    SECRET_KEY: str = "changeme"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"

    LAT_EMPRESA: float = -16.686891
    LON_EMPRESA: float = -49.264794

    RAIO_MAXIMO_KM: float = 300.0
    PEDIDO_MINIMO_KG: float = 30.0
    PRECO_KG_FARDO_30: float = 42.00
    PRECO_KG_FARDO_50: float = 40.00
    TAXA_FRETE_KM: float = 3.50
    FRETE_GRATIS_ACIMA: float = 3000.00

    EVOLUTION_API_URL: str = ""
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# ── PostgreSQL ──────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    pool_pre_ping=True,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


# ── Redis ───────────────────────────────────────────────────
redis_sync = redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)
