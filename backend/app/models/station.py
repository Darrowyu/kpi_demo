from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # 工站名称
    description = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.now)

    standard_params = relationship("StandardParam", back_populates="station")