import re
with open('frontend/src/api/api.ts', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('export const createPurchaseReception = (data: any) => client<any>(')
if idx != -1:
    idx2 = c.find('\n', idx)
    c = c[:idx2+1] + '\nexport const getPurchaseReceptions = (sucursalId: string) => client<any[]>(`/compras/receptions/${sucursalId}`);\nexport const updateSaleDate = (saleId: string, nueva_fecha: string) => client<any>(`/ventas/${saleId}/fecha`, { method: \'PATCH\', body: { nueva_fecha: new Date(nueva_fecha).toISOString() } });\n'
    with open('frontend/src/api/api.ts', 'w', encoding='utf-8') as f:
        f.write(c)
