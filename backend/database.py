import os
from sqlalchemy import create_engine, Column, String, Integer, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get Database URL from environment variable (Railway provides this automatically)
# Fallback to local sqlite for development if not set (optional, but good for safety)
DATABASE_URL = os.getenv("DATABASE_URL")

# Ensure we are using the correct driver for async/sync if needed, 
# but for simplicity we use standard psycopg2 sync driver here.
# Railway URLs often start with postgres://, SQLAlchemy needs postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    # Fallback for local dev without Postgres
    DATABASE_URL = "sqlite:///./local_dev.db"
    print("WARNING: DATABASE_URL not found, using local SQLite database.")

engine = create_engine(DATABASE_URL)
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
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
