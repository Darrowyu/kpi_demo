@echo off
chcp 65001 >nul
echo ==========================================
echo    KPI生产人员绩效系统 - 后端启动脚本
echo ==========================================
echo.

cd /d "%~dp0\backend"

REM 检查虚拟环境
if exist venv\Scripts\activate.bat (
    echo [1/3] 激活虚拟环境...
    call venv\Scripts\activate.bat
) else (
    echo [1/3] 未找到虚拟环境，使用系统Python
)

echo [2/3] 检查依赖安装状态...
python -c "import fastapi, sqlalchemy, pandas" 2>nul
if errorlevel 1 (
    echo [!] 依赖未安装，请先运行: pip install -r requirements.txt
    pause
    exit /b 1
)

echo [3/3] 启动FastAPI服务...
echo.
echo 服务启动后访问:
echo   - API文档: http://localhost:8000/docs
echo   - Health检查: http://localhost:8000/health
echo.
echo 按 Ctrl+C 停止服务
echo ==========================================
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause