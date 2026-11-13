import React from 'react';
import { Users, CreditCard, PhoneCall, Repeat, TrendingUp } from 'lucide-react';
import type { Cliente } from '../../api/clientes';

interface Props {
    clientes: Cliente[];
    totalClientesCount?: number;
}

export const ClientesKPIBar: React.FC<Props> = ({ clientes }) => {
    const total = clientes.length;
    const conTarjeta = clientes.filter(c => Boolean(c.numero_tarjeta)).length;
    const conTelefono = clientes.filter(c => Boolean(c.telefono && c.telefono.trim())).length;
    const recurrentes = clientes.filter(c => c.cantidad_compras > 1).length;
    const totalVentasBs = clientes.reduce((acc, c) => acc + (c.total_compras || 0), 0);

    const formatMoney = (val: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const porcentajeTarjeta = total > 0 ? Math.round((conTarjeta / total) * 100) : 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {/* KPI 1: Total */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Users size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Total Clientes</p>
                    <p className="text-xl font-black text-gray-900">{total}</p>
                </div>
            </div>

            {/* KPI 2: Tarjeta Taboada (Comunidad) */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CreditCard size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider truncate">Tarjeta Taboada</p>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-200/70 text-amber-900">
                            {porcentajeTarjeta}%
                        </span>
                    </div>
                    <p className="text-xl font-black text-amber-950">{conTarjeta}</p>
                </div>
            </div>

            {/* KPI 3: Con Teléfono (WhatsApp) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <PhoneCall size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Con Teléfono</p>
                    <p className="text-xl font-black text-gray-900">{conTelefono}</p>
                </div>
            </div>

            {/* KPI 4: Recurrentes */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <Repeat size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Recurrentes</p>
                    <p className="text-xl font-black text-gray-900">{recurrentes}</p>
                </div>
            </div>

            {/* KPI 5: Facturación Acumulada */}
            <div className="col-span-2 md:col-span-1 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <TrendingUp size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Facturado Total</p>
                    <p className="text-lg font-black text-indigo-700 font-mono truncate">{formatMoney(totalVentasBs)}</p>
                </div>
            </div>
        </div>
    );
};
