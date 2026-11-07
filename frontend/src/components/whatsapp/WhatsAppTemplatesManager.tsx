import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Sparkles, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createWhatsAppTemplate, updateWhatsAppTemplate, deleteWhatsAppTemplate } from '../../api/api';
import type { WhatsAppTemplate } from '../../api/types';

interface WhatsAppTemplatesManagerProps {
    templates: WhatsAppTemplate[];
    isLoading: boolean;
}

const VARIABLE_TAGS = [
    { tag: '{{cliente}}', desc: 'Nombre del cliente' },
    { tag: '{{total}}', desc: 'Monto total venta' },
    { tag: '{{saldo_pendiente}}', desc: 'Saldo deudor' },
    { tag: '{{empresa}}', desc: 'Nombre de la tienda' },
    { tag: '{{pedido}}', desc: 'Nº de pedido' },
    { tag: '{{puntos}}', desc: 'Puntos fidelización' },
];

export default function WhatsAppTemplatesManager({ templates, isLoading }: WhatsAppTemplatesManagerProps) {
    const queryClient = useQueryClient();
    const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);

    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('POS');
    const [mensaje, setMensaje] = useState('');
    const [isDefault, setIsDefault] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
                Cargando plantillas de WhatsApp...
            </div>
        );
    }

    const openCreateModal = () => {
        setEditingTemplate(null);
        setNombre('');
        setCategoria('POS');
        setMensaje('Hola {{cliente}}, gracias por tu compra en {{empresa}} por un total de {{total}}.');
        setIsDefault(false);
        setIsEditingModalOpen(true);
    };

    const openEditModal = (tpl: WhatsAppTemplate) => {
        setEditingTemplate(tpl);
        setNombre(tpl.nombre);
        setCategoria(tpl.categoria);
        setMensaje(tpl.mensaje);
        setIsDefault(tpl.is_default);
        setIsEditingModalOpen(true);
    };

    const createMut = useMutation({
        mutationFn: createWhatsAppTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
            toast.success('Plantilla creada con éxito');
            setIsEditingModalOpen(false);
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WhatsAppTemplate> }) =>
            updateWhatsAppTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
            toast.success('Plantilla actualizada');
            setIsEditingModalOpen(false);
        },
    });

    const deleteMut = useMutation({
        mutationFn: deleteWhatsAppTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
            toast.success('Plantilla eliminada');
        },
    });

    const handleInsertVariable = (tag: string) => {
        setMensaje(prev => prev + ' ' + tag);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !mensaje.trim()) {
            toast.error('Completa el nombre y el mensaje');
            return;
        }

        if (editingTemplate) {
            updateMut.mutate({
                id: editingTemplate.id || editingTemplate._id!,
                data: { nombre, categoria, mensaje, is_default: isDefault },
            });
        } else {
            createMut.mutate({
                nombre,
                categoria,
                mensaje,
                is_default: isDefault,
            });
        }
    };

    // Previsualización interactiva con datos simulados
    const previewRenderedText = mensaje
        .replace(/\{\{cliente\}\}/g, 'Juan Pérez')
        .replace(/\{\{total\}\}/g, 'Bs. 125.00')
        .replace(/\{\{saldo_pendiente\}\}/g, 'Bs. 350.00')
        .replace(/\{\{empresa\}\}/g, 'Pegasus Store')
        .replace(/\{\{pedido\}\}/g, '#1042')
        .replace(/\{\{puntos\}\}/g, '45 pts');

    return (
        <div className="space-y-6">
            {/* Header y Botón Nueva Plantilla */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        <span>Plantillas de Mensajes Dinámicas (Odoo Style)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Define formatos predeterminados para enviar tickets POS, cobro de deudas, confirmaciones y avisos.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                    <Plus size={15} />
                    <span>Nueva Plantilla</span>
                </button>
            </div>

            {/* Grilla de Plantillas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((tpl) => (
                    <div
                        key={tpl.id || tpl._id}
                        className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-4"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    tpl.categoria === 'POS'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : tpl.categoria === 'CREDITOS'
                                        ? 'bg-rose-100 text-rose-700'
                                        : tpl.categoria === 'PEDIDOS'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {tpl.categoria}
                                </span>
                                {tpl.is_default && (
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        ★ Predeterminada
                                    </span>
                                )}
                            </div>

                            <h4 className="text-sm font-bold text-gray-900">{tpl.nombre}</h4>

                            {/* Burbuja simulada estilo WhatsApp */}
                            <div className="p-3 bg-[#e7f8e8] border border-[#c3ebc5] rounded-2xl rounded-tl-xs text-xs text-gray-800 leading-relaxed font-sans shadow-2xs">
                                <p className="whitespace-pre-wrap">{tpl.mensaje}</p>
                                <div className="text-right text-[10px] text-gray-400 font-mono mt-1 flex items-center justify-end gap-1">
                                    <span>10:45 AM</span>
                                    <span className="text-emerald-600 font-black">✓✓</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => openEditModal(tpl)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <Edit2 size={13} />
                                <span>Editar</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(`¿Eliminar plantilla "${tpl.nombre}"?`)) {
                                        deleteMut.mutate(tpl.id || tpl._id!);
                                    }
                                }}
                                className="px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Crear / Editar Plantilla */}
            {isEditingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">
                                {editingTemplate ? 'Editar Plantilla de WhatsApp' : 'Nueva Plantilla de WhatsApp'}
                            </h3>
                            <button
                                onClick={() => setIsEditingModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-gray-900">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre de la Plantilla</label>
                                <input
                                    required
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Recordatorio Amistoso de Cuota"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                                    <select
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500 font-medium"
                                    >
                                        <option value="POS">Venta / POS (Comprobante)</option>
                                        <option value="CREDITOS">Cobro de Deudas / Créditos</option>
                                        <option value="PEDIDOS">Confirmación de Pedidos</option>
                                        <option value="MARKETING">Promoción y Fidelización</option>
                                        <option value="GENERAL">General</option>
                                    </select>
                                </div>

                                <div className="flex items-center pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isDefault}
                                            onChange={(e) => setIsDefault(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <span className="text-xs font-bold text-gray-700">Predeterminada de categoría</span>
                                    </label>
                                </div>
                            </div>

                            {/* Chips de Variables Insertables */}
                            <div>
                                <span className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Haz clic para insertar variables dinámicas:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {VARIABLE_TAGS.map((v) => (
                                        <button
                                            key={v.tag}
                                            type="button"
                                            onClick={() => handleInsertVariable(v.tag)}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                                            title={v.desc}
                                        >
                                            + {v.tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Textarea del Mensaje */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Texto del Mensaje</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={mensaje}
                                    onChange={(e) => setMensaje(e.target.value)}
                                    placeholder="Escribe el mensaje que recibirá el cliente..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white focus:outline-hidden focus:border-indigo-500"
                                />
                            </div>

                            {/* Previsualización en Vivo */}
                            <div>
                                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Vista Previa en Vivo (Simulación del Cliente):
                                </span>
                                <div className="p-3.5 bg-[#e7f8e8] border border-[#c3ebc5] rounded-2xl rounded-tl-xs text-xs text-gray-800 leading-relaxed shadow-2xs font-sans">
                                    <p className="whitespace-pre-wrap">{previewRenderedText}</p>
                                    <div className="text-right text-[10px] text-gray-400 font-mono mt-1 flex items-center justify-end gap-1">
                                        <span>10:45 AM</span>
                                        <span className="text-emerald-600 font-black">✓✓</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditingModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMut.isPending || updateMut.isPending}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <Check size={14} />
                                    <span>Guardar Plantilla</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
