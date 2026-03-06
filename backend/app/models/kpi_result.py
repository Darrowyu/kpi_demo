from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class KPIResult(Base):
    __tablename__ = "kpi_results"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(String(7), index=True, nullable=False)  # 计算月份

    # 五大指标实际值
    working_hours_rate = Column(Float, default=0)  # 工时达成率
    quality_rate = Column(Float, default=0)  # 良品达成率
    productivity_rate = Column(Float, default=0)  # 人时产出达成率
    rework_rate = Column(Float, default=0)  # 返工率
    scrap_rate = Column(Float, default=0)  # 报废率

    # 五大指标等级
    working_hours_grade = Column(String(10), default="")  # 甲/乙/丙/丁
    quality_grade = Column(String(10), default="")
    productivity_grade = Column(String(10), default="")
    rework_grade = Column(String(10), default="")
    scrap_grade = Column(String(10), default="")

    # 综合得分
    total_score = Column(Float, default=0)
    final_grade = Column(String(10), default="")

    created_at = Column(DateTime, default=datetime.now)

    employee = relationship("Employee", back_populates="kpi_results")