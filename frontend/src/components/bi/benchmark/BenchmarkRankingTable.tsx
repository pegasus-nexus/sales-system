import React, { useState, useMemo } from 'react';
import { Store, ArrowUpDown } from 'lucide-react';
import type { StoreKey, RankingSortKey, StoreRankingItem } from './BenchmarkTypes';

interface BenchmarkRankingTableProps {
    formatValue: (val: number) => string;
    onSelectStore?: (storeKey: StoreKey) => void;
    sortKey?: RankingSortKey;
    onSortChange?: (key: RankingSortKey) => void;
}

export const BenchmarkRankingTable: React.FC<BenchmarkRankingTableProps> = ({
    formatValue,
    onSelectStore,
    sortKey: externalSortKey,
    onSortChange
}) => {
    const [internalSortKey, setInternalSortKey] = useState<RankingSortKey>('rendimiento');
    const sortKey = externalSortKey || internalSortKey;

    const handleSort = (key: RankingSortKey) => {
        if (onSortChange) onSortChange(key);
        else setInternalSortKey(key);
    };

    const storesData = useMemo<StoreRankingItem[]>(() => {
        return [
            {
                id: 'heroinas',
                nombre: 'Heroínas (Cochabamba)',
                ventaActual: 3843.00,
                p50Historico: 2850.00,
                variacionPct: 34.8,
                status: 'alto',
                statusEmoji: '🟢',
                opportunityText: 'Líder en volumen transaccional diario. Potenciar ventas cruzadas.'
            },
            {
                id: 'calacoto',
                nombre: 'Calacoto (La Paz)',
                ventaActual: 5169.00,
                p50Historico: 3680.00,
                variacionPct: 40.5,
                status: 'alto',
                statusEmoji: '🟢',
                opportunityText: 'Alto rendimiento. Blindar inventario estrella.'
            },
            {
                id: 'recoleta',
                nombre: 'Recoleta (Cochabamba)',
                ventaActual: 1920.00,
                p50Historico: 2340.00,
                variacionPct: -17.9,
                status: 'bajo',
                statusEmoji: '🟠',
                opportunityText: 'Bajo la mediana. Activar promociones relámpago.'
            }
        ];
    }, []);

    const sortedStores = useMemo(() => {
        const copy = [...storesData];
        if (sortKey === 'rendimiento') {
            return copy.sort((a, b) => b.variacionPct - a.variacionPct);
        } else if (sortKey === 'caida') {
            return copy.sort((a, b) => a.variacionPct - b.variacionPct);
        } else {
            return copy.sort((a, b) => a.ventaActual - b.ventaActual);
        }
    }, [storesData, sortKey]);

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <Store size={18} />
                        <span>Módulo 4: Ranking Comparativo de Sucursales</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Comparación de ventas y nivel de desviación vs mediana P50 histórica por tienda.
                    </p>
                </div>

                {/* Filtros de Ordenamiento */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                        onClick={() => handleSort('rendimiento')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                            sortKey === 'rendimiento' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ArrowUpDown size={12} /> Mejor Rendimiento
                    </button>
                    <button
                        onClick={() => handleSort('caida')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                            sortKey === 'caida' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Mayor Caída
                    </button>
                    <button
                        onClick={() => handleSort('oportunidad')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                            sortKey === 'oportunidad' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Oportunidad
                    </button>
                </div>
            </div>

            {/* Tabla de Ranking */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                            <th className="py-2.5 px-3">Sucursal</th>
                            <th className="py-2.5 px-3">Venta Actual</th>
                            <th className="py-2.5 px-3">Mediana P50</th>
                            <th className="py-2.5 px-3">Variación %</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3">Diagnóstico Táctico</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedStores.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onSelectStore && onSelectStore(item.id)}
                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                                    <span>{item.statusEmoji}</span>
                                    <span>{item.nombre}</span>
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                    {formatValue(item.ventaActual)}
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-500">
                                    {formatValue(item.p50Historico)}
                                </td>
                                <td className="py-3 px-3 font-mono font-bold">
                                    <span className={item.variacionPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                        {item.variacionPct >= 0 ? '+' : ''}{item.variacionPct}%
                                    </span>
                                </td>
                                <td className="py-3 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        item.status === 'alto'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : item.status === 'normal'
                                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs">
                                    {item.opportunityText}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
