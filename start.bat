@echo off
title SalesSystem - Iniciando Servidores...
color 0A

:: Liberar puertos 8001 y 5173 si quedaron colgados de ejecuciones anteriores
echo  Liberando puertos 8001 y 5173 (si estan en uso)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo.
echo  ==========================================
echo   SALSSYSTEM - Iniciando entorno completo
echo  ==========================================
echo.

:: ── BACKEND ──────────────────────────────────
echo  [1/2] Iniciando Backend (FastAPI)...
cd /d "%~dp0."

if not exist "%~dp0.venv\Scripts\activate.bat" (
    echo  [ERROR] No se encontro el entorno virtual en la raiz .venv
    echo  Ejecuta: python -m venv .venv ^&^& .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

start "SalesSystem Backend :8001" cmd /k "cd /d %~dp0backend && call ..\.venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8001"

:: Esperar 8 segundos para que el backend inicie
timeout /t 8 /nobreak > nul

:: ── FRONTEND ─────────────────────────────────
echo  [2/2] Iniciando Frontend (Vite/React)...
start "SalesSystem Frontend :5173" cmd /k "cd /d %~dp0frontend && call npm run dev"

echo.
echo  ==========================================
echo   LISTO! Abre tu navegador en:
echo   http://localhost:5173
echo  ==========================================
echo.
echo  Cierra las ventanas de cmd para detener los servidores.
pause
