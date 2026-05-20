# 📚 Documentación Técnica — SalesSystem (Chocolates Taboada)
**Versión:** 2.0 | **Última actualización:** Mayo 2026

---

## 🎯 Objetivo General del Sistema

SalesSystem es un **motor de inteligencia de negocio** diseñado para Chocolates Taboada. Su propósito es transformar datos de ventas históricos en decisiones estratégicas automáticas mediante:

1. **Predicción de demanda** por producto, sucursal y horizonte temporal
2. **Clasificación estratégica** de productos (Matriz BCG) con datos reales
3. **Chatbot analítico** con acceso directo a los 46,000+ registros históricos
4. **Alertas automáticas** de stock crítico y eventos de mercado
5. **Recomendaciones de pedidos IA** priorizadas por urgencia

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│   Dashboard ─ AnaliticaAvanzada ─ BCG ─ Chatbot ─ POS      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST (JSON)
                         │ Puerto 5173 → 8000
┌────────────────────────▼────────────────────────────────────┐
│                  BACKEND (FastAPI + Python)                  │
│  /api/v1/analytics  ─  /api/v1/chat  ─  /api/v1/sales      │
│  ML Service  ─  BCG Service  ─  Analytics Service           │
└────────────────────────┬────────────────────────────────────┘
                         │ Motor Async (Motor/Beanie)
┌────────────────────────▼────────────────────────────────────┐
│               MONGODB (Base de Datos Principal)              │
│  ventas_historicas_crudas │ sales │ inventario │ users      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ FRONTEND — Librerías y Propósito

### Stack Base

| Librería | Versión | Propósito en el sistema |
|----------|---------|------------------------|
| **react** | 19.2.0 | Framework principal de UI. Componentes reactivos para dashboard, POS y analítica |
| **react-dom** | 19.2.0 | Renderizado del árbol de componentes al DOM del navegador |
| **vite** | 7.3.1 | Bundler y servidor de desarrollo. HMR instantáneo al editar código |
| **typescript** | 5.9.3 | Tipado estático. Previene errores en tiempo de desarrollo |

### Routing & Estado Global

| Librería | Versión | Propósito en el sistema |
|----------|---------|------------------------|
| **react-router-dom** | 7.13.0 | Navegación entre páginas: Dashboard, POS, Analítica, Inventario, etc. |
| **zustand** | 5.0.11 | Estado global del usuario (rol, token JWT, sucursal activa). Reemplaza Redux con código minimalista |
| **@tanstack/react-query** | 5.90.21 | Cache inteligente de peticiones al backend. Evita re-fetches innecesarios |

### Visualización de Datos (Charts)

| Librería | Versión | Propósito en el sistema |
|----------|---------|------------------------|
| **recharts** | 3.8.1 | **Motor principal de gráficas.** Usado en: AreaChart (predicción demanda), ScatterChart (BCG Matrix), BarChart (sucursales/proyecciones), y comparativas horarias |

### Iconografía & UI

| Librería | Versión | Propósito en el sistema |
|----------|---------|------------------------|
| **lucide-react** | 0.564.0 | 1000+ íconos SVG optimizados. Usados en todos los paneles, botones y estados |
| **framer-motion** | 12.34.3 | Animaciones fluidas: transiciones de página, modales, micro-interacciones |
| **sonner** | 2.0.7 | Notificaciones toast (éxito/error/info). Aparece al registrar ventas o cargar datos |
| **tailwindcss** | 4.1.18 | Framework CSS utility-first. Define todo el diseño visual del sistema |
| **tailwindcss-animate** | 1.0.7 | Animaciones CSS declarativas: `animate-pulse`, `animate-bounce`, `slide-in-from-bottom` |
| **tailwind-merge** | 3.4.1 | Fusión segura de clases Tailwind (evita conflictos cuando se mezclan variantes) |
| **clsx** | 2.1.1 | Construcción condicional de className strings |

### Manejo de Archivos & Datos

| Librería | Versión | Propósito en el sistema |
|----------|---------|------------------------|
| **xlsx** | 0.18.5 | Lectura de archivos Excel (.xlsx) importados por el usuario para carga de datos históricos |
| **papaparse** | 5.5.3 | Parseo de archivos CSV. Alternativa liviana para importación de datos |
| **react-dropzone** | 15.0.0 | Zona de drag-and-drop para subir archivos Excel/CSV de ventas históricas |
| **jspdf** | 4.2.0 | Generación de PDFs: comprobantes de pedidos internos, reportes de caja |
| **jspdf-autotable** | 5.0.7 | Tablas formateadas dentro de PDFs (usadas en reportes financieros) |

### Utilidades

| Librería | Versión | Propósito en el sistema |
|----------|---------|------------------------|
| **usehooks-ts** | 3.1.1 | Hooks de React prebuildeados: `useLocalStorage`, `useDebounce`, `useWindowSize` |

---

## ⚙️ BACKEND — Librerías y Propósito

### Stack Base

| Librería | Propósito en el sistema |
|----------|------------------------|
| **fastapi** | Framework web asíncrono. Define todos los endpoints REST del sistema |
| **uvicorn** | Servidor ASGI de producción. Ejecuta FastAPI con soporte async/await nativo |
| **pydantic-settings** | Gestión de variables de entorno (MONGODB_URL, JWT_SECRET, GEMINI_API_KEY) |

### Base de Datos

| Librería | Propósito en el sistema |
|----------|------------------------|
| **motor** | Driver async de MongoDB. Permite queries no-bloqueantes para el alto volumen de registros |
| **beanie** | ODM (Object Document Mapper) sobre Motor. Define modelos MongoDB con validación Pydantic |

### Machine Learning & Ciencia de Datos

| Librería | Propósito en el sistema |
|----------|------------------------|
| **pandas** | Procesamiento de DataFrames para: BCG Matrix, KPIs, tendencias, comparativas YoY |
| **scikit-learn** | **Motor ML principal.** Usa `GradientBoostingRegressor` en modo Quantile (P10/P50/P90) para predicción de demanda |
| **holidays** | Calendario de feriados bolivianos. Feature del modelo ML: detecta días festivos y pre-festivos (ventana de 3 días) |

### Clima & Datos Externos

| Librería | Propósito en el sistema |
|----------|------------------------|
| **openmeteo-requests** | API gratuita de clima histórico y forecast. Aporta `temp_max` y `precipitation` como features al modelo ML |
| **requests-cache** | Cache de peticiones HTTP al API del clima. Evita llamadas repetidas en cada predicción |
| **retry-requests** | Reintentos automáticos con backoff exponencial para la API del clima |

### Autenticación & Seguridad

| Librería | Propósito en el sistema |
|----------|------------------------|
| **passlib[bcrypt]** | Hasheo seguro de contraseñas con bcrypt (factor de costo adaptativo) |
| **bcrypt** | Implementación C-level del algoritmo bcrypt (dependencia de passlib) |
| **python-jose[cryptography]** | Generación y validación de tokens JWT (JSON Web Tokens) para autenticación |
| **email-validator** | Validación de formato de email en creación de usuarios |

### Reportes & Archivos

| Librería | Propósito en el sistema |
|----------|------------------------|
| **openpyxl** | Lectura/escritura de archivos Excel. Soporta la importación masiva de ventas históricas (46k+ registros) |
| **reportlab** | Generación de PDFs desde el backend: comprobantes de recepción de pedidos |
| **python-multipart** | Soporte de `multipart/form-data` para upload de archivos Excel vía FastAPI |

### Inteligencia Artificial (Chatbot)

| Librería | Propósito en el sistema |
|----------|------------------------|
| **langchain-google-genai** | Integración de Google Gemini Pro con LangChain. Motor del chatbot analítico |
| **langchain-experimental** | `create_pandas_dataframe_agent` — Agente que puede ejecutar análisis Python sobre el DataFrame de ventas en tiempo real |

---

## 🤖 SISTEMA DE INTELIGENCIA ARTIFICIAL

### Módulo 1: Predicción de Demanda (ml_service.py)

**Objetivo:** Predecir las ventas de los próximos 7 días con intervalos de confianza.

**Algoritmo:** `GradientBoostingRegressor` en modo Quantile Regression (3 modelos paralelos):
- **P10** → Escenario pesimista (10% de probabilidad de ser menor)
- **P50** → Predicción central (mediana, la más probable)
- **P90** → Escenario optimista (10% de probabilidad de ser mayor)

**Features del modelo:**
```
dayofweek        → Día de semana (0=Lunes, 6=Domingo)
dayofmonth       → Día del mes
month            → Mes del año
is_weekend       → Binario: ¿Es fin de semana?
is_holiday_season → 0=Normal, 1=Pre-feriado (≤3 días), 2=Feriado boliviano
lag_1            → Ventas del día anterior
lag_7            → Ventas del mismo día de la semana pasada
temp_max         → Temperatura máxima del día (Open-Meteo API)
precipitation    → Precipitación en mm (Open-Meteo API)
```

**Datos de entrenamiento:** Últimos 365 días de ventas reales de `ventas_historicas_crudas`.

---

### Módulo 2: Matriz BCG Automática (bcg_service.py)

**Objetivo:** Clasificar automáticamente todos los productos en 4 cuadrantes estratégicos.

**Algoritmo:**
1. Agrupa ventas por producto en el periodo actual y el periodo equivalente anterior
2. Calcula **Cuota de Mercado Relativa** = `ingresos_producto / ingresos_producto_líder`
3. Calcula **Tasa de Crecimiento** = `(ventas_actual - ventas_anterior) / ventas_anterior`
4. Clasifica usando umbrales por **mediana de la distribución** (frontend reclasifica para distribución balanceada)

**Cuadrantes:**
- 🌟 **Estrella** → Alta cuota + Alto crecimiento → REABASTECER
- 🐄 **Vaca Lechera** → Alta cuota + Bajo crecimiento → MANTENER
- ❓ **Interrogante** → Baja cuota + Alto crecimiento → EVALUAR
- 📉 **Perro** → Baja cuota + Bajo crecimiento → DESINVERTIR

---

### Módulo 3: Chatbot Analítico IA (chat_service.py)

**Objetivo:** Permitir al gerente hacer preguntas en lenguaje natural sobre los datos de ventas.

**Arquitectura RAG (Retrieval-Augmented Generation):**
```
Pregunta gerente
     │
     ▼
MongoDB → ventas_historicas_crudas (todos los registros)
     │
     ▼
Pandas DataFrame (fecha, producto, cantidad, monto)
     │
     ▼
LangChain PandasDataframeAgent
     │
     ▼
Google Gemini Pro (LLM)
     │
     ▼
Respuesta analítica en español
```

**Modelo:** `gemini-pro-latest` con `temperature=0` (respuestas deterministas y precisas).

**Capacidades del chatbot:**
- "¿Cuál fue el producto más vendido en marzo?"
- "¿Cuánto vendimos la semana pasada en la sucursal Heroínas?"
- "¿Qué productos tienen tendencia negativa?"
- "Muéstrame el top 5 de productos por ingreso"

---

### Módulo 4: Motor de KPIs y Comparativas (analytics_service.py)

**Objetivo:** Calcular métricas financieras ejecutivas con comparativas YoY (Año contra Año).

**Calcula:**
- Ventas brutas, costo de insumos (85%), margen líquido (15%)
- Ticket promedio, clientes activos/recurrentes
- Percentiles P50 y P90 de ventas por transacción
- Distribución horaria YoY (hoy vs hace 364 días a la misma hora)
- Ventas por sucursal, top 10 productos por ingresos

---

### Módulo 5: Sugerencias de Pedidos IA (frontend — AnaliticaAvanzada.tsx)

**Objetivo:** Generar automáticamente una tabla de acciones prioritarias sin intervención humana.

**Lógica de priorización:**
```
ESTRELLA + crecimiento > 50% → 🔴 ALTA → "Reabastecer +30% inmediatamente"
ESTRELLA + crecimiento < 50% → 🟡 MEDIA → "Reabastecer esta semana"
INTERROGANTE               → 🟡 MEDIA → "Evaluar stock y marketing"
VACA                       → 🟢 BAJA  → "Mantener inventario base"
PERRO + crecimiento < -10% → 🔴 ALTA  → "Liquidar / Descontinuar"
PERRO + crecimiento >= -10%→ 🟡 MEDIA → "Reducir volumen de pedido"
```

---

## 📡 ENDPOINTS PRINCIPALES DEL API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/analytics/dashboard` | KPIs ejecutivos + tendencias + BCG básico |
| GET | `/api/v1/analytics/bcg` | Matriz BCG completa con todos los productos |
| GET | `/api/v1/analytics/ml/predict-demand` | Predicción ML 7 días (P10/P50/P90) |
| GET | `/api/v1/analytics/orchestration` | Dashboard ejecutivo consolidado |
| GET | `/api/v1/analytics/hourly-multiyear` | Comparativa horaria multi-año |
| POST | `/api/v1/chat/reporte-ia` | Chatbot Gemini con datos históricos |
| POST | `/api/v1/analytics/import-historical` | Importación masiva de Excel histórico |
| GET | `/api/v1/sales` | Listado de ventas con paginación |
| POST | `/api/v1/sales` | Registrar nueva venta (POS) |
| GET | `/api/v1/inventario` | Inventario por sucursal |
| GET | `/api/v1/analytics/top-products` | Top productos por ingresos |
| GET | `/api/v1/analytics/sales-by-branch` | Ventas agrupadas por sucursal |

---

## 🗄️ COLECCIONES MONGODB

| Colección | Descripción |
|-----------|-------------|
| `ventas_historicas_crudas` | 46,000+ registros históricos importados de Excel. Base del ML y BCG |
| `sales` | Ventas registradas en tiempo real vía POS |
| `inventario` | Stock por producto y sucursal |
| `products` | Catálogo de productos con precios |
| `users` | Usuarios del sistema con roles |
| `sucursales` | Puntos de venta registrados |
| `pedidos` | Pedidos internos entre sucursales |
| `caja_sesiones` | Sesiones de apertura/cierre de caja |
| `caja_movimientos` | Gastos e ingresos de caja |
| `categorias` | Categorías de productos |
| `descuentos` | Reglas de descuentos por sucursal |

---

## 👥 ROLES Y PERMISOS

| Rol | Acceso |
|-----|--------|
| `SUPERADMIN` | Todo el sistema, todos los tenants |
| `ADMIN_MATRIZ` | Analítica avanzada ML, BCG, chatbot, multi-sucursal |
| `ADMIN` | Dashboard, reportes, gestión de productos |
| `CAJERO` | POS, caja, ventas del día |
| `SUPERVISOR` | Reportes de su sucursal |
| `VENDEDOR` | Solo POS básico |

---

## 🔄 FLUJO DE DATOS COMPLETO

```
Excel Histórico (46k registros)
    ↓ import-historical endpoint
ventas_historicas_crudas (MongoDB)
    ↓
┌───────────────────────────────────┐
│  MOTOR ANALÍTICO (analytics_service.py) │
│  - KPIs Financieros               │
│  - BCG Matrix (bcg_service.py)    │
│  - Comparativa YoY horaria        │
└───────────────┬───────────────────┘
                │
┌───────────────▼───────────────────┐
│  MOTOR ML (ml_service.py)         │
│  - Features: clima + feriados +   │
│    lag variables                  │
│  - GradientBoosting P10/P50/P90  │
│  - Predicción 7 días adelante     │
└───────────────┬───────────────────┘
                │
┌───────────────▼───────────────────┐
│  CHATBOT IA (chat_service.py)     │
│  - LangChain + Gemini Pro         │
│  - PandasDataframeAgent           │
│  - Respuestas en lenguaje natural │
└───────────────┬───────────────────┘
                │
┌───────────────▼───────────────────┐
│  FRONTEND (AnaliticaAvanzada.tsx) │
│  - 7 secciones de análisis        │
│  - BCG reclasificación por mediana│
│  - Sugerencias IA priorizadas     │
│  - Proyecciones 30d/6m/1a        │
│  - Panel multi-sucursal           │
└───────────────────────────────────┘
```

---

## ⚙️ VARIABLES DE ENTORNO REQUERIDAS

```env
# MongoDB
MONGODB_URL=mongodb+srv://...

# Seguridad JWT
JWT_SECRET=tu_clave_secreta_larga
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Google Gemini (Chatbot IA)
GEMINI_API_KEY=AIza...

# Entorno
ENVIRONMENT=development  # o "production"
PROJECT_NAME=ChocolatesTaboada-SalesSystem
```

---

## 📦 CÓMO EJECUTAR EL SISTEMA

```bash
# 1. Backend
cd SalesSystem/backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# 2. Frontend (en otra terminal)
cd SalesSystem/frontend
npm install
npm run dev
# Abrir: http://localhost:5173
```

---

*Documentación generada por Antigravity AI — SalesSystem v2.0 — Mayo 2026*
