# ------------------------------------------------------------------------------
# PEGASUS SALES SYSTEM - DOCKERFILE DEL BACKEND
# ------------------------------------------------------------------------------
# Multi-stage build para reducir el tamaño final de la imagen de producción

# --- Etapa 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalar dependencias del sistema necesarias para construir librerías de Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y construir/instalar las dependencias de Python en el espacio del usuario
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# --- Etapa 2: Runner ---
FROM python:3.11-slim AS runner

WORKDIR /app

# Configurar variables de entorno indispensables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH=/home/pegasususer/.local/bin:$PATH
ENV PORT=8000
ENV ENVIRONMENT=production

# Copiar dependencias de Python pre-compiladas de la etapa anterior
COPY --from=builder /root/.local /home/pegasususer/.local

# Copiar todo el código fuente del backend al contenedor
COPY . .

# Exponer el puerto por defecto de FastAPI
EXPOSE 8000

# Crear un usuario no root por seguridad (evita ejecutar código como root dentro del contenedor)
RUN useradd -m pegasususer && chown -R pegasususer:pegasususer /app /home/pegasususer
USER pegasususer

# Comando por defecto para arrancar la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
