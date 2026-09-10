import React, { useState, useMemo } from 'react';
import {
    Sparkles, Star, Crown, HelpCircle, PackageX, Eye, EyeOff
} from 'lucide-react';
import type { BCGProductItem } from './BIMatrizBCGView';

const formatBs = (num?: number) =>
    `Bs. ${(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface BIMatrizBCGPlotProps {
    products: BCGProductItem[];
    medianUnits: number;
    medianRevenue: number;
    onSelectProduct?: (product: BCGProductItem) => void;
}

export const BIMatrizBCGPlot: React.FC<BIMatrizBCGPlotProps> = ({
    products,
    medianUnits,
    medianRevenue,
    onSelectProduct
}) => {
    const [hoveredProduct, setHoveredProduct] = useState<BCGProductItem | null>(null);
    const [showAllLabels, setShowAllLabels] = useState<boolean>(false);

    // Rango mínimo y máximo para escala de ejes con desvío sutil si los productos se solapan
    const plotData = useMemo(() => {
        if (!products || products.length === 0) {
            return { items: [], maxUnits: 10, maxRevenue: 100 };
        }

        const maxU = Math.max(...products.map(p => p.unidades_vendidas), medianUnits * 2, 1);
        const maxR = Math.max(...products.map(p => p.ingresos_bs), medianRevenue * 2, 1);

        // Agrupación para evitar solapamientos exactos (Jitter offset sutil)
        const coordCounts: Record<string, number> = {};

        const items = products.map((p, idx) => {
            let ratioX = maxU > 0 ? p.unidades_vendidas / maxU : 0.5;
            let ratioY = maxR > 0 ? p.ingresos_bs / maxR : 0.5;

            // Invertido: Mayor volumen a la izquierda (12% - 88%)
            let pctX = 88 - ratioX * 76;
            // Mayor recaudación arriba (12% - 88%)
            let pctY = 88 - ratioY * 76;

            // Clave de coordenadas redondeada
            const coordKey = `${Math.round(pctX / 5)}_${Math.round(pctY / 5)}`;
            const offsetCount = coordCounts[coordKey] || 0;
            coordCounts[coordKey] = offsetCount + 1;

            // Desplazamiento en espiral para productos muy cercanos
            if (offsetCount > 0) {
                const angle = offsetCount * (Math.PI / 3);
                const distance = offsetCount * 3.5;
                pctX = Math.max(8, Math.min(92, pctX + Math.cos(angle) * distance));
                pctY = Math.max(8, Math.min(92, pctY + Math.sin(angle) * distance));
            }

            // Tamaño del círculo proporcional a los ingresos (radio entre 16px y 40px)
            const maxRevItem = Math.max(...products.map(item => item.ingresos_bs), 1);
            const radiusRatio = Math.sqrt(p.ingresos_bs / maxRevItem);
            const radius = Math.max(16, Math.min(40, Math.round(16 + radiusRatio * 24)));

            return {
                ...p,
                pctX,
                pctY,
                radius,
                uniqueKey: `${p.producto_id}_${idx}`
            };
        });

        return { items, maxUnits: maxU, maxRevenue: maxR };
    }, [products, medianUnits, medianRevenue]);

    const renderQuadrantIcon = (quadrant: string, size: number = 16) => {
        switch (quadrant) {
            case 'star':
                return <Star size={size} className="text-amber-300 fill-amber-300 drop-shadow-xs" />;
            case 'cow':
                return <Crown size={size} className="text-emerald-200 fill-emerald-300 drop-shadow-xs" />;
            case 'question':
                return <HelpCircle size={size} className="text-sky-200 fill-sky-300 drop-shadow-xs" />;
            case 'dog':
            default:
                return <PackageX size={size} className="text-slate-200 fill-slate-300 drop-shadow-xs" />;
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 font-sans select-none">
            
            {/* CABECERA CON CONTROLES E ICONOS PROFESIONALES */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500" />
                        <span>Gráfico de Dispersión 2D — Matriz BCG de Productos</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                        Plano Cartesiano de Ventas: Eje Y (Recaudación) vs Eje X (Volumen de Unidades)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Botón Alternar Etiquetas Continuas */}
                    <button
                        onClick={() => setShowAllLabels(!showAllLabels)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                            showAllLabels
                                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {showAllLabels ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span>{showAllLabels ? 'Nombres Visibles' : 'Nombres al Pasar Cursor'}</span>
                    </button>

                    {/* Leyenda de Cuadrantes con Iconos Lucide */}
                    <div className="flex items-center gap-2 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-amber-900">
                            <Star size={12} className="text-amber-500 fill-amber-400" /> Estrellas
                        </span>
                        <span className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-emerald-900">
                            <Crown size={12} className="text-emerald-600 fill-emerald-500" /> Vacas
                        </span>
                        <span className="flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 text-sky-900">
                            <HelpCircle size={12} className="text-sky-600 fill-sky-500" /> Interrogantes
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                            <PackageX size={12} className="text-slate-500 fill-slate-400" /> Mascotas
                        </span>
                    </div>
                </div>
            </div>

            {/* LIENZO DE DISPERSIÓN DE ALTA RESOLUCIÓN VISUAL */}
            <div className="relative w-full h-[480px] bg-gradient-to-br from-[#fcfdfd] via-[#f8fafc] to-[#f1f5f9] rounded-3xl border border-slate-200 overflow-hidden shadow-inner p-4">
                
                {/* CUADRANTES DE FONDO CON COLORES PASTEL Y BORDES DIFUMINADOS */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    
                    {/* Top-Left: ESTRELLAS ⭐ */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-r border-b border-dashed border-teal-600/30 p-4 relative">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100/80 px-3 py-1 rounded-xl w-fit border border-amber-200 shadow-2xs">
                            <Star size={13} className="text-amber-600 fill-amber-500" />
                            <span>ESTRELLAS (Alta Venta / Alto Ingreso)</span>
                        </div>
                    </div>

                    {/* Top-Right: INTERROGANTES ❓ */}
                    <div className="bg-gradient-to-bl from-sky-500/10 via-indigo-500/5 to-transparent border-b border-dashed border-teal-600/30 p-4 relative flex justify-end">
                        <div className="flex items-center gap-1.5 text-xs font-black text-sky-900 bg-sky-100/80 px-3 py-1 rounded-xl w-fit border border-sky-200 shadow-2xs">
                            <HelpCircle size={13} className="text-sky-600 fill-sky-500" />
                            <span>INTERROGANTES (Bajo Volumen / Alto Ingreso)</span>
                        </div>
                    </div>

                    {/* Bottom-Left: VACAS LECHERAS 🐄 */}
                    <div className="bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border-r border-dashed border-teal-600/30 p-4 relative flex items-end">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-xl w-fit border border-emerald-200 shadow-2xs">
                            <Crown size={13} className="text-emerald-600 fill-emerald-500" />
                            <span>VACAS LECHERAS (Alto Volumen / Ingreso Moderado)</span>
                        </div>
                    </div>

                    {/* Bottom-Right: PERROS / MASCOTAS 🐕 */}
                    <div className="bg-gradient-to-tl from-slate-400/10 via-gray-400/5 to-transparent p-4 relative flex items-end justify-end">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 bg-slate-200/90 px-3 py-1 rounded-xl w-fit border border-slate-300 shadow-2xs">
                            <PackageX size={13} className="text-slate-600 fill-slate-500" />
                            <span>PERROS / MASCOTAS (Bajo Volumen / Bajo Ingreso)</span>
                        </div>
                    </div>

                </div>

                {/* EJES DE COORDENADAS CRUZADAS (TEAL ELEGANTE CON PUNTEROS) */}
                {/* Eje Y (Recaudación) */}
                <div className="absolute left-1/2 top-2 bottom-2 w-[2px] bg-teal-600/70 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-teal-700" />
                    <div className="absolute top-2 left-3 bg-white/95 backdrop-blur-xs text-teal-950 font-black text-[10px] px-2.5 py-1 rounded-xl border border-teal-300 shadow-xs whitespace-nowrap">
                        Corte Recaudación: {formatBs(medianRevenue)}
                    </div>
                </div>

                {/* Eje X (Volumen) */}
                <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-teal-600/70 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-teal-700" />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-teal-700" />
                    <div className="absolute right-3 top-3 bg-white/95 backdrop-blur-xs text-teal-950 font-black text-[10px] px-2.5 py-1 rounded-xl border border-teal-300 shadow-xs whitespace-nowrap">
                        Corte Volumen: {medianUnits} un.
                    </div>
                </div>

                {/* NODOS BURBUJA CON COLORES PASTEL PREMIUM & ICONOS LUCIDE */}
                {plotData.items.map((item) => {
                    const isHovered = hoveredProduct?.producto_id === item.producto_id;

                    let bubbleStyle = 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.35)]';
                    if (item.quadrant === 'cow') {
                        bubbleStyle = 'bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.35)]';
                    } else if (item.quadrant === 'question') {
                        bubbleStyle = 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 border-sky-600 shadow-[0_0_15px_rgba(56,189,248,0.35)]';
                    } else if (item.quadrant === 'dog') {
                        bubbleStyle = 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 border-slate-500 shadow-[0_0_12px_rgba(100,116,139,0.3)]';
                    }

                    return (
                        <div
                            key={item.uniqueKey}
                            style={{
                                left: `${item.pctX}%`,
                                top: `${100 - item.pctY}%`
                            }}
                            onMouseEnter={() => setHoveredProduct(item)}
                            onMouseLeave={() => setHoveredProduct(null)}
                            onClick={() => onSelectProduct && onSelectProduct(item)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-200 hover:scale-125 group"
                        >
                            {/* BURBUJA CON GLOW Y BORDE PREMIUM */}
                            <div
                                style={{
                                    width: `${item.radius * 2}px`,
                                    height: `${item.radius * 2}px`
                                }}
                                className={`rounded-full border-2 flex items-center justify-center transition-all ${bubbleStyle} ${
                                    isHovered ? 'scale-125 ring-4 ring-white shadow-2xl z-40' : ''
                                }`}
                            >
                                {renderQuadrantIcon(item.quadrant, Math.max(12, Math.round(item.radius * 0.75)))}
                            </div>

                            {/* ETIQUETA DE PRODUCTO (VISIBLE AL PASAR EL CURSOR O SI SHOWALLLABELS ESTÁ ACTIVO) */}
                            {(isHovered || showAllLabels) && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-center pointer-events-none z-30">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap shadow-md transition-all ${
                                        isHovered
                                            ? 'bg-slate-900 text-amber-300 border-slate-700 text-xs scale-105'
                                            : 'bg-white/95 text-slate-800 border-slate-200'
                                    }`}>
                                        {item.nombre}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* TARJETA TOOLTIP ELEGANTE EN HOVER */}
                {hoveredProduct && (
                    <div className="absolute bottom-4 left-4 z-40 bg-slate-950/95 text-white p-4 rounded-3xl shadow-2xl border border-slate-700/80 max-w-xs space-y-2 animate-in fade-in duration-150 backdrop-blur-md">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                {renderQuadrantIcon(hoveredProduct.quadrant, 16)}
                                <span className="font-black text-xs text-amber-300 truncate max-w-[150px]">
                                    {hoveredProduct.nombre}
                                </span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-xl border ${hoveredProduct.actionColor}`}>
                                {hoveredProduct.quadrantLabel}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[11px] font-semibold pt-1">
                            <div>
                                <span className="text-slate-400 text-[10px] block">Unidades Vendidas:</span>
                                <strong className="text-white font-extrabold">{hoveredProduct.unidades_vendidas} un.</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block">Recaudación Total:</span>
                                <strong className="text-emerald-400 font-extrabold">{formatBs(hoveredProduct.ingresos_bs)}</strong>
                            </div>
                        </div>
                        <div className="text-[10px] text-slate-300 pt-1.5 border-t border-slate-800/80 leading-relaxed font-semibold">
                            <span className="text-amber-400 font-bold">Recomendación IA: </span>
                            {hoveredProduct.recommendation}
                        </div>
                    </div>
                )}

            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
                <span>← Mayor Volumen (Unidades)</span>
                <span>Pasa el cursor sobre cualquier nodo para revelar el nombre sin tapar la pantalla</span>
                <span>Mayor Recaudación (Bs.) ↑</span>
            </div>

        </div>
    );
};
