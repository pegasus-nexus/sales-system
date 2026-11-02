import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, 
    RefreshCcw, Send, Download, Copy, Check, Server, Globe, Database, MessageSquare, HelpCircle, X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { 
    getSystemStatusSummary, 
    triggerInstantProbe, 
    getMonitoringHistory, 
    exportSystemSnapshot, 
    testTelegramNotification, 
    inviteAdminSetup,
    getGlobalAuditLogs
} from '../api/systemMonitorApi';
import type { GlobalAuditLogItem } from '../api/systemMonitorApi';
import { toast } from 'sonner';

type ActiveTab = 'status' | 'history' | 'logs' | 'admin-access';

export default function SystemHealthPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<ActiveTab>('status');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('rodrigorayomartinez@gmail.com');
    const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
    const [isTelegramHelpOpen, setIsTelegramHelpOpen] = useState(false);

    // Queries
    const { data: statusSummary } = useQuery({
        queryKey: ['system-monitor-status'],
        queryFn: getSystemStatusSummary,
        refetchInterval: 30000, // Refresca cada 30 segundos automáticamente
    });

    const { data: history = [], refetch: refetchHistory } = useQuery({
        queryKey: ['system-monitor-history'],
        queryFn: () => getMonitoringHistory(30),
        enabled: activeTab === 'history',
    });

    const { data: auditLogs = [], isLoading: loadingLogs } = useQuery<GlobalAuditLogItem[]>({
        queryKey: ['global-audit-logs'],
        queryFn: () => getGlobalAuditLogs(50),
        enabled: activeTab === 'logs',
    });

    // Mutations
    const probeMut = useMutation({
        mutationFn: triggerInstantProbe,
        onSuccess: (data) => {
            toast.success(data.message || 'Sondeo ejecutado con éxito');
            queryClient.invalidateQueries({ queryKey: ['system-monitor-status'] });
            queryClient.invalidateQueries({ queryKey: ['system-monitor-history'] });
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Error al ejecutar el sondeo');
        },
    });

    const testTelegramMut = useMutation({
        mutationFn: () => testTelegramNotification('Alerta de prueba manual emitida desde el panel de observabilidad Pegasus.'),
        onSuccess: (data) => {
            toast.success(data.message);
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Error al despachar alerta a Telegram');
        },
    });

    const exportMut = useMutation({
        mutationFn: exportSystemSnapshot,
        onSuccess: (snapshot) => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute('href', dataStr);
            dl.setAttribute('download', `pegasus-diagnostico-${new Date().toISOString().slice(0, 10)}.json`);
            dl.click();
            toast.success('Snapshot de diagnóstico exportado exitosamente');
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Error al exportar diagnóstico');
        },
    });

    const inviteMut = useMutation({
        mutationFn: inviteAdminSetup,
        onSuccess: (data) => {
            setLatestInviteUrl(data.setup_url);
            toast.success(data.message);
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Error al generar enlace');
        },
    });

    if (user?.role !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN_STAFF') {
        return <div className="p-8 text-center text-red-500 font-bold">Acceso Restringido a Superadministradores</div>;
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(text);
        toast.info('Enlace copiado al portapapeles');
        setTimeout(() => setCopiedUrl(null), 2500);
    };

    const isSystemHealthy = statusSummary?.overall_status === 'HEALTHY';
    const isDegraded = statusSummary?.overall_status === 'DEGRADED';

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20 md:pb-8">
            {/* Header Principal con Estado Global */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full ${isSystemHealthy ? 'bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse' : isDegraded ? 'bg-amber-500' : 'bg-rose-500 animate-ping'}`} />
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <ShieldAlert className="text-indigo-600" size={26} />
                            Monitor de Servicios & Infraestructura
                        </h1>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Status Page en tiempo real, observabilidad activa y alertas automatizadas a Telegram.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => probeMut.mutate()}
                        disabled={probeMut.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        title="Chequear todos los servicios ahora"
                    >
                        <RefreshCcw size={14} className={probeMut.isPending ? 'animate-spin' : ''} />
                        <span>{probeMut.isPending ? 'Sondeando...' : 'Sondear Ahora'}</span>
                    </button>

                    <button 
                        onClick={() => exportMut.mutate()}
                        disabled={exportMut.isPending}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Descargar snapshot de logs y diagnóstico (respaldo Google Drive)"
                    >
                        <Download size={14} className="text-gray-500" />
                        <span>Exportar Respaldo</span>
                    </button>
                </div>
            </div>

            {/* Pestañas de Navegación del Panel */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-bold">
                <button
                    onClick={() => setActiveTab('status')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'status' 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Status Page en Vivo
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'history' 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Historial de Sondeos
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'logs' 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Logs & Auditoría Global
                </button>
                <button
                    onClick={() => setActiveTab('admin-access')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                        activeTab === 'admin-access' 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Acceso Seguro Superadmin
                </button>
            </div>

            {/* TAB 1: STATUS PAGE EN VIVO */}
            {activeTab === 'status' && (
                <div className="space-y-6">
                    {/* Tarjetas Métricas Clave */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado Global</p>
                            <p className={`text-lg font-black mt-1 ${isSystemHealthy ? 'text-emerald-600' : isDegraded ? 'text-amber-600' : 'text-rose-600'}`}>
                                {isSystemHealthy ? '100% Operacional' : isDegraded ? 'Servicio Degradado' : 'Falla Crítica'}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Sondeo automático cada 60s</p>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Latencia Promedio</p>
                            <p className="text-lg font-black text-gray-900 mt-1 font-mono">
                                {statusSummary?.avg_latency_ms ?? 0} ms
                            </p>
                            <p className="text-[11px] text-emerald-600 mt-0.5 font-semibold">Respuesta inmediata</p>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Incidentes Abiertos</p>
                            <p className="text-lg font-black text-gray-900 mt-1 font-mono">
                                {statusSummary?.open_incidents_count ?? 0}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Sin interrupciones críticas</p>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-150 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alertas Telegram</p>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsTelegramHelpOpen(true)}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                                        title="Guía de configuración"
                                    >
                                        <HelpCircle size={12} />
                                        <span>Guía</span>
                                    </button>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    statusSummary?.telegram_configured 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusSummary?.telegram_configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    {statusSummary?.telegram_configured ? 'Activo y Conectado' : 'Pendiente en .env'}
                                </span>
                            </div>
                            {statusSummary?.telegram_configured ? (
                                <button
                                    onClick={() => testTelegramMut.mutate()}
                                    disabled={testTelegramMut.isPending}
                                    className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                >
                                    <Send size={11} />
                                    <span>{testTelegramMut.isPending ? 'Enviando...' : 'Probar Notificación'}</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsTelegramHelpOpen(true)}
                                    className="mt-2 text-[11px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>¿Dónde configurar mis credenciales?</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grilla de Servicios */}
                    <div className="space-y-3">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Servicios Monitoreados</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {statusSummary?.services?.map((svc) => (
                                <div key={svc.service_key} className="bg-white rounded-2xl p-4 border border-gray-150 shadow-xs flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-600">
                                            {svc.target_type === 'DATABASE' ? <Database size={20} className="text-emerald-600" /> :
                                             svc.target_type === 'INTERNAL_HTTP' ? <Globe size={20} className="text-indigo-600" /> :
                                             svc.service_key.includes('message') ? <MessageSquare size={20} className="text-emerald-500" /> :
                                             <Server size={20} className="text-blue-500" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-900">{svc.service_name}</h3>
                                            <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                                                <span>Latencia: <strong>{svc.latency_ms} ms</strong></span>
                                                <span>•</span>
                                                <span>Uptime 24h: <strong>{svc.uptime_24h_percent}%</strong></span>
                                            </div>
                                            {svc.error_message && (
                                                <p className="mt-1 text-[10px] text-rose-600 font-medium">{svc.error_message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        svc.status === 'UP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        svc.status === 'DEGRADED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                        {svc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: HISTORIAL DE SONDEOS */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Historial de Chequeos Recientes</span>
                        <button onClick={() => refetchHistory()} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Actualizar">
                            <RefreshCcw size={14} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-400 uppercase font-bold text-[10px] border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2.5">Servicio</th>
                                    <th className="px-4 py-2.5 text-center">Estado</th>
                                    <th className="px-4 py-2.5 text-right">Latencia</th>
                                    <th className="px-4 py-2.5">Detalle / Error</th>
                                    <th className="px-4 py-2.5 text-right">Fecha y Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map((h) => (
                                    <tr key={h.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 font-bold text-gray-900">{h.service_name}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                h.status === 'UP' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {h.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono">{h.latency_ms} ms</td>
                                        <td className="px-4 py-2.5 text-gray-500 text-[11px]">{h.error_message || 'OK'}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-400 text-[11px] font-mono">
                                            {new Date(h.checked_at).toLocaleTimeString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: LOGS & AUDITORÍA GLOBAL */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Actividad y Logs del Sistema</span>
                        <span className="text-xs text-gray-400">{auditLogs?.length ?? 0} registros</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {loadingLogs ? (
                            <div className="p-8 text-center text-xs text-gray-400">Cargando logs...</div>
                        ) : auditLogs?.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-400">No hay actividad registrada recientemente.</div>
                        ) : (
                            auditLogs?.map((log: GlobalAuditLogItem) => (
                                <div key={log._id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                    <div className="mt-0.5">
                                        {log.action === 'DELETE' ? <AlertCircle size={16} className="text-rose-500" /> :
                                         log.action === 'UPDATE' ? <AlertTriangle size={16} className="text-amber-500" /> :
                                         <CheckCircle2 size={16} className="text-blue-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-bold text-gray-900">{log.tenant_name || 'Global SaaS'}</p>
                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            [{log.entity}] {log.action} ejecutado por <strong>{log.username}</strong>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: ACCESO SEGURO SUPERADMIN (PILOTO) */}
            {activeTab === 'admin-access' && (
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs max-w-2xl space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Piloto de Acceso Seguro para Administradores</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Genera un enlace criptográfico temporal para que el Superadmin defina su contraseña sin compartir credenciales en texto plano ni hardcodear nada en el código.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="admin@ejemplo.com"
                            className="flex-1 px-3.5 py-2 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-indigo-600 outline-none"
                        />
                        <button
                            onClick={() => inviteMut.mutate(inviteEmail)}
                            disabled={inviteMut.isPending}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            {inviteMut.isPending ? 'Generando...' : 'Generar Enlace Seguro'}
                        </button>
                    </div>

                    {latestInviteUrl && (
                        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-indigo-900">Enlace temporal de un solo uso (Válido por 2 horas):</span>
                                <button
                                    onClick={() => handleCopy(latestInviteUrl)}
                                    className="p-1 hover:bg-indigo-100 rounded text-indigo-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                >
                                    {copiedUrl === latestInviteUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                    <span>{copiedUrl === latestInviteUrl ? 'Copiado' : 'Copiar'}</span>
                                </button>
                            </div>
                            <p className="text-xs font-mono text-indigo-800 break-all bg-white p-2.5 rounded-lg border border-indigo-100 select-all">
                                {latestInviteUrl}
                            </p>
                        </div>
                    )}
                </div>
            )}
            {/* Modal de Guía de Configuración de Telegram */}
            {isTelegramHelpOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-150 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Send className="text-indigo-600" size={20} />
                                <h3 className="text-base font-black text-gray-900">¿Cómo configurar alertas a Telegram?</h3>
                            </div>
                            <button 
                                onClick={() => setIsTelegramHelpOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                            Por seguridad, Telegram no usa números telefónicos para enviar alertas de servidores. Usa un <strong>Bot de Telegram</strong> y tu <strong>Chat ID</strong>. Configurarlo toma 2 minutos:
                        </p>

                        <div className="space-y-2.5 text-xs">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-900">1. Crear tu Bot en Telegram:</p>
                                <p className="text-gray-600 mt-0.5">
                                    En Telegram busca a <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-indigo-700 font-bold">@BotFather</code> y escribe <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-indigo-700 font-bold">/newbot</code>. Te entregará tu <strong>BOT_TOKEN</strong> (ej. 7123456789:AAHk...).
                                </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-900">2. Obtener tu Chat ID:</p>
                                <p className="text-gray-600 mt-0.5">
                                    Abre tu nuevo bot en Telegram y dale <strong>Iniciar</strong> (<code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-indigo-700 font-bold">/start</code>). Luego busca a <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-indigo-700 font-bold">@userinfobot</code> para ver tu Id numérico (ej. 987654321).
                                </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-900">3. Colocar en tu archivo <code className="text-indigo-600">.env</code> del backend:</p>
                                <pre className="mt-1.5 p-2.5 bg-gray-900 text-emerald-400 rounded-lg font-mono text-[11px] select-all overflow-x-auto">
{`TELEGRAM_BOT_TOKEN=tu_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui
FRONTEND_URL=https://tu-frontend.vercel.app`}
                                </pre>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsTelegramHelpOpen(false)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
