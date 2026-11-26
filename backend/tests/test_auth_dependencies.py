"""
Ninguna ruta debe depender directamente de get_current_user: esa dependencia
solo valida el token y se salta usuario inactivo, prueba vencida (402) y la
restricción de cuentas de catálogo. Las rutas deben usar
get_current_active_user o require_roles(...), que se apoyan en ella.

Test de lógica pura: inspecciona el árbol de dependencias, no requiere MongoDB.
"""

import re

from fastapi.routing import APIRoute

from app.infrastructure.auth import get_current_active_user, get_current_user
from app.main import app


def _direct_dependencies(route: APIRoute):
    return [dep.call for dep in route.dependant.dependencies]


def test_no_route_depends_directly_on_get_current_user():
    offenders = [
        f"{','.join(sorted(route.methods))} {route.path}"
        for route in app.routes
        if isinstance(route, APIRoute) and get_current_user in _direct_dependencies(route)
    ]
    assert offenders == [], (
        "Usa get_current_active_user o require_roles en lugar de get_current_user: "
        + "; ".join(offenders)
    )


# Chequeos de salud públicos a propósito (monitoreo); no devuelven datos de negocio.
PUBLIC_BI_ROUTES = {"/api/v1/bi/health"}


def test_bi_routes_require_active_user():
    bi_routes = [
        route
        for route in app.routes
        if isinstance(route, APIRoute)
        and route.path.startswith("/api/v1/bi")
        and route.path not in PUBLIC_BI_ROUTES
    ]
    assert bi_routes, "No se encontraron rutas BI registradas"
    for route in bi_routes:
        calls = _direct_dependencies(route)
        nested = [d.call for dep in route.dependant.dependencies for d in dep.dependencies]
        assert get_current_active_user in calls + nested, route.path


def test_escaped_username_regex_does_not_match_other_users():
    # Un nombre con metacaracteres no debe coincidir con otros usuarios
    pattern = re.compile(f"^{re.escape('admin.*')}$", re.IGNORECASE)
    assert pattern.match("admin.*")
    assert not pattern.match("admin_sucursal")
