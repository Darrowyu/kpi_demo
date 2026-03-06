from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class StandardParam(Base):
    __tablename__ = "standard_params"

    id = Column(Integer, primary_key=True, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)  # 厂区ID
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)  # 可为空表示手工
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)

    # KPI标准参数
    standard_output = Column(Float, default=0)  # 标准人时产出(件/h)
    standard_quality_rate = Column(Float, default=0.99)  # 标准良品率(0-1)
    standard_rework_limit = Column(Float, default=0.005)  # 返工率上限(0-1)
    standard_scrap_limit = Column(Float, default=0.001)  # 报废率上限(0-1)

    note = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关联
    factory = relationship("Factory", back_populates="standard_params")
    product = relationship("Product", back_populates="standard_params")
    device = relationship("Device", back_populates="standard_params")
    station = relationship("Station", back_populates="standard_params")

    __table_args__ = (
        UniqueConstraint('factory_id', 'product_id', 'device_id', 'station_id', 
                        name='uix_factory_product_device_station'),
    )
