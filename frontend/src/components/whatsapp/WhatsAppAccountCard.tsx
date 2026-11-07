import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Smartphone, CheckCircle2, RefreshCw, QrCode, Key } from 'lucide-react';
import { toast } from 'sonner';
import { updateWhatsAppConfig } from '../../api/api';
import type { WhatsAppAccountStatus } from '../../api/types';

interface WhatsAppAccountCardProps {
    status?: WhatsAppAccountStatus;
    isLoading: boolean;
    onRefresh: () => void;
}

export default function WhatsAppAccountCard({ status, isLoading, onRefresh }: WhatsAppAccountCardProps) {
    const queryClient = useQueryClient();
    const live = status?.live_status;
    const isConnected = live?.is_authorized === true;
    const isMock = status?.provider === 'MOCK';

    const [provider, setProvider] = useState(status?.provider || 'GREENAPI');
    const [instanceId, setInstanceId] = useState(status?.instance_id || '');
    const [apiToken, setApiToken] = useState('');
    const [enabled, setEnabled] = useState(status?.enabled ?? true);
    const [defaultMsg, setDefaultMsg] = useState(
        status?.default_message || 'Hola {{cliente}}, adjuntamos tu comprobante de compra por {{total}}.'
    );

    const updateMut = useMutation({
        mutationFn: updateWhatsAppConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            toast.success('Configuración de WhatsApp actualizada');
            onRefresh();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error al guardar configuración';
            toast.error(msg);
        },
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateMut.mutate({
            enabled,
            provider,
            instance_id: instanceId,
            api_token: apiToken || undefined,
            default_message: defaultMsg,
        });
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
            {/* Header del Estado de la Cuenta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isConnected
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">
                                Conexión WhatsApp Business
                            </h3>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                isConnected
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}>
                                {isConnected ? '🟢 En Línea' : '🟡 Desconectado / Pendiente'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Proveedor activo: <b className="text-gray-700">{status?.provider || 'GREENAPI'}</b> • Estado: <span className="font-mono text-xs">{live?.state || 'inactivo'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
                        <span>Verificar Estado</span>
                    </button>
                </div>
            </div>

            {/* Código QR de Vinculación si no está autorizado */}
            {!isConnected && live?.qr_code && (
                <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 max-w-md">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase shadow-xs">
                            <QrCode size={13} />
                            <span>Escanea para Vincular tu WhatsApp</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">
                            Abre WhatsApp en tu teléfono → Dispositivos vinculados → Vincular un dispositivo
                        </h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Apunta tu cámara a este código QR para habilitar el envío automático de comprobantes, recibos y recordatorios de cobro.
                        </p>
                    </div>

                    <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-200 shrink-0">
                        <img
                            src={`data:image/png;base64,${live.qr_code}`}
                            alt="WhatsApp QR Code"
                            className="w-44 h-44 object-contain"
                        />
                    </div>
                </div>
            )}

            {/* Formulario de Configuración del Proveedor */}
            <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Key size={14} className="text-indigo-600" />
                        <span>Parámetros de Integración</span>
                    </span>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-gray-800">Servicio Habilitado</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Proveedor */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Proveedor de API
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500 font-medium"
                        >
                            <option value="GREENAPI">Green API (Recomendado)</option>
                            <option value="ULTRAMSG">UltraMsg</option>
                            <option value="MOCK">Simulador Mock (Pruebas sin costo)</option>
                        </select>
                    </div>

                    {/* Instance ID */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            ID de Instancia (Instance ID)
                        </label>
                        <input
                            type="text"
                            value={instanceId}
                            onChange={(e) => setInstanceId(e.target.value)}
                            placeholder="Ej: 7103123456"
                            disabled={isMock}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500 font-mono disabled:opacity-50"
                        />
                    </div>

                    {/* API Token */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Token de API
                        </label>
                        <input
                            type="password"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            placeholder={status?.api_token ? '••••••••••••••••' : 'Ingresa nuevo token...'}
                            disabled={isMock}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500 font-mono disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Mensaje por Defecto */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Mensaje Predeterminado de Venta (Fallback)
                    </label>
                    <input
                        type="text"
                        value={defaultMsg}
                        onChange={(e) => setDefaultMsg(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={updateMut.isPending}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <CheckCircle2 size={14} />
                        <span>Guardar Parámetros</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
