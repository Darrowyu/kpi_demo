from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.factory import Factory
from app.schemas.factory import Factory as FactorySchema, FactoryCreate, FactoryUpdate

router = APIRouter()


@router.get("/", response_model=List[FactorySchema])
def get_factories(db: Session = Depends(get_db)):
    """获取所有厂区"""
    return db.query(Factory).all()


@router.post("/", response_model=FactorySchema)
def create_factory(factory: FactoryCreate, db: Session = Depends(get_db)):
    """创建厂区"""
    # 检查code是否已存在
    existing = db.query(Factory).filter(Factory.code == factory.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="厂区代码已存在")
    
    db_factory = Factory(**factory.model_dump())
    db.add(db_factory)
    db.commit()
    db.refresh(db_factory)
    return db_factory


@router.get("/{factory_id}", response_model=FactorySchema)
def get_factory(factory_id: int, db: Session = Depends(get_db)):
    """获取单个厂区"""
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="厂区不存在")
    return factory


@router.put("/{factory_id}", response_model=FactorySchema)
def update_factory(factory_id: int, factory: FactoryUpdate, db: Session = Depends(get_db)):
    """更新厂区"""
    db_factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not db_factory:
        raise HTTPException(status_code=404, detail="厂区不存在")
    
    for key, value in factory.model_dump().items():
        setattr(db_factory, key, value)
    
    db.commit()
    db.refresh(db_factory)
    return db_factory


@router.delete("/{factory_id}")
def delete_factory(factory_id: int, db: Session = Depends(get_db)):
    """删除厂区"""
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="厂区不存在")
    
    db.delete(factory)
    db.commit()
    return {"message": "删除成功"}
