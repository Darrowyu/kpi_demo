from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List, Optional

from app.database import get_db
from app.models.employee import Employee
from app.models.production_record import ProductionRecord
from app.schemas.employee import (
    Employee as EmployeeSchema, 
    EmployeeCreate, 
    EmployeeUpdate,
    EmployeeListResponse
)

router = APIRouter()


@router.get("/", response_model=EmployeeListResponse)
def get_employees(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(100, ge=1, le=1000, description="每页数量"),
    factory_id: Optional[int] = Query(None, description="厂区ID筛选"),
    status: Optional[str] = Query(None, description="状态筛选: active在职, inactive离职"),
    search: Optional[str] = Query(None, description="搜索关键词(工号/姓名/部门)"),
    db: Session = Depends(get_db)
):
    """获取员工列表（支持分页、筛选、搜索）"""
    query = db.query(Employee).options(joinedload(Employee.factory))
    
    # 应用筛选
    if factory_id:
        query = query.filter(Employee.factory_id == factory_id)
    if status:
        query = query.filter(Employee.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Employee.employee_no.ilike(search_pattern),
                Employee.name.ilike(search_pattern),
                Employee.department.ilike(search_pattern)
            )
        )
    
    # 获取总数
    total = query.count()
    
    # 获取分页数据
    employees = query.offset(skip).limit(limit).all()
    
    # 构建响应
    result = []
    for emp in employees:
        emp_dict = {
            "id": emp.id,
            "employee_no": emp.employee_no,
            "name": emp.name,
            "department": emp.department,
            "position": emp.position,
            "phone": emp.phone,
            "email": emp.email,
            "factory_id": emp.factory_id,
            "factory_name": emp.factory.name if emp.factory else "",
            "status": emp.status,
            "hire_date": emp.hire_date,
            "created_at": emp.created_at,
            "updated_at": emp.updated_at,
        }
        result.append(EmployeeSchema(**emp_dict))
    
    return EmployeeListResponse(
        total=total,
        items=result,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit
    )


@router.post("/", response_model=EmployeeSchema)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    """创建员工"""
    # 检查工号是否已存在
    existing = db.query(Employee).filter(Employee.employee_no == employee.employee_no).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"工号 {employee.employee_no} 已存在")
    
    db_employee = Employee(**employee.model_dump(exclude_unset=True))
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    # 加载关联数据
    db_employee = db.query(Employee).options(joinedload(Employee.factory)).filter(
        Employee.id == db_employee.id
    ).first()
    
    return EmployeeSchema(
        id=db_employee.id,
        employee_no=db_employee.employee_no,
        name=db_employee.name,
        department=db_employee.department,
        position=db_employee.position,
        phone=db_employee.phone,
        email=db_employee.email,
        factory_id=db_employee.factory_id,
        factory_name=db_employee.factory.name if db_employee.factory else "",
        status=db_employee.status,
        hire_date=db_employee.hire_date,
        created_at=db_employee.created_at,
        updated_at=db_employee.updated_at,
    )


@router.get("/{employee_id}", response_model=EmployeeSchema)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """获取单个员工详情"""
    employee = db.query(Employee).options(joinedload(Employee.factory)).filter(
        Employee.id == employee_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="员工不存在")
    
    return EmployeeSchema(
        id=employee.id,
        employee_no=employee.employee_no,
        name=employee.name,
        department=employee.department,
        position=employee.position,
        phone=employee.phone,
        email=employee.email,
        factory_id=employee.factory_id,
        factory_name=employee.factory.name if employee.factory else "",
        status=employee.status,
        hire_date=employee.hire_date,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


@router.put("/{employee_id}", response_model=EmployeeSchema)
def update_employee(employee_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db)):
    """更新员工信息"""
    db_employee = db.query(Employee).options(joinedload(Employee.factory)).filter(
        Employee.id == employee_id
    ).first()
    
    if not db_employee:
        raise HTTPException(status_code=404, detail="员工不存在")
    
    # 如果修改了工号，检查新工号是否已存在
    update_data = employee.model_dump(exclude_unset=True)
    if "employee_no" in update_data and update_data["employee_no"] != db_employee.employee_no:
        existing = db.query(Employee).filter(
            Employee.employee_no == update_data["employee_no"],
            Employee.id != employee_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"工号 {update_data['employee_no']} 已被其他员工使用")
    
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    
    return EmployeeSchema(
        id=db_employee.id,
        employee_no=db_employee.employee_no,
        name=db_employee.name,
        department=db_employee.department,
        position=db_employee.position,
        phone=db_employee.phone,
        email=db_employee.email,
        factory_id=db_employee.factory_id,
        factory_name=db_employee.factory.name if db_employee.factory else "",
        status=db_employee.status,
        hire_date=db_employee.hire_date,
        created_at=db_employee.created_at,
        updated_at=db_employee.updated_at,
    )


@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """删除员工"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="员工不存在")
    
    # 检查是否有生产记录关联
    record_count = db.query(ProductionRecord).filter(
        ProductionRecord.employee_id == employee_id
    ).count()
    
    if record_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"该员工有 {record_count} 条生产记录，无法删除。建议将状态改为离职。"
        )
    
    db.delete(employee)
    db.commit()
    return {"message": "删除成功"}


@router.post("/batch-import")
def batch_import_employees(employees: List[EmployeeCreate], db: Session = Depends(get_db)):
    """批量导入员工"""
    imported = 0
    updated = 0
    errors = []
    
    for emp_data in employees:
        try:
            # 检查工号是否已存在
            existing = db.query(Employee).filter(Employee.employee_no == emp_data.employee_no).first()
            
            if existing:
                # 更新现有员工
                for key, value in emp_data.model_dump().items():
                    setattr(existing, key, value)
                updated += 1
            else:
                # 创建新员工
                new_emp = Employee(**emp_data.model_dump())
                db.add(new_emp)
                imported += 1
        except Exception as e:
            errors.append({"employee_no": emp_data.employee_no, "error": str(e)})
    
    db.commit()
    return {
        "imported": imported,
        "updated": updated,
        "errors": errors
    }


@router.get("/stats/summary")
def get_employee_stats(db: Session = Depends(get_db)):
    """获取员工统计信息"""
    total = db.query(Employee).count()
    active = db.query(Employee).filter(Employee.status == "active").count()
    inactive = db.query(Employee).filter(Employee.status == "inactive").count()
    
    # 按厂区统计
    factory_stats = db.query(
        Employee.factory_id,
        func.count(Employee.id).label("count")
    ).group_by(Employee.factory_id).all()
    
    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "by_factory": [{"factory_id": f[0], "count": f[1]} for f in factory_stats]
    }
