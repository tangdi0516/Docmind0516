import os
from sqlalchemy import create_engine, Column, String, Integer, Text, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get Database URL from environment variable (Railway provides this automatically)
# Fallback to local sqlite for development if not set (optional, but good for safety)
DATABASE_URL = os.getenv("DATABASE_URL")

print(f"DEBUG: Raw DATABASE_URL found: {'Yes' if DATABASE_URL else 'No'}")

if DATABASE_URL:
    # Fix common protocol issues
    # SQLAlchemy < 1.4 uses postgres://, but newer ones prefer postgresql://
    # We also want to force the psycopg driver: postgresql+psycopg://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

if not DATABASE_URL:
    # Fallback for local dev without Postgres
    DATABASE_URL = "sqlite:///./local_dev.db"
    print("WARNING: DATABASE_URL not found, using local SQLite database.")

print(f"DEBUG: Final DATABASE_URL protocol: {DATABASE_URL.split('://')[0]}")

try:
    engine = create_engine(DATABASE_URL)
    print("DEBUG: Database engine created successfully.")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to create database engine. Error: {e}")
    raise e
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(String, primary_key=True, index=True)
    message_count = Column(Integer, default=0)
    bot_name = Column(String, default="DocMind")
    system_prompt = Column(Text, default="")
    widget_color = Column(String, default="#4F46E5")
    header_logo = Column(String, default="")
    initial_message = Column(String, default="Hello! How can I help you today?")

def init_db():
    # Enable pgvector extension if not exists (Required for Supabase/Postgres vector search)
    with engine.connect() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        connection.commit()
    
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
