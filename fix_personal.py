import sys

with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "r", encoding="utf-8") as f:
    content = f.read()

import re

pattern = r"# --- 4\. Personal Activo Hoy y sus Ventas ---.*?# Sort personal by sales\s*personal_activo\.sort\(key=lambda x: x\[\"ventas_hoy\"\], reverse=True\)"

new_logic = """# --- 4. Personal Activo Hoy y sus Ventas ---
    # Group by cashier for today's sales
    cajeros_agg = await Sale.get_motor_collection().aggregate([
        {"$match": ventas_hoy_match},
        {"$group": {"_id": "$cajero_id", "total_vendido": {"$sum": "$total"}, "count": {"$sum": 1}}}
    ]).to_list(None)
    
    sales_by_user = {str(c["_id"]): c for c in cajeros_agg if c["_id"]}

    # All users for this tenant
    all_users = await User.find({"tenant_id": current_user.tenant_id, "is_active": True}).to_list()
    personal_activo = []
    
    now_utc = datetime.now(timezone.utc)

    for user in all_users:
        uid = str(user.id)
        has_sales = uid in sales_by_user
        
        # Online status calculation (same as users.py)
        is_online = False
        if user.last_active_at:
            last_active = user.last_active_at
            if last_active.tzinfo is None:
                last_active = last_active.replace(tzinfo=timezone.utc)
            diff_seconds = (now_utc - last_active).total_seconds()
            if diff_seconds <= 180:
                is_online = True
        
        if is_online or has_sales:
            p_data = sales_by_user.get(uid, {"total_vendido": 0, "count": 0})
            personal_activo.append({
                "id": uid,
                "nombre": user.full_name or user.username,
                "ventas_hoy": float(str(p_data["total_vendido"])),
                "transacciones": int(str(p_data["count"])),
                "is_online": is_online
            })
    
    # Sort by online first, then by sales desc
    personal_activo.sort(key=lambda x: (x["is_online"], x["ventas_hoy"]), reverse=True)"""

new_content = re.sub(pattern, new_logic, content, flags=re.DOTALL)

if new_content != content:
    with open("backend/app/api/v1/endpoints/dashboard_matriz.py", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: Replaced personal_activo logic")
else:
    print("FAILED: Could not find regex match")
