import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal } from '../../api/types';
import { MovimientosStockTable } from './MovimientosStockTable';

interface Props {
    premios: PremioMomentosTaboada[];
    sucursal: Sucursal | undefined;
}

const STOCK_BAJO = 3;

/** Stock de premios de la sucursal del usuario (solo lectura). El surtido lo gestiona la matriz. */
export const StockSucursalView: React.FC<Props> = ({ premios, sucursal }) => {
    const sucursalId = sucursal?._id || sucursal?.id || '';

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    Stock de premios en {sucursal?.nombre || 'mi sucursal'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Solo lectura. Si un premio está bajo o agotado, solicita el surtido a la administración matriz.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                    {premios.map(p => {
                        const stock = p.stock_por_sucursal[sucursalId] || 0;
                        const bajo = stock <= STOCK_BAJO;
                        return (
                            <div
                                key={p._id || p.id || p.codigo}
                                className={`p-4 rounded-xl border ${
                                    stock === 0
                                        ? 'border-rose-200 bg-rose-50'
                                        : bajo
                                            ? 'border-amber-200 bg-amber-50'
                                            : 'border-gray-200 bg-white'
                                }`}
                            >
                                <p className="text-sm font-bold text-gray-900">{p.nombre}</p>
                                <p className="text-xs text-gray-500">
                                    {p.sellos_requeridos} sellos + Bs {p.copago_bs.toFixed(2)}
                                </p>
                                <p className="text-2xl font-black text-gray-900 mt-2">{stock}</p>
                                {bajo && (
                                    <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1 mt-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {stock === 0 ? 'Agotado: pedir surtido' : 'Stock bajo'}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {sucursalId && <MovimientosStockTable sucursalId={sucursalId} />}
        </div>
    );
};
