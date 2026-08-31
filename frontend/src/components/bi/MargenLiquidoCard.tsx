import React from 'react';
import { Receipt, Info, ChevronRight } from 'lucide-react';

interface MargenLiquidoCardProps {
    margenLiquidoBs?: number;
    comisionMatrizBs?: number;
    margenRetailBs?: number;
    loading?: boolean;
    formatBs: (num?: number) => string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    desgloseSucursales?: Array<{ sucursal_id: string; nombre_sucursal: string; ingresos: number; ordenes: number }>;
    onSelectSucursal?: (sucursalId: string) => void;
}

export const MargenLiquidoCard: React.FC<MargenLiquidoCardProps> = ({
    margenLiquidoBs,
    comisionMatrizBs,
    margenRetailBs,
    loading = false,
    formatBs,
    isExpanded = false,
    onToggleExpand,
    desgloseSucursales = [],
    onSelectSucursal
}) => {
    return (
        <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100/80 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div>
                <div className="flex justify-between items-start pb-3 border-b border-amber-100/60">
                    <div>
                        <span className="text-xs font-black uppercase tracking-wider text-amber-950 block">Margen Líquido</span>
                        <span className="text-[10px] font-bold text-amber-700/80">Rentabilidad Contable</span>
                    </div>
                    <div className="p-2 bg-amber-100/60 rounded-2xl text-amber-600 shadow-2xs">
                        <Receipt size={18} />
                    </div>
                </div>

                <div className="my-3">
                    <h2 className="text-2xl lg:text-3xl font-black text-amber-950 tracking-tight leading-none">
                        {loading ? '...' : formatBs(margenLiquidoBs)}
                    </h2>
                    <div className="mt-2 space-y-1 text-[10px] font-semibold text-amber-800/90">
                        <p className="flex items-center justify-between">
                            <span>Comisión Matriz (15%):</span>
                            <strong className="font-bold text-amber-900">{formatBs(comisionMatrizBs)}</strong>
                        </p>
                        <p className="flex items-center justify-between">
                            <span>Margen Retail:</span>
                            <strong className="font-bold text-amber-900">{formatBs(margenRetailBs)}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="pt-2 border-t border-amber-100/60 text-[10px] font-extrabold text-amber-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                        <Info size={12} className="text-amber-600" />
                        <span>Ganancia real</span>
                    </span>
                    {onToggleExpand && (
                        <button
                            onClick={onToggleExpand}
                            className="text-[11px] font-black text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                            title="Ver margen por sucursal"
                        >
                            <span>{isExpanded ? 'Ocultar' : 'Desglose'}</span>
                            <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>

                {/* LISTA VERTICAL MINIMALISTA DE MARGEN LÍQUIDO */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {(() => {
                            const activeSucursales = desgloseSucursales.filter(
                                (suc) => (suc.ingresos || 0) > 0 || (suc.ordenes || 0) > 0
                            );

                            if (activeSucursales.length === 0) {
                                return (
                                    <p className="text-[11px] font-bold text-amber-800/70 italic text-center py-1">
                                        Sin margen registrado
                                    </p>
                                );
                            }

                            return (
                                <div className="space-y-1.5 pt-0.5">
                                    {activeSucursales.map((suc) => {
                                        // Estimar margen por sucursal manteniendo proporción retail/comisión
                                        const sucMargen = (suc.ingresos || 0) * 0.25; // Proporcional
                                        return (
                                            <div
                                                key={suc.sucursal_id}
                                                onClick={() => onSelectSucursal && onSelectSucursal(suc.sucursal_id)}
                                                className="flex items-center justify-between py-1.5 px-2.5 bg-white/90 hover:bg-amber-100/70 rounded-xl text-xs font-bold text-amber-950 border border-amber-100/80 transition-all cursor-pointer"
                                                title={`Filtrar vista por ${suc.nombre_sucursal}`}
                                            >
                                                <span className="truncate pr-2 font-extrabold">{suc.nombre_sucursal}</span>
                                                <span className="font-black shrink-0 text-amber-900">{formatBs(sucMargen)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};
