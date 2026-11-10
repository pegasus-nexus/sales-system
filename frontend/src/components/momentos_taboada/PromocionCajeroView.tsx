import React, { useState, useEffect, useCallback } from 'react';
import {
    Users,
    TrendingUp,
    Ticket,
    Repeat,
    Search,
    RefreshCcw,
    CreditCard,
    Gift,
    Calendar,
    Phone,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import type { ParticipantePromocion, MetricasPromocionCajero, Sucursal } from '../../api/types';
import { getMomentosTaboadaParticipantes, afiliarTarjetaTaboada } from '../../api/api';

interface Props {
    sucursales: Sucursal[];
    onSelectClienteParaCanje: (telefonoOIdentificador: string) => void;
}

export const PromocionCajeroView: React.FC<Props> = ({
    sucursales,
    onSelectClienteParaCanje,
}) => {
    const [selectedSucursal, setSelectedSucursal] = useState<string>('TODAS');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [participantes, setParticipantes] = useState<ParticipantePromocion[]>([]);
    const [metricas, setMetricas] = useState<MetricasPromocionCajero | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [afiliandoTel, setAfiliandoTel] = useState<string | null>(null);
    const [successNotif, setSuccessNotif] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMsg(null);
            const res = await getMomentosTaboadaParticipantes(
                selectedSucursal === 'TODAS' ? undefined : selectedSucursal,
                searchTerm
            );
            setMetricas(res.metricas);
            setParticipantes(res.participantes || []);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar datos de promoción';
            setErrorMsg(msg);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSucursal, searchTerm]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(timeout);
    }, [loadData]);

    const handleAfiliarTarjeta = async (p: ParticipantePromocion) => {
        if (!p.raw_tel || p.raw_tel.startsWith('ID:')) {
            alert('Este cliente no cuenta con número de celular registrado para vincular la tarjeta.');
            return;
        }

        try {
            setAfiliandoTel(p.raw_tel);
            const res = await afiliarTarjetaTaboada(p.raw_tel, p.nombre);
            setSuccessNotif(`Tarjeta ${res.numero_tarjeta} asignada a ${p.nombre}!`);
            setTimeout(() => setSuccessNotif(null), 4000);
            loadData();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al vincular tarjeta';
            setErrorMsg(msg);
        } finally {
            setAfiliandoTel(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Banner Informativo para el Cajero */}
            <div className="bg-amber-900/10 border border-amber-800/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-amber-200" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-950">
                            Vista de Promoción Momentos Taboada (Mostrador / Cajero)
                        </h3>
                        <p className="text-xs text-amber-800">
                            Supervisa participantes, tickets acumulados por compra ($\ge$ Bs 30) e incentiva el uso de la Tarjeta Taboada.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedSucursal}
                        onChange={e => setSelectedSucursal(e.target.value)}
                        className="px-3 py-1.5 border border-amber-300 rounded-xl text-xs font-semibold text-gray-900 bg-white shadow-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="TODAS">Todas las Sucursales</option>
                        {sucursales.map(s => {
                            const sId = s._id || s.id || '';
                            return (
                                <option key={sId} value={sId}>
                                    {s.nombre} ({s.ciudad})
                                </option>
                            );
                        })}
                    </select>

                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="p-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl transition-all shadow-sm"
                        title="Actualizar datos"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Mensajes de Éxito / Error */}
            {successNotif && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successNotif}</span>
                </div>
            )}
            {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                    {errorMsg}
                </div>
            )}

            {/* 4 KPIs Clave Solicitados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Cuántos participantes hay total */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Total Participantes
                        </span>
                        <span className="text-2xl font-black text-gray-900 block">
                            {metricas ? metricas.total_participantes : 0}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                            Clientes con compras $\ge$ Bs 30
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                {/* 2. Ticket promedio */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Ticket Promedio
                        </span>
                        <span className="text-2xl font-black text-amber-900 block">
                            Bs {metricas ? metricas.ticket_promedio.toFixed(2) : '0.00'}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                            Por compra en campaña
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                {/* 3. Número de tickets repartidos (total) */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Tickets Repartidos
                        </span>
                        <span className="text-2xl font-black text-amber-600 block">
                            {metricas ? metricas.total_tickets_repartidos : 0}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                            1 ticket por cada Bs 30
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Ticket className="w-5 h-5" />
                    </div>
                </div>

                {/* 4. Cuántos participantes compraron más de una vez */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 block mb-1">
                            Compraron &gt; 1 Vez
                        </span>
                        <span className="text-2xl font-black text-emerald-700 block">
                            {metricas ? metricas.participantes_recurrentes : 0}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                            {metricas && metricas.total_participantes > 0
                                ? `${Math.round((metricas.participantes_recurrentes / metricas.total_participantes) * 100)}% de fidelización`
                                : '0% recurrencia'}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Repeat className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Barra de Búsqueda Rápida para el Mostrador */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar participante por Nombre, Celular o Tarjeta (ej: TAB-)..."
                        className="w-full pl-10 pr-4 py-2 text-xs md:text-sm border border-gray-200 rounded-xl text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    />
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    Mostrando <b>{participantes.length}</b> participantes encontrados
                </div>
            </div>

            {/* Tabla de Participantes (7 Columnas Requeridas) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {participantes.length === 0 ? (
                    <div className="p-12 text-center text-sm text-gray-400">
                        {isLoading ? 'Cargando participantes...' : 'No se encontraron participantes en la campaña.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">a. Nombre</th>
                                    <th className="py-3 px-4">b. Última Compra</th>
                                    <th className="py-3 px-4 text-center">c. Tickets Acumulados</th>
                                    <th className="py-3 px-4">d. Celular</th>
                                    <th className="py-3 px-4">e. Estado de Canjeado</th>
                                    <th className="py-3 px-4 text-center">f. Tickets Usados</th>
                                    <th className="py-3 px-4">g. Tarjeta Taboada</th>
                                    <th className="py-3 px-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {participantes.map(p => (
                                    <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                                        {/* a. Nombre */}
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-gray-900 block text-xs md:text-sm">
                                                {p.nombre}
                                            </span>
                                            <span className="text-[11px] text-gray-400 block">
                                                {p.cantidad_compras} compra{p.cantidad_compras !== 1 ? 's' : ''} (Bs {p.total_gastado_bs.toFixed(2)})
                                            </span>
                                        </td>

                                        {/* b. Fecha de última compra */}
                                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>
                                                    {new Date(p.fecha_ultima_compra).toLocaleString('es-BO', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* c. Número de tickets acumulados */}
                                        <td className="py-3 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-black text-xs border border-amber-200">
                                                <Ticket className="w-3 h-3 text-amber-700" />
                                                {p.tickets_acumulados}
                                            </span>
                                        </td>

                                        {/* d. Celular */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                                                <Phone className="w-3 h-3 text-gray-400" />
                                                <span>{p.celular}</span>
                                            </div>
                                        </td>

                                        {/* e. Estado de canjeado */}
                                        <td className="py-3 px-4">
                                            {p.total_canjes === 0 ? (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-semibold text-[11px]">
                                                    Sin canjes
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px] inline-flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    {p.estado_canjeado}
                                                </span>
                                            )}
                                        </td>

                                        {/* f. Número de tickets utilizados */}
                                        <td className="py-3 px-4 text-center">
                                            {p.tickets_utilizados > 0 ? (
                                                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                                    -{p.tickets_utilizados}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">0</span>
                                            )}
                                        </td>

                                        {/* g. Tarjeta Taboada */}
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {p.tarjeta_taboada ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2c1d11] text-amber-300 rounded-lg font-mono font-bold text-xs shadow-sm border border-amber-500/30">
                                                    <CreditCard className="w-3 h-3 text-amber-400" />
                                                    {p.tarjeta_taboada}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAfiliarTarjeta(p)}
                                                    disabled={afiliandoTel === p.raw_tel}
                                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                    title="Asignar tarjeta para recaudar datos del cliente"
                                                >
                                                    <CreditCard className="w-3 h-3 text-amber-700" />
                                                    <span>{afiliandoTel === p.raw_tel ? 'Asignando...' : '+ Activar'}</span>
                                                </button>
                                            )}
                                        </td>

                                        {/* Acción Rápida: Canjear */}
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => onSelectClienteParaCanje(p.celular !== 'Sin celular' ? p.celular : p.nombre)}
                                                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                                            >
                                                <Gift className="w-3.5 h-3.5" />
                                                <span>Canjear</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
export default PromocionCajeroView;
