import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Award, Gift, Wallet, History, RefreshCcw, Users, Lock, CheckCircle2, Play, Pause } from 'lucide-react';
import type {
    PremioMomentosTaboada,
    Sucursal,
    CanjeMomentosTaboada,
    MetricasMomentosTaboada,
    EstadoCampanaTaboada,
} from '../api/types';
import {
    getMomentosTaboadaPremios,
    getSucursales,
    getMomentosTaboadaCanjes,
    getMomentosTaboadaMetricas,
    getMomentosTaboadaEstadoCampana,
    toggleMomentosTaboadaCampana,
} from '../api/api';
import { useAuthStore } from '../store/authStore';
import { PremiosStockManager } from '../components/momentos_taboada/PremiosStockManager';
import { CajaChicaTaboadaCard } from '../components/momentos_taboada/CajaChicaTaboadaCard';
import { PromocionCajeroView } from '../components/momentos_taboada/PromocionCajeroView';
import { CanjeFlujoCajeroCard } from '../components/momentos_taboada/CanjeFlujoCajeroCard';

type TabType = 'canje' | 'promocion' | 'premios' | 'caja' | 'historial';

export const MomentosTaboadaPage: React.FC = () => {
    const role = useAuthStore(state => state.role);
    const isAdmin = role === 'ADMIN_MATRIZ' || role === 'ADMIN' || role === 'SUPERADMIN';

    const [activeTab, setActiveTab] = useState<TabType>('promocion');
    const [premios, setPremios] = useState<PremioMomentosTaboada[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [canjes, setCanjes] = useState<CanjeMomentosTaboada[]>([]);
    const [metricas, setMetricas] = useState<MetricasMomentosTaboada | null>(null);
    const [estadoCampana, setEstadoCampana] = useState<EstadoCampanaTaboada | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isTogglingCampana, setIsTogglingCampana] = useState<boolean>(false);
    const [preloadedQuery, setPreloadedQuery] = useState<string>('');

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [pRes, sRes, cRes, estRes] = await Promise.all([
                getMomentosTaboadaPremios(),
                getSucursales(),
                getMomentosTaboadaCanjes(),
                getMomentosTaboadaEstadoCampana(),
            ]);
            setPremios(pRes || []);
            setSucursales(sRes || []);
            setCanjes(cRes || []);
            setEstadoCampana(estRes || null);

            if (isAdmin) {
                const mRes = await getMomentosTaboadaMetricas();
                setMetricas(mRes);
            }
        } catch (err: unknown) {
            console.error('Error cargando Momentos Taboada:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleCampana = async (nuevaActiva: boolean) => {
        const confirmar = window.confirm(
            nuevaActiva
                ? '¿Deseas activar oficialmente la campaña Momentos Taboada para todos los cajeros y clientes?'
                : '¿Deseas pausar la campaña Momentos Taboada? Los cajeros y clientes verán la pantalla de preparación.'
        );
        if (!confirmar) return;

        try {
            setIsTogglingCampana(true);
            const res = await toggleMomentosTaboadaCampana({ activa: nuevaActiva });
            setEstadoCampana(prev => (prev ? { ...prev, activa: res.activa } : null));
            await loadData();
        } catch (err: unknown) {
            alert('Error al cambiar el estado de la campaña: ' + (err instanceof Error ? err.message : 'Error desconocido'));
        } finally {
            setIsTogglingCampana(false);
        }
    };

    const handleSelectClienteParaCanje = (identificador: string) => {
        setPreloadedQuery(identificador);
        setActiveTab('canje');
    };

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
                                Módulo Oficial Chocolates Taboada
                            </span>
                            <span className="text-xs text-amber-200/70 font-semibold">
                                Campaña Noviembre 2026
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight font-serif text-[#fdf8f2]">
                            Momentos Taboada
                        </h1>
                        <p className="text-sm text-amber-100/80 mt-1 max-w-2xl">
                            <i>"Elige tu momento. Colecciona experiencias."</i> — Panel de gestión de participantes, canjes oficiales y control de cartillas por cliente.
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

                {/* Métricas Flash (para administradores) */}
                {isAdmin && metricas && (
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

            {/* Banner de Control de Campaña (Solo Administradores) */}
            {isAdmin && estadoCampana && (
                <div
                    className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
                        estadoCampana.activa
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/90 border-amber-300 text-amber-950'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                                estadoCampana.activa ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                            }`}
                        >
                            {estadoCampana.activa ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-gray-900">
                                    {estadoCampana.activa
                                        ? 'Campaña Oficialmente Activa y Visible'
                                        : 'Modo Preparación / Campaña Oculta para Cajeros y Clientes'}
                                </span>
                                <span
                                    className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                        estadoCampana.activa
                                            ? 'bg-emerald-200 text-emerald-900'
                                            : 'bg-amber-200 text-amber-900'
                                    }`}
                                >
                                    {estadoCampana.activa ? 'En Vivo' : 'Borrador'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-700 mt-1 max-w-2xl">
                                {estadoCampana.activa
                                    ? `Los cajeros y clientes pueden consultar cartillas y canjear premios. (Activado por: ${
                                          estadoCampana.activado_por_usuario || 'Administración'
                                      })`
                                    : 'Cajeros y clientes NO pueden ver ni interactuar con la campaña todavía. Puedes surtir stock, preparar premios y revisar reglas antes de activarla.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => handleToggleCampana(!estadoCampana.activa)}
                        disabled={isTogglingCampana}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 ${
                            estadoCampana.activa
                                ? 'bg-white hover:bg-gray-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                    >
                        {isTogglingCampana ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : estadoCampana.activa ? (
                            <>
                                <Pause className="w-4 h-4" />
                                <span>Pausar Campaña</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                <span>🚀 Activar para Sucursales y Clientes</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {!isAdmin && estadoCampana && !estadoCampana.activa ? (
                /* Vista para cajeros cuando la campaña aún no fue activada por administración */
                <div className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto border border-amber-100 shadow-sm space-y-4 my-6">
                    <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-extrabold uppercase tracking-widest rounded-full border border-amber-200 inline-block">
                            Campaña en Preparación
                        </span>
                        <h2 className="text-2xl font-black text-gray-900 font-serif">
                            Momentos Taboada se está preparando
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {estadoCampana.mensaje_inactivo ||
                            'La administración de la empresa está surtiendo los premios y configurando el lanzamiento oficial. Esta sección estará disponible en tu caja en cuanto se active oficialmente.'}
                    </p>
                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60 text-xs text-amber-900 text-left flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>Nota para personal:</strong> Las compras válidas (≥ Bs 30) se continúan acumulando de forma segura en el sistema, por lo que los clientes no perderán ningún sello al momento del lanzamiento oficial.
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Navegación por Pestañas */}
                    <div className="flex border-b border-gray-200 overflow-x-auto space-x-2">
                        <button
                            onClick={() => setActiveTab('promocion')}
                            className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === 'promocion'
                                    ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>📊 Promoción & Participantes</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('canje')}
                            className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                                activeTab === 'canje'
                                    ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Gift className="w-4 h-4" />
                            <span>🎁 Canje de Premios</span>
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

                        {/* Pestañas solo para Administrador */}
                        {isAdmin && (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* Contenido de la Pestaña Activa */}
                    {activeTab === 'promocion' && (
                        <PromocionCajeroView
                            sucursales={sucursales}
                            onSelectClienteParaCanje={handleSelectClienteParaCanje}
                        />
                    )}

                    {activeTab === 'canje' && (
                        <CanjeFlujoCajeroCard
                            premios={premios}
                            sucursales={sucursales}
                            initialQuery={preloadedQuery}
                            onCanjeExitoso={loadData}
                        />
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

                    {activeTab === 'premios' && isAdmin && (
                        <PremiosStockManager
                            premios={premios}
                            sucursales={sucursales}
                            onRefresh={loadData}
                        />
                    )}

                    {activeTab === 'caja' && isAdmin && (
                        <CajaChicaTaboadaCard sucursales={sucursales} />
                    )}
                </>
            )}
        </div>
    );
};
export default MomentosTaboadaPage;
