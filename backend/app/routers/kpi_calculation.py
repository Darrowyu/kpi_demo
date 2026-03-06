from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.employee import Employee
from app.models.production_record import ProductionRecord
from app.models.kpi_result import KPIResult
from app.schemas.kpi import KPICalculationRequest, KPICalculationResponse, KPIResultDetail
from app.services.kpi_calculator import KPICalculator

router = APIRouter()


@router.post("/calculate", response_model=KPICalculationResponse)
def calculate_kpi(request: KPICalculationRequest, db: Session = Depends(get_db)):
    """计算员工KPI"""
    # 获取员工
    employee = db.query(Employee).filter(Employee.id == request.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="员工不存在")

    # 获取该员工该月的生产记录
    records = db.query(ProductionRecord).filter(
        ProductionRecord.employee_id == request.employee_id,
        ProductionRecord.month == request.month
    ).all()

    if not records:
        return KPICalculationResponse(
            success=False,
            message=f"未找到员工 {employee.name} 在 {request.month} 的生产记录"
        )

    # 计算KPI
    calculator = KPICalculator(db)
    result = calculator.calculate_kpi(request.employee_id, request.month, records)

    if not result:
        return KPICalculationResponse(
            success=False,
            message="KPI计算失败"
        )

    # 保存结果到数据库
    kpi_result = db.query(KPIResult).filter(
        KPIResult.employee_id == request.employee_id,
        KPIResult.month == request.month
    ).first()

    if kpi_result:
        # 更新
        kpi_result.working_hours_rate = result["indicators"][0].actual_value
        kpi_result.quality_rate = result["indicators"][1].actual_value
        kpi_result.productivity_rate = result["indicators"][2].actual_value
        kpi_result.rework_rate = result["indicators"][3].actual_value
        kpi_result.scrap_rate = result["indicators"][4].actual_value
        kpi_result.working_hours_grade = result["indicators"][0].grade
        kpi_result.quality_grade = result["indicators"][1].grade
        kpi_result.productivity_grade = result["indicators"][2].grade
        kpi_result.rework_grade = result["indicators"][3].grade
        kpi_result.scrap_grade = result["indicators"][4].grade
        kpi_result.total_score = result["total_score"]
        kpi_result.final_grade = result["final_grade"]
    else:
        # 创建
        kpi_result = KPIResult(
            employee_id=request.employee_id,
            month=request.month,
            working_hours_rate=result["indicators"][0].actual_value,
            quality_rate=result["indicators"][1].actual_value,
            productivity_rate=result["indicators"][2].actual_value,
            rework_rate=result["indicators"][3].actual_value,
            scrap_rate=result["indicators"][4].actual_value,
            working_hours_grade=result["indicators"][0].grade,
            quality_grade=result["indicators"][1].grade,
            productivity_grade=result["indicators"][2].grade,
            rework_grade=result["indicators"][3].grade,
            scrap_grade=result["indicators"][4].grade,
            total_score=result["total_score"],
            final_grade=result["final_grade"],
        )
        db.add(kpi_result)

    db.commit()
    db.refresh(kpi_result)

    return KPICalculationResponse(
        success=True,
        message="KPI计算成功",
        result=KPIResultDetail(
            id=kpi_result.id,
            employee_id=employee.id,
            employee_name=employee.name,
            employee_no=employee.employee_no,
            month=kpi_result.month,
            working_hours_rate=kpi_result.working_hours_rate,
            quality_rate=kpi_result.quality_rate,
            productivity_rate=kpi_result.productivity_rate,
            rework_rate=kpi_result.rework_rate,
            scrap_rate=kpi_result.scrap_rate,
            working_hours_grade=kpi_result.working_hours_grade,
            quality_grade=kpi_result.quality_grade,
            productivity_grade=kpi_result.productivity_grade,
            rework_grade=kpi_result.rework_grade,
            scrap_grade=kpi_result.scrap_grade,
            total_score=kpi_result.total_score,
            final_grade=kpi_result.final_grade,
            created_at=kpi_result.created_at,
        )
    )


@router.get("/results", response_model=List[KPIResultDetail])
def get_kpi_results(
    employee_id: int = None,
    month: str = None,
    db: Session = Depends(get_db)
):
    """获取KPI结果列表"""
    query = db.query(KPIResult, Employee).join(Employee)

    if employee_id:
        query = query.filter(KPIResult.employee_id == employee_id)
    if month:
        query = query.filter(KPIResult.month == month)

    results = query.all()

    return [
        KPIResultDetail(
            id=r.KPIResult.id,
            employee_id=r.Employee.id,
            employee_name=r.Employee.name,
            employee_no=r.Employee.employee_no,
            month=r.KPIResult.month,
            working_hours_rate=r.KPIResult.working_hours_rate,
            quality_rate=r.KPIResult.quality_rate,
            productivity_rate=r.KPIResult.productivity_rate,
            rework_rate=r.KPIResult.rework_rate,
            scrap_rate=r.KPIResult.scrap_rate,
            working_hours_grade=r.KPIResult.working_hours_grade,
            quality_grade=r.KPIResult.quality_grade,
            productivity_grade=r.KPIResult.productivity_grade,
            rework_grade=r.KPIResult.rework_grade,
            scrap_grade=r.KPIResult.scrap_grade,
            total_score=r.KPIResult.total_score,
            final_grade=r.KPIResult.final_grade,
            created_at=r.KPIResult.created_at,
        )
        for r in results
    ]


@router.get("/results/{result_id}", response_model=KPIResultDetail)
def get_kpi_result(result_id: int, db: Session = Depends(get_db)):
    """获取单个KPI结果"""
    result = db.query(KPIResult, Employee).join(Employee).filter(KPIResult.id == result_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="KPI结果不存在")

    return KPIResultDetail(
        id=result.KPIResult.id,
        employee_id=result.Employee.id,
        employee_name=result.Employee.name,
        employee_no=result.Employee.employee_no,
        month=result.KPIResult.month,
        working_hours_rate=result.KPIResult.working_hours_rate,
        quality_rate=result.KPIResult.quality_rate,
        productivity_rate=result.KPIResult.productivity_rate,
        rework_rate=result.KPIResult.rework_rate,
        scrap_rate=result.KPIResult.scrap_rate,
        working_hours_grade=result.KPIResult.working_hours_grade,
        quality_grade=result.KPIResult.quality_grade,
        productivity_grade=result.KPIResult.productivity_grade,
        rework_grade=result.KPIResult.rework_grade,
        scrap_grade=result.KPIResult.scrap_grade,
        total_score=result.KPIResult.total_score,
        final_grade=result.KPIResult.final_grade,
        created_at=result.KPIResult.created_at,
    )


@router.get("/dashboard-stats")
def get_dashboard_stats(month: Optional[str] = None, db: Session = Depends(get_db)):
    """获取仪表盘统计数据"""
    from sqlalchemy import func

    # 默认使用当前月份
    if not month:
        month = datetime.now().strftime("%Y-%m")

    # 获取上月份用于计算环比
    current_year, current_month = int(month[:4]), int(month[5:7])
    if current_month == 1:
        last_month = f"{current_year - 1}-12"
    else:
        last_month = f"{current_year}-{current_month - 1:02d}"

    # 本月统计数据
    current_results = db.query(KPIResult).filter(KPIResult.month == month).all()

    total_employees = len(current_results)
    avg_score = sum(r.total_score for r in current_results) / total_employees if total_employees > 0 else 0
    grade_a = sum(1 for r in current_results if r.final_grade and r.final_grade.startswith("甲"))
    grade_d = sum(1 for r in current_results if r.final_grade and r.final_grade.startswith("丁"))

    # 上月数据用于环比
    last_month_results = db.query(KPIResult).filter(KPIResult.month == last_month).all()
    last_month_count = len(last_month_results)

    mom_change = 0
    if last_month_count > 0:
        mom_change = round((total_employees - last_month_count) / last_month_count * 100, 1)

    return {
        "success": True,
        "data": {
            "totalEmployees": total_employees,
            "avgScore": round(avg_score * 10, 1) if avg_score <= 10 else round(avg_score, 1),  # 转换为百分制
            "gradeA": grade_a,
            "gradeD": grade_d,
            "monthOverMonthChange": mom_change
        }
    }


@router.get("/recent-calculations")
def get_recent_calculations(limit: int = 5, db: Session = Depends(get_db)):
    """获取最近KPI计算记录"""
    results = db.query(KPIResult, Employee).join(Employee).order_by(
        KPIResult.created_at.desc()
    ).limit(limit).all()

    data = [
        {
            "id": r.KPIResult.id,
            "employeeName": r.Employee.name,
            "month": r.KPIResult.month,
            "totalScore": round(r.KPIResult.total_score, 2),
            "grade": r.KPIResult.final_grade[0] if r.KPIResult.final_grade else "",
            "calculatedAt": r.KPIResult.created_at.strftime("%Y-%m-%d %H:%M") if r.KPIResult.created_at else ""
        }
        for r in results
    ]

    return {
        "success": True,
        "data": data
    }
