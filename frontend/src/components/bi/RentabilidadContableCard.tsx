import React from 'react';
import { Percent, ChevronRight, Store } from 'lucide-react';

interface RentabilidadContableCardProps {
    rentabilidadPct?: number;
    loading?: boolean;
    onOpenModal?: () => void;
}

export const RentabilidadContableCard: React.FC<RentabilidadContableCardProps> = ({
    rentabilidadPct,
    loading = false,
    onOpenModal
}) => {

    return (
        <div className="bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white rounded-3xl p-5 shadow-xs border border-violet-100/80 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex justify-between items-start pb-3 border-b border-violet-100/60">
                <div>
                    <span className="text-xs font-black uppercase tracking-wider text-violet-950 block">Rentabilidad Contable</span>
                    <span className="text-[10px] font-bold text-violet-700/80">Porcentaje Operativo</span>
                </div>
                <div className="p-2 bg-violet-100/60 rounded-2xl text-violet-600 shadow-2xs">
                    <Percent size={18} />
                </div>
            </div>

            <div className="my-3">
                <h2 className="text-2xl lg:text-3xl font-black text-violet-950 tracking-tight leading-none flex items-baseline gap-1">
                    {loading ? '...' : `${(rentabilidadPct || 0).toFixed(2)}%`}
                </h2>
                <p className="text-[10px] font-bold text-violet-700/80 mt-1">
                    Sobre ventas públicas realizadas
                </p>
            </div>

            <button
                onClick={onOpenModal}
                className="pt-2 border-t border-violet-100/60 text-[11px] font-black text-violet-700 hover:text-violet-900 flex items-center justify-between w-full transition-colors group cursor-pointer"
                title="Ver desglose financiero por sucursal"
            >
                <span className="flex items-center gap-1.5">
                    <Store size={13} className="text-violet-600" />
                    <span>Ver Detalles</span>
                </span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
    );
};
