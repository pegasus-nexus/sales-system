#!/bin/bash
echo "Iniciando Servidor Backend..."
cd "$(dirname "$0")/backend"
if [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
