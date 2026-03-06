from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    model = Column(String(50), unique=True, index=True, nullable=False)  # 产品型号
    category = Column(String(50), default="")  # 产品类别
    description = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.now)

    standard_params = relationship("StandardParam", back_populates="product")