import os
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine, text  # pyright: ignore[reportMissingImports]
from sqlalchemy.engine import make_url  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import declarative_base, sessionmaker  # pyright: ignore[reportMissingImports]

from app.config import settings


def prepare_database_url(url: str) -> str:
    """Ensure SSL is enabled and correct dialect driver is specified for PostgreSQL."""
    if not url:
        return url

    parsed = urlparse(url)
    if not parsed.scheme.startswith("postgres"):
        return url

    # SQLAlchemy 2.0 kërkon specifikisht 'postgresql+psycopg2://'
    scheme = "postgresql+psycopg2"

    hostname = parsed.hostname or ""
    is_local = hostname in ("localhost", "127.0.0.1", "db")
    query = parse_qs(parsed.query)

    if not is_local and "sslmode" not in query:
        query["sslmode"] = ["require"]

    normalized_query = urlencode(
        {key: values[0] for key, values in query.items()}
    )
    return urlunparse(parsed._replace(scheme=scheme, query=normalized_query))


# 1. Përgatit URL-në fillestare
raw_url = prepare_database_url(settings.DATABASE_URL)

# 2. Konverto në objekt URL të SQLAlchemy për të pastruar pgbouncer
parsed_url = make_url(raw_url)
query_params = dict(parsed_url.query)

if "pgbouncer" in query_params:
    del query_params["pgbouncer"]

clean_url = parsed_url._replace(query=query_params)

# 3. Krijimi i Engine me URL-në e pastruar plotësisht
engine = create_engine(
    clean_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True