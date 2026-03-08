"""
CLI版本 vs Web版本 KPI计算结果对比测试
使用实际Excel文件进行验证
"""
import sys
import os

# 添加项目路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'backend'))

import pandas as pd
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# 导入CLI版本
from kpi_calculator import KPICalculator as CLICalculator
from kpi_report_generator import KPIReportGenerator
from config import STANDARD_PARAMS

# 导入Web版本
from app.database import Base
from app.models.production_record import ProductionRecord
from app.models.standard_param import StandardParam
from app.models.product import Product
from app.models.device import Device
from app.models.station import Station
from app.models.factory import Factory
from app.services.kpi_calculator import KPICalculator as WebCalculator


# 导入CLI版本的config到Web数据库
def import_cli_config_to_db(db: Session):
    """将CLI版本的STANDARD_PARAMS导入到数据库"""
    # 创建默认厂区
    factory = db.query(Factory).filter(Factory.code == "DG_XA").first()
    if not factory:
        factory = Factory(code="DG_XA", name="东莞迅安", description="默认厂区")
        db.add(factory)
        db.commit()

    # 清空现有标准参数
    db.query(StandardParam).delete()
    db.query(Station).delete()
    db.query(Device).delete()
    db.query(Product).delete()
    db.commit()

    # 收集所有产品、设备、工站
    products = {}
    devices = {"": None}  # 空字符串表示手工
    stations = {}

    for (product_model, device_name, station_name), params in STANDARD_PARAMS.items():
        # 创建产品
        if product_model not in products:
            product = Product(model=product_model, category="", description="")
            db.add(product)
            db.commit()
            products[product_model] = product

        # 创建设备
        if device_name not in devices:
            if device_name:  # 非空才创建
                device = Device(name=device_name, device_type="")
                db.add(device)
                db.commit()
                devices[device_name] = device
            else:
                devices[device_name] = None

        # 创建工站
        if station_name not in stations:
            station = Station(name=station_name, description="")
            db.add(station)
            db.commit()
            stations[station_name] = station

        # 创建标准参数
        std_param = StandardParam(
            factory_id=factory.id,
            product_id=products[product_model].id,
            device_id=devices[device_name].id if devices[device_name] else None,
            station_id=stations[station_name].id,
            standard_output=params.get('standard_output', 0),
            standard_quality_rate=params.get('standard_quality_rate', 0.99),
            standard_rework_limit=params.get('standard_rework_limit', 0.003),
            standard_scrap_limit=params.get('standard_scrap_limit', 0.0005),
            note=params.get('note', ''),
        )
        db.add(std_param)

    db.commit()
    print(f"[INFO] 导入了 {len(STANDARD_PARAMS)} 条标准参数到数据库")
    return factory


def parse_cli_excel(file_path: str):
    """解析Excel文件，返回CLI版本格式的数据"""
    df = pd.read_excel(file_path, sheet_name=0, header=None)

    # 提取员工信息（第1行）
    employee_id = str(df.iloc[0, 1]) if pd.notna(df.iloc[0, 1]) else ""
    employee_name = str(df.iloc[0, 4]) if pd.notna(df.iloc[0, 4]) else ""

    # 读取数据行（从第3行开始，即索引2）
    data_df = pd.read_excel(file_path, sheet_name=0, header=1)

    # 标准化列名
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

    actual_columns = {}
    used_targets = set()
    for col in data_df.columns:
        col_str = str(col).strip()
        for key, value in column_mapping.items():
            if key in col_str and value not in used_targets:
                actual_columns[col] = value
                used_targets.add(value)
                break

    data_df = data_df.rename(columns=actual_columns)

    # 选择需要的列
    required_cols = ['date', 'station', 'product', 'hours', 'good_qty', 'rework_qty', 'scrap_qty']
    available_cols = [c for c in required_cols if c in data_df.columns]
    raw_data = data_df[available_cols].copy()

    # 添加设备列
    if 'device' in data_df.columns:
        raw_data['device'] = data_df['device'].fillna('').astype(str)
    else:
        raw_data['device'] = ''

    # 数据类型转换
    raw_data['hours'] = pd.to_numeric(raw_data['hours'], errors='coerce').fillna(0)
    raw_data['good_qty'] = pd.to_numeric(raw_data['good_qty'], errors='coerce').fillna(0)
    raw_data['rework_qty'] = pd.to_numeric(raw_data['rework_qty'], errors='coerce').fillna(0)
    raw_data['scrap_qty'] = pd.to_numeric(raw_data['scrap_qty'], errors='coerce').fillna(0)

    # 提取月份
    month = ""
    if 'date' in raw_data.columns and len(raw_data) > 0:
        first_date = pd.to_datetime(raw_data['date'].iloc[0])
        month = first_date.strftime('%Y年%m月')

    return {
        'employee_id': employee_id,
        'employee_name': employee_name,
        'month': month,
        'raw_data': raw_data,
    }


def convert_to_web_records(parsed_data: dict, employee_id: int = 1, month: str = "2026-01"):
    """将解析的数据转换为Web版本的ProductionRecord列表"""
    records = []
    df = parsed_data['raw_data'].copy()

    # 处理多工站拆分
    expanded_rows = []
    for idx, row in df.iterrows():
        station_value = str(row['station']) if pd.notna(row.get('station')) else ''
        stations = [s.strip() for s in station_value.split() if s.strip()]

        if len(stations) <= 1:
            expanded_rows.append({
                'product_model': str(row.get('product', '')),
                'device_name': str(row.get('device', '')),
                'station_name': station_value,
                'production_hours': float(row.get('hours', 0)),
                'good_quantity': int(row.get('good_qty', 0)),
                'rework_quantity': int(row.get('rework_qty', 0)),
                'scrap_quantity': int(row.get('scrap_qty', 0)),
            })
        else:
            n_stations = len(stations)
            for station in stations:
                expanded_rows.append({
                    'product_model': str(row.get('product', '')),
                    'device_name': str(row.get('device', '')),
                    'station_name': station,
                    'production_hours': float(row.get('hours', 0)) / n_stations,
                    'good_quantity': int(row.get('good_qty', 0) / n_stations),
                    'rework_quantity': int(row.get('rework_qty', 0) / n_stations),
                    'scrap_quantity': int(row.get('scrap_qty', 0) / n_stations),
                })

    # 创建ProductionRecord对象
    for row_data in expanded_rows:
        if not row_data['product_model'] or not row_data['station_name']:
            continue

        record = ProductionRecord(
            employee_id=employee_id,
            record_date=datetime.now(),
            product_model=row_data['product_model'],
            device_name=row_data['device_name'],
            station_name=row_data['station_name'],
            production_hours=row_data['production_hours'],
            good_quantity=row_data['good_quantity'],
            rework_quantity=row_data['rework_quantity'],
            scrap_quantity=row_data['scrap_quantity'],
            month=month,
        )
        records.append(record)

    return records


def run_cli_calculation(file_path: str):
    """运行CLI版本计算"""
    print("\n" + "="*60)
    print("CLI版本计算")
    print("="*60)

    calculator = CLICalculator(standard_params=STANDARD_PARAMS)
    calculator.load_data(file_path)
    calculator.aggregate_by_product_station()
    calculator.calculate_all_kpis()

    print(f"员工: {calculator.employee_name}")
    print(f"月份: {calculator.month}")
    print(f"原始记录数: {len(calculator.raw_data) if calculator.raw_data is not None else 0}")
    print(f"聚合组数: {len(calculator.aggregated_data)}")

    print("\nKPI结果:")
    for result in calculator.kpi_results:
        print(f"  {result.indicator_name}: {result.actual_value:.4f} ({result.grade}) "
              f"-> 加权得分: {result.weighted_score:.4f}")

    print(f"\n综合得分: {calculator.get_total_score():.4f}")
    print(f"综合等级: {calculator.get_total_grade()}")

    # 生成报告
    report_data = calculator.generate_report()
    return calculator, report_data


def run_web_calculation(records: list, db: Session):
    """运行Web版本计算"""
    print("\n" + "="*60)
    print("Web版本计算")
    print("="*60)

    calculator = WebCalculator(db)
    result = calculator.calculate_kpi(1, "2026-01", records)

    print(f"原始记录数: {len(records)}")
    print(f"聚合组数: {len(result['aggregated_data'])}")

    print("\nKPI结果:")
    for ind in result['indicators']:
        print(f"  {ind.name}: {ind.actual_value:.4f} ({ind.grade}) "
              f"-> 加权得分: {ind.weighted_score:.4f}")

    print(f"\n综合得分: {result['total_score']:.4f}")
    print(f"综合等级: {result['final_grade']}")

    return result


def compare_results(cli_calc, cli_report, web_result):
    """对比CLI和Web版本的计算结果"""
    print("\n" + "="*60)
    print("结果对比")
    print("="*60)

    comparison = []
    all_match = True

    # 对比各指标
    for i, cli_ind in enumerate(cli_calc.kpi_results):
        web_ind = web_result['indicators'][i]

        value_diff = abs(cli_ind.actual_value - web_ind.actual_value)
        score_diff = abs(cli_ind.weighted_score - web_ind.weighted_score)

        match = value_diff < 0.01 and cli_ind.grade == web_ind.grade
        if not match:
            all_match = False

        comparison.append({
            'indicator': cli_ind.indicator_name,
            'cli_value': cli_ind.actual_value,
            'web_value': web_ind.actual_value,
            'value_diff': value_diff,
            'cli_grade': cli_ind.grade,
            'web_grade': web_ind.grade,
            'cli_score': cli_ind.weighted_score,
            'web_score': web_ind.weighted_score,
            'score_diff': score_diff,
            'match': match,
        })

        status = "[PASS]" if match else "[FAIL]"
        print(f"\n{status} {cli_ind.indicator_name}:")
        print(f"  CLI: {cli_ind.actual_value:.4f} ({cli_ind.grade}) -> {cli_ind.weighted_score:.4f}")
        print(f"  Web: {web_ind.actual_value:.4f} ({web_ind.grade}) -> {web_ind.weighted_score:.4f}")
        if value_diff >= 0.01:
            print(f"  差值: {value_diff:.4f}")

    # 对比综合得分
    total_diff = abs(cli_calc.get_total_score() - web_result['total_score'])
    total_match = total_diff < 0.01
    if not total_match:
        all_match = False

    status = "[PASS]" if total_match else "[FAIL]"
    print(f"\n{status} 综合得分:")
    print(f"  CLI: {cli_calc.get_total_score():.4f} ({cli_calc.get_total_grade()})")
    print(f"  Web: {web_result['total_score']:.4f} ({web_result['final_grade']})")
    if total_diff >= 0.01:
        print(f"  差值: {total_diff:.4f}")

    return comparison, all_match


def export_comparison_excel(comparison: list, cli_report: dict, web_result: dict, output_dir: str):
    """导出对比结果到Excel"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"kpi_comparison_{timestamp}.xlsx")

    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Sheet 1: 指标对比
        df_comparison = pd.DataFrame(comparison)
        df_comparison.to_excel(writer, sheet_name='指标对比', index=False)

        # Sheet 2: CLI详细结果
        cli_kpi_data = []
        for r in cli_report.get('kpi_results', []):
            cli_kpi_data.append({
                '指标名称': r['indicator_name'],
                '实际值': r['actual_value'],
                '等级': r['grade'],
                '原始分': r['raw_score'],
                '权重': r['weight'],
                '加权得分': r['weighted_score'],
            })
        df_cli = pd.DataFrame(cli_kpi_data)
        df_cli.to_excel(writer, sheet_name='CLI结果', index=False)

        # Sheet 3: Web详细结果
        web_kpi_data = []
        for ind in web_result['indicators']:
            web_kpi_data.append({
                '指标名称': ind.name,
                '实际值': ind.actual_value,
                '等级': ind.grade,
                '原始分': ind.raw_score,
                '权重': ind.weight,
                '加权得分': ind.weighted_score,
            })
        df_web = pd.DataFrame(web_kpi_data)
        df_web.to_excel(writer, sheet_name='Web结果', index=False)

        # Sheet 4: CLI聚合数据
        agg_data = []
        for d in cli_report.get('aggregated_data', []):
            agg_data.append(d)
        df_agg = pd.DataFrame(agg_data)
        df_agg.to_excel(writer, sheet_name='CLI聚合数据', index=False)

        # Sheet 5: Web聚合数据
        web_agg_data = []
        for d in web_result['aggregated_data']:
            web_agg_data.append({
                'product': d.product_model,
                'device': d.device_name,
                'station': d.station_name,
                'total_hours': d.total_hours,
                'total_good': d.total_good,
                'total_rework': d.total_rework,
                'total_scrap': d.total_scrap,
                'actual_output': d.actual_output,
                'actual_quality_rate': d.actual_quality_rate,
                'hours_ratio': d.hours_ratio,
                'output_ratio': d.output_ratio,
            })
        df_web_agg = pd.DataFrame(web_agg_data)
        df_web_agg.to_excel(writer, sheet_name='Web聚合数据', index=False)

    print(f"\n[INFO] 对比结果已导出: {output_file}")
    return output_file


def main():
    """主函数"""
    print("="*60)
    print("CLI vs Web KPI计算对比测试")
    print("="*60)

    # 文件路径 - 使用项目根目录的kpi.xlsx
    excel_file = os.path.join(PROJECT_ROOT, "kpi.xlsx")

    if not os.path.exists(excel_file):
        print(f"[ERROR] 文件不存在: {excel_file}")
        return

    print(f"[INFO] 测试文件: {excel_file}")

    # 1. CLI版本计算
    cli_calc, cli_report = run_cli_calculation(excel_file)

    # 2. 解析数据用于Web版本
    parsed_data = parse_cli_excel(excel_file)

    # 3. 创建内存数据库并导入配置
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    import_cli_config_to_db(db)

    # 4. 转换为Web记录并计算
    web_records = convert_to_web_records(parsed_data)
    print(f"\n[INFO] Web版本记录数 (含多工站拆分): {len(web_records)}")

    web_result = run_web_calculation(web_records, db)

    # 5. 对比结果
    comparison, all_match = compare_results(cli_calc, cli_report, web_result)

    # 6. 导出对比结果 - 使用test_comparison目录
    output_dir = os.path.join(PROJECT_ROOT, 'test_comparison')
    os.makedirs(output_dir, exist_ok=True)
    output_file = export_comparison_excel(comparison, cli_report, web_result, output_dir)

    # 7. 总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    if all_match:
        print("[PASS] CLI版本和Web版本计算结果一致!")
    else:
        print("[FAIL] CLI版本和Web版本计算结果存在差异!")
        print("请查看导出文件了解详细差异:")
        print(f"  {output_file}")

    return all_match


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
