from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.station import Station
from app.models.device import Device
from app.schemas.station import Station as StationSchema, StationCreate
from app.schemas.device import Device as DeviceSchema, DeviceCreate

router = APIRouter()


@router.get("/", response_model=List[StationSchema])
def get_stations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取工站列表"""
    return db.query(Station).offset(skip).limit(limit).all()


@router.post("/", response_model=StationSchema)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    """创建工站"""
    existing = db.query(Station).filter(Station.name == station.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="工站名称已存在")

    db_station = Station(**station.model_dump())
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station


@router.delete("/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db)):
    """删除工站"""
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="工站不存在")

    db.delete(station)
    db.commit()
    return {"message": "删除成功"}


# 设备管理
@router.get("/devices/", response_model=List[DeviceSchema])
def get_devices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取设备列表"""
    return db.query(Device).offset(skip).limit(limit).all()


@router.post("/devices/", response_model=DeviceSchema)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    """创建设备"""
    existing = db.query(Device).filter(Device.name == device.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="设备名称已存在")

    db_device = Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device
