from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Factory(Base):
    """厂区模型"""
    __tablename__ = "factories"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)  # 厂区代码: DG_XA, HB_CB, TG_ZM
    name = Column(String(50), nullable=False)  # 厂区名称: 东莞迅安、湖北赤壁、泰国知勉
    description = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关联
    standard_params = relationship("StandardParam", back_populates="factory")
    employees = relationship("Employee", back_populates="factory")
