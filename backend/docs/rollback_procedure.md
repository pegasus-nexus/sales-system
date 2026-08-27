# 💾 PROCEDIMIENTO OPERATIVO OFICIAL DE RESTAURACIÓN Y ROLLBACK DE DESASTRES

**SISTEMA:** PEGASUS SALES SYSTEM  
**ENTORNO:** PRODUCCIÓN / STAGING  
**BASELINE CONGELADO:** `afc8029`  
**VERSIÓN BI:** 10/10 FASES CONSOLIDADO Y CONCILIADO  

---

## 1. OBJETIVO OPERATIVO

Este documento establece el protocolo estándar repetible y comprobable para:
1. **Restaurar la base de datos MongoDB** desde un respaldo consistente (`mongodump` / snapshot).
2. **Ejecutar un Rollback de Emergencia del Backend & Frontend** hacia el commit estable baseline (`afc8029`).
3. **Verificar la integridad funcional y matemática (Bs. 0.00 Dif)** tras la recuperación.

---

## 2. PROCEDIMIENTO DE RESPALDO (BACKUP)

### A. Comando Ejecutable de Respaldo
```bash
python run_script.py ops/backup_mongodb.py
```
- **Ubicación de Salida**: `backend/backups/backup_YYYYMMDD_HHMMSS/`
- **Generación de SHA-256**: Se calcula automáticamente un archivo `checksum_sha256.txt` para garantizar la inmutabilidad e integridad del dump.

---

## 3. PROCEDIMIENTO DE RESTAURACIÓN (RESTORE)

### A. Comando Ejecutable de Restauración
```bash
python run_script.py ops/restore_mongodb.py --backup-dir backend/backups/backup_latest/ --target-db sales_system_restore_test
```

### B. Criterios de Validación del Restore
1. Conteo de documentos por colección entre BD Origen y BD Restaurada.
2. Diferencia total de documentos = **`0`**.

---

## 4. PROCEDIMIENTO DE ROLLBACK DE CÓDIGO (GIT)

En caso de detectarse una falla crítica insalvable en producción:

```powershell
# 1. Detener servicios FastAPI / Node.js
# 2. Retornar al commit baseline seguro
git fetch origin
git checkout afc8029 -f
git reset --hard afc8029

# 3. Validar estado de compilación Frontend
cd frontend
npm run build

# 4. Validar integridad de las 10 Fases del BI
cd ../backend
python run_script.py run_full_bi_regression_suite.py
```

---

## 5. RE-VALIDACIÓN POSTERIOR OBLIGATORIA

Posterior a cualquier evento de restauración o rollback, debe ejecutarse la Suite de Seguridad y Regresión:
1. `python run_script.py verify_security_eje1_suite.py` $\rightarrow$ Must be **`✓ PASS`**
2. `python run_script.py run_full_bi_regression_suite.py` $\rightarrow$ Must be **`✓ PASS`**
