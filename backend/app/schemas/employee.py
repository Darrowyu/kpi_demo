from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class EmployeeBase(BaseModel):
    employee_no: str = Field(..., min_length=1, max_length=20, description="工号")
    name: str = Field(..., min_length=1, max_length=50, description="姓名")
    department: str = Field(default="", max_length=50, description="部门")
    position: str = Field(default="", max_length=50, description="职位")
    phone: str = Field(default="", max_length=20, description="联系电话")
    email: str = Field(default="", max_length=100, description="邮箱")
    factory_id: Optional[int] = Field(default=None, description="所属厂区ID")
    status: str = Field(default="active", description="状态: active在职, inactive离职")
    hire_date: Optional[datetime] = Field(default=None, description="入职日期")


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(EmployeeBase):
    employee_no: Optional[str] = Field(default=None, min_length=1, max_length=20)
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)


class Employee(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    factory_name: Optional[str] = Field(default="", description="厂区名称")

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """员工列表分页响应"""
    total: int
    items: list[Employee]
    page: int
    page_size: int
