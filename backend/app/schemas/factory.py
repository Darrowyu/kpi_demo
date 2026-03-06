from pydantic import BaseModel
from datetime import datetime


class FactoryBase(BaseModel):
    code: str
    name: str
    description: str = ""


class FactoryCreate(FactoryBase):
    pass


class FactoryUpdate(FactoryBase):
    pass


class Factory(FactoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
