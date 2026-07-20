# 🏗️ Diagnóstico Completo & Plan de Evolución — Pegasus SalesSystem

## Resumen Ejecutivo

He realizado un análisis profundo de tu proyecto completo: **34 modelos de dominio, 29 módulos de endpoints, 12 servicios de negocio, 11 servicios de analítica/ML/IA, 34 páginas en el frontend, y ~340K+ líneas de código backend**. El sistema es impresionantemente funcional — sirve a un negocio real en Bolivia con POS multi-sucursal, inventario, créditos, analítica con ML, chatbot IA, y más. Sin embargo, tiene deuda técnica significativa que limitará su crecimiento como SaaS multi-rubro.

---

## 📊 Estado Actual del Proyecto — Scorecard

| Área | Puntuación | Comentario |
|------|:----------:|------------|
| **Funcionalidad** | 🟢 9/10 | Extremadamente completo para el caso de uso actual |
| **Arquitectura Backend** | 🟡 5/10 | Clean Architecture definida pero aplicada solo al ~10% del código |
| **Arquitectura Frontend** | 🟡 6/10 | Buen stack (React 19 + Zustand + React Query) pero archivos monolíticos |
| **Multi-tenancy** | 🟡 5/10 | Funciona pero depende de que el dev no olvide filtrar `tenant_id` |
| **Testing** | 🔴 2/10 | 7 test files backend, 0 en frontend. Cobertura < 5% |
| **CI/CD** | 🟡 4/10 | CI existe pero lint mínimo, no hay CD automatizado |
| **Seguridad** | 🟡 5/10 | JWT + bcrypt + rate limiting, pero sin refresh tokens ni CSRF |
| **DevOps** | 🔴 3/10 | Sin Dockerfile, sin entorno de staging, sin logging estructurado |
| **Documentación** | 🟡 5/10 | DOCUMENTACION_TECNICA.md existe pero no hay `.env.example` ni API docs |
| **Escalabilidad SaaS** | 🟡 4/10 | Multi-tenant básico funciona, pero no está listo para multi-rubro |

---

## 🔴 Los 5 Problemas Críticos (Prioridad Máxima)

### 1. Archivos Monolíticos Gigantes
Los archivos más grandes del proyecto son bombas de tiempo para mantenimiento:

| Archivo | Tamaño | Problema |
|---------|--------|----------|
| [CajaPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/CajaPage.tsx) | **110KB** | Una sola página con toda la lógica de caja |
| [POSPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/POSPage.tsx) | **78KB** | Punto de venta monolítico |
| [CatalogoPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/CatalogoPage.tsx) | **74KB** | Catálogo en un solo componente |
| [reports.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/api/v1/endpoints/reports.py) | **64KB** | Todos los reportes en un solo archivo |
| [sales_service.py](file:///c:/Users/rodri/Desktop/sales-system/backend/app/application/services/sales_service.py) | **51KB** | Toda la lógica de ventas |
| [api.ts](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/api/api.ts) | **906 líneas** | TODAS las funciones API en un solo archivo |

### 2. Arquitectura Inconsistente (Clean Architecture al ~10%)
Tu [clean-architecture-rules.md](file:///c:/Users/rodri/Desktop/sales-system/.agents/workflows/clean-architecture-rules.md) define reglas excelentes, pero solo se aplican al módulo de Dark Kitchen/Producción. El 90% restante accede a Beanie directamente desde los endpoints.

### 3. Aislamiento de Tenant Manual y Frágil
No existe un middleware o base query que aplique `tenant_id` automáticamente. Cada query depende de que el desarrollador recuerde filtrar. **Un solo olvido = fuga de datos entre empresas.**

### 4. Sin Tests ni Validación Automatizada
- Backend: 7 archivos de test (cobertura < 5%)
- Frontend: **CERO tests**
- ~20 scripts sueltos de debug en la raíz del backend (`check_*.py`, `fix_*.py`)

### 5. Sin Entorno de Staging ni Dev Database
Como discutimos antes, solo existe `sales_system_prod`. No hay forma segura de probar cambios.

---

## 🟡 Problemas Moderados

| # | Problema | Impacto |
|---|----------|---------|
| 6 | **URL de API duplicada 12+ veces** en `api.ts` con puertos inconsistentes (8000 vs 8001) | Bugs silenciosos |
| 7 | **Dos directorios `schemas/`** (`app/schemas/` y `app/domain/schemas/`) | Confusión para devs |
| 8 | **Dos directorios `services/`** (`app/services/` y `app/application/services/`) | Inconsistencia |
| 9 | **`require_roles` duplicado** en dos archivos con firmas diferentes | Bugs potenciales |
| 10 | **Token JWT en localStorage** sin refresh token | Vulnerabilidad XSS |
| 11 | **Sin lazy loading** — las 34 páginas cargan de golpe | Bundle grande |
| 12 | **`datetime.utcnow()` deprecado** en Python 3.12+ | Warnings futuros |
| 13 | **Sin `.env.example`** — nuevo dev no sabe qué variables configurar | Onboarding lento |
| 14 | **CORS hardcodeado** (`taboada-fexco.vercel.app`) en `main.py` | No es multi-tenant |
| 15 | **Sin logging estructurado** — usa `print()` en producción | Imposible debugear |

---

## 🗺️ Plan de Evolución: De Retail a Multi-Rubro SaaS

### Fase 0: Estabilización (1-2 semanas)
> **Objetivo:** Que lo que ya funciona no se rompa nunca más.

- [ ] **Crear `sales_system_dev`** en el mismo clúster de Atlas
- [ ] **Crear `.env.example`** con todas las variables documentadas
- [ ] **Crear `Dockerfile`** para el backend (reemplazar Vercel serverless)
- [ ] **Organizar scripts sueltos** → mover `check_*.py`, `fix_*.py`, `seed_*.py` a `backend/scripts/`
- [ ] **Eliminar código muerto** → `App.css`, imports duplicados, monkey-patches duplicados
- [ ] **Configurar Ruff completo** → `pyproject.toml` con reglas estrictas
- [ ] **Configurar ESLint estricto** → resolver `any` types en `api.ts`
- [ ] **Agregar `.env.example`** tanto en backend como frontend

---

### Fase 1: Arquitectura Base Multi-Rubro (2-3 semanas)
> **Objetivo:** Que el sistema pueda servir a Retail Y Restaurantes con la misma base de código.

#### 1.1 Tenant Isolation Middleware (Backend)
Crear un middleware que inyecte `tenant_id` automáticamente en todas las queries:

```python
# app/infrastructure/middleware/tenant_scope.py
class TenantScopeMiddleware:
    """Auto-inject tenant_id into all Beanie queries."""
    async def __call__(self, request, call_next):
        user = get_current_user(request)
        request.state.tenant_id = user.tenant_id
        response = await call_next(request)
        return response
```

#### 1.2 Evolucionar el Modelo de Tenant
Tu modelo `Tenant` ya tiene `rubro: RubroEmpresa` con `RETAIL`, `DARK_KITCHEN`, `SERVICIOS`. Esto es excelente. Lo que falta:

```python
class RubroEmpresa(str, Enum):
    RETAIL = "RETAIL"
    RESTAURANTE = "RESTAURANTE"      # NUEVO
    DARK_KITCHEN = "DARK_KITCHEN"
    CAFETERIA = "CAFETERIA"           # NUEVO
    SERVICIOS = "SERVICIOS"

# Módulos por rubro (configuración de onboarding)
MODULOS_POR_RUBRO = {
    "RETAIL": ["INVENTARIO", "POS", "KARDEX", "CAJA", "CREDITOS"],
    "RESTAURANTE": ["INVENTARIO", "POS", "CAJA", "RECETAS", "MESAS", "COCINA"],
    "DARK_KITCHEN": ["INVENTARIO", "RECETAS", "MEAL_PLANS", "PRODUCCION", "DESPACHO"],
    "CAFETERIA": ["INVENTARIO", "POS", "CAJA", "RECETAS"],
}
```

#### 1.3 Módulos Específicos para Restaurantes (Nuevos)

| Módulo | Descripción | Prioridad |
|--------|-------------|-----------|
| **MESAS** | Gestión de mesas, estado (libre/ocupada/reservada), asignación de pedidos | Alta |
| **COMANDAS** | Pantalla de cocina, pedidos en tiempo real, estados (pendiente/preparando/listo) | Alta |
| **CARTA_DIGITAL** | Menú digital con QR, categorías (Entradas, Platos, Bebidas, Postres) | Media |
| **RESERVAS** | Sistema de reservas por fecha/hora/mesa | Media |
| **DELIVERY** | Gestión de pedidos para llevar/delivery | Media |
| **PROPINAS** | Cálculo y distribución de propinas | Baja |

---

### Fase 2: Refactorización Arquitectónica (3-4 semanas)
> **Objetivo:** Que agregar nuevos módulos sea rápido y seguro.

#### 2.1 Completar la Clean Architecture
Extender el patrón Repository + UoW a TODOS los módulos (no solo producción):

```
Endpoint → Service → Repository Interface → Mongo Implementation
                 └→ UoW (para transacciones multi-documento)
```

**Orden de migración sugerido** (de mayor a menor impacto):
1. `sales_service.py` (51KB) → SaleRepository + SaleService
2. `reports.py` (64KB) → ReportService + split por tipo de reporte
3. `inventario.py` (29KB) → InventarioRepository + InventarioService
4. `caja.py` (19KB) → CajaRepository + CajaService
5. Resto de módulos

#### 2.2 Descomponer Componentes Frontend
- `CajaPage.tsx` (110KB) → `CajaSession/`, `CajaMovimientos/`, `CajaCierre/`, `CajaResumen/`
- `POSPage.tsx` (78KB) → `POSCart/`, `POSPayment/`, `POSSearch/`, `POSTicket/`
- `api.ts` (906 líneas) → `api/auth.ts`, `api/sales.ts`, `api/inventory.ts`, etc.

#### 2.3 Implementar Lazy Loading
```tsx
const POSPage = lazy(() => import('./pages/POSPage'));
const CajaPage = lazy(() => import('./pages/CajaPage'));
// ... reducir bundle inicial en ~60%
```

---

### Fase 3: Calidad y DevOps (2-3 semanas)
> **Objetivo:** Que los deploys sean seguros y automáticos.

- [ ] **Tests unitarios** para los servicios críticos (ventas, inventario, caja)
- [ ] **Tests de integración** para los endpoints principales
- [ ] **Tests E2E** con Playwright para flujos críticos (login → venta → cierre de caja)
- [ ] **CD Pipeline** → GitHub Actions auto-deploy a Render en merge a `main`
- [ ] **Staging environment** → `staging.pegasus-nexus.com` con `sales_system_staging`
- [ ] **Logging estructurado** → Reemplazar `print()` con `structlog` o `loguru`
- [ ] **Monitoreo** → Sentry para errores, métricas básicas de uptime

---

## 🛠️ Cómo Usar Agentes/MCP/CLI para Acelerar Todo Esto

### Lo que ya tienes configurado (y está bien):
- ✅ **Workflows de agente** en `.agents/workflows/` (Git, CI, Clean Architecture)
- ✅ **GitHub Actions CI** básico

### Lo que deberías agregar:

#### 1. **AGENTS.md** — Reglas globales para el agente
Crear un `AGENTS.md` en `.agents/` que yo lea automáticamente en cada conversación:

```markdown
# Reglas del Proyecto Pegasus SalesSystem

## Arquitectura
- SIEMPRE usar el patrón Repository para acceso a datos
- NUNCA importar Beanie directamente en endpoints o services
- SIEMPRE filtrar por tenant_id en toda query

## Código
- Backend en Python 3.11+, usar `datetime.now(UTC)` en vez de `datetime.utcnow()`
- Frontend en TypeScript estricto, NO usar `any`
- Archivos máximo 500 líneas — si excede, refactorizar

## Testing
- Todo nuevo endpoint DEBE tener al menos un test de integración
- Todo nuevo service DEBE tener tests unitarios
```

#### 2. **Skills** — Tareas repetitivas automatizadas
Crear skills en `.agents/skills/` para operaciones comunes:

```
.agents/skills/
├── new-module/
│   └── SKILL.md          # "Crear nuevo módulo completo (model → repo → service → endpoint → test)"
├── db-check/
│   └── SKILL.md          # "Verificar salud de la base de datos de producción"
├── deploy-check/
│   └── SKILL.md          # "Verificar que Render y Vercel estén funcionando"
└── tenant-onboard/
    └── SKILL.md          # "Crear nuevo tenant con usuario admin y datos de prueba"
```

#### 3. **MCP (Model Context Protocol)**
MCP te permite conectar herramientas externas directamente al agente. Las más útiles para ti serían:

| MCP Server | Para qué | Beneficio |
|------------|----------|-----------|
| **MongoDB MCP** | Consultar/modificar la BD directamente desde el chat | No más scripts `check_*.py` sueltos |
| **Sentry MCP** | Ver errores de producción en tiempo real | Detectar bugs antes que tus usuarios |
| **GitHub MCP** | Crear PRs, revisar issues, manejar branches | Flujo de trabajo más ágil |
| **Vercel MCP** | Ver deploys, logs, y estado de la app | Monitoreo desde el chat |

#### 4. **CLI Personalizado** (Opcional pero potente)
Crear un CLI con `typer` para operaciones de DevOps:

```bash
python -m cli db:check          # Estado de la base de datos
python -m cli db:seed           # Poblar datos de prueba
python -m cli tenant:create     # Crear nuevo tenant
python -m cli deploy:status     # Estado de Render + Vercel
python -m cli test:run          # Correr tests con cobertura
```

---

## 🍽️ Roadmap Específico: Módulo Restaurante

### Modelos Nuevos Necesarios

```python
# Mesa
class Mesa(Document):
    tenant_id: str
    sucursal_id: str
    numero: int
    capacidad: int
    estado: EstadoMesa  # LIBRE, OCUPADA, RESERVADA, MANTENIMIENTO
    zona: Optional[str]  # "Terraza", "Interior", "VIP"

# Comanda (Orden de cocina)
class Comanda(Document):
    tenant_id: str
    sucursal_id: str
    mesa_id: Optional[str]
    mesero_id: str
    items: List[ComandaItem]
    estado: EstadoComanda  # PENDIENTE, EN_PREPARACION, LISTA, ENTREGADA
    tipo: TipoComanda  # PARA_MESA, PARA_LLEVAR, DELIVERY
    notas_cocina: Optional[str]
    created_at: datetime

# Reserva
class Reserva(Document):
    tenant_id: str
    sucursal_id: str
    mesa_id: str
    cliente_nombre: str
    cliente_telefono: str
    fecha_hora: datetime
    num_personas: int
    estado: EstadoReserva  # CONFIRMADA, CANCELADA, COMPLETADA
```

### Pantallas Nuevas Frontend

| Pantalla | Descripción | Rol que la usa |
|----------|-------------|----------------|
| **MapaMesas** | Vista visual del restaurante con mesas arrastrables | Mesero, Admin |
| **PantallaCocina** | Dashboard de comandas en tiempo real (estilo KDS) | Cocinero |
| **TomarPedido** | POS adaptado para restaurante (seleccionar mesa → agregar platos) | Mesero |
| **CartaDigital** | Menú con QR que el cliente escanea desde su teléfono | Cliente final |
| **Reservas** | Calendario de reservas por mesa y horario | Hostess, Admin |

---

## Open Questions

> [!IMPORTANT]
> ### Preguntas que necesito que me respondas para afinar el plan:

1. **¿Cuál es tu prioridad #1 ahora mismo?**
   - A) Estabilizar lo que hay (testing, DevOps, refactorización)
   - B) Lanzar el módulo de Restaurantes lo antes posible
   - C) Ambas en paralelo

2. **¿Tienes ya un cliente restaurante esperando?** Si sí, ¿qué tipo de restaurante? (casual, comida rápida, dark kitchen, cafetería)

3. **¿Render o Vercel?** Actualmente el backend está en ambos (Vercel serverless + Render web service). ¿Cuál quieres mantener como producción definitiva?

4. **¿Quieres que configure los MCP servers** (MongoDB, GitHub, Sentry) para que puedas consultarlos directamente desde aquí?

5. **¿Hay más desarrolladores trabajando contigo** o eres tú solo? Esto cambia la prioridad de documentación y onboarding.

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd backend && pytest tests/ -v --cov=app --cov-report=html

# Frontend
cd frontend && npx vitest run

# E2E (futuro)
cd frontend && npx playwright test
```

### Manual Verification
- Verificar login multi-tenant en `app.pegasus-nexus.com`
- Probar flujo completo: Login → POS → Venta → Cierre de Caja
- Verificar aislamiento de datos entre tenants
