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

    // Datos simulados dinámicos por tienda
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

    // Ordenamiento según sortKey
    const sortedStores = useMemo(() => {
        const copy = [...storesData];
        if (sortKey === 'rendimiento') {
            return copy.sort((a, b) => b.variacionPct - a.variacionPct);
        } else if (sortKey === 'caida') {
            return copy.sort((a, b) => a.variacionPct - b.variacionPct);
        } else {
            // Oportunidad
            return copy.sort((a, b) => a.ventaActual - b.ventaActual);
        }
    }, [storesData, sortKey]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Store size={18} />
                    <span>Módulo 4: Ranking Comparativo de Sucursales</span>
                </div>

                {/* Filtros de Ordenamiento */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                        onClick={() => handleSort('rendimiento')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                            sortKey === 'rendimiento' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <ArrowUpDown size={12} /> Mejor Rendimiento
                    </button>
                    <button
                        onClick={() => handleSort('caida')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                            sortKey === 'caida' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Mayor Caída
                    </button>
                    <button
                        onClick={() => handleSort('oportunidad')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                            sortKey === 'oportunidad' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
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
                        <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                            <th className="py-2.5 px-3">Sucursal</th>
                            <th className="py-2.5 px-3">Venta Actual</th>
                            <th className="py-2.5 px-3">Mediana P50</th>
                            <th className="py-2.5 px-3">Variación %</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3">Diagnóstico Táctico</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {sortedStores.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onSelectStore && onSelectStore(item.id)}
                                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                                <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                                    <span>{item.statusEmoji}</span>
                                    <span>{item.nombre}</span>
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-slate-200">
                                    {formatValue(item.ventaActual)}
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-400">
                                    {formatValue(item.p50Historico)}
                                </td>
                                <td className="py-3 px-3 font-mono font-bold">
                                    <span className={item.variacionPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {item.variacionPct >= 0 ? '+' : ''}{item.variacionPct}%
                                    </span>
                                </td>
                                <td className="py-3 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        item.status === 'alto'
                                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                            : item.status === 'normal'
                                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs">
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
