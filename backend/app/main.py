from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models  # 确保模型被注册

# 创建所有表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="KPI生产人员绩效系统", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入路由
from app.routers import employees, products, stations, standard_params, kpi_calculation, upload, factories

app.include_router(employees.router, prefix="/api/employees", tags=["员工管理"])
app.include_router(products.router, prefix="/api/products", tags=["产品管理"])
app.include_router(stations.router, prefix="/api/stations", tags=["工站管理"])
app.include_router(standard_params.router, prefix="/api/standard-params", tags=["标准参数"])
app.include_router(kpi_calculation.router, prefix="/api/kpi", tags=["KPI计算"])
app.include_router(upload.router, prefix="/api/upload", tags=["数据上传"])
app.include_router(factories.router, prefix="/api/factories", tags=["厂区管理"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
