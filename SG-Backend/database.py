# SG-Backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# آدرس دیتابیس PostgreSQL خود را اینجا وارد کنید:
SQLALCHEMY_DATABASE_URL = "postgresql://username:password@localhost:5432/sheen_ghazy_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()