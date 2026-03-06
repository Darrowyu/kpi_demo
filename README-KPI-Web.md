# KPI生产人员绩效系统 - Web版

## 项目结构

```
kpi-web/
├── backend/                    # FastAPI后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI入口
│   │   ├── config.py          # KPI配置常量
│   │   ├── database.py        # 数据库连接(SQLite)
│   │   ├── models/            # SQLAlchemy模型
│   │   ├── schemas/           # Pydantic数据模型
│   │   ├── routers/           # API路由
│   │   └── services/          # KPI计算核心
│   ├── scripts/
│   │   └── init_data.py       # 数据初始化脚本
│   └── requirements.txt
├── frontend/                   # React前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── services/          # API调用
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README-KPI-Web.md          # 本文档
```

## 技术栈

- **后端**: Python 3.11 + FastAPI + SQLAlchemy + SQLite
- **前端**: React 18 + TypeScript + Ant Design + Vite

## 快速开始

### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 初始化数据库

```bash
cd backend
python scripts/init_data.py
```

这将：
- 创建SQLite数据库
- 初始化产品、设备、工站基础数据
- 从原config.py导入所有标准参数

### 3. 启动后端服务

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务启动后：
- API文档: http://localhost:8000/docs
- Health检查: http://localhost:8000/health

### 4. 安装前端依赖

```bash
cd frontend
npm install
```

### 5. 启动前端服务

```bash
cd frontend
npm run dev
```

前端服务启动后：
- 访问: http://localhost:5173

## API端点

### 员工管理
- `GET /api/employees/` - 获取员工列表
- `POST /api/employees/` - 创建员工
- `GET /api/employees/{id}` - 获取单个员工
- `PUT /api/employees/{id}` - 更新员工
- `DELETE /api/employees/{id}` - 删除员工

### 产品管理
- `GET /api/products/` - 获取产品列表
- `POST /api/products/` - 创建产品
- `DELETE /api/products/{id}` - 删除产品

### 工站管理
- `GET /api/stations/` - 获取工站列表
- `POST /api/stations/` - 创建工站
- `DELETE /api/stations/{id}` - 删除工站
- `GET /api/stations/devices/` - 获取设备列表
- `POST /api/stations/devices/` - 创建设备

### 标准参数
- `GET /api/standard-params/` - 获取标准参数列表
- `POST /api/standard-params/` - 创建标准参数
- `PUT /api/standard-params/{id}` - 更新标准参数
- `DELETE /api/standard-params/{id}` - 删除标准参数
- `POST /api/standard-params/batch-import` - 批量导入

### KPI计算
- `POST /api/kpi/calculate` - 计算员工KPI
- `GET /api/kpi/results` - 获取KPI结果列表
- `GET /api/kpi/results/{id}` - 获取单个KPI结果

### 数据上传
- `POST /api/upload/production-records` - 上传生产记录Excel

## 页面功能

1. **仪表盘** - 系统概览
2. **数据上传** - 上传Excel生产记录
3. **员工管理** - CRUD员工信息
4. **标准参数** - 管理产品+设备+工站的标准参数
5. **KPI计算** - 选择员工和月份计算KPI
6. **KPI报告** - 查看绩效排名和统计

## 数据迁移说明

原命令行程序的数据已迁移：
- `config.py` → `backend/app/config.py` (配置常量)
- `kpi_calculator.py` → `backend/app/services/kpi_calculator.py` (计算逻辑)

标准参数通过 `scripts/init_data.py` 从原config.py自动导入到数据库。

## 后续优化建议

1. **数据导出** - 支持导出计算结果为Excel
2. **图表展示** - 添加趋势图、对比图
3. **批量计算** - 一次性计算多个员工的KPI
4. **用户认证** - 添加登录权限控制
5. **历史记录** - 查看KPI计算历史

## 注意事项

- 首次运行前需要安装依赖并初始化数据库
- 前端代理配置在 `vite.config.ts` 中，默认转发 `/api` 到 `localhost:8000`
- SQLite数据库文件 `kpi.db` 会在后端目录自动生成
