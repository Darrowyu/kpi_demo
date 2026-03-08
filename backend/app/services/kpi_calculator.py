"""
KPI计算服务
完全复刻CLI版本核心算法，确保计算结果100%一致
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from sqlalchemy.orm import Session
from app.models.standard_param import StandardParam
from app.models.product import Product
from app.models.device import Device
from app.models.station import Station
from app.models.production_record import ProductionRecord
from app.config import KPI_WEIGHTS, MONTHLY_STANDARD_HOURS, GRADE_THRESHOLDS, GRADE_SCORES


@dataclass
class AggregatedData:
    """按产品+设备+工站聚合的数据"""
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
    """KPI计算器 - 完全对齐CLI版本逻辑"""

    def __init__(self, db: Session):
        self.db = db

    def get_standard_params(self, product_model: str, device_name: str, station_name: str) -> Optional[Dict]:
        """
        获取标准参数（支持回退到手工标准）
        与CLI版本 _get_standard_params 逻辑一致
        """
        # 第一优先级：(产品, 设备, 工站) 精确匹配
        param = self.db.query(StandardParam).join(Product).join(Station).outerjoin(Device).filter(
            Product.model == product_model,
            Station.name == station_name,
        )

        # 统一处理空字符串和NULL
        device_name_clean = device_name.strip() if device_name else ""

        if device_name_clean:
            param = param.filter(Device.name == device_name_clean)
        else:
            # 手工标准：device_id为NULL
            param = param.filter(StandardParam.device_id.is_(None))

        result = param.first()

        if result:
            return {
                "standard_output": result.standard_output,
                "standard_quality_rate": result.standard_quality_rate,
                "standard_rework_limit": result.standard_rework_limit,
                "standard_scrap_limit": result.standard_scrap_limit,
            }

        # 第二优先级：(产品, '', 工站) 回退到手工标准
        if device_name_clean:
            return self.get_standard_params(product_model, "", station_name)

        return None

    def aggregate_data(self, records: List[ProductionRecord]) -> List[AggregatedData]:
        """
        按(产品+设备+工站)聚合数据
        与CLI版本 aggregate_by_product_station 逻辑一致
        """
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

        # 计算总量
        total_hours = sum(g["total_hours"] for g in groups.values())
        total_output = sum(g["total_good"] + g["total_rework"] + g["total_scrap"] for g in groups.values())

        result = []
        for key, data in groups.items():
            total_quantity = data["total_good"] + data["total_rework"] + data["total_scrap"]

            # 实际人时产出 = 良品数 / 工时
            actual_output = data["total_good"] / data["total_hours"] if data["total_hours"] > 0 else 0
            # 实际良品率 = 良品数 / 总产量
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
        """
        根据指标值判定等级
        与CLI版本 determine_grade 逻辑完全一致 - 使用范围匹配
        """
        thresholds = GRADE_THRESHOLDS.get(indicator_name, {})

        for grade, (low, high) in thresholds.items():
            if low <= value <= high:
                return grade

        return "丁"  # 默认丁等

    def calc_working_hours_rate(self, records: List[ProductionRecord]) -> KPIIndicator:
        """
        计算工时达成率
        公式: 实际总工时 / 月度标准工时 * 100%
        与CLI版本一致，不使用round()
        """
        total_hours = sum(r.production_hours for r in records)
        rate = (total_hours / MONTHLY_STANDARD_HOURS) * 100

        grade = self.determine_grade("working_hours_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["working_hours_rate"]
        weighted_score = raw_score * weight

        return KPIIndicator(
            name="工时达成率",
            actual_value=rate,  # CLI版本不调用round()
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score,
        )

    def calc_quality_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """
        计算良品达成率
        公式: Σ[(各产品+设备+工站实际良品率 / 标准良品率) * 该组合工时占比]
        与CLI版本一致，不使用round()
        """
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

        rate = weighted_sum * 100

        grade = self.determine_grade("quality_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["quality_rate"]
        weighted_score = raw_score * weight

        return KPIIndicator(
            name="良品达成率",
            actual_value=rate,  # CLI版本不调用round()
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score,
        )

    def calc_productivity_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """
        计算人时产出达成率
        公式: Σ[(各产品+设备+工站实际人时产出 / 标准人时产出) * 该组合工时占比]
        与CLI版本一致，不使用round()
        """
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

        rate = weighted_sum * 100

        grade = self.determine_grade("productivity_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["productivity_rate"]
        weighted_score = raw_score * weight

        return KPIIndicator(
            name="人时产出达成率",
            actual_value=rate,  # CLI版本不调用round()
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score,
        )

    def calc_rework_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """
        计算返工率控制
        公式: Σ(各产品返工率 * 该产品产量占比)
        返工率 = 返工数 / (良品+返工+报废)
        与CLI版本 calc_rework_rate 逻辑完全一致
        """
        # 按产品维度聚合计算返工率
        product_data = {}
        for data in aggregated:
            if data.product_model not in product_data:
                product_data[data.product_model] = {
                    "rework": 0,
                    "total": 0
                }
            product_data[data.product_model]["rework"] += data.total_rework
            product_data[data.product_model]["total"] += data.total_good + data.total_rework + data.total_scrap

        # 计算总产量用于产量占比
        grand_total = sum(p["total"] for p in product_data.values())

        weighted_sum = 0
        for product, pdata in product_data.items():
            if pdata["total"] > 0:
                rework_rate = pdata["rework"] / pdata["total"]
                output_ratio = pdata["total"] / grand_total if grand_total > 0 else 0
                weighted_sum += rework_rate * output_ratio

        rate = weighted_sum * 100

        grade = self.determine_grade("rework_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["rework_rate"]
        weighted_score = raw_score * weight

        return KPIIndicator(
            name="返工率控制",
            actual_value=rate,  # CLI版本不调用round()
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score,
        )

    def calc_scrap_rate(self, aggregated: List[AggregatedData]) -> KPIIndicator:
        """
        计算报废率控制
        公式: Σ(各产品报废率 * 该产品产量占比)
        报废率 = 报废数 / (良品+返工+报废)
        与CLI版本 calc_scrap_rate 逻辑完全一致
        """
        # 按产品维度聚合计算报废率
        product_data = {}
        for data in aggregated:
            if data.product_model not in product_data:
                product_data[data.product_model] = {
                    "scrap": 0,
                    "total": 0
                }
            product_data[data.product_model]["scrap"] += data.total_scrap
            product_data[data.product_model]["total"] += data.total_good + data.total_rework + data.total_scrap

        # 计算总产量用于产量占比
        grand_total = sum(p["total"] for p in product_data.values())

        weighted_sum = 0
        for product, pdata in product_data.items():
            if pdata["total"] > 0:
                scrap_rate = pdata["scrap"] / pdata["total"]
                output_ratio = pdata["total"] / grand_total if grand_total > 0 else 0
                weighted_sum += scrap_rate * output_ratio

        rate = weighted_sum * 100

        grade = self.determine_grade("scrap_rate", rate)
        raw_score = GRADE_SCORES.get(grade, 4)
        weight = KPI_WEIGHTS["scrap_rate"]
        weighted_score = raw_score * weight

        return KPIIndicator(
            name="报废率控制",
            actual_value=rate,  # CLI版本不调用round()
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score,
        )

    def calculate_kpi(self, employee_id: int, month: str, records: List[ProductionRecord]) -> Dict:
        """
        计算员工KPI
        与CLI版本 calculate_all_kpis 逻辑一致
        """
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

        # 判定综合等级 - 与CLI版本 get_total_grade 一致
        if total_score >= 8:
            final_grade = "甲"
        elif total_score >= 6:
            final_grade = "乙"
        elif total_score >= 4:
            final_grade = "丙"
        else:
            final_grade = "丁"

        return {
            "indicators": indicators,
            "aggregated_data": aggregated,
            "total_score": total_score,  # CLI版本不调用round()
            "final_grade": final_grade,
        }
