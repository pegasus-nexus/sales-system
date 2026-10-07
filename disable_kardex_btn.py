import os

path = "frontend/src/pages/InventarioPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    data = f.read()

target = """                    {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MATRIZ' || user?.role === 'ADMIN') && (
                    <button
                        onClick={async () => {
                            if(confirm("Esto recalculara el Kardex matematicamente para alinear stock. Desea continuar?")) {
                                try {
                                    await corregirKardexProducto("ALL", selectedSucursal);
                                    toast.success("Kardex recalculado y alineado exitosamente");
                                    queryClient.invalidateQueries({ queryKey: ['inventario'] });
                                } catch (e: any) {
                                    toast.error("Error recalculando Kardex");
                                }
                            }
                        }}
                        className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all whitespace-nowrap h-8"
                        title="Corrige errores historicos de descuadre en Kardex"
                    >
                        <RefreshCcw size={16} />
                        Alinear Kardex
                    </button>
                    )}"""

data = data.replace(target, "")

with open(path, "w", encoding="utf-8") as f:
    f.write(data)
print("Disabled Alinear Kardex button")
