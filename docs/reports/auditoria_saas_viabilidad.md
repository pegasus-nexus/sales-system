# Estudio de Viabilidad SaaS: Pegasus SalesSystem
**Fecha de Auditoría:** Octubre 2026
**Objetivo:** Evaluar la preparación técnica del sistema para ser comercializado como un Software as a Service (SaaS) a múltiples empresas.

---

## 1. Capacidad y Escalabilidad (Usuarios y Ventas a la vez)
* **Estado Actual:** El sistema está alojado en **Vercel** (Serverless) y **MongoDB Atlas**. Esta arquitectura Serverless le permite auto-escalar casi infinitamente ante picos de tráfico.
* **El Cuello de Botella:** Al ser Serverless, cada petición puede abrir una nueva conexión a la base de datos. MongoDB Atlas tiene límites de conexiones concurrentes (500 en planes gratuitos/bajos, 1500 en medios). Si entran muchos usuarios de golpe, la base de datos colapsará por "falta de conexiones" (*Connection Pool Exhaustion*).
* **¿Qué debemos hacer?** Implementar un "Connection Pooler" (Proxy de conexiones) y agregar "Rate Limiting" (Límites de peticiones por segundo) en las rutas de ventas e inventarios para evitar ataques o saturación.

## 2. Alojamiento de Páginas Web (Catálogos Públicos)
* **Estado Actual:** Actualmente, todos los usuarios inician sesión en la misma plataforma compartida (ej. `app.pegasus-nexus.com`). El catálogo público web está alojado externamente (Next.js) y está **rígidamente conectado a la empresa principal (Chocolates Taboada)**.
* **¿Qué debemos hacer?** 
  - No podemos alojar webs estáticas dentro del SaaS actual de manera mágica. 
  - Se debe implementar un sistema de **Subdominios Dinámicos** (ej. `miempresa.pegasus-nexus.com`) usando el *Edge Routing* de Vercel para que el sistema sepa qué catálogo mostrar dependiendo de la URL que visite el cliente final.

## 3. Tipos de Moneda (Divisas)
* **Estado Actual: ❌ Nulo.** El sistema asume que todo el mundo opera en Bolivianos (Bs.). Las siglas "Bs." están escritas directamente en el código del Punto de Venta, Catálogos, e Impresión de Tickets. El backend no guarda el tipo de moneda en las ventas ni soporta tasas de cambio.
* **¿Qué debemos hacer?** 
  - Agregar el campo `moneda` (ej. USD, BOB, MXN) a la configuración de la Empresa (Tenant).
  - Quitar todos los "Bs." del frontend y reemplazarlos por una función inteligente que formatee el precio según la moneda de la empresa.

## 4. Catálogo e Inventarios (Matriz vs Sucursales)
* **Inventario en Matriz:** ✅ **Sí está soportado.** El código ya está diseñado para que la matriz tenga su propio almacén físico (reconocido en código como `sucursal_id = "CENTRAL"`).
* **Catálogo Independiente por Sucursal:** ❌ **No está soportado.** Actualmente, el catálogo de productos es "Global" para toda la empresa. Todas las sucursales ven los mismos productos (aunque pueden tener precios diferentes). Una sucursal **no puede** crear productos que la matriz no vea. 
* **¿Qué debemos hacer?** Modificar el modelo de `Product` para incluir una lista de `sucursales_permitidas`. Si está vacío, es global; si tiene IDs, solo esas sucursales verán el producto.

## 5. Nichos Preparados
Al analizar el modelo de datos (en `tenant.py`), el sistema ya tiene las estructuras base para venderse en los siguientes rubros:
1. **Retail** (Comercio minorista genérico).
2. **Restaurante** (Gastronomía estándar).
3. **Dark Kitchen** (Cocinas ocultas, ya tiene integraciones de recetas y planes de comida).
4. **Cafetería**.
5. **Servicios** (Productos sin inventario físico).

## 6. Periodos de Prueba (Trials) y Restricción de Acceso
* **Bloqueo Actual:** ✅ Sí existe. Hay un componente llamado `SoftLockBlocker` que "bloquea" la pantalla con un modal gigante cuando la fecha del día supera la fecha de `plan_expires_at`.
* **Alertas Previas:** ❌ **No existen.** El cliente se queda bloqueado de golpe. 
* **Control de Planes:** ❌ Los límites de los planes (ej. máximo 3 sucursales en el plan básico) están definidos pero **no se respetan en el backend** (un cliente podría crear 10 sucursales sin que el sistema lo detenga).
* **¿Qué debemos hacer?** Programar un "Banner de Alerta" amarillo en la parte superior que diga *"Tu prueba termina en X días"*, y reforzar los bloqueos en el servidor para que respeten el límite de los planes.

---

## 🚨 7. ALERTAS CRÍTICAS (FUGAS DE DATOS)
El código fue construido pensando únicamente en *Chocolates Taboada* y tiene fallos graves si metes a otro cliente hoy:
1. **Configuración Web cruzada:** Si la empresa "Zapatos XYZ" edita el diseño de su página web, el código por error **reescribe la página de Chocolates Taboada**.
2. **Fuga de Reportes:** Si un cajero entra sin empresa asignada, el sistema automáticamente le muestra los reportes financieros de Taboada.
3. **Importación de Ventas Excel:** Si dos empresas importan ventas con el mismo número de ticket (ej. Ticket #001), el sistema de una empresa sobrescribirá las ventas de la otra.

**ESTO DEBE ARREGLARSE ANTES DE VENDER LA PRIMERA SUSCRIPCIÓN.**
