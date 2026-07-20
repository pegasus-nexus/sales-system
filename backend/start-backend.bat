@echo off
title Backend FastAPI - Puerto 8001
color 0B
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo.
echo  Backend corriendo en http://localhost:8001
echo  Documentacion en  http://localhost:8001/docs
echo.
python -m uvicorn app.main:app --reload --port 8001
