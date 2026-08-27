# 🚨 RUNBOOK DE MANEJO DE INCIDENTES OPERATIVOS — PEGASUS SALES SYSTEM v1.0.0

**SISTEMA:** PEGASUS SALES SYSTEM  
**VERSIÓN:** `v1.0.0`  
**DOCUMENTO:** GUÍA DE ACTUACIÓN ANTE INCIDENTES EN PRODUCCIÓN  

---

## 🛠️ 1. PROTOCOLOS DE ACTUACIÓN ANTE ALERTAS Y ERRORES

### INCIDENTE 1: CAÍDA DE CONEXIÓN O ERROR 500 EN APIS DE BI / IA
- **Síntoma**: El frontend muestra la tarjeta `API_ERROR` con el botón *Reintentar*.
- **Causa Posible**: Caída del servicio FastAPI backend o reinicio del contenedor Python.
- **Acción Inmediata**:
  1. Verificar estado del proceso Python/Uvicorn.
  2. Ejecutar `python run_script.py verify_postprod_health.py`.
  3. Revisar logs en `backend/logs/` buscando tracebacks de Pydantic o PyMongo.

---

### INCIDENTE 2: LATENCIA ALTA EN CONSULTAS DE MONGODB (> 2 SEGUNDOS)
- **Síntoma**: Carga lenta en la pestaña de Resumen Ejecutivo.
- **Causa Posible**: Pérdida de un índice compuesto o consulta sin filtro de `tenant_id`.
- **Acción Inmediata**:
  1. Ejecutar `python run_script.py verify_fase13_9_multitenant.py` para verificar el plan de ejecución `IXSCAN`.
  2. Recrear índices optimizados ejecutando la inicialización del motor de DB.

---

### INCIDENTE 3: DESFASE DE FECHAS EN REPORTES TEMPORALES
- **Síntoma**: Ventas de medianoche asociadas al día equivocado.
- **Causa Posible**: Invocación de `datetime.utcnow()` obsoleta sin la zona horaria `America/La_Paz`.
- **Acción Inmediata**:
  1. Verificar que todas las agregaciones usen `ZoneInfo("America/La_Paz")`.
  2. Confirmar que la medianoche Bolivia corresponde al rango UTC `[04:00:00 - 04:00:00]`.
