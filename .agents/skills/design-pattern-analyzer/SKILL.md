---
name: design-pattern-analyzer
description: >-
  Analiza requerimientos y refactorizaciones en Pegasus SalesSystem para determinar qué patrón
  de diseño (Creacional, Estructural o de Comportamiento) amerita ser aplicado según Clean Architecture,
  SOLID y el principio YAGNI.
---

# Design Pattern Analyzer & Decision Engine

Este skill guía al agente y a los desarrolladores al momento de diseñar nuevas funciones o refactorizar código en Pegasus SalesSystem.

## 1. Árbol de Decisión Rápido (¿Amerita un Patrón?)

Pregúntate antes de escribir código:
1. **¿Existe variabilidad real o al menos dos variantes concretas?**
   - *NO:* Usa código directo, funciones simples o clases Pydantic. No apliques patrones por simple teoría (Principio YAGNI).
   - *SÍ:* Continúa al paso 2.

2. **¿En qué dimensión está el problema?**
   - **Creación de objetos:** Revisa sección [Patrones Creacionales](#patrones-creacionales).
   - **Estructura y relaciones entre clases:** Revisa sección [Patrones Estructurales](#patrones-estructurales).
   - **Comunicación y asignación de responsabilidades:** Revisa sección [Patrones de Comportamiento](#patrones-de-comportamiento).

---

## 2. Catálogo de Patrones y Cuándo Aplicarlos en Pegasus

### Patrones Creacionales
| Patrón | Cuándo SÍ usarlo en Pegasus | Ejemplo Real en el Código |
| :--- | :--- | :--- |
| **Factory Method** | Se requiere crear un objeto cuya clase concreta depende de configuración dinámica de un tenant. | Proveedores de WhatsApp (`GreenApiProvider`, `UltraMsgProvider`, `MockMessageProvider`). |
| **Abstract Factory** | Se requiere instanciar una familia coherente de múltiples servicios interdependientes según entorno o país. | Localización fiscal multi-país (Bolivia SIAT vs Perú SUNAT: Validador + Firmador + Emisor). |
| **Builder** | Construcción progresiva de objetos complejos con validaciones o cálculos intermedios. | Construcción de ventas multi-pago (Efectivo + QR + Crédito) o generadores de queries complejas de BI. |
| **Prototype** | Clonar instancias complejas evitando el costo de recrear desde cero. | Duplicación de recetas base o plantillas de planes de membresía. |
| **Singleton** | Recursos únicos compartidos a nivel de infraestructura global. | Pool de conexiones de base de datos (`MongoClient`), cliente Redis o motor de caching. |

### Patrones Estructurales
| Patrón | Cuándo SÍ usarlo en Pegasus | Ejemplo Real en el Código |
| :--- | :--- | :--- |
| **Adapter** | Integrar APIs de terceros o formatos legacy para adaptarlos a las interfaces del dominio. | Adaptar payloads de webhooks de pasarelas de pago o parsers de formatos bancarios externos. |
| **Bridge** | Separar una abstracción de alto nivel de su motor de renderizado o persistencia. | Reporte ejecutivo desacoplado del motor de exportación (PDF con ReportLab vs Excel con OpenPyXL). |
| **Composite** | Manejar estructuras recursivas o jerárquicas como si fueran un único objeto. | Productos compuestos / combos gastronómicos con ingredientes, sub-recetas y porciones anidadas. |
| **Decorator** | Agregar responsabilidades transversales sin modificar la clase original. | Decoradores de métricas de tiempo de ejecución, rate limiting por tenant o caché en memoria. |
| **Facade** | Ofrecer una interfaz unificada y simple sobre subsistemas enredados o complejos. | `CierreCajaFacade` que orquesta arqueo, auditoría contable, bloqueo de turnos y generación de PDFs. |
| **Proxy** | Controlar el acceso a un objeto costoso o restringido. | Acceso cacheado a configuraciones de tenant o control de rate limit antes de golpear la base de datos. |

### Patrones de Comportamiento
| Patrón | Cuándo SÍ usarlo en Pegasus | Ejemplo Real en el Código |
| :--- | :--- | :--- |
| **Strategy** | Algoritmos intercambiables en tiempo de ejecución para resolver un mismo cálculo. | Estrategias de valuación de inventario (FIFO, LIFO, Promedio Ponderado) o reglas de cálculo de comisiones. |
| **Observer / Pub-Sub** | Desacoplar efectos secundarios tras un evento principal. | Evento `SaleCompleted` $\rightarrow$ notifica a inventario (resta stock), finanzas (asiento) y WhatsApp sin acoplar el POS. |
| **State** | Un objeto altera su comportamiento drásticamente según su estado. | Estados de una Orden de Compra (`BORRADOR`, `APROBADA`, `EN_TRANSITO`, `RECIBIDA_PARCIAL`, `CERRADA`). |
| **Chain of Responsibility** | Secuencia de validaciones o filtros desacoplados donde cada eslabón puede aprobar o rechazar. | Pipeline de validación de cobro: 1) Saldo disponible $\rightarrow$ 2) Caja abierta $\rightarrow$ 3) Stock suficiente $\rightarrow$ 4) Permiso de rol. |
| **Command** | Encapsular operaciones para permitir deshacer (Undo), encolar o auditar. | Comandos reversibles de ajuste manual de inventario con reversa garantizada en Kardex. |
| **Template Method** | Algoritmo con esqueleto invariante pero pasos específicos personalizables por subclase. | Pipeline ETL de subida de archivos (Paso 1: Validar formato -> Paso 2: Parsear filas -> Paso 3: Guardar en lote). |

---

## 3. Protocolo de Implementación Obligatorio

1. **Ubicación:** 
   - Interfaces abstractas: en `backend/app/domain/` o interfaces de infraestructura.
   - Implementaciones concretas: en `backend/app/infrastructure/` o `backend/app/application/`.
   - Clientes de negocio: en `backend/app/application/services/`.
2. **Pruebas:** Cada patrón implementado debe incluir su test unitario en `backend/tests/test_<pattern_name>.py`.
3. **Límite de líneas:** Ningún archivo de patrón debe superar las 500 líneas (`AGENTS.md`).
