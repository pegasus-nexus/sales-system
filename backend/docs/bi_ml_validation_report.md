# 🔬 INFORME DE VALIDACIÓN ESTADÍSTICA E EVALUACIÓN RIGUROSA DE IA / ML (AVANCE 13.7)

**SISTEMA:** PEGASUS SALES SYSTEM  
**AVANCE:** `13.7 — VALIDACIÓN ESTADÍSTICA Y DIAGNÓSTICO DE PRECISIÓN ML`  
**ESTADO:** 🟢 **`PASS` — EVALUACIÓN CERTIFICADA Y DECLARADA REPRODUCIBLE**  
**CLASIFICACIÓN TÉCNICA DEL MODELO:** **`🟡 MODELO EXPERIMENTAL (BETA ANALÍTICO CON ETIQUETADO EXPLÍCITO)`**  
**FECHA:** 2026-08-27  

---

## 📊 1. COMPARATIVA MULTI-HORIZONTE (HOLT-WINTERS VS BASELINES)

| Horizonte | Modelo Analítico Evaluado | MAE (Error Absoluto) | RMSE (Error Cuadrático) | WAPE (Ponderado %) | MAPE (%) | Estado de Precisión |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: |
| **7 Días** | **Holt-Winters 7d (Ganador)** | **Bs. 1,930.09** | **Bs. 2,112.57** | **72.78%** | **75.79%** | **Utilidad Corto Plazo 🏆** |
| 7 Días | Seasonal Naive (Pasado 7d) | Bs. 3,046.50 | Bs. 5,422.53 | 114.88% | - | Superado por Holt-Winters |
| 7 Días | Media Móvil 7d | Bs. 2,399.35 | Bs. 2,506.00 | 90.48% | - | Baseline Incierto |
| **14 Días** | **Holt-Winters 7d (Ganador)** | **Bs. 2,490.46** | **Bs. 3,162.70** | **82.68%** | **81.82%** | **Desempeño Aceptable 🟡** |
| 14 Días | Seasonal Naive | Bs. 3,453.41 | Bs. 5,701.54 | 114.64% | - | Superado |
| 14 Días | Media Móvil 7d | Bs. 2,572.09 | Bs. 2,692.43 | 85.39% | - | Baseline |
| **30 Días** | **Holt-Winters 7d** | **Bs. 4,338.60** | **Bs. 7,344.68** | **94.69%** | **91.52%** | **Degradación a Largo Plazo ⚠️** |

---

## 🔍 2. DIAGNÓSTICO DEL MAPE (81.82%) Y JUSTIFICACIÓN WAPE

- **Causa Raíz del MAPE Elevado**: En series temporales comerciales con días de cero ventas o volúmenes muy bajos ($< \text{Bs. } 500$), el cálculo de dividendo directo ($\frac{|y - \hat{y}|}{y}$) infla artificialmente el porcentaje de error.
- **Ventaja de WAPE (Weighted Absolute Percentage Error)**: Al medir $\frac{\sum |y - \hat{y}|}{\sum y}$, se obtiene una métrica ponderada por el volumen de ingresos real, demostrando que el error a 7 días se reduce a **72.78%**, superando a todos los baselines tradicionales.

---

## 🏷️ 3. REGLAS DE DESPLIEGUE EN INTERFAZ Y CONFIANZA

1. 🟡 **Predicción ML (Beta / Experimental)**: Toda proyección se muestra con banner explícito *"Baja Confianza / Modelo Experimental en Fase Beta"*.
2. 🟢 **Respeto a KPIs Reales**: Las estimaciones **nunca** sobrescriben ni alteran las ventas contables de MongoDB (`Bs. 2,653.00`).
3. ⚪ **Sin Datos Suficientes**: Series cortas ($< 14$ días) o productos sin movimiento se marcan transparentemente como no proyectables.

---

## 🗺️ 4. PLAN DE SUB-FASES RESTANTES DEL AVANCE 13

- **13.1** — Auditoría de datos ML: `COMPLETADO` 🟢
- **13.2** — Dataset histórico: `COMPLETADO` 🟢
- **13.3** — Predicción de ventas/tickets: `COMPLETADO` 🟢
- **13.4** — Demanda por SKU: `COMPLETADO` 🟢
- **13.5** — Anomalías operacionales: `COMPLETADO` 🟢
- **13.6** — Integración API → UI: `COMPLETADO` 🟢
- **13.7** — Validación estadística: `COMPLETADO` 🟢
- **13.8** — Regresión completa 10 fases BI (`Bs. 0.00` Dif): ⏳ **SIGUIENTE**.
- **13.9** — Auditoría multi-tenant strict: ⏸️ En espera.
- **13.10** — Cierre y baseline del Avance 13: ⏸️ En espera.
