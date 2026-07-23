# 🔴 Diagnóstico de Rendimiento — Out of Memory (512MB Render)

## Causa Raíz

Tu backend **Ran out of memory** porque varios endpoints cargan **datos ilimitados a la RAM** usando `to_list(length=None)` — esto trae TODOS los registros de MongoDB a la memoria del servidor de una sola vez. Con 46K+ registros históricos + miles de ventas POS, un solo request de reportes puede consumir cientos de MB.

---

## Los 7 Puntos Críticos (Ordenados por Severidad)

### 🔴 1. Chat Service — EL PEOR OFENSOR
**Archivo:** [chat_service.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/services/chat_service.py) (línea 30)

```python
datos_crudos = await cursor.to_list(length=None)  # ← CARGA 46K+ REGISTROS
df = pd.DataFrame(datos_crudos)  # ← DUPLICA EN PANDAS (~100-200MB)
```

**Impacto:** Cada pregunta al chatbot carga **46,000+ documentos** de `ventas_historicas_crudas` en RAM, luego los duplica en un DataFrame de Pandas, y luego los pasa a LangChain. Un solo request puede consumir **200-400MB** — casi el límite completo de Render.

**Fix recomendado:**
- Pre-agregar los datos con un pipeline de MongoDB (totales por producto/mes) en vez de traer todo crudo
- Limitar a los últimos 90-180 días en vez de todo el historial
- Cachear el DataFrame con TTL de 1 hora

---

### 🔴 2. Analytics Service — 2 queries sin límite
**Archivo:** [analytics_service.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/services/analytics_service.py) (líneas 75 y 120)

```python
datos_hist = await cursor_hist.to_list(length=None)  # ← ALL historical records
live_sales = await cursor_sales.to_list(length=None)  # ← ALL live sales
```

**Impacto:** Carga TODOS los datos históricos + TODAS las ventas vivas en RAM simultáneamente.

**Fix:** Usar aggregation pipelines que hagan los cálculos en MongoDB, no en Python.

---

### 🔴 3. Caja Sessions — N+1 Query Problem
**Archivo:** [caja.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/api/v1/endpoints/caja.py) (líneas 86-128)

```python
for s in sesiones:  # 5-10 sesiones
    movs = await CajaMovimiento.find(...).to_list()    # Query 1 por sesión
    sales = await Sale.find(...).to_list()              # Query 2 por sesión → SIN LÍMITE
```

**Impacto:** Por cada sesión de caja, hace **2 queries adicionales**. Con 10 sesiones = **20 queries** en un solo request. Y la query de Sales no tiene `length` → trae TODAS las ventas de esa sesión a RAM.

**Fix:** Reemplazar con un aggregation pipeline con `$lookup` que haga todo en una sola query.

---

### 🟠 4. Reports — Evolución Mensual carga todas las ventas
**Archivo:** [reports.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/api/v1/endpoints/reports.py) (línea 1867)

```python
sales = await Sale.find(*filters).sort(Sale.created_at).to_list()  # ← ALL SALES
products_list = await Product.find(Product.tenant_id == tenant_id).to_list()  # ← ALL products
```

**Impacto:** El reporte mensual carga **TODAS las ventas** del periodo + todos los productos + todas las categorías a RAM. Con 6 meses de datos = potencialmente miles de documentos Sale completos (con items embebidos).

---

### 🟠 5. Reports — Rentabilidad por productos
**Archivo:** [rentabilidad_service.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/services/rentabilidad_service.py) (línea 223)

```python
).to_list(50000)  # ← Hasta 50,000 registros
```

**Impacto:** Puede cargar hasta 50K registros de una sola vez.

---

### 🟡 6. ML Service — Carga 1 año de ventas
**Archivo:** [ml_service.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/services/ml_service.py) (línea 26)

```python
sales_data = await cursor.to_list(length=None)  # ← 365 días de ventas
df = pd.DataFrame(sales_data)  # ← Duplica en Pandas + scikit-learn
```

**Impacto:** Menos severo porque solo trae `created_at` y `total`, pero + pandas + 3 modelos GradientBoosting en RAM simultáneamente puede sumar ~50-100MB.

---

### 🟡 7. Reports — Queries con `length=5000` generalizadas

Varias queries en `reports.py` usan `to_list(length=5000)`:
- Línea 553, 605: rentabilidad con 2000 registros
- Líneas 1619, 1701: análisis de productos con 5000 registros

---

## 📊 Resumen Visual del Consumo de Memoria

| Endpoint/Service | Registros cargados | RAM estimada | Frecuencia |
|------------------|-------------------|-------------|------------|
| **Chat Service** | 46,000+ (completos) | 200-400MB 🔴 | Cada pregunta |
| **Analytics Dashboard** | ~46K hist + todas ventas POS | 150-300MB 🔴 | Cada carga del dashboard |
| **Caja /sesiones** | N sesiones × (movs + sales) | 50-150MB 🟠 | Frecuente |
| **Reportes Mensual** | Todas ventas del periodo | 50-200MB 🟠 | Al generar reporte |
| **ML Predict** | 365 días + pandas + sklearn | 50-100MB 🟡 | Al pedir predicción |
| **Rentabilidad** | Hasta 50K registros | 30-80MB 🟡 | Al generar reporte |

**Render Free/Starter = 512MB.** Un solo request del chat + un dashboard simultáneo = 💥 OOM.

---

## 🛠️ Plan de Optimización (Propuesto)

### Prioridad 1 — Eliminar OOM inmediato (1-2 días)

#### 1A. Chat Service → Aggregation pre-computada

```python
# ANTES: Cargar 46K registros completos
datos_crudos = await cursor.to_list(length=None)

# DESPUÉS: Aggregation que resume los datos en MongoDB
pipeline = [
    {"$group": {
        "_id": {"producto": "$nombre_producto", "mes": {"$dateToString": {"format": "%Y-%m", "date": "$fecha_transaccion"}}},
        "cantidad": {"$sum": "$cantidad_vendida"},
        "monto": {"$sum": "$monto_total_bs"}
    }},
    {"$sort": {"_id.mes": 1}}
]
resumen = await cursor.to_list(length=500)  # ← ~500 filas vs 46,000
```

#### 1B. Analytics Service → Aggregation en MongoDB

Mover los cálculos de KPIs, tendencias y comparativas a aggregation pipelines en vez de hacerlos en Python con listas.

#### 1C. Caja /sesiones → Aggregation con $lookup

```python
# ANTES: N+1 queries
for s in sesiones:
    movs = await CajaMovimiento.find(...).to_list()
    sales = await Sale.find(...).to_list()

# DESPUÉS: Un solo pipeline con $lookup
pipeline = [
    {"$match": query_args},
    {"$sort": {"abierta_at": -1}},
    {"$skip": skip}, {"$limit": limit},
    {"$lookup": {
        "from": "caja_movimientos",
        "localField": "_id",
        "foreignField": "sesion_id",
        "as": "movimientos"
    }},
    # Calcular totales con $reduce en MongoDB, no en Python
]
```

### Prioridad 2 — Limitar datos traídos (1 día)

Reemplazar TODOS los `to_list(length=None)` por límites razonables:

```python
# Chat: máximo 180 días
# Analytics: usar aggregation
# Reports evolución: aggregation pipeline con $group por mes
# ML: ya tiene límite de 365 días (OK, pero usar aggregation para agrupar)
# Rentabilidad: to_list(length=1000) máximo
```

### Prioridad 3 — Caché de resultados pesados (1 día)

```python
from functools import lru_cache
# O usar Redis/in-memory cache con TTL

@lru_cache(maxsize=10)
def get_dashboard_data(tenant_id: str, date_key: str):
    # Cacheado por 30 minutos
    ...
```

### Prioridad 4 — Monitoreo (1 día)

Agregar un middleware de tracking de memoria:

```python
import tracemalloc

@app.middleware("http")
async def memory_tracking(request, call_next):
    tracemalloc.start()
    response = await call_next(request)
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    if peak > 200_000_000:  # 200MB
        print(f"⚠️ HIGH MEMORY: {request.url.path} used {peak/1024/1024:.1f}MB")
    return response
```

---

## Open Questions

> [!IMPORTANT]
> 1. **¿Quieres que ejecute las optimizaciones de Prioridad 1 ahora mismo?** Son los 3 fixes que eliminarían el OOM inmediatamente.
> 2. **¿El chatbot se usa activamente?** Si no, podemos deshabilitarlo temporalmente para liberar recursos.
> 3. **¿Consideras subir el plan de Render?** El tier gratuito/starter (512MB) es muy limitado para un sistema con ML + Pandas + Analytics. El siguiente tier (1GB) daría mucho más margen.
