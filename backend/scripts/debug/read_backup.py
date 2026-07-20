import bson

BSON_PATH = r"c:\Users\rodri\Desktop\RespaldoSaaS\dump\salessystem\users.bson"
SUCURSALES_BSON = r"c:\Users\rodri\Desktop\RespaldoSaaS\dump\salessystem\sucursales.bson"
TENANTS_BSON = r"c:\Users\rodri\Desktop\RespaldoSaaS\dump\salessystem\tenants.bson"

BROKEN_EMAILS = [
    "caja.matriz@gmail.com",
    "mariana.ramos@gmail.com",
    "shelly.fuentes@gmail.com",
    "admin@taboada.com",
    "facturador@taboada.com",
    "cateringmontalvo@gmail.com",
    "bdante29bol@outlook.es",
    "carolinabeltranmontalvo@gmail.com"
]

def main():
    try:
        # Load Sucursales
        with open(SUCURSALES_BSON, "rb") as f:
            sucursales_data = bson.decode_all(f.read())
        sucursal_map = {str(s["_id"]): s.get("nombre", s.get("name", "Unnamed")) for s in sucursales_data}
        
        # Load Tenants
        with open(TENANTS_BSON, "rb") as f:
            tenants_data = bson.decode_all(f.read())
        tenant_map = {str(t["_id"]): t.get("name", "Unnamed") for t in tenants_data}
        
        # Load Users
        with open(BSON_PATH, "rb") as f:
            data = f.read()
        
        backup_users = bson.decode_all(data)
        
        print("Data from Old Backup (RespaldoSaaS):")
        for u in backup_users:
            email = u.get("email")
            if email in BROKEN_EMAILS:
                tid = u.get("tenant_id")
                sid = u.get("sucursal_id")
                tname = tenant_map.get(str(tid), str(tid)) if tid else "None"
                sname = sucursal_map.get(str(sid), str(sid)) if sid else "None"
                print(f"- {email}:")
                print(f"    Tenant: {tname}")
                print(f"    Sucursal: {sname}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
