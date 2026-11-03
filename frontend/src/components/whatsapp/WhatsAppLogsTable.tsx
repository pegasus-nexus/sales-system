import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, CheckCircle2, AlertTriangle, RefreshCw, Smartphone } from 'lucide-react';
import { getWhatsAppLogs } from '../../api/api';
import { formatFullDate as formatDate } from '../../utils/dateUtils';

export default function WhatsAppLogsTable() {
    const [page, setPage] = useState(1);
    const [origenFilter, setOrigenFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['whatsapp-logs', page, origenFilter, estadoFilter],
        queryFn: () => getWhatsAppLogs(page, 20, origenFilter || undefined, estadoFilter || undefined),
    });

    const logs = data?.items || [];
    const total = data?.total || 0;
    const pages = data?.pages || 1;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header y Filtros */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <History size={18} className="text-indigo-600" />
                        <span>Bitácora de Auditoría de Envíos</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registro inmutable de todos los mensajes enviados por cajeros, cobradores o de forma automática.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filtro Origen */}
                    <select
                        value={origenFilter}
                        onChange={(e) => {
                            setOrigenFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white font-medium"
                    >
                        <option value="">Todos los orígenes</option>
                        <option value="POS">Ventas POS</option>
                        <option value="CREDITOS">Cobro de Créditos</option>
                        <option value="DIRECTO">Envío Directo</option>
                        <option value="SISTEMA">Sistema</option>
                    </select>

                    {/* Filtro Estado */}
                    <select
                        value={estadoFilter}
                        onChange={(e) => {
                            setEstadoFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white font-medium"
                    >
                        <option value="">Todos los estados</option>
                        <option value="ENVIADO">Enviados</option>
                        <option value="ERROR">Con Error</option>
                    </select>

                    <button
                        onClick={() => refetch()}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                        title="Recargar bitácora"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase font-bold tracking-wider">
                        <tr>
                            <th className="py-3 px-4">Fecha / Hora</th>
                            <th className="py-3 px-4">Destinatario</th>
                            <th className="py-3 px-4">Origen</th>
                            <th className="py-3 px-4">Mensaje Enviado</th>
                            <th className="py-3 px-4">Emisor</th>
                            <th className="py-3 px-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-400">
                                    Cargando bitácora de mensajes...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-400">
                                    No hay registros de envíos de WhatsApp aún.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const isSent = log.estado === 'ENVIADO';
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Smartphone size={13} className="text-gray-400" />
                                                <span>{log.telefono}</span>
                                            </div>
                                            {log.cliente_nombre && (
                                                <span className="text-[11px] font-normal text-gray-500 block">
                                                    {log.cliente_nombre}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                {log.origen}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 max-w-xs truncate" title={log.mensaje}>
                                            <span className="text-gray-800 line-clamp-1">{log.mensaje}</span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
                                            {log.usuario_nombre}
                                        </td>
                                        <td className="py-3 px-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                isSent
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {isSent ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                                <span>{log.estado}</span>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación simple */}
            {pages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Total: <b>{total}</b> envíos</span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                        >
                            Anterior
                        </button>
                        <span>Página {page} de {pages}</span>
                        <button
                            disabled={page >= pages}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
