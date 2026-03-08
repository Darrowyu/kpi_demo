from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import pandas as pd
from io import BytesIO
from datetime import datetime
import re

from app.database import get_db
from app.models.employee import Employee
from app.models.production_record import ProductionRecord

router = APIRouter()


def expand_multi_station_rows(df: pd.DataFrame) -> pd.DataFrame:
    """
    展开包含多个工站的行 - 与CLI版本 _expand_multi_station_rows 逻辑一致
    例如: '纸箱打两条 黄色包装带' -> 拆分为两行
    """
    if 'station_name' not in df.columns:
        return df

    expanded_rows = []
    for idx, row in df.iterrows():
        station_value = str(row['station_name']) if pd.notna(row['station_name']) else ''

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
                new_row['station_name'] = station
                # 工时按工站数量平均分摊
                new_row['production_hours'] = row['production_hours'] / n_stations
                # 数量按工站数量平均分摊（取整）
                new_row['good_quantity'] = int(row['good_quantity'] / n_stations)
                new_row['rework_quantity'] = int(row['rework_quantity'] / n_stations)
                new_row['scrap_quantity'] = int(row['scrap_quantity'] / n_stations)
                expanded_rows.append(new_row)

    return pd.DataFrame(expanded_rows)


def parse_month_from_sheet_name(sheet_name: str) -> Optional[str]:
    """
    从sheet名称解析月份
    支持格式: "2601-丁新松" -> "2026-01", "2026-01-丁新松" -> "2026-01"
    """
    # 尝试匹配 2601-xxx 格式
    match = re.match(r'^(\d{2})(\d{2})-', sheet_name)
    if match:
        year_prefix = match.group(1)
        month_num = match.group(2)
        return f"20{year_prefix}-{month_num}"
    
    # 尝试匹配 2026-01-xxx 或 2026-01 格式
    match = re.match(r'^(\d{4})-(\d{2})', sheet_name)
    if match:
        year = match.group(1)
        month = match.group(2)
        return f"{year}-{month}"
    
    return None


def extract_employee_name(sheet_name: str) -> str:
    """从sheet名称提取员工姓名"""
    # 移除常见的后缀
    name = sheet_name
    # 移除 -KPI (n) 后缀
    name = re.sub(r'-KPI\s*\(\d+\)$', '', name)
    # 移除开头的月份前缀如 2601- 或 2026-01-
    name = re.sub(r'^\d{4}-', '', name)
    name = re.sub(r'^\d{6}-', '', name)
    # 移除前后空格
    name = name.strip()
    return name if name else sheet_name


def parse_month_from_filename(filename: str) -> Optional[str]:
    """
    从文件名解析月份
    支持格式: "2601-知恩生产记录.xlsx" -> "2026-01"
    """
    # 尝试匹配 2601-xxx 格式
    match = re.match(r'^(\d{2})(\d{2})-', filename)
    if match:
        year_prefix = match.group(1)
        month_num = match.group(2)
        return f"20{year_prefix}-{month_num}"
    
    # 尝试匹配 2026-01-xxx 格式
    match = re.match(r'^(\d{4})-(\d{2})', filename)
    if match:
        year = match.group(1)
        month = match.group(2)
        return f"{year}-{month}"
    
    return None


@router.post("/production-records")
def upload_production_records(
    file: UploadFile = File(...),
    month: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """上传生产记录Excel文件"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="只支持Excel文件")

    # 读取Excel所有sheet
    try:
        content = file.file.read()
        xls = pd.ExcelFile(BytesIO(content))
        sheet_names = xls.sheet_names
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"读取Excel失败: {str(e)}")
    
    # 如果前端没有传递月份，尝试从文件名解析
    file_month = parse_month_from_filename(file.filename)
    if not month and file_month:
        month = file_month

    results = []

    for sheet_name in sheet_names:
        # 尝试读取数据，支持不同的表头行
        # 先尝试第3行作为表头（原始格式：第1行公司名，第2行员工信息，第3行表头）
        try:
            df = pd.read_excel(xls, sheet_name=sheet_name, header=2)
            if df.empty or len(df.columns) < 5:
                # 尝试第2行作为表头
                df = pd.read_excel(xls, sheet_name=sheet_name, header=1)
        except Exception:
            try:
                df = pd.read_excel(xls, sheet_name=sheet_name, header=1)
            except Exception as e:
                results.append({
                    "sheet": sheet_name,
                    "employee": None,
                    "imported": 0,
                    "error": f"读取失败: {str(e)}"
                })
                continue

        if df.empty:
            results.append({
                "sheet": sheet_name,
                "employee": None,
                "imported": 0,
                "error": "空数据"
            })
            continue

        # 确定月份
        sheet_month = month
        if not sheet_month:
            # 尝试从sheet名解析
            parsed_month = parse_month_from_sheet_name(sheet_name)
            if parsed_month:
                sheet_month = parsed_month
            else:
                # 使用当前月份
                sheet_month = datetime.now().strftime("%Y-%m")

        # 提取员工姓名
        employee_name = extract_employee_name(sheet_name)
        
        # 查找或创建员工
        employee = db.query(Employee).filter(Employee.name == employee_name).first()
        if not employee:
            employee = Employee(
                employee_no=employee_name,  # 临时用工号
                name=employee_name,
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

        # 处理数据行 - 支持多种列名变体
        column_mapping = {
            # 日期
            '日期': 'record_date',
            'Date': 'record_date',
            # 工站
            '工站': 'station_name',
            'Station': 'station_name',
            '工序': 'station_name',
            # 产品型号
            '产品型号': 'product_model',
            '工厂型号': 'product_model',
            'Product': 'product_model',
            '型号': 'product_model',
            # 工时
            '生产时数': 'production_hours',
            '工时': 'production_hours',
            'Hours': 'production_hours',
            '生產時數': 'production_hours',
            # 良品数量
            '良品数量': 'good_quantity',
            '良品数': 'good_quantity',
            'Good Qty': 'good_quantity',
            '良品數量': 'good_quantity',
            '良品數': 'good_quantity',
            # 返工数量
            '返工数量': 'rework_quantity',
            '返工数': 'rework_quantity',
            'Rework Qty': 'rework_quantity',
            '返工品數量': 'rework_quantity',
            # 报废数量
            '报废数量': 'scrap_quantity',
            '报废数': 'scrap_quantity',
            'Scrap Qty': 'scrap_quantity',
            '報廢品數量': 'scrap_quantity',
            # 设备名称
            '设备名称': 'device_name',
            '設備名稱': 'device_name',
            '设备': 'device_name',
            'Device': 'device_name',
        }

        # 重命名列（不区分大小写）
        renamed_columns = {}
        for col in df.columns:
            col_str = str(col).strip()
            # 尝试直接匹配
            if col_str in column_mapping:
                renamed_columns[col] = column_mapping[col_str]
            else:
                # 尝试部分匹配
                for key, value in column_mapping.items():
                    if key in col_str:
                        renamed_columns[col] = value
                        break
        
        df_renamed = df.rename(columns=renamed_columns)

        # 多工站拆分 - 与CLI版本逻辑一致
        df_renamed = expand_multi_station_rows(df_renamed)

        imported_count = 0
        errors = []
        
        for idx, row in df_renamed.iterrows():
            try:
                # 跳过无效行
                product_model = row.get('product_model')
                station_name = row.get('station_name')
                
                if pd.isna(product_model) or pd.isna(station_name):
                    continue
                
                # 转换日期
                record_date = row.get('record_date')
                if pd.isna(record_date):
                    record_date = datetime.now()
                elif isinstance(record_date, str):
                    try:
                        record_date = pd.to_datetime(record_date)
                    except:
                        record_date = datetime.now()

                # 转换数值
                production_hours = float(row.get('production_hours', 0)) if not pd.isna(row.get('production_hours')) else 0
                good_quantity = int(row.get('good_quantity', 0)) if not pd.isna(row.get('good_quantity')) else 0
                rework_quantity = int(row.get('rework_quantity', 0)) if not pd.isna(row.get('rework_quantity')) else 0
                scrap_quantity = int(row.get('scrap_quantity', 0)) if not pd.isna(row.get('scrap_quantity')) else 0
                
                # 设备名称处理
                device_name = row.get('device_name', '')
                if pd.isna(device_name):
                    device_name = ''
                else:
                    device_name = str(device_name).strip()

                record = ProductionRecord(
                    employee_id=employee.id,
                    record_date=record_date,
                    product_model=str(product_model).strip(),
                    device_name=device_name,
                    station_name=str(station_name).strip(),
                    production_hours=production_hours,
                    good_quantity=good_quantity,
                    rework_quantity=rework_quantity,
                    scrap_quantity=scrap_quantity,
                    month=sheet_month,
                )
                db.add(record)
                imported_count += 1
            except Exception as e:
                errors.append(f"行{idx}: {str(e)}")
                continue

        db.commit()
        result_item = {
            "sheet": sheet_name,
            "employee": employee.name,
            "imported": imported_count,
            "month": sheet_month
        }
        if errors:
            result_item["errors"] = errors[:5]  # 只显示前5个错误
        results.append(result_item)

    return {
        "message": "上传成功",
        "month": month,
        "results": results
    }
