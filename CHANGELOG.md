# 📋 CHANGELOG OFICIAL DE RELEASES — PEGASUS SALES SYSTEM

Todas las modificaciones notables a este proyecto están documentadas en este archivo respetando la gobernanza **`v1.0.0`**.

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
