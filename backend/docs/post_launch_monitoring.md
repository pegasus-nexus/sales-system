# 📡 PROTOCOLO DE MONITOREO Y OPERACIÓN POST-LANZAMIENTO (PRIMERAS 24–72 HORAS)

**SISTEMA:** PEGASUS SALES SYSTEM  
**RELEASE:** `v1.0.0`  
**COMMIT BASELINE:** `cc253de`  

---

## 1. UMBRALES OPERATIVOS DE PRODUCCIÓN

Durante la ventana inicial post-lanzamiento (24 a 72 horas), el equipo de operaciones debe monitorear los siguientes indicadores clave mediante el endpoint de salud `GET /api/v1/bi/health` e interceptor de logs:

| Métrica u Criterio | Umbral Target | Acción Inmediata ante Desviación |
| :--- | :---: | :--- |
| **Endpoint Salud (`GET /api/v1/bi/health`)** | **`200 OK` / `status: healthy`** | Notificación crítica si status cambia a `unhealthy`. |
| **Conectividad MongoDB** | **`mongodb: connected`** | Reinicio de grupo de conexiones en caso de fallo de socket. |
| **Catálogo de Índices** | **`indexes: ok`** | Re-ejecutar `python run_script.py verify_mongodb_explain_eje3_suite.py`. |
| **Latencia p95 BI HTTP** | **`< 1500 ms`** | Inspección de `X-Response-Time-Ms` en logs estructurados JSON. |
| **Tasa de Errores HTTP 500** | **`< 0.1% (Target: 0.0%)`** | Alerta automatizada y extracción de `correlation_id` del log. |
| **Diferencia de Conciliación** | **`Bs. 0.00`** | Re-ejecutar `run_full_bi_regression_suite.py`. |

---

## 2. PROCEDIMIENTO ANTE INCIDENTES CRÍTICOS (PLAYBOOK)

### A. Diagnóstico Rápido por Correlation ID
Cuando un usuario reporte una anomalía o en caso de error 500:
1. Extraer el header **`X-Correlation-ID`** o buscar en los logs JSON:
```bash
grep "correlation_id_afectado" backend/logs/production.log
```
2. Inspeccionar la entrada JSON para identificar `endpoint`, `tenant_id`, `latency_ms` y stack trace.

### B. Procedimiento de Escalación o Rollback
Si se requiere retornar al commit estable de producción de forma inmediata:
```bash
python run_script.py ops/restore_mongodb.py
git checkout v1.0.0 -f
```
