import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
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

    // Rango mínimo y máximo para escala de ejes
    const plotData = useMemo(() => {
        if (!products || products.length === 0) {
            return { items: [], maxUnits: 10, maxRevenue: 100, minUnits: 0, minRevenue: 0 };
        }

        const maxU = Math.max(...products.map(p => p.unidades_vendidas), medianUnits * 2, 1);
        const maxR = Math.max(...products.map(p => p.ingresos_bs), medianRevenue * 2, 1);

        const items = products.map(p => {
            // Posicionamiento relabel en porcentaje (0% - 100%)
            // Eje X: 0% a la izquierda (Alto Volumen) -> 100% a la derecha (Bajo Volumen)
            // O estándar: Izquierda (Alto), Derecha (Bajo) como en la matriz BCG tradicional
            let pctX = 50;
            if (maxU > 0) {
                // Invertido: Mayor volumen a la izquierda (10% - 90%)
                const ratio = p.unidades_vendidas / maxU;
                pctX = 90 - ratio * 80;
            }

            let pctY = 50;
            if (maxR > 0) {
                // Mayor recaudación arriba (10% - 90%)
                const ratio = p.ingresos_bs / maxR;
                pctY = 90 - ratio * 80;
            }

            // Tamaño del círculo proporcional a los ingresos (radio entre 14px y 36px)
            const maxRevItem = Math.max(...products.map(item => item.ingresos_bs), 1);
            const radiusRatio = Math.sqrt(p.ingresos_bs / maxRevItem);
            const radius = Math.max(14, Math.min(38, Math.round(14 + radiusRatio * 24)));

            return {
                ...p,
                pctX,
                pctY,
                radius
            };
        });

        return { items, maxUnits: maxU, maxRevenue: maxR, minUnits: 0, minRevenue: 0 };
    }, [products, medianUnits, medianRevenue]);

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 font-sans select-none">
            
            {/* CABECERA DEL GRÁFICO */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-600" />
                        <span>Gráfico de Dispersión 2D — Matriz BCG de Productos</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">
                        Eje Y: Recaudación acumulada | Eje X: Volumen relativo de unidades | Tamaño: Participación en ventas
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3 py-1 rounded-xl border border-amber-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Estrellas</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Vacas</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-sky-50 text-sky-900 px-3 py-1 rounded-xl border border-sky-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span>Interrogantes</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-xl border border-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span>Perros</span>
                    </span>
                </div>
            </div>

            {/* LIENZO INTERACTIVO MATRIZ BCG EN ESTILO 2D GRID CON EJES Y FLECHAS */}
            <div className="relative w-full h-[460px] bg-[#fbfcfd] rounded-2xl border border-slate-200/90 overflow-hidden shadow-inner p-4">
                
                {/* FONDO DE CUADRANTES CON COLORES PASTEL SUAVES */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                    {/* Top-Left: Estrellas ⭐ */}
                    <div className="bg-amber-500/5 border-r border-b border-dashed border-teal-500/40 p-3 relative">
                        <span className="text-[11px] font-black text-amber-800/60 uppercase tracking-wider">
                            ⭐ Estrellas (Alta Venta / Alto Ingreso)
                        </span>
                    </div>

                    {/* Top-Right: Interrogantes ❓ */}
                    <div className="bg-sky-500/5 border-b border-dashed border-teal-500/40 p-3 relative text-right">
                        <span className="text-[11px] font-black text-sky-800/60 uppercase tracking-wider">
                            ❓ Interrogantes (Bajo Volumen / Alto Ingreso)
                        </span>
                    </div>

                    {/* Bottom-Left: Vacas Lecheras 🐄 */}
                    <div className="bg-emerald-500/5 border-r border-dashed border-teal-500/40 p-3 relative flex items-end">
                        <span className="text-[11px] font-black text-emerald-800/60 uppercase tracking-wider">
                            🐄 Vacas Lecheras (Alto Volumen / Ingreso Moderado)
                        </span>
                    </div>

                    {/* Bottom-Right: Mascotas / Perros 🐕 */}
                    <div className="bg-slate-500/5 p-3 relative flex items-end justify-end">
                        <span className="text-[11px] font-black text-slate-600/60 uppercase tracking-wider">
                            🐕 Mascotas / Perros (Bajo Volumen / Bajo Ingreso)
                        </span>
                    </div>
                </div>

                {/* EJES PRINCIPALES (TEAL CROSS AXES CON FLECHAS COMO EN LA IMAGEN REQUERIDA) */}
                {/* Eje Vertical (Y-Axis) */}
                <div className="absolute left-1/2 top-2 bottom-2 w-[2px] bg-teal-600/80 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-teal-700" />
                    <span className="absolute top-2 left-2 bg-white/90 text-teal-900 font-black text-[10px] px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs whitespace-nowrap">
                        Corte Recaudación: {formatBs(medianRevenue)}
                    </span>
                </div>

                {/* Eje Horizontal (X-Axis) */}
                <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-teal-600/80 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-teal-700" />
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-teal-700" />
                    <span className="absolute right-2 top-2 bg-white/90 text-teal-900 font-black text-[10px] px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs whitespace-nowrap">
                        Corte Volumen: {medianUnits} un.
                    </span>
                </div>

                {/* NODOS BURBUJA DE PRODUCTO (CORAL / AMBER CIRCLES CON ETIQUETAS COMO LA IMAGEN) */}
                {plotData.items.map((item) => {
                    const isHovered = hoveredProduct?.producto_id === item.producto_id;

                    return (
                        <div
                            key={item.producto_id}
                            style={{
                                left: `${item.pctX}%`,
                                top: `${100 - item.pctY}%`
                            }}
                            onMouseEnter={() => setHoveredProduct(item)}
                            onMouseLeave={() => setHoveredProduct(null)}
                            onClick={() => onSelectProduct && onSelectProduct(item)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-200 hover:scale-125 group"
                        >
                            {/* CÍRCULO BURBUJA ESTILO IMAGEN DE REFERENCIA (Naranja / Coral con Borde Rojo Destacado) */}
                            <div
                                style={{
                                    width: `${item.radius * 2}px`,
                                    height: `${item.radius * 2}px`
                                }}
                                className={`rounded-full flex items-center justify-center transition-all shadow-md ${
                                    item.quadrant === 'star'
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-orange-600 text-white'
                                        : item.quadrant === 'cow'
                                        ? 'bg-gradient-to-br from-emerald-400 to-teal-600 border-2 border-emerald-700 text-white'
                                        : item.quadrant === 'question'
                                        ? 'bg-gradient-to-br from-sky-400 to-indigo-500 border-2 border-sky-600 text-white'
                                        : 'bg-gradient-to-br from-orange-300 to-rose-400 border-2 border-rose-600 text-white'
                                } ${isHovered ? 'ring-4 ring-amber-300 shadow-lg scale-110' : ''}`}
                            >
                                <span className="text-[10px] font-black tracking-tight drop-shadow-xs">
                                    {item.quadrantEmoji}
                                </span>
                            </div>

                            {/* ETIQUETA NOMBRE DEL PRODUCTO (COMO EN LA IMAGEN DE REFERENCIA) */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-center whitespace-nowrap pointer-events-none">
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md transition-all ${
                                    isHovered
                                        ? 'bg-slate-900 text-white shadow-md font-black text-xs z-30'
                                        : 'text-amber-950 bg-white/90 border border-amber-200/80 shadow-2xs'
                                }`}>
                                    {item.nombre}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* TOOLTIP INTERACTIVO HOVER TARJETA INFORMATIVA */}
                {hoveredProduct && (
                    <div className="absolute bottom-4 left-4 z-30 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 max-w-xs space-y-1.5 animate-in fade-in duration-150 backdrop-blur-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                            <span className="font-black text-xs text-amber-300 truncate">
                                {hoveredProduct.quadrantEmoji} {hoveredProduct.nombre}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {hoveredProduct.quadrantLabel}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold pt-1">
                            <div>
                                <span className="text-slate-400 text-[10px] block">Unidades Vendidas:</span>
                                <strong className="text-white font-extrabold">{hoveredProduct.unidades_vendidas} un.</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[10px] block">Recaudación:</span>
                                <strong className="text-emerald-400 font-extrabold">{formatBs(hoveredProduct.ingresos_bs)}</strong>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-300 pt-1 border-t border-slate-800 leading-tight">
                            {hoveredProduct.recommendation}
                        </p>
                    </div>
                )}

            </div>
            
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
                <span>← Mayor Volumen (Unidades)</span>
                <span>Pasa el cursor o haz clic en cualquier burbuja para inspeccionar detalles</span>
                <span>Mayor Recaudación (Bs.) ↑</span>
            </div>

        </div>
    );
};
