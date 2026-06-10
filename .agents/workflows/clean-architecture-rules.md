# Reglas de Arquitectura Limpia (Clean Architecture)

Este flujo de trabajo define las reglas **ESTRICTAS** para la creación de nuevos módulos o la refactorización de servicios existentes en el proyecto Pegaso SalesSystem. El objetivo principal es mantener el código desacoplado de la base de datos (MongoDB/PostgreSQL) para permitir alta escalabilidad y pruebas automatizadas (Testing).

## 1. Prohibido el Acceso Directo a Base de Datos en Servicios
**REGLA DE ORO:** Ningún archivo dentro de `app/application/services/` puede importar o usar métodos del ODM/ORM directamente (ej. `Model.find()`, `model.insert()`, `session.start_transaction()`).

- **INCORRECTO:** `await Cliente.find(...)`
- **CORRECTO:** `await self.cliente_repo.get_by_tenant(...)`

## 2. Uso Estricto del Patrón Repositorio
Todo acceso a datos debe hacerse a través de un Repositorio.
1. **Paso 1 (Interfaz):** Define una interfaz abstracta en `app/domain/repositories/` heredando de `BaseRepository`.
2. **Paso 2 (Implementación):** Crea la implementación concreta en `app/infrastructure/repositories/` heredando de `MongoBaseRepository` (o la tecnología actual) y de tu Interfaz.
3. **Paso 3 (Inyección):** Registra tu repositorio en `app/dependencies.py`.

## 3. Manejo de Transacciones con Unit of Work (UoW)
Si tu caso de uso modifica más de un documento o tabla (ej. Crear una venta y descontar inventario), **DEBES** usar la Unidad de Trabajo (`BaseUnitOfWork`).

```python
# CORRECTO
async with self.uow:
    await self.venta_repo.add(venta, session=self.uow.session)
    await self.inventario_repo.update(inv, session=self.uow.session)
# El commit o rollback es automático al salir del bloque 'async with'.
```

## 4. Inyección de Dependencias en Endpoints
Los endpoints de FastAPI en `app/api/v1/endpoints/` NUNCA deben instanciar servicios manualmente ni llamar a métodos estáticos de los servicios.
Deben usar el motor de inyección de FastAPI (`Depends`).

```python
# INCORRECTO
@router.post("/")
async def crear(data: DTO):
    return await MiServicio.crear_algo(data)

# CORRECTO
from app.dependencies import get_mi_servicio

@router.post("/")
async def crear(data: DTO, service: MiServicio = Depends(get_mi_servicio)):
    return await service.crear_algo(data)
```

## 5. Instrucciones para la IA (System Prompt)
Si yo (la IA) voy a crear un nuevo módulo para ti, DEBES pedirme que lea este archivo antes o usar el comando `/clean-architecture-rules`. Al leer esto, yo sabré que debo:
1. Crear las interfaces del repositorio.
2. Crear la implementación en la capa de infraestructura.
3. Crear el servicio pidiendo los repositorios por el constructor `__init__`.
4. Inyectar las dependencias en `dependencies.py` y pasarlas al router.
