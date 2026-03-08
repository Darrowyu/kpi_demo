"""
初始化基础数据脚本
从原config.py迁移标准参数到数据库
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.models.product import Product
from app.models.device import Device
from app.models.station import Station
from app.models.standard_param import StandardParam
from app.models.factory import Factory

# 创建表
models.Base.metadata.create_all(bind=engine)

# 基础数据 - 厂区 (id, code, name, description)
FACTORIES = [
    (1, "ZN", "知恩", "默认厂区"),
]

# 基础数据 - 产品型号
PRODUCTS = [
    ("9600-N95", "N95系列"),
    ("9500-N95", "N95系列"),
    ("E101W", "E系列"),
    ("E103B", "E系列"),
    ("A103B", "A系列"),
    ("A铝片", "铝片系列"),
    ("E铝片", "铝片系列"),
]

# 基础数据 - 设备
DEVICES = [
    ("9600-N95四合一", "自动化"),
    ("9600-N95四合一包装入袋", "自动化"),
    ("全自动二合一贴铝鼻夹点头带机", "自动化"),
    ("全自动二合一贴铝鼻夹机", "自动化"),
    ("全自动点焊机", "自动化"),
    ("全自动点焊机-双点", "自动化"),
    ("全自动点焊机-单点", "自动化"),
    ("全自动点焊机-铝鼻夹", "自动化"),
    ("全自动点带焊带机", "自动化"),
    ("全自动贴带机", "自动化"),
    ("全自动贴带焊带机", "自动化"),
    ("全自动贴片焊带机", "自动化"),
    ("全自动封切包装机", "自动化"),
    ("ZQ-1", "专机"),
    ("ZQ-2", "专机"),
    ("ZEA-2", "专机"),
    ("斩台", "专机"),
    ("封口机", "专机"),
    ("过缩机", "专机"),
]

# 基础数据 - 工站
STATIONS = [
    ("查货", ""),
    ("穿铝鼻夹", ""),
    ("贴片", ""),
    ("贴铝鼻夹", ""),
    ("贴带", ""),
    ("焊带", ""),
    ("点带", ""),
    ("点焊", ""),
    ("贴海绵条", ""),
    ("贴彩盒标签", ""),
    ("贴外箱标签", ""),
    ("包装", ""),
    ("封口", ""),
    ("斩台", ""),
    ("冲铝片", ""),
    ("过胶", ""),
    ("过缩", ""),
    ("开机", ""),
    ("装彩盒", ""),
    ("装箱", ""),
    ("套袋", ""),
    ("放说明", ""),
    ("整理", ""),
    ("清洗", ""),
]


def init_products(db: Session):
    """初始化产品"""
    for model, category in PRODUCTS:
        existing = db.query(Product).filter(Product.model == model).first()
        if not existing:
            db.add(Product(model=model, category=category))
    db.commit()
    print("[OK] 产品型号初始化完成")


def init_devices(db: Session):
    """初始化设备"""
    for name, device_type in DEVICES:
        existing = db.query(Device).filter(Device.name == name).first()
        if not existing:
            db.add(Device(name=name, device_type=device_type))
    db.commit()
    print("[OK] 设备初始化完成")


def init_stations(db: Session):
    """初始化工站"""
    for name, desc in STATIONS:
        existing = db.query(Station).filter(Station.name == name).first()
        if not existing:
            db.add(Station(name=name, description=desc))
    db.commit()
    print("[OK] 工站初始化完成")


def init_factories(db: Session):
    """初始化厂区"""
    for id, code, name, description in FACTORIES:
        existing = db.query(Factory).filter(Factory.id == id).first()
        if not existing:
            db.add(Factory(id=id, code=code, name=name, description=description))
    db.commit()
    print("[OK] 厂区初始化完成")


def init_standard_params_from_config(db: Session):
    """从原config.py导入标准参数"""
    # 导入原config中的STANDARD_PARAMS
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from config import STANDARD_PARAMS

    product_map = {p.model: p.id for p in db.query(Product).all()}
    device_map = {d.name: d.id for d in db.query(Device).all()}
    station_map = {s.name: s.id for s in db.query(Station).all()}

    imported = 0
    skipped = 0

    for (product_model, device_name, station_name), params in STANDARD_PARAMS.items():
        product_id = product_map.get(product_model)
        device_id = device_map.get(device_name) if device_name else None
        station_id = station_map.get(station_name)

        if not product_id or not station_id:
            skipped += 1
            continue

        # 检查是否已存在
        existing = db.query(StandardParam).filter(
            StandardParam.product_id == product_id,
            StandardParam.device_id == device_id,
            StandardParam.station_id == station_id,
        ).first()

        if not existing:
            db.add(StandardParam(
                factory_id=1,  # 默认厂区：知恩
                product_id=product_id,
                device_id=device_id,
                station_id=station_id,
                standard_output=params.get('standard_output', 0),
                standard_quality_rate=params.get('standard_quality_rate', 0.99),
                standard_rework_limit=params.get('standard_rework_limit', 0.005),
                standard_scrap_limit=params.get('standard_scrap_limit', 0.001),
                note=params.get('note', ''),
            ))
            imported += 1

    db.commit()
    print(f"[OK] 标准参数初始化完成 (导入: {imported}, 跳过: {skipped})")


def main():
    db = SessionLocal()
    try:
        print("开始初始化基础数据...")
        init_factories(db)
        init_products(db)
        init_devices(db)
        init_stations(db)
        init_standard_params_from_config(db)
        print("\n数据初始化完成！")
    except Exception as e:
        print(f"初始化失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
