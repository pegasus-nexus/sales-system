import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, Sparkles, History, Settings2 } from 'lucide-react';
import { getWhatsAppStatus, getWhatsAppTemplates } from '../api/api';

import WhatsAppAccountCard from '../components/whatsapp/WhatsAppAccountCard';
import WhatsAppTemplatesManager from '../components/whatsapp/WhatsAppTemplatesManager';
import WhatsAppDirectSender from '../components/whatsapp/WhatsAppDirectSender';
import WhatsAppLogsTable from '../components/whatsapp/WhatsAppLogsTable';

export default function WhatsAppPage() {
    const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'logs' | 'config'>('send');

    const {
        data: statusData,
        isLoading: loadingStatus,
        refetch: refetchStatus,
    } = useQuery({
        queryKey: ['whatsapp-status'],
        queryFn: getWhatsAppStatus,
    });

    const {
        data: templatesData = [],
        isLoading: loadingTemplates,
    } = useQuery({
        queryKey: ['whatsapp-templates'],
        queryFn: getWhatsAppTemplates,
    });

    const isConnected = statusData?.live_status?.is_authorized === true;

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header Principal de la App */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                WhatsApp Nexus
                            </h1>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Odoo App
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Centro de comunicaciones: envío de tickets POS, cobro de cuotas, confirmaciones y mensajes a clientes.
                        </p>
                    </div>
                </div>

                {/* Badge de Conectividad Rápida */}
                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                        isConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span>{isConnected ? 'WhatsApp Conectado' : 'Pendiente de Vinculación'}</span>
                    </div>
                </div>
            </div>

            {/* Selector de Pestañas Moderno */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('send')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        activeTab === 'send'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <Send size={14} />
                    <span>Envío Inmediato</span>
                </button>

                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        activeTab === 'templates'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <Sparkles size={14} />
                    <span>Plantillas Dinámicas ({templatesData.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        activeTab === 'logs'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <History size={14} />
                    <span>Bitácora de Envíos</span>
                </button>

                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                        activeTab === 'config'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                    <Settings2 size={14} />
                    <span>Conexión & QR</span>
                </button>
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div className="pt-2">
                {activeTab === 'send' && (
                    <WhatsAppDirectSender templates={templatesData} />
                )}

                {activeTab === 'templates' && (
                    <WhatsAppTemplatesManager
                        templates={templatesData}
                        isLoading={loadingTemplates}
                    />
                )}

                {activeTab === 'logs' && (
                    <WhatsAppLogsTable />
                )}

                {activeTab === 'config' && (
                    <WhatsAppAccountCard
                        status={statusData}
                        isLoading={loadingStatus}
                        onRefresh={refetchStatus}
                    />
                )}
            </div>
        </div>
    );
}
