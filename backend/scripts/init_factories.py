"""
初始化厂区数据脚本
创建三个厂区：东莞迅安、湖北赤壁、泰国知勉
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.models.factory import Factory

# 创建表
models.Base.metadata.create_all(bind=engine)

# 三个厂区
FACTORIES = [
    {"code": "DG_XA", "name": "东莞迅安", "description": "东莞生产基地"},
    {"code": "HB_CB", "name": "湖北赤壁", "description": "湖北赤壁生产基地"},
    {"code": "TG_ZM", "name": "泰国知勉", "description": "泰国生产基地"},
]


def init_factories(db: Session):
    """初始化厂区数据"""
    for factory_data in FACTORIES:
        existing = db.query(Factory).filter(Factory.code == factory_data["code"]).first()
        if not existing:
            db.add(Factory(**factory_data))
            print(f"[创建] {factory_data['name']} ({factory_data['code']})")
        else:
            # 更新名称和描述
            existing.name = factory_data["name"]
            existing.description = factory_data["description"]
            print(f"[更新] {factory_data['name']} ({factory_data['code']})")
    
    db.commit()
    print("\n厂区数据初始化完成!")


def main():
    db = SessionLocal()
    try:
        print("开始初始化厂区数据...")
        init_factories(db)
    except Exception as e:
        print(f"初始化失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
