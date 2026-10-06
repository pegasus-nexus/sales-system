import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

# We need to import Tenant
if "from app.domain.models.tenant import Tenant" not in content:
    content = content.replace("from app.domain.models.sucursal import Sucursal", "from app.domain.models.sucursal import Sucursal\nfrom app.domain.models.tenant import Tenant")

content = content.replace("async def get_dashboard_matriz(", "async def get_dashboard_matriz(")

# Fetch tenant settings for margins
margin_logic_inject = """
    # Get Tenant Settings for Margins
    tenant_obj = await Tenant.find_one({"name": current_user.tenant_id})
    margen_dist = 0.15
    if tenant_obj and hasattr(tenant_obj, "settings") and hasattr(tenant_obj.settings, "margen_distribuidor"):
        margen_dist = tenant_obj.settings.margen_distribuidor
    margen_cliente_pct = 1.0 - margen_dist

    # --- 1. Top Metrics (Ventas Hoy) ---
"""

content = content.replace("    # --- 1. Top Metrics (Ventas Hoy) ---", margin_logic_inject)

# Replace 0.15 and 0.85 with dynamic variables
content = content.replace("margen_distribuidor = round(total_mes * 0.15, 2)", "margen_distribuidor = round(total_mes * margen_dist, 2)")
content = content.replace("margen_cliente = round(total_mes * 0.85, 2)", "margen_cliente = round(total_mes * margen_cliente_pct, 2)")

content = content.replace("margen_distribuidor = round(total_dia * 0.15, 2)", "margen_distribuidor = round(total_dia * margen_dist, 2)")
content = content.replace("margen_cliente = round(total_dia * 0.85, 2)", "margen_cliente = round(total_dia * margen_cliente_pct, 2)")

# Now rewrite Personal Activo logic
old_personal_logic = """        pipeline_personal = [
            {"$match": ventas_hoy_match},
            {"$group": {
                "_id": "$cajero_id",
                "ventas_hoy": {"$sum": "$total"},
                "transacciones": {"$sum": 1}
            }}
        ]
        
        personal_agg = await Sale.aggregate(pipeline_personal).to_list()
        personal_activo = []
        for p in personal_agg:
            user = await User.get(p["_id"])
            personal_activo.append({
                "id": str(p["_id"]),
                "nombre": user.full_name if user else "Desconocido",
                "ventas_hoy": p["ventas_hoy"],
                "transacciones": p["transacciones"]
            })"""

new_personal_logic = """        # Personal Activo = Usuarios Online + Cajeros con ventas hoy
        pipeline_personal = [
            {"$match": ventas_hoy_match},
            {"$group": {
                "_id": "$cajero_id",
                "ventas_hoy": {"$sum": "$total"},
                "transacciones": {"$sum": 1}
            }}
        ]
        personal_agg = await Sale.aggregate(pipeline_personal).to_list()
        sales_by_user = {str(p["_id"]): p for p in personal_agg if p["_id"]}

        # All users for this tenant
        all_users = await User.find({"tenant_id": current_user.tenant_id, "is_active": True}).to_list()
        personal_activo = []
        now = datetime.now(timezone.utc)

        for user in all_users:
            uid = str(user.id)
            has_sales = uid in sales_by_user
            
            # Online status calculation (same as users.py)
            is_online = False
            if user.last_active_at:
                diff_seconds = (now - user.last_active_at).total_seconds()
                if diff_seconds <= 180:
                    is_online = True
            
            if is_online or has_sales:
                p_data = sales_by_user.get(uid, {"ventas_hoy": 0, "transacciones": 0})
                personal_activo.append({
                    "id": uid,
                    "nombre": user.full_name or user.username,
                    "ventas_hoy": p_data["ventas_hoy"],
                    "transacciones": p_data["transacciones"],
                    "is_online": is_online
                })
        
        # Sort by online first, then by sales desc
        personal_activo.sort(key=lambda x: (x["is_online"], x["ventas_hoy"]), reverse=True)"""

content = content.replace(old_personal_logic, new_personal_logic)

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated dashboard_matriz")
