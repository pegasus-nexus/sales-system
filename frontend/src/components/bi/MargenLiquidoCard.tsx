import React from 'react';
import { Receipt, Info } from 'lucide-react';

interface MargenLiquidoCardProps {
    margenLiquidoBs?: number;
    comisionMatrizBs?: number;
    margenRetailBs?: number;
    loading?: boolean;
    formatBs: (num?: number) => string;
}

export const MargenLiquidoCard: React.FC<MargenLiquidoCardProps> = ({
    margenLiquidoBs,
    comisionMatrizBs,
    margenRetailBs,
    loading = false,
    formatBs
}) => {
    return (
        <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white rounded-3xl p-5 shadow-xs border border-amber-100/80 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
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

            <div className="pt-2 border-t border-amber-100/60 text-[10px] font-extrabold text-amber-700 flex items-center gap-1">
                <Info size={12} className="text-amber-600" />
                <span>Ganancia real después de costos y comisiones</span>
            </div>
        </div>
    );
};
