# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供本仓库代码的工作指引。

## 项目概述

KPI生产人员绩效系统 - 用于计算和管理生产员工绩效指标的Web系统。

**技术栈:**
- 后端: Python 3.11 + FastAPI + SQLAlchemy + SQLite
- 前端: React 18 + TypeScript + Ant Design + Vite
- 数据处理: pandas + openpyxl 处理Excel

## 常用命令

### 后端 (FastAPI)
```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据库并导入种子数据
python scripts/init_data.py

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 健康检查
# GET http://localhost:8000/health
# API文档: http://localhost:8000/docs
```

### 前端 (React + Vite)
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

### 全栈开发
```bash
# 终端1: 后端
cd backend && uvicorn app.main:app --reload --port 8000

# 终端2: 前端
cd frontend && npm run dev
```

## 架构

### 后端结构 (`backend/app/`)

**核心文件:**
- `main.py` - FastAPI入口，CORS配置，路由注册
- `database.py` - SQLAlchemy引擎，会话管理 (SQLite)
- `config.py` - KPI权重、等级阈值、标准工时常量

**模型 (`models/`):**
- `employee.py` - 员工信息 (工号, 姓名, 部门, 厂区ID)
- `production_record.py` - 每日生产数据 (日期, 产品, 工站, 工时, 数量)
- `kpi_result.py` - 每月员工KPI计算结果
- `product.py`, `device.py`, `station.py` - 主数据实体
- `standard_param.py` - 各(产品×设备×工站)的标准参数
- `factory.py` - 厂区管理

**服务 (`services/`):**
- `kpi_calculator.py` - KPI计算核心逻辑，包含5个指标：
  1. 工时达成率 (10%) - 实际工时/标准工时(176h)
  2. 良品达成率 (30%) - Σ[(实际良品率/标准良品率)×工时占比]
  3. 人时产出达成率 (30%) - Σ[(实际产出/标准产出)×工时占比]
  4. 返工率控制 (15%) - Σ(各产品返工率×产量占比)
  5. 报废率控制 (15%) - Σ(各产品报废率×产量占比)

**路由 (`routers/`):**
- `/api/employees` - 员工CRUD
- `/api/products` - 产品管理
- `/api/stations` - 工站和设备管理
- `/api/standard-params` - 标准参数管理
- `/api/kpi` - KPI计算和结果查询
- `/api/upload` - 生产记录Excel上传
- `/api/factories` - 厂区管理

### 前端结构 (`frontend/src/`)

**路由 (`App.tsx`):**
- `/` - 仪表盘 (系统概览)
- `/upload` - 数据上传 (Excel上传)
- `/employees` - 员工管理
- `/standards` - 标准参数管理
- `/kpi-calculation` - KPI计算
- `/kpi-report` - KPI报告

**服务 (`services/`):**
- `api.ts` - Axios实例，基础URL配置
- `employee.ts`, `kpi.ts`, `upload.ts`, `standardParam.ts` - API封装

**UI组件 (`components/ui/`):**
- shadcn/ui组件 (button, card, table, dialog等)
- Tailwind CSS样式

### KPI计算逻辑

**数据聚合流程:**
1. 上传Excel → 解析为`ProductionRecord`行数据
2. 按(产品型号, 设备名称, 工站名称)分组
3. 计算实际产出 = 良品数量 / 工时
4. 计算实际良品率 = 良品 / 总量
5. 计算工时占比和产量占比用于加权

**标准参数查找 (`get_standard_params`):**
```python
# 首先尝试精确匹配: (产品 × 设备 × 工站)
# 回退到: (产品 × 工站) 且设备为NULL (手工标准)
```

**等级判定:**
- 甲: 10分
- 乙: 8分
- 丙: 6分
- 丁: 4分

综合得分 = Σ(指标等级得分 × 权重)
综合等级: 甲等(8-10), 乙等(6-7.99), 丙等(4-5.99), 丁等(0-3.99)

### 关键配置常量 (`backend/app/config.py`)

```python
MONTHLY_STANDARD_HOURS = 176  # 22天 × 8小时
KPI_WEIGHTS = {
    "working_hours_rate": 0.10,  # 工时达成率
    "quality_rate": 0.30,        # 良品达成率
    "productivity_rate": 0.30,   # 人时产出达成率
    "rework_rate": 0.15,         # 返工率控制
    "scrap_rate": 0.15,          # 报废率控制
}
```

## 开发注意事项

**数据库:**
- SQLite文件自动创建在`backend/kpi.db`
- 运行`python scripts/init_data.py`可重置并导入种子数据

**代理配置:**
- Vite开发服务器将`/api`代理到`http://localhost:8000`
- 配置在`frontend/vite.config.ts`中

**Excel上传格式:**
系统期望的Excel文件包含员工Sheet，列包括：
- 日期, 工站, 产品型号, 生产时数, 良品数量, 返工数量, 报废数量
- 支持两种表头格式（含/不含公司名称行）
- 单个单元格中的多工站用空格分隔

**多工站拆分:**
工站名称包含空格时（如"纸箱打两条 黄色包装带"）会自动拆分，数据按比例分摊。

## 文件说明

**传统CLI版本 (根目录):**
- `main.py`, `config.py`, `kpi_calculator.py` - 原始命令行版本
- `kpi.xlsx`, `2601-知恩生产记录C4.xlsx` - 示例数据文件

**Web版本:**
- `backend/` - FastAPI应用
- `frontend/` - React应用
- `README-KPI-Web.md` - Web版本文档
