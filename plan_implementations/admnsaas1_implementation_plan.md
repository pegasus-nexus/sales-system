# Profesionalizar Panel Admin SaaS

## Estado Actual

Tu panel SaaS ya tiene una base funcional:

| Página | Estado | Acceso STAFF |
|--------|--------|-------------|
| Dashboard SaaS (`/admin/dashboard`) | ✅ Funcional — métricas MRR, gráficos, alertas | ✅ Fijado hoy |
| Empresas y Módulos (`/admin/empresas`) | ✅ Completa — CRUD tenants, módulos, impersonation | ✅ OK |
| Facturación y Planes (`/admin/planes`) | ✅ Funcional — PlanBuilder, precios | ✅ OK |
| Salud del Sistema (`/admin/health`) | ✅ Funcional — audit logs globales | ✅ Fijado hoy |
| Equipo SaaS (`/admin/colaboradores`) | ✅ Funcional — CRUD staff | 🔒 Solo SUPERADMIN (correcto) |

**Sidebar actualizado hoy:** Ahora muestra las 5 opciones (Dashboard, Empresas, Planes, Salud, Equipo).

---

## Cambios Propuestos (Solo pulido, NO rompe nada)

### Componente 1: Dashboard SaaS — Métricas Reales + UI Premium

#### [MODIFY] [AdminDashboardPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/AdminDashboardPage.tsx)

El dashboard actual tiene datos **simulados** para el gráfico MRR (líneas 48-56). Mejoras:

1. **Reemplazar datos simulados con reales** — Calcular el MRR real basado en `plan_expires_at` y `precio_mensual` de cada tenant
2. **Agregar métricas faltantes:**
   - **Total usuarios activos** (suma de usuarios de todos los tenants)
   - **Espacio en disco real** (ya se trae de la API pero se muestra como "simulado")
   - **Último login** de cada tenant (para detectar churn silencioso)
3. **KPI Cards con tendencia** — Mostrar flechas ↑↓ comparando mes actual vs anterior
4. **Tabla resumen de empresas** — Quick-glance con columnas: Empresa, Plan, Estado, MRR, Usuarios, Último uso

> [!IMPORTANT]
> **No se rompe nada**: Solo se mejora la presentación del frontend. El endpoint `/tenants/admin/dashboard` ya existe y devuelve los datos.

---

### Componente 2: Empresas — Botón de Impersonation más visible

#### [MODIFY] [TenantsAdminPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/TenantsAdminPage.tsx)

- Agregar un **badge de "último acceso"** para cada tenant
- Mejorar el botón de **impersonate** para que sea más visible y tenga confirmación
- Agregar un filtro rápido por **estado** (activo/inactivo) y **plan**

---

### Componente 3: Colaboradores — Permisos granulares (futuro)

#### [MODIFY] [SaasCollaboratorsPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/SaasCollaboratorsPage.tsx)

El sistema actual crea colaboradores con acceso completo (excepto crear otros colaboradores). Por ahora esto es suficiente.

**Para una fase futura** se podría agregar:
- Checkboxes de permisos: "Ver empresas", "Editar planes", "Ver salud", "Impersonar"
- Pero esto requiere cambios en el backend y es mejor hacerlo cuando haya más colaboradores

---

### Componente 4: Salud del Sistema — Más Info

#### [MODIFY] [SystemHealthPage.tsx](file:///c:/Users/rodri/Desktop/sales-system/frontend/src/pages/SystemHealthPage.tsx)

- Agregar **indicadores de salud** visuales (API latency, DB status, último deploy)
- Mostrar **versión del backend** actual
- Mostrar **memoria usada** del backend (Render)

---

## Open Questions

> [!IMPORTANT]
> 1. **¿Qué prioridad le das a cada componente?** ¿Quieres que haga todo o solo algunos?
> 2. **¿Los datos de MRR en el gráfico deben ser reales o está bien simulado por ahora?** Hacerlos reales requiere agregar un campo `precio_mensual` a cada tenant y calcular el histórico.
> 3. **¿Necesitas que el SUPERADMIN_STAFF pueda impersonar tenants?** Actualmente ambos roles pueden, ¿eso está bien?
> 4. **¿Hay alguna vista que sientas que falta completamente?** (ej: Activity Log, Notificaciones, Configuración global)

## Verificación

- ✅ Los fixes de acceso STAFF ya están aplicados (Dashboard + Health)
- ✅ Sidebar expandido con las 5 opciones
- Se verificará con `npm run lint` y revisión visual después de cada cambio
