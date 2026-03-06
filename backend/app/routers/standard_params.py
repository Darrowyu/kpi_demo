from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from collections import defaultdict

from app.database import get_db
from app.models.standard_param import StandardParam
from app.models.product import Product
from app.models.device import Device
from app.models.station import Station
from app.schemas.standard_param import (
    StandardParamCreate, StandardParamUpdate, StandardParamWithNames,
    StandardParamByProduct, StandardParamByFactory
)

router = APIRouter()


@router.get("/", response_model=List[StandardParamWithNames])
def get_standard_params(
    factory_id: int = None,
    product_id: int = None,
    device_id: int = None,
    station_id: int = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    """获取标准参数列表"""
    query = db.query(StandardParam).options(
        joinedload(StandardParam.factory),
        joinedload(StandardParam.product),
        joinedload(StandardParam.device),
        joinedload(StandardParam.station)
    )

    if factory_id:
        query = query.filter(StandardParam.factory_id == factory_id)
    if product_id:
        query = query.filter(StandardParam.product_id == product_id)
    if device_id is not None:
        query = query.filter(StandardParam.device_id == device_id)
    if station_id:
        query = query.filter(StandardParam.station_id == station_id)

    params = query.offset(skip).limit(limit).all()

    # 转换为包含名称的响应
    result = []
    for p in params:
        result.append(StandardParamWithNames(
            id=p.id,
            factory_id=p.factory_id,
            product_id=p.product_id,
            device_id=p.device_id,
            station_id=p.station_id,
            factory_name=p.factory.name if p.factory else "",
            product_model=p.product.model if p.product else "",
            device_name=p.device.name if p.device else "手工",
            station_name=p.station.name if p.station else "",
            standard_output=p.standard_output,
            standard_quality_rate=p.standard_quality_rate,
            standard_rework_limit=p.standard_rework_limit,
            standard_scrap_limit=p.standard_scrap_limit,
            note=p.note,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ))

    return result


@router.get("/by-factory", response_model=List[StandardParamByFactory])
def get_standard_params_by_factory(
    factory_id: int = None,
    db: Session = Depends(get_db)
):
    """按厂区获取标准参数，并按产品型号分组"""
    query = db.query(StandardParam).options(
        joinedload(StandardParam.factory),
        joinedload(StandardParam.product),
        joinedload(StandardParam.device),
        joinedload(StandardParam.station)
    )

    if factory_id:
        query = query.filter(StandardParam.factory_id == factory_id)

    params = query.all()

    # 按厂区和产品型号分组
    factory_dict = defaultdict(lambda: {"products": defaultdict(list)})
    
    for p in params:
        factory_key = p.factory_id
        if factory_key not in factory_dict:
            factory_dict[factory_key]["factory"] = p.factory
        
        product_key = p.product_id
        param_data = StandardParamWithNames(
            id=p.id,
            factory_id=p.factory_id,
            product_id=p.product_id,
            device_id=p.device_id,
            station_id=p.station_id,
            factory_name=p.factory.name if p.factory else "",
            product_model=p.product.model if p.product else "",
            device_name=p.device.name if p.device else "手工",
            station_name=p.station.name if p.station else "",
            standard_output=p.standard_output,
            standard_quality_rate=p.standard_quality_rate,
            standard_rework_limit=p.standard_rework_limit,
            standard_scrap_limit=p.standard_scrap_limit,
            note=p.note,
            created_at=p.created_at,
            updated_at=p.updated_at,
        )
        factory_dict[factory_key]["products"][product_key].append(param_data)

    # 构建响应
    result = []
    for factory_id, data in factory_dict.items():
        factory = data["factory"]
        products_list = []
        for product_id, params_list in data["products"].items():
            if params_list:
                products_list.append(StandardParamByProduct(
                    product_id=product_id,
                    product_model=params_list[0].product_model,
                    params=params_list
                ))
        
        result.append(StandardParamByFactory(
            factory_id=factory.id,
            factory_name=factory.name,
            factory_code=factory.code,
            products=products_list
        ))

    return result


@router.post("/", response_model=StandardParamWithNames)
def create_standard_param(param: StandardParamCreate, db: Session = Depends(get_db)):
    """创建标准参数"""
    # 检查是否已存在
    existing = db.query(StandardParam).filter(
        StandardParam.factory_id == param.factory_id,
        StandardParam.product_id == param.product_id,
        StandardParam.device_id == param.device_id,
        StandardParam.station_id == param.station_id,
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="该厂区下此组合的标准参数已存在")

    db_param = StandardParam(**param.model_dump())
    db.add(db_param)
    db.commit()
    db.refresh(db_param)

    return StandardParamWithNames(
        id=db_param.id,
        factory_id=db_param.factory_id,
        product_id=db_param.product_id,
        device_id=db_param.device_id,
        station_id=db_param.station_id,
        factory_name=db_param.factory.name if db_param.factory else "",
        product_model=db_param.product.model if db_param.product else "",
        device_name=db_param.device.name if db_param.device else "手工",
        station_name=db_param.station.name if db_param.station else "",
        standard_output=db_param.standard_output,
        standard_quality_rate=db_param.standard_quality_rate,
        standard_rework_limit=db_param.standard_rework_limit,
        standard_scrap_limit=db_param.standard_scrap_limit,
        note=db_param.note,
        created_at=db_param.created_at,
        updated_at=db_param.updated_at,
    )


@router.put("/{param_id}", response_model=StandardParamWithNames)
def update_standard_param(param_id: int, param: StandardParamUpdate, db: Session = Depends(get_db)):
    """更新标准参数"""
    db_param = db.query(StandardParam).options(
        joinedload(StandardParam.factory),
        joinedload(StandardParam.product),
        joinedload(StandardParam.device),
        joinedload(StandardParam.station)
    ).filter(StandardParam.id == param_id).first()

    if not db_param:
        raise HTTPException(status_code=404, detail="标准参数不存在")

    # 只更新非None字段
    update_data = param.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_param, key, value)

    db.commit()
    db.refresh(db_param)

    return StandardParamWithNames(
        id=db_param.id,
        factory_id=db_param.factory_id,
        product_id=db_param.product_id,
        device_id=db_param.device_id,
        station_id=db_param.station_id,
        factory_name=db_param.factory.name if db_param.factory else "",
        product_model=db_param.product.model if db_param.product else "",
        device_name=db_param.device.name if db_param.device else "手工",
        station_name=db_param.station.name if db_param.station else "",
        standard_output=db_param.standard_output,
        standard_quality_rate=db_param.standard_quality_rate,
        standard_rework_limit=db_param.standard_rework_limit,
        standard_scrap_limit=db_param.standard_scrap_limit,
        note=db_param.note,
        created_at=db_param.created_at,
        updated_at=db_param.updated_at,
    )


@router.delete("/{param_id}")
def delete_standard_param(param_id: int, db: Session = Depends(get_db)):
    """删除标准参数"""
    param = db.query(StandardParam).filter(StandardParam.id == param_id).first()
    if not param:
        raise HTTPException(status_code=404, detail="标准参数不存在")

    db.delete(param)
    db.commit()
    return {"message": "删除成功"}


@router.post("/batch-import")
def batch_import_standard_params(params: List[StandardParamCreate], db: Session = Depends(get_db)):
    """批量导入标准参数"""
    imported = 0
    updated = 0

    for param in params:
        existing = db.query(StandardParam).filter(
            StandardParam.factory_id == param.factory_id,
            StandardParam.product_id == param.product_id,
            StandardParam.device_id == param.device_id,
            StandardParam.station_id == param.station_id,
        ).first()

        if existing:
            # 更新
            for key, value in param.model_dump().items():
                setattr(existing, key, value)
            updated += 1
        else:
            # 创建
            db_param = StandardParam(**param.model_dump())
            db.add(db_param)
            imported += 1

    db.commit()
    return {"imported": imported, "updated": updated}
