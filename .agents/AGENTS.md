# Reglas del Proyecto Pegasus SalesSystem

Este documento define las directrices y normas que todos los agentes de IA (incluyendo Antigravity) deben cumplir al proponer o realizar cambios en el código de Pegasus SalesSystem.

---

## 🏛️ Arquitectura y Patrones de Diseño

1. **Clean Architecture Estricta:**
   - La lógica de acceso a datos debe estar desacoplada mediante interfaces de Repositorios e implementaciones en MongoDB/Beanie.
   - **NUNCA** importar modelos de Beanie o Pymongo directamente en los endpoints de FastAPI (`app/api/*`) o en los servicios de negocio (`app/application/services/*`).
   - Los endpoints deben comunicarse únicamente con los **Servicios** de negocio.
   - Los servicios deben comunicarse únicamente con las abstracciones de los **Repositorios**.

2. **Aislamiento de Tenant (Multi-tenancy):**
   - **SIEMPRE** filtrar explícitamente por `tenant_id` en todas las consultas y escrituras a base de datos.
   - Toda lógica de mutación de datos debe garantizar que el `tenant_id` del usuario autenticado coincide con el `tenant_id` del recurso (aislamiento estricto a nivel de base de datos).

3. **Transacciones ACID y SOLID:**
   - Para operaciones que afecten a múltiples colecciones (por ejemplo: registrar una venta y restar stock del inventario), se debe implementar el patrón **Unit of Work (UoW)** para garantizar consistencia ACID mediante transacciones de MongoDB.
   - Respetar los principios SOLID en todo momento (responsabilidad única por archivo/clase).

---

## 🐍 Reglas del Backend (Python / FastAPI)

1. **Estilo y Estructura:**
   - Usar Python 3.11+ y tipado estricto (`typing`).
   - Evitar `datetime.utcnow()` ya que está obsoleto en Python 3.12+. Usar `datetime.now(timezone.utc)` (de `datetime` y `zoneinfo` o `datetime.now(UTC)`).
   - Tamaño máximo por archivo: **500 líneas**. Si un archivo excede este límite, se debe refactorizar y descomponer (ej. separar servicios gigantescos o endpoints).

2. **Administración de Scripts:**
   - Todos los scripts administrativos o de verificación de base de datos deben colocarse en `backend/scripts/` (subdirectorios `admin/`, `seed/`, `migrations/`, `debug/`).
   - Utilizar el ejecutor centralizado `python run_script.py [script_name]` para ejecutar cualquier script auxiliar.

---

## ⚛️ Reglas del Frontend (TypeScript / React)

1. **TypeScript Estricto:**
   - **PROHIBIDO** el uso de `any` en firmas de funciones, props de componentes o mapeos de API. Todo debe estar debidamente tipado con interfaces y enums de TypeScript.
   - Sincronizar las interfaces de TypeScript con los esquemas Pydantic del backend.

2. **Estructura de Componentes:**
   - Dividir componentes monolíticos en archivos modulares de tamaño reducido (< 500 líneas).
   - Separar la UI de la lógica de datos delegando las llamadas API a React Query y el estado global a Zustand.

3. **Carga Eficiente:**
   - Usar Lazy Loading (`lazy`, `Suspense`) para las rutas del frontend, con el fin de reducir el tamaño del bundle inicial.

---

## 🧪 Testing y Calidad de Código

1. **Backend Testing:**
   - Cada nuevo endpoint de API debe contar con al menos un test de integración (`pytest`).
   - Cada nueva función de servicio crítico debe contar con tests unitarios correspondientes.

2. **Formateo y Linting:**
   - Ejecutar `ruff check .` en el backend antes de dar por completado un cambio.
   - Ejecutar `npm run lint` en el frontend para validar que se cumplen las directrices de TypeScript y React Hooks.
