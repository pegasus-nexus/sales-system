---
name: new-module
description: Guía de generación automática para un nuevo módulo de negocio respetando Clean Architecture en Pegasus SalesSystem.
---

# Skill: Creación de Módulos Clean Architecture

Utiliza esta skill cuando el usuario te pida crear una nueva funcionalidad o módulo de negocio (como Mesas, Comandas, Reservas, etc.). Debes estructurar el código en las siguientes capas desacopladas:

## Estructura a Generar

1. **Modelo de Dominio (Entidad Beanie):**
   - Ruta: `backend/app/domain/models/nombre_modulo.py`
   - Debe heredar de `beanie.Document`.
   - **Obligatorio:** Incluir el campo `tenant_id: str` y asegurar que forme parte de las búsquedas.

2. **Interfaz de Repositorio:**
   - Ruta: `backend/app/domain/repositories/nombre_modulo.py`
   - Define los métodos abstractos necesarios (ej. `get_by_id`, `create`, `update`, `delete`, `list_by_tenant`).

3. **Implementación de Repositorio (MongoDB):**
   - Ruta: `backend/app/infrastructure/repositories/nombre_modulo.py`
   - Implementa la interfaz del repositorio utilizando Beanie/Motor.

4. **Servicio de Aplicación:**
   - Ruta: `backend/app/application/services/nombre_modulo_service.py`
   - Contiene la lógica de negocio pura. Se comunica únicamente con las interfaces de repositorio inyectadas.

5. **Router / Endpoints (FastAPI):**
   - Ruta: `backend/app/api/v1/endpoints/nombre_modulo.py`
   - Consume los servicios para procesar las solicitudes. Inyecta el `tenant_id` obtenido del token JWT.

6. **Test de Integración:**
   - Ruta: `backend/app/tests/api/test_nombre_modulo.py`
   - Mockea la base de datos o usa la base de datos de test y valida el funcionamiento del endpoint.
