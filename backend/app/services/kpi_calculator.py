"""
KPI计算服务
从原kpi_calculator.py迁移核心算法
"""
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from sqlalchemy.orm import Session
from app.models.standard_param import StandardParam
from app.models.production_record import ProductionRecord
from app.config import KPI_WEIGHTS, MONTHLY_STANDARD_HOURS, GRADE_THRESHOLDS, GRADE_SCORES


@dataclass
class AggregatedData:
    """聚合数据"""
    product_model: str
    device_name: str
    station_name: str
    total_hours: float
    total_good: int
    total_rework: int
    total_scrap: int
    actual_output: float
    actual_quality_rate: float
    hours_ratio: float
    output_ratio: float


@dataclass
class KPIIndicator:
    """KPI指标"""
    name: str
    actual_value: float
    grade: str
    raw_score: int
    weight: float
    weighted_score: float


class KPICalculator:
    """KPI计算器"""

    def __init__(self, db: Session):
        self.db = db

    def get_standard_params(self, product_model: str, device_name: str, station_name: str) -> Optional[Dict]:
        """获取标准参数（支持回退到手工标准）"""
        # 先查精确匹配
        from app.models.product import Product
        from app.models.device import Device
        from app.models.station import Station

        param = self.db.query(StandardParam).join(Product).join(Station).outerjoin(Device).filter(
            Product.model == product_model,
            Station.name == station_name,
        )

        if device_name:
            param = param.filter(Device.name == device_name)
        else:
            param = param.filter(StandardParam.device_id.is_(None))

        result = param.first()

        if result:
            return {
                "standard_output": result.standard_output,
                "standard_quality_rate": result.standard_quality_rate,
                "standard_rework_limit": result.standard_rework_limit,
                "standard_scrap_limit": result.standard_scrap_limit,
            }

        # 回退到手工标准
        if device_name:
            return self.get_standard_params(product_model, "", station_name)

        return None

    def aggregate_data(self, records: List[ProductionRecord]) -> List[AggregatedData]:
        """按(产品+设备+工站)聚合数据"""
        groups = {}

        for record in records:
            key = (record.product_model, record.device_name, record.station_name)
            if key not in groups:
                groups[key] = {
                    "product_model": record.product_model,
                    "device_name": record.device_name,
                    "station_name": record.station_name,
                    "total_hours": 0,
                    "total_good": 0,
                    "total_rework": 0,
                    "total_scrap": 0,
                }
            groups[key]["total_hours"] += record.production_hours
            groups[key]["total_good"] += record.good_quantity
            groups[key]["total_rework"] += record.rework_quantity
            groups[key]["total_scrap"] += record.scrap_quantity

        # 计算总工时和总产量用于计算占比
        total_hours = sum(g["total_hours"] for g in groups.values())
        total_output = sum(g["total_good"] + g["total_rework"] + g["total_scrap"] for g in groups.values())

        result = []
        for key, data in groups.items():
            total_quantity = data["total_good"] + data["total_rework"] + data["total_scrap"]

            actual_output = data["total_good"] / data["total_hours"] if data["total_hours"] > 0 else 0
            actual_quality_rate = data["total_good"] / total_quantity if total_quantity > 0 else 0

            hours_ratio = data["total_hours"] / total_hours if total_hours > 0 else 0
            output_ratio = total_quantity / total_output if total_output > 0 else 0

            result.append(AggregatedData(
                product_model=data["product_model"],
                device_name=data["device_name"],
                station_name=data["station_name"],
                total_hours=data["total_hours"],
                total_good=data["total_good"],
                total_rework=data["total_rework"],
                total_scrap=data["total_scrap"],
                actual_output=actual_output,
                actual_quality_rate=actual_quality_rate,
                hours_ratio=hours_ratio,
                output_ratio=output_ratio,
            ))

        return result

    def determine_grade(self, indicator_name: str, value: float) -> str:
        """判定等级"""
        thresholds = GRADE_THRESHOLDS.get(indicator_name, {})

        if indicator_name in ["rework_rate", "scrap_rate"]:
            # 返工率和报废率：越低越好
            if value <= thresholds.get("甲", 0):
                return "甲"
            elif value <= thresholds.get("乙", 0):
                return "乙"
            elif value <= thresholds.get("丙", 0):
                return "丙"
            else:
                return "丁"
        else:
            # 其他指标：越高越好
            if value >= thresholds.get("甲", 1.0):
                return "甲"
            elif value >= thresholds.get("乙", 0):
                return "乙"
            elif value >= thresholds.get("丙", 0):
                return "丙"
            else:
                return "丁"

    def calc_working_hours_rate(self, records: List[ProductionRecord]) -> KPIIndicator:
        """计算工时达成率"""
        total_hours = sum(r.production_hours for r in records)
        rate = total_hours / MONTHLY_STANDARD_HOURS

        grade = self.determine_grade("working_hours_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["working_hours_rate"]

        return KPIIndicator(
            name="工时达成率",
            actual_value=round(rate * 100, 2),  # 百分比显示
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=round(raw_score * weight, 2),
        )

    def calc_quality_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """计算良品达成率（加权平均）"""
        weighted_sum = 0

        for data in aggregated:
            std_params = self.get_standard_params(
                data.product_model,
                data.device_name,
                data.station_name
            )
            if std_params:
                std_quality_rate = std_params["standard_quality_rate"]
                if std_quality_rate > 0:
                    ratio = data.actual_quality_rate / std_quality_rate
                    weighted_sum += ratio * data.hours_ratio

        grade = self.determine_grade("quality_rate", weighted_sum)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["quality_rate"]

        return KPIIndicator(
            name="良品达成率",
            actual_value=round(weighted_sum * 100, 2),
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=round(raw_score * weight, 2),
        )

    def calc_productivity_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """计算人时产出达成率（加权平均）"""
        weighted_sum = 0

        for data in aggregated:
            std_params = self.get_standard_params(
                data.product_model,
                data.device_name,
                data.station_name
            )
            if std_params:
                std_output = std_params["standard_output"]
                if std_output > 0:
                    ratio = data.actual_output / std_output
                    weighted_sum += ratio * data.hours_ratio

        grade = self.determine_grade("productivity_rate", weighted_sum)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["productivity_rate"]

        return KPIIndicator(
            name="人时产出达成率",
            actual_value=round(weighted_sum * 100, 2),
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=round(raw_score * weight, 2),
        )

    def calc_rework_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """计算返工率（按产量加权）"""
        total_rework = sum(data.total_rework * data.output_ratio for data in aggregated)
        total_output = sum((data.total_good + data.total_rework + data.total_scrap) * data.output_ratio for data in aggregated)

        rate = total_rework / total_output if total_output > 0 else 0

        grade = self.determine_grade("rework_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["rework_rate"]

        return KPIIndicator(
            name="返工率控制",
            actual_value=round(rate * 100, 2),
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=round(raw_score * weight, 2),
        )

    def calc_scrap_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """计算报废率（按产量加权）"""
        total_scrap = sum(data.total_scrap * data.output_ratio for data in aggregated)
        total_output = sum((data.total_good + data.total_rework + data.total_scrap) * data.output_ratio for data in aggregated)

        rate = total_scrap / total_output if total_output > 0 else 0

        grade = self.determine_grade("scrap_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["scrap_rate"]

        return KPIIndicator(
            name="报废率控制",
            actual_value=round(rate * 100, 2),
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=round(raw_score * weight, 2),
        )

    def calculate_kpi(self, employee_id: int, month: str, records: List[ProductionRecord]) -> Dict:
        """计算员工KPI"""
        if not records:
            return None

        # 聚合数据
        aggregated = self.aggregate_data(records)

        # 计算五大指标
        indicators = [
            self.calc_working_hours_rate(records),
            self.calc_quality_rate(aggregated),
            self.calc_productivity_rate(aggregated),
            self.calc_rework_rate(aggregated),
            self.calc_scrap_rate(aggregated),
        ]

        # 综合得分
        total_score = sum(ind.weighted_score for ind in indicators)

        # 判定综合等级
        if total_score >= 8.0:
            final_grade = "甲等"
        elif total_score >= 6.0:
            final_grade = "乙等"
        elif total_score >= 4.0:
            final_grade = "丙等"
        else:
            final_grade = "丁等"

        return {
            "indicators": indicators,
            "aggregated_data": aggregated,
            "total_score": round(total_score, 2),
            "final_grade": final_grade,
        }
