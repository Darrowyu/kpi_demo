from pydantic import BaseModel
from datetime import datetime


class ProductBase(BaseModel):
    model: str
    category: str = ""
    description: str = ""


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True