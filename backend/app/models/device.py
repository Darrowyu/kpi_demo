from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # 设备名称
    device_type = Column(String(50), default="")  # 设备类型
    created_at = Column(DateTime, default=datetime.now)

    standard_params = relationship("StandardParam", back_populates="device")