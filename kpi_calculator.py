"""
生产人员KPI计算器 - 核心计算逻辑
基于算法体系文件定义的固定算法实现
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Tuple, List, Optional
from dataclasses import dataclass, asdict
from config import (
    STANDARD_PARAMS, KPI_WEIGHTS, GRADE_THRESHOLDS,
    GRADE_SCORES, MONTHLY_STANDARD_HOURS, KPI_NAMES
)


@dataclass
class KPIResult:
    """KPI指标计算结果"""
    indicator_name: str       # 指标名称
    actual_value: float       # 实际达成值
    grade: str               # 等级（甲/乙/丙/丁）
    raw_score: int           # 原始分（10/8/6/4）
    weight: float            # 权重
    weighted_score: float    # 加权得分


@dataclass
class AggregatedData:
    """按产品+设备+工站聚合的数据"""
    product: str             # 产品型号
    device: str              # 设备名称（空表示手工作业）
    station: str             # 工站
    total_hours: float       # 总工时
    total_good: int          # 总良品数
    total_rework: int        # 总返工数
    total_scrap: int         # 总报废数
    actual_output: float     # 实际人时产出
    actual_quality_rate: float  # 实际良品率
    hours_ratio: float       # 工时占比
    output_ratio: float      # 产量占比


class KPICalculator:
    """
    生产人员KPI计算器

    实现5个KPI指标的计算：
    1. 工时达成率（10%）
    2. 良品达成率（30%）
    3. 人时产出达成率（30%）
    4. 返工率控制（15%）
    5. 报废率控制（15%）
    """

    def __init__(self, standard_params: Dict = STANDARD_PARAMS):
        self.standard_params = standard_params
        self.raw_data: Optional[pd.DataFrame] = None
        self.employee_id: str = ""
        self.employee_name: str = ""
        self.month: str = ""
        self.aggregated_data: List[AggregatedData] = []
        self.kpi_results: List[KPIResult] = []

    def load_data(self, file_path: str) -> None:
        """加载原始生产数据"""
        # 读取Excel文件
        df = pd.read_excel(file_path, sheet_name=0, header=None)

        # 提取员工信息（第1行）
        self.employee_id = str(df.iloc[0, 1]) if pd.notna(df.iloc[0, 1]) else ""
        self.employee_name = str(df.iloc[0, 4]) if pd.notna(df.iloc[0, 4]) else ""

        # 读取数据行（从第3行开始，即索引2）
        data_df = pd.read_excel(file_path, sheet_name=0, header=1)

        # 标准化列名 (支持设备列的多语言变体)
        # 注意：只映射"设备名称"列，不映射"设备编号"列
        column_mapping = {
            '日期': 'date',
            '工站': 'station',
            '工厂型号': 'product',
            '生產時數': 'hours',
            '良品數量': 'good_qty',
            '返工品數量': 'rework_qty',
            '報廢品數量': 'scrap_qty',
            '设备名称': 'device',
            '設備名稱': 'device',
        }

        # 找到匹配的列名并映射
        actual_columns = {}
        used_targets = set()  # 已使用的目标列名
        for col in data_df.columns:
            col_str = str(col).strip()
            for key, value in column_mapping.items():
                if key in col_str and value not in used_targets:
                    actual_columns[col] = value
                    used_targets.add(value)
                    break

        data_df = data_df.rename(columns=actual_columns)

        # 选择需要的列（包含device列）
        required_cols = ['date', 'station', 'product', 'hours', 'good_qty', 'rework_qty', 'scrap_qty']
        available_cols = [c for c in required_cols if c in data_df.columns]
        self.raw_data = data_df[available_cols].copy()

        # 检测设备列，如果不存在则添加并默认为空字符串（手工作业）
        if 'device' in data_df.columns:
            self.raw_data['device'] = data_df['device'].fillna('').astype(str)
        else:
            self.raw_data['device'] = ''

        # 数据类型转换
        self.raw_data['hours'] = pd.to_numeric(self.raw_data['hours'], errors='coerce').fillna(0)
        self.raw_data['good_qty'] = pd.to_numeric(self.raw_data['good_qty'], errors='coerce').fillna(0)
        self.raw_data['rework_qty'] = pd.to_numeric(self.raw_data['rework_qty'], errors='coerce').fillna(0)
        self.raw_data['scrap_qty'] = pd.to_numeric(self.raw_data['scrap_qty'], errors='coerce').fillna(0)

        # 处理工站名称中包含空格的情况（多工站拆分）
        self.raw_data = self._expand_multi_station_rows(self.raw_data)

        # 提取月份
        if 'date' in self.raw_data.columns and len(self.raw_data) > 0:
            first_date = pd.to_datetime(self.raw_data['date'].iloc[0])
            self.month = first_date.strftime('%Y年%m月')

    def _expand_multi_station_rows(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        展开包含多个工站的行
        例如: '纸箱打两条                      黄色包装带' -> 拆分为两行
        """
        if 'station' not in df.columns:
            return df

        expanded_rows = []
        for idx, row in df.iterrows():
            station_value = str(row['station']) if pd.notna(row['station']) else ''

            # 按空白字符分割工站名称
            stations = [s.strip() for s in station_value.split() if s.strip()]

            if len(stations) <= 1:
                # 单行工站，直接保留
                expanded_rows.append(row.to_dict())
            else:
                # 多工站行，拆分为多行，数据按比例分摊
                n_stations = len(stations)
                for station in stations:
                    new_row = row.to_dict().copy()
                    new_row['station'] = station
                    # 工时和产量按工站数量平均分摊
                    new_row['hours'] = row['hours'] / n_stations
                    new_row['good_qty'] = int(row['good_qty'] / n_stations)
                    new_row['rework_qty'] = int(row['rework_qty'] / n_stations)
                    new_row['scrap_qty'] = int(row['scrap_qty'] / n_stations)
                    expanded_rows.append(new_row)

        return pd.DataFrame(expanded_rows)

    def _get_standard_params(self, product: str, device: str, station: str) -> Optional[Dict]:
        """查询标准参数，支持回退逻辑"""
        # 第一优先级：(产品, 设备, 工站)
        key = (product, device, station)
        if key in self.standard_params:
            return self.standard_params[key]

        # 第二优先级：(产品, '', 工站) 手工作业
        fallback_key = (product, '', station)
        if fallback_key in self.standard_params:
            return self.standard_params[fallback_key]

        return None

    def aggregate_by_product_station(self) -> None:
        """按产品+设备+工站维度聚合数据"""
        if self.raw_data is None or len(self.raw_data) == 0:
            return

        # 按产品、设备和工站分组聚合
        grouped = self.raw_data.groupby(['product', 'device', 'station']).agg({
            'hours': 'sum',
            'good_qty': 'sum',
            'rework_qty': 'sum',
            'scrap_qty': 'sum'
        }).reset_index()

        # 计算总量
        total_hours = grouped['hours'].sum()
        total_output = grouped['good_qty'].sum() + grouped['rework_qty'].sum() + grouped['scrap_qty'].sum()

        # 构建聚合数据列表
        self.aggregated_data = []
        for _, row in grouped.iterrows():
            product = row['product']
            device = str(row.get('device', '')).strip()  # 设备名称，确保是字符串
            station = row['station']
            hours = row['hours']
            good = int(row['good_qty'])
            rework = int(row['rework_qty'])
            scrap = int(row['scrap_qty'])

            # 实际人时产出 = 良品数 ÷ 工时
            actual_output = good / hours if hours > 0 else 0

            # 实际良品率 = 良品数 ÷ (良品+返工+报废)
            total = good + rework + scrap
            actual_quality_rate = good / total if total > 0 else 0

            # 工时占比
            hours_ratio = hours / total_hours if total_hours > 0 else 0

            # 产量占比
            output_ratio = total / total_output if total_output > 0 else 0

            agg = AggregatedData(
                product=product,
                device=device,
                station=station,
                total_hours=hours,
                total_good=good,
                total_rework=rework,
                total_scrap=scrap,
                actual_output=actual_output,
                actual_quality_rate=actual_quality_rate,
                hours_ratio=hours_ratio,
                output_ratio=output_ratio
            )
            self.aggregated_data.append(agg)

    def determine_grade(self, value: float, indicator: str) -> str:
        """
        根据指标值判定等级

        Args:
            value: 指标实际值
            indicator: 指标类型

        Returns:
            等级（甲/乙/丙/丁）
        """
        thresholds = GRADE_THRESHOLDS.get(indicator, {})

        for grade, (low, high) in thresholds.items():
            if low <= value <= high:
                return grade

        return '丁'  # 默认丁等

    def calc_working_hours_rate(self) -> KPIResult:
        """
        计算工时达成率
        公式: 实际总工时 ÷ 月度标准工时 × 100%
        """
        if not self.aggregated_data:
            return KPIResult('工时达成率', 0, '丁', 4, 0.10, 0.4)

        # 实际总工时
        actual_hours = sum(agg.total_hours for agg in self.aggregated_data)

        # 工时达成率
        rate = (actual_hours / MONTHLY_STANDARD_HOURS) * 100

        # 判定等级
        grade = self.determine_grade(rate, 'working_hours_rate')
        raw_score = GRADE_SCORES[grade]
        weight = KPI_WEIGHTS['working_hours_rate']
        weighted_score = raw_score * weight

        return KPIResult(
            indicator_name='工时达成率',
            actual_value=rate,
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score
        )

    def calc_quality_rate(self) -> KPIResult:
        """
        计算良品达成率
        公式: Σ[(各产品+设备+工站实际良品率 ÷ 标准良品率) × 该组合工时占比]
        """
        if not self.aggregated_data:
            return KPIResult('良品达成率', 0, '丁', 4, 0.30, 1.2)

        weighted_sum = 0
        used_combinations = 0

        for agg in self.aggregated_data:
            # 使用三维查询标准参数，支持回退到手工标准
            std = self._get_standard_params(agg.product, agg.device, agg.station)
            if std is None:
                continue

            std_quality_rate = std['standard_quality_rate']

            # (实际良品率÷标准良品率) × 工时占比
            if std_quality_rate > 0:
                contribution = (agg.actual_quality_rate / std_quality_rate) * agg.hours_ratio
                weighted_sum += contribution
                used_combinations += 1

        # 转换为百分比
        rate = weighted_sum * 100

        # 判定等级
        grade = self.determine_grade(rate, 'quality_rate')
        raw_score = GRADE_SCORES[grade]
        weight = KPI_WEIGHTS['quality_rate']
        weighted_score = raw_score * weight

        return KPIResult(
            indicator_name='良品达成率',
            actual_value=rate,
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score
        )

    def calc_productivity_rate(self) -> KPIResult:
        """
        计算人时产出达成率
        公式: Σ[(各产品+设备+工站实际人时产出 ÷ 标准人时产出) × 该组合工时占比]
        """
        if not self.aggregated_data:
            return KPIResult('人时产出达成率', 0, '丁', 4, 0.30, 1.2)

        weighted_sum = 0
        used_combinations = 0

        for agg in self.aggregated_data:
            # 使用三维查询标准参数，支持回退到手工标准
            std = self._get_standard_params(agg.product, agg.device, agg.station)
            if std is None:
                continue

            std_output = std['standard_output']

            # (实际产出÷标准产出) × 工时占比
            if std_output > 0:
                contribution = (agg.actual_output / std_output) * agg.hours_ratio
                weighted_sum += contribution
                used_combinations += 1

        # 转换为百分比
        rate = weighted_sum * 100

        # 判定等级
        grade = self.determine_grade(rate, 'productivity_rate')
        raw_score = GRADE_SCORES[grade]
        weight = KPI_WEIGHTS['productivity_rate']
        weighted_score = raw_score * weight

        return KPIResult(
            indicator_name='人时产出达成率',
            actual_value=rate,
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score
        )

    def calc_rework_rate(self) -> KPIResult:
        """
        计算返工率控制
        公式: Σ(各产品返工率 × 该产品产量占比)
        返工率 = 返工数 ÷ (良品+返工+报废)
        """
        if not self.aggregated_data:
            return KPIResult('返工率控制', 0, '甲', 10, 0.15, 1.5)

        weighted_sum = 0

        # 按产品维度聚合计算返工率
        product_data = {}
        for agg in self.aggregated_data:
            if agg.product not in product_data:
                product_data[agg.product] = {
                    'rework': 0,
                    'total': 0
                }
            product_data[agg.product]['rework'] += agg.total_rework
            product_data[agg.product]['total'] += agg.total_good + agg.total_rework + agg.total_scrap

        # 计算总产量用于产量占比
        grand_total = sum(p['total'] for p in product_data.values())

        for product, data in product_data.items():
            if data['total'] > 0:
                rework_rate = data['rework'] / data['total']
                output_ratio = data['total'] / grand_total if grand_total > 0 else 0
                weighted_sum += rework_rate * output_ratio

        # 转换为百分比
        rate = weighted_sum * 100

        # 判定等级
        grade = self.determine_grade(rate, 'rework_rate')
        raw_score = GRADE_SCORES[grade]
        weight = KPI_WEIGHTS['rework_rate']
        weighted_score = raw_score * weight

        return KPIResult(
            indicator_name='返工率控制',
            actual_value=rate,
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score
        )

    def calc_scrap_rate(self) -> KPIResult:
        """
        计算报废率控制
        公式: Σ(各产品报废率 × 该产品产量占比)
        报废率 = 报废数 ÷ (良品+返工+报废)
        """
        if not self.aggregated_data:
            return KPIResult('报废率控制', 0, '甲', 10, 0.15, 1.5)

        weighted_sum = 0

        # 按产品维度聚合计算报废率
        product_data = {}
        for agg in self.aggregated_data:
            if agg.product not in product_data:
                product_data[agg.product] = {
                    'scrap': 0,
                    'total': 0
                }
            product_data[agg.product]['scrap'] += agg.total_scrap
            product_data[agg.product]['total'] += agg.total_good + agg.total_rework + agg.total_scrap

        # 计算总产量用于产量占比
        grand_total = sum(p['total'] for p in product_data.values())

        for product, data in product_data.items():
            if data['total'] > 0:
                scrap_rate = data['scrap'] / data['total']
                output_ratio = data['total'] / grand_total if grand_total > 0 else 0
                weighted_sum += scrap_rate * output_ratio

        # 转换为百分比
        rate = weighted_sum * 100

        # 判定等级
        grade = self.determine_grade(rate, 'scrap_rate')
        raw_score = GRADE_SCORES[grade]
        weight = KPI_WEIGHTS['scrap_rate']
        weighted_score = raw_score * weight

        return KPIResult(
            indicator_name='报废率控制',
            actual_value=rate,
            grade=grade,
            raw_score=raw_score,
            weight=weight,
            weighted_score=weighted_score
        )

    def calculate_all_kpis(self) -> None:
        """计算所有KPI指标"""
        self.kpi_results = [
            self.calc_working_hours_rate(),
            self.calc_quality_rate(),
            self.calc_productivity_rate(),
            self.calc_rework_rate(),
            self.calc_scrap_rate()
        ]

    def get_total_score(self) -> float:
        """获取综合绩效总得分"""
        return sum(r.weighted_score for r in self.kpi_results)

    def get_total_grade(self) -> str:
        """根据总得分判定综合等级"""
        total = self.get_total_score()
        if total >= 8:
            return '甲'
        elif total >= 6:
            return '乙'
        elif total >= 4:
            return '丙'
        else:
            return '丁'

    def generate_report(self) -> Dict:
        """生成详细计算报告"""
        return {
            'employee_info': {
                'employee_id': self.employee_id,
                'employee_name': self.employee_name,
                'month': self.month
            },
            'raw_data': self.raw_data.to_dict('records') if self.raw_data is not None else [],
            'aggregated_data': [asdict(agg) for agg in self.aggregated_data],
            'kpi_results': [asdict(r) for r in self.kpi_results],
            'total_score': self.get_total_score(),
            'total_grade': self.get_total_grade()
        }
