import React, { useState, useMemo } from 'react';
import {
    Sparkles, Package, Target, RefreshCw, Info, Search
} from 'lucide-react';
import type { TopProductoItemBI } from '../../api/biApi';
import { BIMatrizBCGPlot } from './BIMatrizBCGPlot';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type QuadrantType = 'all' | 'star' | 'cow' | 'question' | 'dog';

export interface BCGProductItem extends TopProductoItemBI {
    quadrant: QuadrantType;
    quadrantLabel: string;
    quadrantEmoji: string;
    recommendation: string;
    actionColor: string;
}

interface BIMatrizBCGViewProps {
    products: TopProductoItemBI[];
    loading?: boolean;
}

export const BIMatrizBCGView: React.FC<BIMatrizBCGViewProps> = ({ products, loading }) => {
    const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Cálculo dinámico de Mediana para Ejes de Matriz BCG
    const bcgAnalysis = useMemo(() => {
        if (!products || products.length === 0) {
            return {
                medianUnits: 0,
                medianRevenue: 0,
                bcgProducts: [] as BCGProductItem[],
                stats: {
                    star: { count: 0, revenue: 0, units: 0, pct: 0 },
                    cow: { count: 0, revenue: 0, units: 0, pct: 0 },
                    question: { count: 0, revenue: 0, units: 0, pct: 0 },
                    dog: { count: 0, revenue: 0, units: 0, pct: 0 }
                },
                totalRevenue: 0
            };
        }

        const sortedUnits = [...products].map(p => p.unidades_vendidas).sort((a, b) => a - b);
        const sortedRevenue = [...products].map(p => p.ingresos_bs).sort((a, b) => a - b);

        const mid = Math.floor(products.length / 2);
        const medianUnits = products.length % 2 !== 0
            ? sortedUnits[mid]
            : (sortedUnits[mid - 1] + sortedUnits[mid]) / 2;

        const medianRevenue = products.length % 2 !== 0
            ? sortedRevenue[mid]
            : (sortedRevenue[mid - 1] + sortedRevenue[mid]) / 2;

        const totalRev = products.reduce((sum, p) => sum + p.ingresos_bs, 0);

        const stats = {
            star: { count: 0, revenue: 0, units: 0, pct: 0 },
            cow: { count: 0, revenue: 0, units: 0, pct: 0 },
            question: { count: 0, revenue: 0, units: 0, pct: 0 },
            dog: { count: 0, revenue: 0, units: 0, pct: 0 }
        };

        const bcgProducts: BCGProductItem[] = products.map(p => {
            const highVolume = p.unidades_vendidas >= medianUnits;
            const highRevenue = p.ingresos_bs >= medianRevenue;

            let quadrant: QuadrantType = 'dog';
            let quadrantLabel = 'Mascota / Perro';
            let quadrantEmoji = '🐕';
            let recommendation = 'Evaluar liquidación, sustitución o empaquetamiento comercial.';
            let actionColor = 'bg-slate-100 text-slate-700 border-slate-200';

            if (highVolume && highRevenue) {
                quadrant = 'star';
                quadrantLabel = 'Estrella';
                quadrantEmoji = '⭐';
                recommendation = 'Mantener inventario prioritario, destacar en promociones y blindar stock.';
                actionColor = 'bg-amber-100 text-amber-900 border-amber-300';
            } else if (highVolume && !highRevenue) {
                quadrant = 'cow';
                quadrantLabel = 'Vaca Lechera';
                quadrantEmoji = '🐄';
                recommendation = 'Generador de flujo continuo. Optimizar costos de distribución sin alterar precio.';
                actionColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
            } else if (!highVolume && highRevenue) {
                quadrant = 'question';
                quadrantLabel = 'Interrogante';
                quadrantEmoji = '❓';
                recommendation = 'Alto impacto unitario. Aplicar incentivos de prueba o combos de venta cruzada.';
                actionColor = 'bg-sky-100 text-sky-900 border-sky-300';
            }

            // Acumular estadísticas
            stats[quadrant].count += 1;
            stats[quadrant].revenue += p.ingresos_bs;
            stats[quadrant].units += p.unidades_vendidas;

            return {
                ...p,
                quadrant,
                quadrantLabel,
                quadrantEmoji,
                recommendation,
                actionColor
            };
        });

        if (totalRev > 0) {
            stats.star.pct = Number(((stats.star.revenue / totalRev) * 100).toFixed(1));
            stats.cow.pct = Number(((stats.cow.revenue / totalRev) * 100).toFixed(1));
            stats.question.pct = Number(((stats.question.revenue / totalRev) * 100).toFixed(1));
            stats.dog.pct = Number(((stats.dog.revenue / totalRev) * 100).toFixed(1));
        }

        return {
            medianUnits,
            medianRevenue,
            bcgProducts,
            stats,
            totalRevenue: totalRev
        };
    }, [products]);

    // Filtrado por cuadrante y por término de búsqueda
    const filteredProducts = useMemo(() => {
        return bcgAnalysis.bcgProducts.filter(p => {
            const matchesQuadrant = selectedQuadrant === 'all' || p.quadrant === selectedQuadrant;
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = !term || p.nombre.toLowerCase().includes(term) || p.categoria_nombre.toLowerCase().includes(term);
            return matchesQuadrant && matchesSearch;
        });
    }, [bcgAnalysis.bcgProducts, selectedQuadrant, searchTerm]);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
                <RefreshCw size={28} className="animate-spin text-amber-600 mx-auto" />
                <p className="text-xs font-black text-slate-700">Calculando Matriz BCG dinámicamente sobre {products.length} productos...</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-2">
                <Info size={32} className="text-amber-500 mx-auto" />
                <h3 className="text-base font-black text-slate-800">No hay ventas registradas para generar la Matriz BCG</h3>
                <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                    Selecciona un rango de fechas con transacciones activas o cambia la sucursal filtrada.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* TARJETAS RESUMEN DE LOS 4 CUADRANTES CON RECAUDACIÓN TOTAL */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/50 p-4 rounded-3xl border border-amber-200/80">
                <div className="flex items-center gap-2">
                    <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Matriz Boston Consulting Group
                    </span>
                    <span className="text-xs font-extrabold text-slate-700">
                        Base: <strong className="text-amber-900 font-black">{products.length} SKUs</strong> | Eje Volumen: <strong className="text-amber-900 font-black">{bcgAnalysis.medianUnits} un.</strong> | Eje Ingresos: <strong className="text-amber-900 font-black">{formatBs(bcgAnalysis.medianRevenue)}</strong>
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-2xl border border-amber-200/80 text-xs font-bold text-slate-800 shadow-2xs">
                    <Target size={15} className="text-amber-600" />
                    <span>Recaudación Analizada: <strong className="text-slate-900 font-black">{formatBs(bcgAnalysis.totalRevenue)}</strong></span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. ESTRELLAS ⭐ */}
                <div
                    onClick={() => setSelectedQuadrant(selectedQuadrant === 'star' ? 'all' : 'star')}
                    className={`cursor-pointer rounded-3xl p-5 border transition-all duration-200 shadow-xs ${
                        selectedQuadrant === 'star'
                            ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400'
                            : 'bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white border-amber-200 hover:border-amber-400 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                        <span className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                            ⭐ Estrellas
                        </span>
                        <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-lg">
                            {bcgAnalysis.stats.star.count} SKUs
                        </span>
                    </div>
                    <div className="my-3 space-y-1">
                        <div className="text-2xl font-black text-slate-900">{formatBs(bcgAnalysis.stats.star.revenue)}</div>
                        <div className="flex justify-between text-xs font-extrabold text-amber-800">
                            <span>{bcgAnalysis.stats.star.pct}% de facturación</span>
                            <span>{bcgAnalysis.stats.star.units} un.</span>
                        </div>
                    </div>
                    <p className="text-[11px] font-extrabold text-amber-900 bg-amber-100/80 p-2 rounded-xl border border-amber-200/80">
                        Alta Venta & Alto Ingreso. Blindar stock y potenciar visibilidad.
                    </p>
                </div>

                {/* 2. VACAS LECHERAS 🐄 */}
                <div
                    onClick={() => setSelectedQuadrant(selectedQuadrant === 'cow' ? 'all' : 'cow')}
                    className={`cursor-pointer rounded-3xl p-5 border transition-all duration-200 shadow-xs ${
                        selectedQuadrant === 'cow'
                            ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-400'
                            : 'bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white border-emerald-200 hover:border-emerald-400 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                        <span className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5">
                            🐄 Vacas Lecheras
                        </span>
                        <span className="text-xs font-extrabold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-lg">
                            {bcgAnalysis.stats.cow.count} SKUs
                        </span>
                    </div>
                    <div className="my-3 space-y-1">
                        <div className="text-2xl font-black text-slate-900">{formatBs(bcgAnalysis.stats.cow.revenue)}</div>
                        <div className="flex justify-between text-xs font-extrabold text-emerald-800">
                            <span>{bcgAnalysis.stats.cow.pct}% de facturación</span>
                            <span>{bcgAnalysis.stats.cow.units} un.</span>
                        </div>
                    </div>
                    <p className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100/80 p-2 rounded-xl border border-emerald-200/80">
                        Alta Venta & Ingreso Moderado. Flujo continuo y alta rotación.
                    </p>
                </div>

                {/* 3. INTERROGANTE ❓ */}
                <div
                    onClick={() => setSelectedQuadrant(selectedQuadrant === 'question' ? 'all' : 'question')}
                    className={`cursor-pointer rounded-3xl p-5 border transition-all duration-200 shadow-xs ${
                        selectedQuadrant === 'question'
                            ? 'bg-sky-100/90 border-sky-500 ring-2 ring-sky-400'
                            : 'bg-gradient-to-br from-sky-50/90 via-indigo-50/30 to-white border-sky-200 hover:border-sky-400 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                        <span className="text-xs font-black text-sky-950 uppercase flex items-center gap-1.5">
                            ❓ Interrogantes
                        </span>
                        <span className="text-xs font-extrabold bg-sky-200 text-sky-900 px-2 py-0.5 rounded-lg">
                            {bcgAnalysis.stats.question.count} SKUs
                        </span>
                    </div>
                    <div className="my-3 space-y-1">
                        <div className="text-2xl font-black text-slate-900">{formatBs(bcgAnalysis.stats.question.revenue)}</div>
                        <div className="flex justify-between text-xs font-extrabold text-sky-800">
                            <span>{bcgAnalysis.stats.question.pct}% de facturación</span>
                            <span>{bcgAnalysis.stats.question.units} un.</span>
                        </div>
                    </div>
                    <p className="text-[11px] font-extrabold text-sky-900 bg-sky-100/80 p-2 rounded-xl border border-sky-200/80">
                        Baja Venta & Alto Ingreso Unitario. Estimular con campañas o combos.
                    </p>
                </div>

                {/* 4. PERROS 🐕 */}
                <div
                    onClick={() => setSelectedQuadrant(selectedQuadrant === 'dog' ? 'all' : 'dog')}
                    className={`cursor-pointer rounded-3xl p-5 border transition-all duration-200 shadow-xs ${
                        selectedQuadrant === 'dog'
                            ? 'bg-slate-200 border-slate-500 ring-2 ring-slate-400'
                            : 'bg-gradient-to-br from-slate-100/90 via-gray-50/40 to-white border-slate-200 hover:border-slate-400 hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                            🐕 Mascotas / Perros
                        </span>
                        <span className="text-xs font-extrabold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg">
                            {bcgAnalysis.stats.dog.count} SKUs
                        </span>
                    </div>
                    <div className="my-3 space-y-1">
                        <div className="text-2xl font-black text-slate-900">{formatBs(bcgAnalysis.stats.dog.revenue)}</div>
                        <div className="flex justify-between text-xs font-extrabold text-slate-600">
                            <span>{bcgAnalysis.stats.dog.pct}% de facturación</span>
                            <span>{bcgAnalysis.stats.dog.units} un.</span>
                        </div>
                    </div>
                    <p className="text-[11px] font-extrabold text-slate-700 bg-slate-100 p-2 rounded-xl border border-slate-200">
                        Baja Venta & Bajo Ingreso. Evaluar liquidación o descontinuación.
                    </p>
                </div>

            </div>

            {/* GRÁFICO DE DISPERSIÓN 2D CON EJES Y NODOS BURBUJA (FORMATO SOLICITADO) */}
            <BIMatrizBCGPlot
                products={bcgAnalysis.bcgProducts}
                medianUnits={bcgAnalysis.medianUnits}
                medianRevenue={bcgAnalysis.medianRevenue}
                onSelectProduct={(prod) => setSearchTerm(prod.nombre)}
            />

            {/* CUADRANTE VISUAL BCG 2X2 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Sparkles size={18} className="text-amber-600" />
                            <span>Matriz Visual BCG 2x2 (Distribución por Cuadrantes)</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">
                            Eje Vertical: Recaudación acumulada (Corte: {formatBs(bcgAnalysis.medianRevenue)}) | Eje Horizontal: Volumen de ventas (Corte: {bcgAnalysis.medianUnits} un.)
                        </p>
                    </div>
                    {selectedQuadrant !== 'all' && (
                        <button
                            onClick={() => setSelectedQuadrant('all')}
                            className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-2xl border border-amber-200/80 transition-all"
                        >
                            Ver Todos los Cuadrantes
                        </button>
                    )}
                </div>

                {/* MATRIZ DE 2 FILAS X 2 COLUMNAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* CUADRANTE ALTO INGRESO / ALTO VOLUMEN (ESTRELLAS ⭐) */}
                    <div className="bg-amber-50/70 rounded-3xl p-5 border-2 border-amber-200/80 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-amber-200/80">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">⭐</span>
                                <div>
                                    <h4 className="text-sm font-black text-amber-950">ESTRELLAS (Stars)</h4>
                                    <span className="text-[10px] font-bold text-amber-700">Alto Volumen & Alto Ingreso</span>
                                </div>
                            </div>
                            <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-xl">
                                {bcgAnalysis.stats.star.count} Productos
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 text-xs font-bold">
                            {bcgAnalysis.bcgProducts.filter(p => p.quadrant === 'star').map(p => (
                                <div key={p.producto_id} className="bg-white p-2.5 rounded-2xl border border-amber-200/70 shadow-2xs flex justify-between items-center">
                                    <span className="text-slate-900 font-extrabold truncate max-w-[180px]">{p.nombre}</span>
                                    <div className="text-right shrink-0">
                                        <span className="block font-black text-amber-800">{formatBs(p.ingresos_bs)}</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold">{p.unidades_vendidas} un. ({p.participacion_pct}%)</span>
                                    </div>
                                </div>
                            ))}
                            {bcgAnalysis.stats.star.count === 0 && (
                                <p className="text-center py-4 text-slate-400 font-bold">Sin productos en este cuadrante</p>
                            )}
                        </div>
                    </div>

                    {/* CUADRANTE ALTO INGRESO / BAJO VOLUMEN (INTERROGANTE ❓) */}
                    <div className="bg-sky-50/70 rounded-3xl p-5 border-2 border-sky-200/80 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-sky-200/80">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">❓</span>
                                <div>
                                    <h4 className="text-sm font-black text-sky-950">INTERROGANTES (Question Marks)</h4>
                                    <span className="text-[10px] font-bold text-sky-700">Bajo Volumen & Alto Ingreso</span>
                                </div>
                            </div>
                            <span className="text-xs font-black text-sky-900 bg-sky-200/80 px-2.5 py-1 rounded-xl">
                                {bcgAnalysis.stats.question.count} Productos
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 text-xs font-bold">
                            {bcgAnalysis.bcgProducts.filter(p => p.quadrant === 'question').map(p => (
                                <div key={p.producto_id} className="bg-white p-2.5 rounded-2xl border border-sky-200/70 shadow-2xs flex justify-between items-center">
                                    <span className="text-slate-900 font-extrabold truncate max-w-[180px]">{p.nombre}</span>
                                    <div className="text-right shrink-0">
                                        <span className="block font-black text-sky-800">{formatBs(p.ingresos_bs)}</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold">{p.unidades_vendidas} un. ({p.participacion_pct}%)</span>
                                    </div>
                                </div>
                            ))}
                            {bcgAnalysis.stats.question.count === 0 && (
                                <p className="text-center py-4 text-slate-400 font-bold">Sin productos en este cuadrante</p>
                            )}
                        </div>
                    </div>

                    {/* CUADRANTE BAJO INGRESO / ALTO VOLUMEN (VACAS LECHERAS 🐄) */}
                    <div className="bg-emerald-50/70 rounded-3xl p-5 border-2 border-emerald-200/80 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-emerald-200/80">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🐄</span>
                                <div>
                                    <h4 className="text-sm font-black text-emerald-950">VACAS LECHERAS (Cash Cows)</h4>
                                    <span className="text-[10px] font-bold text-emerald-700">Alto Volumen & Ingreso Moderado</span>
                                </div>
                            </div>
                            <span className="text-xs font-black text-emerald-900 bg-emerald-200/80 px-2.5 py-1 rounded-xl">
                                {bcgAnalysis.stats.cow.count} Productos
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 text-xs font-bold">
                            {bcgAnalysis.bcgProducts.filter(p => p.quadrant === 'cow').map(p => (
                                <div key={p.producto_id} className="bg-white p-2.5 rounded-2xl border border-emerald-200/70 shadow-2xs flex justify-between items-center">
                                    <span className="text-slate-900 font-extrabold truncate max-w-[180px]">{p.nombre}</span>
                                    <div className="text-right shrink-0">
                                        <span className="block font-black text-emerald-800">{formatBs(p.ingresos_bs)}</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold">{p.unidades_vendidas} un. ({p.participacion_pct}%)</span>
                                    </div>
                                </div>
                            ))}
                            {bcgAnalysis.stats.cow.count === 0 && (
                                <p className="text-center py-4 text-slate-400 font-bold">Sin productos en este cuadrante</p>
                            )}
                        </div>
                    </div>

                    {/* CUADRANTE BAJO INGRESO / BAJO VOLUMEN (MASCOTAS / PERROS 🐕) */}
                    <div className="bg-slate-100/70 rounded-3xl p-5 border-2 border-slate-300/80 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300/80">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🐕</span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900">PERROS / MASCOTAS (Dogs)</h4>
                                    <span className="text-[10px] font-bold text-slate-500">Bajo Volumen & Bajo Ingreso</span>
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-800 bg-slate-300/80 px-2.5 py-1 rounded-xl">
                                {bcgAnalysis.stats.dog.count} Productos
                            </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 text-xs font-bold">
                            {bcgAnalysis.bcgProducts.filter(p => p.quadrant === 'dog').map(p => (
                                <div key={p.producto_id} className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex justify-between items-center">
                                    <span className="text-slate-900 font-extrabold truncate max-w-[180px]">{p.nombre}</span>
                                    <div className="text-right shrink-0">
                                        <span className="block font-black text-slate-700">{formatBs(p.ingresos_bs)}</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold">{p.unidades_vendidas} un. ({p.participacion_pct}%)</span>
                                    </div>
                                </div>
                            ))}
                            {bcgAnalysis.stats.dog.count === 0 && (
                                <p className="text-center py-4 text-slate-400 font-bold">Sin productos en este cuadrante</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* TABLA PRINCIPAL DE CLASIFICACIÓN DETALLADA MATRIZ BCG */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-xs space-y-4">
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <Package size={18} className="text-amber-600" />
                            <span>Detalle Completo de Productos & Recomendación Estratégica</span>
                        </h3>
                        <p className="text-xs text-slate-400 font-bold">Clasificación individual y acciones sugeridas para cada SKU</p>
                    </div>

                    {/* CONTROLES DE FILTRADO Y BUSCADOR */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        
                        {/* Selector de Cuadrante Pill */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-extrabold">
                            <button
                                onClick={() => setSelectedQuadrant('all')}
                                className={`px-3 py-1 rounded-xl transition-all ${selectedQuadrant === 'all' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Todos ({bcgAnalysis.bcgProducts.length})
                            </button>
                            <button
                                onClick={() => setSelectedQuadrant('star')}
                                className={`px-3 py-1 rounded-xl transition-all ${selectedQuadrant === 'star' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                ⭐ Estrellas ({bcgAnalysis.stats.star.count})
                            </button>
                            <button
                                onClick={() => setSelectedQuadrant('cow')}
                                className={`px-3 py-1 rounded-xl transition-all ${selectedQuadrant === 'cow' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                🐄 Vacas ({bcgAnalysis.stats.cow.count})
                            </button>
                            <button
                                onClick={() => setSelectedQuadrant('question')}
                                className={`px-3 py-1 rounded-xl transition-all ${selectedQuadrant === 'question' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                ❓ Interrogantes ({bcgAnalysis.stats.question.count})
                            </button>
                            <button
                                onClick={() => setSelectedQuadrant('dog')}
                                className={`px-3 py-1 rounded-xl transition-all ${selectedQuadrant === 'dog' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                🐕 Mascotas ({bcgAnalysis.stats.dog.count})
                            </button>
                        </div>

                        {/* Buscador Input */}
                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar en BCG..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                            />
                        </div>

                    </div>
                </div>

                {/* TABLA DE PRODUCTOS MATRIZ BCG */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                                <th className="py-3 px-3">Producto / Categoría</th>
                                <th className="py-3 px-3 text-center">Cuadrante BCG</th>
                                <th className="py-3 px-3 text-right">Unidades</th>
                                <th className="py-3 px-3 text-right">Precio Prom.</th>
                                <th className="py-3 px-3 text-right">Ingresos Totales</th>
                                <th className="py-3 px-3 text-center">Part. %</th>
                                <th className="py-3 px-3">Recomendación Estratégica IA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            {filteredProducts.map((p, idx) => (
                                <tr key={p.producto_id || idx} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="py-3.5 px-3">
                                        <div className="font-black text-slate-900 max-w-xs truncate">{p.nombre}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">{p.categoria_nombre}</div>
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-xl border ${p.actionColor}`}>
                                            <span>{p.quadrantEmoji}</span>
                                            <span>{p.quadrantLabel}</span>
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-right text-slate-900 font-extrabold">{p.unidades_vendidas} un.</td>
                                    <td className="py-3.5 px-3 text-right text-slate-500">{formatBs(p.precio_promedio_efectivo)}</td>
                                    <td className="py-3.5 px-3 text-right font-black text-slate-900">{formatBs(p.ingresos_bs)}</td>
                                    <td className="py-3.5 px-3 text-center font-black text-amber-700">{p.participacion_pct}%</td>
                                    <td className="py-3.5 px-3 max-w-sm text-[11px] text-slate-600 leading-relaxed font-semibold">
                                        {p.recommendation}
                                    </td>
                                </tr>
                            ))}

                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-slate-400 font-bold">
                                        No se encontraron productos que coincidan con la búsqueda o filtro activo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
};
