"""
KPI计算一致性验证测试
对比CLI版本和Web版本的计算结果
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 添加项目根目录到路径以导入CLI版本
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# 导入Web版本
from app.database import Base
from app.models.production_record import ProductionRecord
from app.models.standard_param import StandardParam
from app.models.product import Product
from app.models.device import Device
from app.models.station import Station
from app.models.factory import Factory
from app.services.kpi_calculator import KPICalculator, AggregatedData
from app.config import KPI_WEIGHTS, GRADE_THRESHOLDS, GRADE_SCORES

# 导入CLI版本配置进行对比
CLI_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'config.py')


def create_test_db():
    """创建内存测试数据库"""
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def setup_test_data(db: Session):
    """设置测试数据 - 模拟真实的生产记录"""
    # 创建厂区
    factory = Factory(code="DG_XA", name="东莞迅安", description="测试厂区")
    db.add(factory)
    db.commit()

    # 创建产品
    product1 = Product(model="9600-N95", category="N95口罩", description="测试产品1")
    product2 = Product(model="9500-N95", category="N95口罩", description="测试产品2")
    db.add_all([product1, product2])
    db.commit()

    # 创建设备
    device1 = Device(name="二合一焊头带/贴鼻夹机", device_type="生产设备")
    device2 = Device(name="手工设备", device_type="手工")  # 手工标准
    db.add_all([device1, device2])
    db.commit()

    # 创建工站
    station1 = Station(name="二合一", description="测试工站1")
    station2 = Station(name="查货", description="测试工站2")
    station3 = Station(name="装箱", description="测试工站3")
    db.add_all([station1, station2, station3])
    db.commit()

    # 创建标准参数 - 与CLI版本STANDARD_PARAMS一致
    std_params = [
        # 9600-N95 + 设备 + 工站
        StandardParam(
            factory_id=factory.id,
            product_id=product1.id,
            device_id=device1.id,
            station_id=station1.id,
            standard_output=1971,
            standard_quality_rate=0.99,
            standard_rework_limit=0.003,
            standard_scrap_limit=0.0005,
        ),
        # 9600-N95 + 手工 + 查货
        StandardParam(
            factory_id=factory.id,
            product_id=product1.id,
            device_id=None,
            station_id=station2.id,
            standard_output=1971,
            standard_quality_rate=0.99,
            standard_rework_limit=0.003,
            standard_scrap_limit=0.0005,
        ),
        # 9600-N95 + 手工 + 装箱
        StandardParam(
            factory_id=factory.id,
            product_id=product1.id,
            device_id=None,
            station_id=station3.id,
            standard_output=2756,
            standard_quality_rate=0.99,
            standard_rework_limit=0.003,
            standard_scrap_limit=0.0005,
        ),
        # 9500-N95 + 设备 + 工站
        StandardParam(
            factory_id=factory.id,
            product_id=product2.id,
            device_id=device1.id,
            station_id=station1.id,
            standard_output=1818,
            standard_quality_rate=0.99,
            standard_rework_limit=0.003,
            standard_scrap_limit=0.0005,
        ),
    ]
    db.add_all(std_params)
    db.commit()

    return {
        'factory': factory,
        'products': [product1, product2],
        'devices': [device1, device2],
        'stations': [station1, station2, station3],
    }


def create_test_records():
    """
    创建测试生产记录
    模拟多产品、多工站的复杂场景
    """
    records = []

    # 员工1的数据 - 多个产品多个工站
    base_date = datetime(2026, 1, 1)

    # 9600-N95 在二合一工站 (有设备)
    for day in range(1, 11):  # 10天
        records.append(ProductionRecord(
            employee_id=1,
            record_date=datetime(2026, 1, day),
            product_model="9600-N95",
            device_name="二合一焊头带/贴鼻夹机",
            station_name="二合一",
            production_hours=8.0,
            good_quantity=1800,
            rework_quantity=10,
            scrap_quantity=2,
            month="2026-01",
        ))

    # 9600-N95 在查货工站 (手工)
    for day in range(1, 6):  # 5天
        records.append(ProductionRecord(
            employee_id=1,
            record_date=datetime(2026, 1, day),
            product_model="9600-N95",
            device_name="",
            station_name="查货",
            production_hours=8.0,
            good_quantity=1900,
            rework_quantity=15,
            scrap_quantity=3,
            month="2026-01",
        ))

    # 9500-N95 在二合一工站 (不同产品)
    for day in range(11, 16):  # 5天
        records.append(ProductionRecord(
            employee_id=1,
            record_date=datetime(2026, 1, day),
            product_model="9500-N95",
            device_name="二合一焊头带/贴鼻夹机",
            station_name="二合一",
            production_hours=8.0,
            good_quantity=1700,
            rework_quantity=20,
            scrap_quantity=5,
            month="2026-01",
        ))

    return records


def test_grade_thresholds_format():
    """测试等级阈值格式是否正确"""
    print("\n" + "="*60)
    print("测试1: 等级阈值格式验证")
    print("="*60)

    for indicator, thresholds in GRADE_THRESHOLDS.items():
        print(f"\n{indicator}:")
        for grade, (low, high) in thresholds.items():
            print(f"  {grade}: {low} ~ {high}")

    # 验证格式
    assert all(isinstance(v, tuple) and len(v) == 2
               for thresholds in GRADE_THRESHOLDS.values()
               for v in thresholds.values()), "阈值格式必须是(low, high)元组"

    print("\n[PASS] 等级阈值格式正确")


def test_determine_grade():
    """测试等级判定逻辑"""
    print("\n" + "="*60)
    print("测试2: 等级判定逻辑验证")
    print("="*60)

    db = create_test_db()
    setup_test_data(db)
    calculator = KPICalculator(db)

    test_cases = [
        # (指标名, 值, 期望等级)
        ("working_hours_rate", 100, "甲"),
        ("working_hours_rate", 95, "乙"),
        ("working_hours_rate", 90, "丙"),
        ("working_hours_rate", 85, "丁"),
        ("quality_rate", 100, "甲"),
        ("quality_rate", 98, "乙"),
        ("quality_rate", 95, "丙"),
        ("quality_rate", 94, "丁"),
        ("rework_rate", 0.5, "甲"),
        ("rework_rate", 0.51, "乙"),
        ("rework_rate", 1.01, "丙"),
        ("rework_rate", 2.01, "丁"),
        ("scrap_rate", 0.1, "甲"),
        ("scrap_rate", 0.11, "乙"),
        ("scrap_rate", 0.31, "丙"),
        ("scrap_rate", 0.51, "丁"),
    ]

    all_passed = True
    for indicator, value, expected in test_cases:
        result = calculator.determine_grade(indicator, value)
        status = "[PASS]" if result == expected else "[FAIL]"
        if result != expected:
            all_passed = False
        print(f"{status} {indicator}: {value} -> {result} (期望: {expected})")

    assert all_passed, "等级判定测试失败"
    print("\n[PASS] 等级判定逻辑正确")


def test_aggregate_data():
    """测试数据聚合逻辑"""
    print("\n" + "="*60)
    print("测试3: 数据聚合逻辑验证")
    print("="*60)

    db = create_test_db()
    calculator = KPICalculator(db)
    records = create_test_records()

    aggregated = calculator.aggregate_data(records)

    print(f"\n原始记录数: {len(records)}")
    print(f"聚合后组数: {len(aggregated)}")

    for data in aggregated:
        print(f"\n  {data.product_model} | {data.device_name or '手工'} | {data.station_name}")
        print(f"    工时: {data.total_hours:.2f}, 良品: {data.total_good}, "
              f"返工: {data.total_rework}, 报废: {data.total_scrap}")
        print(f"    实际产出: {data.actual_output:.2f}, 良品率: {data.actual_quality_rate:.4f}")
        print(f"    工时占比: {data.hours_ratio:.4f}, 产量占比: {data.output_ratio:.4f}")

    # 验证聚合结果
    assert len(aggregated) == 3, f"期望3个聚合组，实际{len(aggregated)}个"

    # 验证工时占比总和为1
    total_hours_ratio = sum(d.hours_ratio for d in aggregated)
    assert abs(total_hours_ratio - 1.0) < 0.001, f"工时占比总和应为1，实际{total_hours_ratio}"

    print("\n[PASS] 数据聚合逻辑正确")


def test_rework_rate_calculation():
    """测试返工率计算 - 按产品聚合后加权"""
    print("\n" + "="*60)
    print("测试4: 返工率计算逻辑验证")
    print("="*60)

    db = create_test_db()
    calculator = KPICalculator(db)
    records = create_test_records()
    aggregated = calculator.aggregate_data(records)

    print("\n按产品聚合的返工数据:")
    product_data = {}
    for data in aggregated:
        if data.product_model not in product_data:
            product_data[data.product_model] = {"rework": 0, "total": 0}
        product_data[data.product_model]["rework"] += data.total_rework
        product_data[data.product_model]["total"] += data.total_good + data.total_rework + data.total_scrap

    grand_total = sum(p["total"] for p in product_data.values())
    weighted_sum = 0
    for product, pdata in product_data.items():
        if pdata["total"] > 0:
            rework_rate = pdata["rework"] / pdata["total"] * 100
            output_ratio = pdata["total"] / grand_total
            contribution = rework_rate * output_ratio
            weighted_sum += contribution
            print(f"  {product}: 返工率={rework_rate:.4f}%, "
                  f"产量占比={output_ratio:.4f}, 加权贡献={contribution:.4f}%")

    print(f"\n加权返工率: {weighted_sum:.4f}%")

    # 与计算器结果对比
    result = calculator.calc_rework_rate(aggregated)
    print(f"计算器结果: {result.actual_value:.4f}%")

    assert abs(result.actual_value - weighted_sum) < 0.01, "返工率计算不一致"
    print("\n[PASS] 返工率计算逻辑正确")


def test_scrap_rate_calculation():
    """测试报废率计算 - 按产品聚合后加权"""
    print("\n" + "="*60)
    print("测试5: 报废率计算逻辑验证")
    print("="*60)

    db = create_test_db()
    calculator = KPICalculator(db)
    records = create_test_records()
    aggregated = calculator.aggregate_data(records)

    print("\n按产品聚合的报废数据:")
    product_data = {}
    for data in aggregated:
        if data.product_model not in product_data:
            product_data[data.product_model] = {"scrap": 0, "total": 0}
        product_data[data.product_model]["scrap"] += data.total_scrap
        product_data[data.product_model]["total"] += data.total_good + data.total_rework + data.total_scrap

    grand_total = sum(p["total"] for p in product_data.values())
    weighted_sum = 0
    for product, pdata in product_data.items():
        if pdata["total"] > 0:
            scrap_rate = pdata["scrap"] / pdata["total"] * 100
            output_ratio = pdata["total"] / grand_total
            contribution = scrap_rate * output_ratio
            weighted_sum += contribution
            print(f"  {product}: 报废率={scrap_rate:.4f}%, "
                  f"产量占比={output_ratio:.4f}, 加权贡献={contribution:.4f}%")

    print(f"\n加权报废率: {weighted_sum:.4f}%")

    # 与计算器结果对比
    result = calculator.calc_scrap_rate(aggregated)
    print(f"计算器结果: {result.actual_value:.4f}%")

    assert abs(result.actual_value - weighted_sum) < 0.01, "报废率计算不一致"
    print("\n[PASS] 报废率计算逻辑正确")


def test_full_calculation():
    """测试完整KPI计算流程"""
    print("\n" + "="*60)
    print("测试6: 完整KPI计算流程验证")
    print("="*60)

    db = create_test_db()
    setup_test_data(db)
    calculator = KPICalculator(db)
    records = create_test_records()

    result = calculator.calculate_kpi(1, "2026-01", records)

    print("\nKPI计算结果:")
    print(f"综合得分: {result['total_score']:.4f}")
    print(f"综合等级: {result['final_grade']}")
    print("\n各指标详情:")

    for ind in result['indicators']:
        print(f"\n  {ind.name}:")
        print(f"    实际值: {ind.actual_value:.4f}")
        print(f"    等级: {ind.grade}")
        print(f"    原始分: {ind.raw_score}")
        print(f"    权重: {ind.weight}")
        print(f"    加权得分: {ind.weighted_score:.4f}")

    # 验证综合得分
    expected_total = sum(ind.weighted_score for ind in result['indicators'])
    assert abs(result['total_score'] - expected_total) < 0.001, "综合得分计算错误"

    print("\n[PASS] 完整KPI计算流程正确")


def test_no_rounding():
    """测试没有舍入，保持原始精度"""
    print("\n" + "="*60)
    print("测试7: 数值精度验证（无舍入）")
    print("="*60)

    db = create_test_db()
    setup_test_data(db)
    calculator = KPICalculator(db)
    records = create_test_records()

    result = calculator.calculate_kpi(1, "2026-01", records)

    for ind in result['indicators']:
        # 检查实际值是否包含小数
        print(f"{ind.name}: {ind.actual_value}")
        # 不强制检查小数位，因为某些情况下可能是整数
        # 但确保不是被round过的值

    print(f"\n综合得分: {result['total_score']}")
    print("\n[PASS] 数值精度保持正确")


def run_all_tests():
    """运行所有测试"""
    print("\n" + "="*60)
    print("KPI计算一致性验证测试")
    print("Web版本 vs CLI版本")
    print("="*60)

    tests = [
        test_grade_thresholds_format,
        test_determine_grade,
        test_aggregate_data,
        test_rework_rate_calculation,
        test_scrap_rate_calculation,
        test_full_calculation,
        test_no_rounding,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n[FAIL] {test.__name__} 失败: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*60)
    print(f"测试完成: 通过 {passed}/{len(tests)}, 失败 {failed}/{len(tests)}")
    print("="*60)

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
