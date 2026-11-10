import React, { useState, useEffect } from 'react';
import { History, RefreshCcw, ArrowRight, PackagePlus, ArrowLeftRight } from 'lucide-react';
import type { MovimientoStockPremio } from '../../api/types';
import { getMomentosTaboadaMovimientosStock } from '../../api/api';

interface Props {
    sucursalId?: string;
}

export const MovimientosStockTable: React.FC<Props> = ({ sucursalId }) => {
    const [movimientos, setMovimientos] = useState<MovimientoStockPremio[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadMovs = async () => {
        try {
            setIsLoading(true);
            const res = await getMomentosTaboadaMovimientosStock(undefined, sucursalId);
            setMovimientos(res || []);
        } catch (err: unknown) {
            console.error('Error cargando movimientos de stock:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMovs();
    }, [sucursalId]);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-3">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-700" />
                    <h4 className="text-sm font-bold text-gray-900">
                        Auditoría de Surtidos & Traslados de Premios
                    </h4>
                </div>
                <button
                    onClick={loadMovs}
                    disabled={isLoading}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    title="Actualizar historial"
                >
                    <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {movimientos.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                    {isLoading ? 'Cargando movimientos...' : 'Aún no se han registrado surtidos ni traslados de premios.'}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                            <tr>
                                <th className="py-2.5 px-4">Fecha</th>
                                <th className="py-2.5 px-4">Tipo</th>
                                <th className="py-2.5 px-4">Premio</th>
                                <th className="py-2.5 px-4 text-center">Cantidad</th>
                                <th className="py-2.5 px-4">Origen / Destino</th>
                                <th className="py-2.5 px-4">Motivo</th>
                                <th className="py-2.5 px-4">Responsable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {movimientos.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50/50">
                                    <td className="py-2.5 px-4 text-gray-500 whitespace-nowrap">
                                        {new Date(m.fecha).toLocaleString('es-BO', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                    <td className="py-2.5 px-4">
                                        {m.tipo === 'SURTIDO_INGRESO' ? (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                                                <PackagePlus className="w-3 h-3 text-emerald-600" />
                                                Surtido
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                                                <ArrowLeftRight className="w-3 h-3 text-amber-600" />
                                                Traslado
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-4 font-bold text-gray-900">
                                        {m.premio_nombre}
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-black text-amber-900">
                                        +{m.cantidad}
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-700">
                                        {m.origen ? (
                                            <div className="flex items-center gap-1 text-[11px]">
                                                <span>{m.origen}</span>
                                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                                <span className="font-semibold text-gray-900">{m.destino}</span>
                                            </div>
                                        ) : (
                                            <span className="font-semibold text-gray-900">{m.destino}</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-500 text-[11px]">
                                        {m.motivo || 'Sin motivo'}
                                    </td>
                                    <td className="py-2.5 px-4 text-gray-600 font-medium">
                                        {m.usuario_nombre || 'Admin'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
export default MovimientosStockTable;
