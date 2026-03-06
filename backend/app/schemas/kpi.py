from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class KPIIndicator(BaseModel):
    """单个KPI指标"""
    name: str
    actual_value: float
    grade: str
    raw_score: int
    weight: float
    weighted_score: float


class KPIResultDetail(BaseModel):
    """KPI结果详情"""
    id: int
    employee_id: int
    employee_name: str
    employee_no: str
    month: str

    # 五大指标
    working_hours_rate: float
    quality_rate: float
    productivity_rate: float
    rework_rate: float
    scrap_rate: float

    # 等级
    working_hours_grade: str
    quality_grade: str
    productivity_grade: str
    rework_grade: str
    scrap_grade: str

    # 综合
    total_score: float
    final_grade: str

    created_at: datetime

    class Config:
        from_attributes = True


class KPICalculationRequest(BaseModel):
    """KPI计算请求"""
    employee_id: int
    month: str  # 格式: 2026-02


class KPICalculationResponse(BaseModel):
    """KPI计算响应"""
    success: bool
    message: str
    result: Optional[KPIResultDetail] = None


class ProductionRecordImport(BaseModel):
    """生产记录导入项"""
    employee_no: str
    employee_name: str
    record_date: str  # YYYY-MM-DD
    product_model: str
    device_name: str = ""
    station_name: str
    production_hours: float
    good_quantity: int
    rework_quantity: int = 0
    scrap_quantity: int = 0
    month: str