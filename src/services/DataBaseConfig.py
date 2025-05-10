import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
load_dotenv()

class DataBaseConfig:

    def __init__(self):
        self.DATABASE_URL =os.getenv("DATABASE_URL")
        if not self.DATABASE_URL:
            raise ValueError("Environment variable 'DATABASE_URL' is not set.")
        self.engine = create_engine(self.DATABASE_URL, connect_args={"check_same_thread": False})
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def get_db(self):
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()
