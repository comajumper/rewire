from sqlalchemy import create_engine, Column, Integer, String, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

# Create Database Engine
engine = create_engine(DATABASE_URL)

# Database Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Model
Base = declarative_base()

from sqlalchemy import DateTime, func

# Define User Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    name = Column(String, nullable=True)
    focus = Column(String, nullable=True)  # SLOW, SIGNAL, SHARPEN
    created_at = Column(DateTime, default=func.now())

# Define Nudge Table
class Nudge(Base):
    __tablename__ = "nudges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nudge_type = Column(String, nullable=False)  # Pre-meeting, Mid-meeting, Reflection
    message = Column(String, nullable=False)
    scheduled_at = Column(TIMESTAMP, nullable=False)
    completed = Column(Boolean, default=False)