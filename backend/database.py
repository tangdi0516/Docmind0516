import os
from sqlalchemy import create_engine, Column, String, Integer, Text, JSON, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import socket
from urllib.parse import urlparse, urlunparse

# ... (imports remain the same)

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
        
    # Force SSL for Supabase (if not already present)
    if "sslmode" not in DATABASE_URL:
        if "?" in DATABASE_URL:
            DATABASE_URL += "&sslmode=require"
        else:
            DATABASE_URL += "?sslmode=require"

    # Validation: Check for missing '@' symbol which causes confusing "invalid port" errors
    if "@" not in DATABASE_URL:
        print("CRITICAL WARNING: DATABASE_URL is missing the '@' separator between password and host.")
        print("Please check your Railway 'DATABASE_URL' variable.")
        print("Format should be: postgresql://user:password@host:port/dbname")

    # FORCE IPv4: Resolve hostname to IPv4 to avoid "Network is unreachable" on IPv6
    try:
        # Parse the URL
        parsed = urlparse(DATABASE_URL)
        hostname = parsed.hostname
        
        # If we have a hostname and it's not already an IP address
        if hostname and not hostname.replace('.', '').isnumeric() and ":" not in hostname:
            print(f"DEBUG: Resolving hostname '{hostname}' to IPv4...")
            ipv4_addr = socket.gethostbyname(hostname)
            print(f"DEBUG: Resolved to IPv4: {ipv4_addr}")
            
            # Reconstruct the netloc with the IPv4 address
            # netloc format: user:password@host:port
            new_netloc = ""
            if parsed.username:
                new_netloc += parsed.username
                if parsed.password:
                    new_netloc += f":{parsed.password}"
                new_netloc += "@"
            
            new_netloc += ipv4_addr
            
            if parsed.port:
                new_netloc += f":{parsed.port}"
            
            # Update the URL
            parsed = parsed._replace(netloc=new_netloc)
            DATABASE_URL = urlunparse(parsed)
            print("DEBUG: Updated DATABASE_URL to use IPv4 address.")
            
    except Exception as e:
        print(f"WARNING: Failed to resolve IPv4 address: {e}")
        # Continue with original URL if resolution fails

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
