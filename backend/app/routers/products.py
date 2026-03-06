from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.product import Product
from app.schemas.product import Product as ProductSchema, ProductCreate

router = APIRouter()


@router.get("/", response_model=List[ProductSchema])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取产品列表"""
    return db.query(Product).offset(skip).limit(limit).all()


@router.post("/", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """创建产品"""
    # 检查是否已存在
    existing = db.query(Product).filter(Product.model == product.model).first()
    if existing:
        raise HTTPException(status_code=400, detail="产品型号已存在")

    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """删除产品"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="产品不存在")

    db.delete(product)
    db.commit()
    return {"message": "删除成功"}
