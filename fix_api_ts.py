import sys

with open("frontend/src/api/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the updateSaleDate function URL
old_func = """export const updateSaleDate = (saleId: string, nueva_fecha: string) => client<any>(`/ventas/${saleId}/fecha`, { method: 'PATCH', body: { nueva_fecha: new Date(nueva_fecha).toISOString() } });"""
new_func = """export const updateSaleDate = (saleId: string, nueva_fecha: string) => client<any>(`/sales/${saleId}/fecha`, { method: 'PATCH', body: { nueva_fecha: new Date(nueva_fecha).toISOString() } });"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open("frontend/src/api/api.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Successfully updated api.ts")
else:
    print("Could not find the function in api.ts!")
