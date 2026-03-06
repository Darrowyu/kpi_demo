from pydantic import BaseModel
from datetime import datetime


class StationBase(BaseModel):
    name: str
    description: str = ""


class StationCreate(StationBase):
    pass


class Station(StationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True