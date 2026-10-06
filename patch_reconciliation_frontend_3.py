import os
import re

path = 'frontend/src/components/InventoryReconciliationView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

# Pattern 1: Ingresos a Inventario ... (-) Costo de Ventas
pattern1 = re.compile(r'(\(\+\) Ingresos a Inventario.*?)<div className="flex justify-between items-center text-sm text-red-600">\s*<span className="font-medium flex items-center gap-1">\(\-\) Mermas y Salidas Manuales.*?</span>\s*<span className="font-bold">\-\{formatBs\(report\.salidas_mermas_costo\)\}</span>\s*</div>\s*<div className="flex justify-between items-center text-sm text-red-600">\s*<span className="font-medium">\(\-\) Costo de Ventas.*?</span>\s*<span className="font-bold">\-\{formatBs\(report\.costo_ventas\)\}</span>\s*</div>', re.DOTALL)

replacement1 = r'''\1
                                {report.desglose_ingresos && Object.entries(report.desglose_ingresos).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs pl-4 text-gray-500">
                                        <span>• {k.replace('_', ' ')}</span>
                                        <span>{formatBs(v)}</span>
                                    </div>
                                ))}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/compras" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase block">Ir al Historial de Compras/Ingresos →</Link>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium flex items-center gap-1">(-) Mermas y Salidas Manuales <div title="Mercadería retirada sin cobrar"><Info size={14} className="opacity-50" /></div></span>
                                    <span className="font-bold">-{formatBs(report.salidas_mermas_costo)}</span>
                                </div>
                                {report.desglose_salidas && Object.entries(report.desglose_salidas).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs pl-4 text-red-400/80">
                                        <span>• {k.replace('_', ' ')}</span>
                                        <span>{formatBs(v)}</span>
                                    </div>
                                ))}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/auditoria-inventario" className="text-[10px] text-red-500 hover:underline font-bold uppercase block">Auditar Mermas e Inventario →</Link>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium">(-) Costo de Ventas (Salió por Caja)</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>'''

data = pattern1.sub(replacement1, data)

pattern2 = re.compile(r'(<span className="text-gray-600 font-bold">Ventas Netas</span>\s*<span className="font-bold text-gray-900">\{formatBs\(report\.ventas_netas\)\}</span>\s*</div>)\s*<div className="flex justify-between items-center text-sm text-red-500">\s*<span className="font-medium">\(\-\) Costo de la.*?Vendida</span>\s*<span className="font-bold">\-\{formatBs\(report\.costo_ventas\)\}</span>\s*</div>', re.DOTALL)

replacement2 = r'''<span className="text-gray-600 font-bold">Ventas Netas (Global)</span>
                                    <span className="font-bold text-gray-900">{formatBs(report.ventas_netas)}</span>
                                </div>
                                {report.ventas_regulares !== undefined && (
                                    <>
                                        <div className="flex justify-between items-center text-xs pl-4 text-gray-500">
                                            <span>• Ventas a Precio Regular</span>
                                            <span>{formatBs(report.ventas_regulares)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pl-4 text-indigo-500 font-bold bg-indigo-50/50 rounded p-1">
                                            <span>• Ventas Fraccionadas / Promoción</span>
                                            <span>{formatBs(report.ventas_promocion)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/reportes?tab=daily" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase block">Ver Reporte de Ventas por Jornada →</Link>
                                </div>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <div className="flex justify-between items-center text-sm text-red-500">
                                    <span className="font-medium">(-) Costo de la Mercadería Vendida</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>'''

data = pattern2.sub(replacement2, data)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Frontend React view properly patched with regex.")
