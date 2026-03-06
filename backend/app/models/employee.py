from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_no = Column(String(20), unique=True, index=True, nullable=False)  # 工号
    name = Column(String(50), nullable=False)  # 姓名
    department = Column(String(50), default="")  # 部门
    position = Column(String(50), default="")  # 职位
    phone = Column(String(20), default="")  # 联系电话
    email = Column(String(100), default="")  # 邮箱
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=True)  # 所属厂区
    status = Column(String(20), default="active")  # 状态: active在职, inactive离职
    hire_date = Column(DateTime, nullable=True)  # 入职日期
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # 关联
    factory = relationship("Factory", back_populates="employees")
    production_records = relationship("ProductionRecord", back_populates="employee")
    kpi_results = relationship("KPIResult", back_populates="employee")
