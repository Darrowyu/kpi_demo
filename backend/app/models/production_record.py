from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    # 生产数据
    record_date = Column(Date, nullable=False)  # 日期
    product_model = Column(String(50), nullable=False)  # 产品型号
    device_name = Column(String(100), default="")  # 设备名称
    station_name = Column(String(100), nullable=False)  # 工站名称

    production_hours = Column(Float, default=0)  # 生产时数
    good_quantity = Column(Integer, default=0)  # 良品数量
    rework_quantity = Column(Integer, default=0)  # 返工数量
    scrap_quantity = Column(Integer, default=0)  # 报废数量

    # 计算字段
    actual_output = Column(Float, default=0)  # 实际人时产出
    actual_quality_rate = Column(Float, default=0)  # 实际良品率

    # 所属月份（用于查询）
    month = Column(String(7), index=True)  # 格式: 2026-02

    created_at = Column(DateTime, default=datetime.now)

    employee = relationship("Employee", back_populates="production_records")