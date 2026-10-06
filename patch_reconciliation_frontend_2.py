import os

path = 'frontend/src/components/InventoryReconciliationView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target1 = '''                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-medium">(+) Ingresos a Inventario (Pedidos, Compras)</span>
                                    <span className="font-bold text-indigo-600">+{formatBs(report.ingresos_inventario_costo)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium flex items-center gap-1">(-) Mermas y Salidas Manuales <div title="MercaderA-a retirada sin cobrar"><Info size={14} className="opacity-50" /></div></span>
                                    <span className="font-bold">-{formatBs(report.salidas_mermas_costo)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium">(-) Costo de Ventas (SaliA3 por Caja)</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>'''

replacement1 = '''                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-medium">(+) Ingresos a Inventario (Pedidos, Compras)</span>
                                    <span className="font-bold text-indigo-600">+{formatBs(report.ingresos_inventario_costo)}</span>
                                </div>
                                {report.desglose_ingresos && Object.entries(report.desglose_ingresos).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs pl-4 text-gray-500">
                                        <span>• {k.replace('_', ' ')}</span>
                                        <span>{formatBs(v)}</span>
                                    </div>
                                ))}
                                <div className="text-right mt-1 mb-2">
                                    <Link to="/compras/historico" className="text-[10px] text-indigo-500 hover:underline font-bold uppercase block">Ir al Historial de Compras/Ingresos →</Link>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm text-red-600">
                                    <span className="font-medium flex items-center gap-1">(-) Mermas y Salidas Manuales <div title="MercaderA-a retirada sin cobrar"><Info size={14} className="opacity-50" /></div></span>
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
                                    <span className="font-medium">(-) Costo de Ventas (SaliA3 por Caja)</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>'''

data = data.replace(target1, replacement1)

target2 = '''                            <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-gray-200 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-bold">Ventas Netas</span>
                                    <span className="font-bold text-gray-900">{formatBs(report.ventas_netas)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-red-500">
                                    <span className="font-medium">(-) Costo de la MercaderA-a Vendida</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>'''

replacement2 = '''                            <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-gray-200 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 font-bold">Ventas Netas (Global)</span>
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
                                    <span className="font-medium">(-) Costo de la MercaderA-a Vendida</span>
                                    <span className="font-bold">-{formatBs(report.costo_ventas)}</span>
                                </div>'''

data = data.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Frontend React view patched.")
