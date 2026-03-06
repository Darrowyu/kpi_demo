from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StandardParamBase(BaseModel):
    standard_output: float
    standard_quality_rate: float
    standard_rework_limit: float
    standard_scrap_limit: float
    note: str = ""


class StandardParamCreate(StandardParamBase):
    factory_id: int
    product_id: int
    device_id: Optional[int] = None
    station_id: int


class StandardParamUpdate(StandardParamBase):
    factory_id: Optional[int] = None
    product_id: Optional[int] = None
    device_id: Optional[int] = None
    station_id: Optional[int] = None


class StandardParam(StandardParamBase):
    id: int
    factory_id: int
    product_id: int
    device_id: Optional[int]
    station_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StandardParamWithNames(StandardParam):
    """包含关联名称的标准参数"""
    factory_name: str = ""  # 厂区名称
    product_model: str = ""
    device_name: Optional[str] = None
    station_name: str = ""


# 按产品型号分组的响应
class StandardParamByProduct(BaseModel):
    """按产品型号分组的标准参数"""
    product_id: int
    product_model: str
    params: list[StandardParamWithNames]


# 按厂区分组的响应
class StandardParamByFactory(BaseModel):
    """按厂区分组的标准参数"""
    factory_id: int
    factory_name: str
    factory_code: str
    products: list[StandardParamByProduct]
