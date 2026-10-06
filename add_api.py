import sys

with open("frontend/src/api/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

export_code = """
export async function exportInventarioExcel(): Promise<void> {
    const token = useAuthStore.getState().token;
    if (!token) throw new Error("No token");
    
    const response = await fetch(`${BASE_URL}/inventario/exportar-excel`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error("Error al exportar");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_Completo_${new Date().getTime()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
"""

if "exportInventarioExcel" not in content:
    content += export_code
    with open("frontend/src/api/api.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Added exportInventarioExcel to api.ts")
