# Reporte Estratégico: Infraestructura, Costos y Monitoreo SaaS
**Proyecto:** Pegasus SalesSystem
**Objetivo:** Analizar la viabilidad económica del alojamiento, control de pruebas gratis y monitoreo de clientes para evitar pérdidas financieras.

---

## 1. La Gran Decisión de Servidores: Vercel vs. Render vs. Google Cloud

El problema de las "Conexiones a la Base de Datos" nace por cómo funciona **Vercel** (donde estamos hoy). Vercel usa "Serverless" (funciones sin servidor). Esto significa que cada vez que un cliente hace una venta, Vercel "prende" una máquina, abre una conexión a tu base de datos, guarda la venta, y "apaga" la máquina. Si hay 500 ventas a la vez, se abren 500 conexiones de golpe, saturando MongoDB.

### Comparativa:
| Plataforma | Ideal para... | Manejo de Conexiones a BD | Costo / Previsibilidad |
| :--- | :--- | :--- | :--- |
| **Vercel** | **Frontend (React)** | ❌ Malo (Serverless causa picos masivos). | ⚠️ Caro si el tráfico es alto. Cobran por ancho de banda y ejecuciones. |
| **Render / Railway** | **Backend (Python)** | ✅ Excelente (Mantiene 1 sola "tubería" gigante abierta siempre, llamada Connection Pooling). | ✅ Muy barato y predecible. Pagas un monto fijo al mes por el tamaño del servidor. |
| **Google Cloud / AWS**| Sistemas de +1 millón de usuarios | ✅ Excelente. | ❌ Muy complejo (requiere DevOps) y costos ocultos impredecibles. |

💡 **Mi Recomendación (Lo que debemos hacer):** 
**Arquitectura Híbrida.** Dejamos el Frontend (la interfaz visual) alojado en **Vercel** (porque son los reyes mundiales en eso y es súper rápido). Pero mudamos el Backend (Python/FastAPI) a **Render o Railway**. 
Al mover el Backend a Render, **el problema de las conexiones a base de datos desaparece automáticamente**, porque la máquina siempre estará encendida y agrupará el tráfico (Connection Pool nativo). Además, te costará una fracción del precio.

---

## 2. Gestión de Pruebas Gratis (Free Trials) y Rentabilidad

*"¿Qué pasa si salimos perdiendo?"*
Las pruebas gratis consumen espacio en tu base de datos y poder de procesamiento. Si mil personas se registran, suben 10,000 productos cada una y no pagan, perderás dinero en almacenamiento de MongoDB Atlas.

### ¿Cómo nos protegemos?
1. **Límites Duros en Pruebas Gratis (Hard Limits):** 
   Durante el "Free Trial", el sistema debe estar limitado por código a:
   - Máximo 1 sucursal.
   - Máximo 2 usuarios (Cajero y Admin).
   - Máximo 100 o 200 productos.
   - Máximo 1000 transacciones mensuales.
   *Si el cliente quiere subir un Excel con 5000 productos, el sistema le pedirá que pague.*
2. **Limpieza Automática (Soft-Delete):** 
   Si una cuenta expira y pasan 30 días sin pago, un proceso automático debe ocultar o "archivar" sus productos e imágenes para liberar espacio (especialmente las fotos que consumen almacenamiento en Cloudinary).

---

## 3. El Panel de Monitoreo "Súper Admin" (El Ojo del SaaS)

Actualmente, no sabemos qué cliente consume más. Para administrar este SaaS de manera profesional, necesitamos construir un **Panel de Control Súper Admin** (invisible para los clientes, solo accesible para ti).

**¿Qué debe tener este panel?**
* **Tabla de Consumo por Tenant (Empresa):**
  - Nombre de Empresa.
  - Almacenamiento usado (MB en imágenes de productos).
  - Cantidad de Ventas este mes.
  - Estado del Plan (Trial, Activo, Moroso).
* **Alerta de Clientes Peligrosos:** 
  Un sistema de semáforo. Si el "Cliente X" está haciendo 10,000 llamadas a la API por hora, se marca en rojo. A estos clientes "pesados" es a los que hay que contactar para cobrarles un plan Enterprise superior.
* **Métricas de MRR (Ingreso Recurrente Mensual):** 
  Saber cuánto dinero está entrando fijo cada mes versus tus costos de MongoDB + Render.

## Conclusión y Siguientes Pasos
**Sí puedo programar todo esto.** 

Si estás de acuerdo con la visión del negocio, nuestro plan de acción en el futuro sería:
1. Crear el Panel Súper Admin para que tengas control total de quién usa qué.
2. Aplicar los "Límites Duros" a los planes gratis.
3. Migrar el Backend a una plataforma como Render para abaratar costos y arreglar el problema de conexiones masivas de manera nativa.
4. Implementar los Subdominios (`cliente.pegasus-nexus.com`) para su lanzamiento.
