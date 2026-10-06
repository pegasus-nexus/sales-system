import os
import re

path = 'frontend/src/components/InventoryReconciliationView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target_iface = '''    desglose_ingresos?: Record<string, number>;
    desglose_salidas?: Record<string, number>;
}'''

replacement_iface = '''    desglose_ingresos?: Record<string, number>;
    desglose_salidas?: Record<string, number>;
    detalles_anomalias?: {
        id: string;
        tipo: string;
        producto: string;
        cantidad: number;
        costo: number;
        fecha: string;
        usuario_id: string;
    }[];
}'''

data = data.replace(target_iface, replacement_iface)

target_table = '''                    <div className="mt-8 text-center text-xs text-gray-400">
                        * El costo de ventas se calcula basándose en el "Costo Unitario" registrado en el Kárdex al momento exacto de la venta.<br/>
                        Generado el {new Date().toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}'''

replacement_table = '''                    {report.detalles_anomalias && report.detalles_anomalias.length > 0 && (
                        <div className="mt-8">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <AlertTriangle size={18} className="text-amber-500" /> Registro Detallado de Anomalías (Mermas, Ajustes y Salidas Manuales)
                            </h3>
                            <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">Tipo</th>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-right">Cantidad</th>
                                            <th className="px-4 py-3 text-right">Impacto (Bs)</th>
                                            <th className="px-4 py-3">Usuario / Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {report.detalles_anomalias.map(an => (
                                            <tr key={an.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-600">{new Date(an.fecha).toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className={\px-2 py-1 rounded text-[10px] font-bold \\}>
                                                        {an.tipo.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{an.producto}</td>
                                                <td className="px-4 py-3 text-right text-gray-700">{an.cantidad}</td>
                                                <td className={\px-4 py-3 text-right font-bold \\}>
                                                    {formatBs(Math.abs(an.costo))}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[150px]">{an.usuario_id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center text-xs text-gray-400">
                        * El costo de ventas se calcula basándose en el "Costo Unitario" registrado en el Kárdex al momento exacto de la venta.<br/>
                        Generado el {new Date().toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}'''

data = data.replace(target_table, replacement_table)

with open(path, 'w', encoding='utf-8') as f:
    f.write(data)

print("Frontend React view patched for anomaly table.")
