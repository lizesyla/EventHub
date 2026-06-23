import os
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

def get_engine():
    """Ndërton lidhjen në mënyrë të sigurt si objekt për të shmangur problemet me karakteret speciale."""
    
    # Lexon vlerat nga .env ose mjedisi i Render. Nëse nuk ekzistojnë, përdor vlerat default.
    db_user = os.getenv("DB_USER", "postgres.bepahdqamumvexkcjrrl")
    db_password = os.getenv("DB_PASSWORD", "G@qN$mFXe5vH7cQ")
    db_host = os.getenv("DB_HOST", "aws-0-eu-west-1.pooler.supabase.com")
    db_port = int(os.getenv("DB_PORT", 6543))
    db_name = os.getenv("DB_NAME", "postgres")

    connection_url = URL.create(
        drivername="postgresql+psycopg2",
        username=db_user,
        password=db_password,
        host=db_host,
        port=db_port,
        database=db_name,
        query={"sslmode": "require"}
    )
    
    return create_engine(connection_url, pool_pre_ping=True)

# Krijimi i Engine
engine = get_engine()

# Konfigurimi i Session dhe Base
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