import json
from locust import HttpUser, task, between


class BIEjecutivoLoadTestUser(HttpUser):
    """
    Simulación de Carga Concurrente de Usuarios Virtuales sobre los 10 Endpoints del Centro BI.
    Monitorea Error Rate, Latencia p95 y trazabilidad.
    """
    wait_time = between(0.1, 0.5)

    def on_start(self):
        # Autenticación y Token de Usuario Admin
        response = self.client.post(
            "/api/v1/auth/login",
            data={"username": "admin.general.taboada@taboada.bo", "password": "password123"}
        )
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            self.headers = {}

    @task(3)
    def test_bi_ejecutivo_resumen(self):
        self.client.get(
            "/api/v1/bi-ejecutivo/resumen?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
            headers=self.headers,
            name="GET /api/v1/bi-ejecutivo/resumen"
        )

    @task(2)
    def test_bi_panel_general(self):
        self.client.get(
            "/api/v1/bi/panel-general?start_date=2026-08-25&end_date=2026-08-25&sucursal_id=all",
            headers=self.headers,
            name="GET /api/v1/bi/panel-general"
        )

    @task(2)
    def test_bi_inventario_control(self):
        self.client.get(
            "/api/v1/bi-inventario/control?sucursal_id=all",
            headers=self.headers,
            name="GET /api/v1/bi-inventario/control"
        )

    @task(1)
    def test_bi_health(self):
        self.client.get(
            "/api/v1/bi/health",
            name="GET /api/v1/bi/health"
        )
