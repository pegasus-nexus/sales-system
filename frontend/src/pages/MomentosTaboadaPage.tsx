import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Award, Gift, Wallet, History, RefreshCcw } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal, CanjeMomentosTaboada, MetricasMomentosTaboada } from '../api/types';
import { getMomentosTaboadaPremios, getSucursales, getMomentosTaboadaCanjes, getMomentosTaboadaMetricas } from '../api/api';
import { PremiosStockManager } from '../components/momentos_taboada/PremiosStockManager';
import { CanjeFormModal } from '../components/momentos_taboada/CanjeFormModal';
import { CajaChicaTaboadaCard } from '../components/momentos_taboada/CajaChicaTaboadaCard';

type TabType = 'canje' | 'premios' | 'caja' | 'historial';

export const MomentosTaboadaPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('canje');
    const [premios, setPremios] = useState<PremioMomentosTaboada[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [canjes, setCanjes] = useState<CanjeMomentosTaboada[]>([]);
    const [metricas, setMetricas] = useState<MetricasMomentosTaboada | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [pRes, sRes, cRes, mRes] = await Promise.all([
                getMomentosTaboadaPremios(),
                getSucursales(),
                getMomentosTaboadaCanjes(),
                getMomentosTaboadaMetricas(),
            ]);
            setPremios(pRes);
            setSucursales(sRes || []);
            setCanjes(cRes || []);
            setMetricas(mRes);
        } catch (err: unknown) {
            console.error('Error cargando Momentos Taboada:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Hero Oficial */}
            <div className="bg-gradient-to-r from-[#2c1d11] via-[#4a2e1b] to-[#1f140b] p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest rounded-full border border-amber-500/30 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Módulo Exclusivo Chocolates Taboada
                            </span>
                            <span className="text-xs text-amber-200/70 font-semibold">
                                Campaña Noviembre 2026
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-serif text-[#fdf8f2]">
                            Momentos Taboada
                        </h1>
                        <p className="text-sm text-amber-100/80 mt-1 max-w-2xl">
                            Elige tu momento. Colecciona experiencias. Control de cartillas, inventario de premios por sucursal y recaudación del fondo promocional.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>

                {/* Métricas Flash */}
                {metricas && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <span className="text-amber-200/70 block">Canjes Realizados</span>
                            <span className="text-xl font-black text-white">
                                {metricas.metricas.total_canjes} premios
                            </span>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <span className="text-amber-200/70 block">Sellos Redimidos</span>
                            <span className="text-xl font-black text-amber-300">
                                {metricas.metricas.total_sellos_redimidos} sellos
                            </span>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <span className="text-amber-200/70 block">Fondo Recaudado (Copagos)</span>
                            <span className="text-xl font-black text-emerald-400">
                                Bs {metricas.metricas.total_recaudado_fondo_bs.toFixed(2)}
                            </span>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <span className="text-amber-200/70 block">Ventas Participantes</span>
                            <span className="text-xl font-black text-white">
                                Bs {metricas.metricas.total_facturado_ventas_bs.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Navegación por Pestañas */}
            <div className="flex border-b border-gray-200 overflow-x-auto space-x-2">
                <button
                    onClick={() => setActiveTab('canje')}
                    className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'canje'
                            ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Gift className="w-4 h-4" />
                    <span>🎁 Canje Rápido & Cartilla</span>
                </button>

                <button
                    onClick={() => setActiveTab('premios')}
                    className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'premios'
                            ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Award className="w-4 h-4" />
                    <span>🏆 Premios & Stock Sucursales</span>
                </button>

                <button
                    onClick={() => setActiveTab('caja')}
                    className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'caja'
                            ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Wallet className="w-4 h-4" />
                    <span>💵 Caja Chica Promocional</span>
                </button>

                <button
                    onClick={() => setActiveTab('historial')}
                    className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                        activeTab === 'historial'
                            ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <History className="w-4 h-4" />
                    <span>📜 Historial de Canjes ({canjes.length})</span>
                </button>
            </div>

            {/* Contenido de la Pestaña Activa */}
            {activeTab === 'canje' && (
                <CanjeFormModal
                    premios={premios}
                    sucursales={sucursales}
                    onCanjeExitoso={loadData}
                />
            )}

            {activeTab === 'premios' && (
                <PremiosStockManager
                    premios={premios}
                    sucursales={sucursales}
                    onRefresh={loadData}
                />
            )}

            {activeTab === 'caja' && (
                <CajaChicaTaboadaCard sucursales={sucursales} />
            )}

            {activeTab === 'historial' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">
                                Registro Inmutable de Canjes Oficiales
                            </h3>
                            <p className="text-xs text-gray-500">
                                Auditoría detallada de premios entregados, sellos redimidos y dinero recaudado.
                            </p>
                        </div>
                    </div>

                    {canjes.length === 0 ? (
                        <div className="p-12 text-center text-sm text-gray-400">
                            Aún no se han registrado canjes de la promoción Momentos Taboada.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-4">Fecha & Hora</th>
                                        <th className="py-3 px-4">Cliente</th>
                                        <th className="py-3 px-4">Premio Canjeado</th>
                                        <th className="py-3 px-4">Sellos</th>
                                        <th className="py-3 px-4">Copago</th>
                                        <th className="py-3 px-4">Sucursal</th>
                                        <th className="py-3 px-4">Atendido Por</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {canjes.map(c => {
                                        const cId = c.id || c._id || '';
                                        return (
                                            <tr key={cId} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-4 font-medium text-gray-700">
                                                    {new Date(c.created_at).toLocaleString('es-BO', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-gray-900 block">
                                                        {c.cliente_nombre}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500">
                                                        {c.cliente_telefono}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-amber-950">
                                                    {c.premio_nombre}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-extrabold text-[11px] border border-amber-200">
                                                        -{c.sellos_utilizados} sellos
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-extrabold text-emerald-700">
                                                        Bs {c.copago_bs.toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 block">
                                                        {c.metodo_pago}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-700">
                                                    {c.sucursal_nombre}
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    {c.cajero_nombre || 'Admin'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default MomentosTaboadaPage;
