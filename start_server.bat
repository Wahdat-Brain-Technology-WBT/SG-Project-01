@echo off
echo ==============================================
echo SHEEN GHAZY BABA ERP - Starting API Server...
echo ==============================================
echo.
echo Opening port 8000 in Windows Firewall (if not already opened)...
netsh advfirewall firewall add rule name="SheenGhazy ERP" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
echo.

IF EXIST "venv\Scripts\activate.bat" (
    echo Activating Virtual Environment...
    call venv\Scripts\activate.bat
) ELSE IF EXIST ".venv\Scripts\activate.bat" (
    echo Activating Virtual Environment...
    call .venv\Scripts\activate.bat
) ELSE (
    echo No virtual environment found. Using system Python...
)

echo Starting FastAPI on http://0.0.0.0:8000 ...

python -m uvicorn main:app --host 0.0.0.0 --port 8000
pause