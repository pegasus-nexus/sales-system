import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Smartphone, User, FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsAppCustomMessage } from '../../api/api';
import type { WhatsAppTemplate } from '../../api/types';

interface WhatsAppDirectSenderProps {
    templates: WhatsAppTemplate[];
}

export default function WhatsAppDirectSender({ templates }: WhatsAppDirectSenderProps) {
    const queryClient = useQueryClient();
    const [phone, setPhone] = useState('');
    const [clienteNombre, setClienteNombre] = useState('');
    const [message, setMessage] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const sendMut = useMutation({
        mutationFn: sendWhatsAppCustomMessage,
        onSuccess: (res) => {
            if (res.success) {
                toast.success('Mensaje enviado correctamente vía WhatsApp');
                setMessage('');
                queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
            } else {
                toast.error('El mensaje no pudo ser entregado por el proveedor de WhatsApp');
            }
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error al enviar mensaje';
            toast.error(msg);
        },
    });

    const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tId = e.target.value;
        setSelectedTemplateId(tId);
        const tpl = templates.find((t) => (t.id || t._id) === tId);
        if (tpl) {
            let rendered = tpl.mensaje;
            if (clienteNombre) {
                rendered = rendered.replace(/\{\{cliente\}\}/g, clienteNombre);
            }
            setMessage(rendered);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = phone.trim();
        if (!cleanPhone || !message.trim()) {
            toast.error('Ingresa el número telefónico y el mensaje');
            return;
        }

        sendMut.mutate({
            phone: cleanPhone,
            message: message.trim(),
            cliente_nombre: clienteNombre.trim() || undefined,
            origen: 'DIRECTO',
            variables: {
                cliente: clienteNombre || 'Estimado cliente',
            },
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Redacción de Mensaje */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Send size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Bandeja de Envío Inmediato
                        </h3>
                        <p className="text-xs text-gray-500">
                            Envía mensajes a cualquier cliente o prospecto directamente desde la plataforma.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSend} className="space-y-4 text-gray-900">
                    {/* Destinatario y Teléfono */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Número de WhatsApp (con o sin cód. país)
                            </label>
                            <div className="relative">
                                <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    required
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ej: 71234567 o 59171234567"
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-emerald-500 font-mono font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Nombre del Cliente (Opcional)
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={clienteNombre}
                                    onChange={(e) => setClienteNombre(e.target.value)}
                                    placeholder="Ej: Rodrigo Rayo"
                                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Selector de Plantilla */}
                    {templates.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <FileText size={13} className="text-indigo-600" />
                                    <span>Cargar Plantilla Preconfigurada</span>
                                </span>
                                <span className="text-[10px] text-gray-400">Autocompleta el texto</span>
                            </label>
                            <select
                                value={selectedTemplateId}
                                onChange={handleSelectTemplate}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-emerald-500 font-medium"
                            >
                                <option value="">Escribir mensaje libre...</option>
                                {templates.map((t) => (
                                    <option key={t.id || t._id} value={t.id || t._id}>
                                        [{t.categoria}] {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Texto del Mensaje */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Mensaje a Enviar
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escribe el mensaje que deseas enviar al cliente..."
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 text-gray-900 bg-white focus:outline-hidden focus:border-emerald-500 leading-relaxed font-sans"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={sendMut.isPending}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {sendMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            <span>Enviar por WhatsApp</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Vista Previa del Teléfono Móvil */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl relative overflow-hidden border border-slate-800">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-white tracking-tight">
                                Vista Previa del Cliente en WhatsApp
                            </span>
                        </div>
                        <span className="text-[11px] font-mono text-gray-400">WhatsApp Web UI</span>
                    </div>

                    {/* Cabecera simulada de chat */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
                            P
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">Tu Tienda Retail</p>
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <span>en línea</span>
                            </p>
                        </div>
                    </div>

                    {/* Burbuja del mensaje */}
                    <div className="py-6 flex justify-end">
                        <div className="max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-xs shadow-md space-y-1 text-xs leading-relaxed font-sans">
                            <p className="whitespace-pre-wrap">
                                {message ? message : 'El mensaje que escribas a la izquierda se previsualizará aquí exactamente como lo verá tu cliente en su celular.'}
                            </p>
                            <div className="text-right text-[10px] text-emerald-200/60 font-mono mt-1 flex items-center justify-end gap-1">
                                <span>11:42</span>
                                <span className="text-cyan-300 font-bold">✓✓</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>Los comprobantes y tickets POS se envían de forma idéntica a esta previsualización</span>
                </div>
            </div>
        </div>
    );
}
