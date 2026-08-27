# 📖 MANUAL DE OPERACIÓN DE PRODUCCIÓN — PEGASUS SALES SYSTEM v1.0.0

**SISTEMA:** PEGASUS SALES SYSTEM  
**VERSIÓN OFICIAL:** `v1.0.0`  
**COMMIT BASELINE RELEASE:** `f1e0821`  
**DOCUMENTO:** MANUAL DE OPERACIÓN CONTINUA Y MONITOREO DE SISTEMA  

---

## 🛠️ 1. PROTOCOLOS DE EJECUCIÓN Y MANTENIMIENTO

### 1.1 Ejecución Centralizada de Scripts
Todos los scripts auxiliares de verificación, migración o auditoría deben ejecutarse estrictamente mediante el runner centralizado en `backend/`:

```bash
python run_script.py [nombre_del_script.py]
```

### 1.2 Auditoría de Salud y Conectividad (Health Checks)
Verificar en cualquier momento la salud de la API y MongoDB ejecutando:

```bash
python run_script.py verify_postprod_health.py
```

O consultando el endpoint HTTP:
`GET /health` o `GET /api/v1/bi/health`

---

## 💾 2. RESPALDOS Y RESTAURACIÓN DE MONGODB (BACKUPS)

### 2.1 Backup Diario de Base de Datos
Para generar un respaldo comprimido de la base de datos de MongoDB:

```bash
mongodump --uri="mongodb://localhost:27017/pegasus_sales" --out=/backups/$(date +%Y%m%d)_pegasus_backup
```

### 2.2 Verificación Semanal de Restauración de Prueba
```bash
mongorestore --uri="mongodb://localhost:27017/pegasus_sales_test_restore" --drop /backups/20260827_pegasus_backup/pegasus_sales
```

---

## 🔒 3. REGLAS PERMANENTES DE GOBERNANZA Y REVISIÓN DE CAMBIOS

Toda modificación al código fuente debe seguir sin excepción la **Regla de Oro**:

$$\text{CAMBIO} \longrightarrow \text{PRUEBA REGRESIÓN} \longrightarrow \text{CONCILIACIÓN 1:1} \longrightarrow \text{PASS} \longrightarrow \text{COMMIT}$$

Suite obligatoria antes de autorizar un deploy:
1. `npm run build` en `frontend/` (TypeScript / Vite).
2. `python run_script.py verify_fase10_field_audit.py` (Certificación contable `Bs. 0.00` Dif).
