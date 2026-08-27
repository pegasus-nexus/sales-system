# 🩹 INFORME DE RECONCILIACIÓN DE PRESETS Y HOTFIX TEMPORAL (RELEASE v1.0.1)

**SISTEMA:** PEGASUS SALES SYSTEM  
**HOTFIX RELEASE:** `v1.0.1`  
**ESTADO:** 🟢 **`PASS` — CONCILIACIÓN MATEMÁTICA CERTIFICADA (Bs. 0.00 DIFERENCIA / 0 TICKETS DIFERENCIA)**  
**SCRIPT AUDITOR:** [`backend/scripts/debug/verify_presets_sum_audit.py`](file:///c:/Users/dell/OneDrive/Desktop/SalesSystem/backend/scripts/debug/verify_presets_sum_audit.py)  
**FECHA:** 2026-08-27  

---

## 📊 1. MATRIZ DE AUDITORÍA DE SUMAS DIARIAS VS RANGOS ACUMULADOS

| Filtro Temporal / Preset | Suma de Días Individuales (Mongo / API) | Rango Directo de API | Diferencia Monetaria | Diferencia Tickets | Estado |
| :--- | :---: | :---: | :---: | :---: | :-: |
| **Hoy (27/08/2026)** | **Bs. 434.50 / 15 tks** | **Bs. 434.50 / 15 tks** | **Bs. 0.00** | **0 tickets** | **✓ PASS** |
| **Ayer (26/08/2026)** | **Bs. 2,355.83 / 51 tks** | **Bs. 2,355.83 / 51 tks** | **Bs. 0.00** | **0 tickets** | **✓ PASS** |
| **7 Días (21/08 - 27/08)** | **Bs. 17,302.62 / 379 tks** | **Bs. 17,302.62 / 379 tks** | **Bs. 0.00** | **0 tickets** | **✓ PASS** |
| **30 Días (29/07 - 27/08)** | **Bs. 61,881.27 / 1,673 tks** | **Bs. 61,881.27 / 1,673 tks** | **Bs. 0.00** | **0 tickets** | **✓ PASS** |

---

## 🔒 2. SOLUCIÓN CORREGIDA EN FRONTEND

- **Ajuste de Matemática de Fechas en UTC**: Se corrigió el helper `getFormattedBoliviaDate` en [`BIFilterHeader.tsx`](file:///c:/Users/dell/OneDrive/Desktop/SalesSystem/frontend/src/components/bi/common/BIFilterHeader.tsx) reemplazando `new Date(y, m - 1, d)` por `new Date(Date.UTC(y, m - 1, d + daysOffset))`.
- **Inmunidad a Zona Horaria del Cliente**: Se garantiza que navegadores en cualquier parte del mundo interpreten y calculen exactamente los rangos en `America/La_Paz` sin desfasar el día de la consulta.
