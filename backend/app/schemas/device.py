from pydantic import BaseModel
from datetime import datetime


class DeviceBase(BaseModel):
    name: str
    device_type: str = ""


class DeviceCreate(DeviceBase):
    pass


class Device(DeviceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True