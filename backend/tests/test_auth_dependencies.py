"""
Ninguna ruta debe depender directamente de get_current_user: esa dependencia
solo valida el token y se salta usuario inactivo, prueba vencida (402) y la
restricción de cuentas de catálogo. Las rutas deben usar
get_current_active_user o require_roles(...), que se apoyan en ella.

Inspecciona el router de cada módulo de endpoints directamente, para no
depender de cómo cada versión de FastAPI arma app.routes. No requiere MongoDB.
"""

import importlib
import pkgutil
import re

from fastapi.routing import APIRoute

import app.api.v1.endpoints as endpoints_pkg
from app.infrastructure.auth import get_current_active_user, get_current_user

# Chequeos de salud públicos a propósito (monitoreo); no devuelven datos de negocio.
PUBLIC_ROUTES = {("bi", "/health")}


def _endpoint_routes():
    """(módulo, ruta) de cada APIRoute definida en app/api/v1/endpoints."""
    for info in pkgutil.iter_modules(endpoints_pkg.__path__):
        module = importlib.import_module(f"{endpoints_pkg.__name__}.{info.name}")
        router = getattr(module, "router", None)
        if router is None:
            continue
        for route in router.routes:
            if isinstance(route, APIRoute):
                yield info.name, route


def _all_dependency_calls(dependant):
    for dep in dependant.dependencies:
        yield dep.call
        yield from _all_dependency_calls(dep)


def test_endpoint_routes_are_discovered():
    assert len(list(_endpoint_routes())) > 50


def test_no_route_depends_directly_on_get_current_user():
    offenders = [
        f"{module}: {','.join(sorted(route.methods))} {route.path}"
        for module, route in _endpoint_routes()
        if get_current_user in [dep.call for dep in route.dependant.dependencies]
    ]
    assert offenders == [], (
        "Usa get_current_active_user o require_roles en lugar de get_current_user: "
        + "; ".join(offenders)
    )


def test_bi_routes_require_active_user():
    bi_routes = [
        (module, route)
        for module, route in _endpoint_routes()
        if module.startswith("bi") and (module, route.path) not in PUBLIC_ROUTES
    ]
    assert bi_routes, "No se encontraron rutas BI"
    for module, route in bi_routes:
        assert get_current_active_user in set(_all_dependency_calls(route.dependant)), (
            f"{module}: {route.path}"
        )


def test_escaped_username_regex_does_not_match_other_users():
    # Un nombre con metacaracteres no debe coincidir con otros usuarios
    pattern = re.compile(f"^{re.escape('admin.*')}$", re.IGNORECASE)
    assert pattern.match("admin.*")
    assert not pattern.match("admin_sucursal")
