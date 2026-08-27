# 📋 CHANGELOG OFICIAL DE RELEASES — PEGASUS SALES SYSTEM

Todas las modificaciones notables a este proyecto están documentadas en este archivo respetando la gobernanza **`v1.0.0`**.

---

## 🩹 [v1.0.1] - 2026-08-27 (Hotfix Date Presets & Sum Conciliation)

### 🐛 Correcciones & Mejoras:
- **Matemática de Fechas UTC-Safe en UI**: Corrección en `getFormattedBoliviaDate` de [`BIFilterHeader.tsx`](file:///c:/Users/dell/OneDrive/Desktop/SalesSystem/frontend/src/components/bi/common/BIFilterHeader.tsx) utilizando `Date.UTC(y, m - 1, d + offset)` para evitar desvíos causados por el huso horario local de la máquina del usuario.
- **Conciliación de Sumas Diarias vs. Rangos Acumulados (`verify_presets_sum_audit.py`)**:
  - **Hoy (27/08/2026)**: Mongo = API = `Bs. 434.50` (15 tickets) (`Bs. 0.00 / 0 Tks Dif`).
  - **Ayer (26/08/2026)**: Mongo = API = `Bs. 2,355.83` (51 tickets) (`Bs. 0.00 / 0 Tks Dif`).
  - **7 Días**: Suma Diarias = API Rango = `Bs. 17,302.62` (379 tickets) (`Bs. 0.00 / 0 Tks Dif`).
  - **30 Días**: Suma Diarias = API Rango = `Bs. 61,881.27` (1,673 tickets) (`Bs. 0.00 / 0 Tks Dif`).

---

## 🏆 [v1.0.0] - 2026-08-27 (Official Product Release)

### 🌟 Novedades Principales:
- **Clean Architecture Completa Backend**: Separación estricta en capas Domain, Application e Infrastructure con desacoplamiento total de Beanie/Pymongo en endpoints FastAPI.
- **Centro BI de 10 Fases Certificado**: 10 vistas analíticas en React con 100% de conciliación contable contra MongoDB directo (`Bs. 2,653.00` de Ventas, `67` tickets, `Bs. 440.70` de Margen y `Bs. 261,633.86` de Inventario Valorizado).
- **Módulo de Inteligencia Artificial & ML (Avance 13)**:
  - Algoritmo **Holt-Winters Additive** con bandas de confianza del 95%.
  - Pronóstico de demanda física por SKU.
  - Alertas operacionales de anomalías por puntuación Z-Score.
- **UX & Visual System**: Componentes modulares `BIKpiCard`, `BIBadgeHeader`, `BIStateBanner` y gráficos Recharts adaptables a todos los breakpoints responsive (Desktop, Laptop, Tablet, Mobile).
- **Seguridad & Multi-Tenancy Strict**: Aislamiento total por `tenant_id` en todas las agregaciones e índices compuestos MongoDB `IXSCAN`.
- **Observabilidad Operativa (Avance 14)**: Script `verify_postprod_health.py` para medición continua de latencias P50/P95 y salud de infraestructura.

### 🔒 Certificación de Gobernanza:
- Commit release de producción: `f1e0821`
- Baseline ML: `ML_BASELINE_v1` (`e2837ad`)
- Tolerancia monetaria: `Bs. 0.00` de diferencia en las 10 Fases del Centro BI.
