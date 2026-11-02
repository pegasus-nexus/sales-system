import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Tag, User as UserIcon, FileText, MessageSquare, Calendar } from 'lucide-react';

export type POSQuickWidget = 'descuento' | 'vendedor' | 'nit' | 'whatsapp' | 'fecha';

interface POSCustomizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    pinnedWidgets: POSQuickWidget[];
    onToggleWidget: (widget: POSQuickWidget) => void;
    canEditDate: boolean;
    hasWhatsApp: boolean;
}

export function POSCustomizeModal({
    isOpen,
    onClose,
    pinnedWidgets,
    onToggleWidget,
    canEditDate,
    hasWhatsApp,
}: POSCustomizeModalProps) {
    if (!isOpen) return null;

    const options: { id: POSQuickWidget; label: string; desc: string; icon: React.ReactNode; visible: boolean }[] = [
        {
            id: 'descuento',
            label: 'Descuentos Rápidos',
            desc: 'Aplica promociones y descuentos directamente en el ticket sin abrir ventanas.',
            icon: <Tag size={16} className="text-amber-600" />,
            visible: true,
        },
        {
            id: 'vendedor',
            label: 'Vendedor Comisionista',
            desc: 'Selecciona el vendedor asignado para comisiones directamente en el ticket.',
            icon: <UserIcon size={16} className="text-indigo-600" />,
            visible: true,
        },
        {
            id: 'nit',
            label: 'Solicitud de Factura (NIT)',
            desc: 'Casilla rápida para activar NIT y razón social directamente en la vista.',
            icon: <FileText size={16} className="text-blue-600" />,
            visible: true,
        },
        {
            id: 'whatsapp',
            label: 'Comprobante por WhatsApp',
            desc: 'Switch para disparar el recibo por WhatsApp sin entrar a acciones.',
            icon: <MessageSquare size={16} className="text-emerald-600" />,
            visible: hasWhatsApp,
        },
        {
            id: 'fecha',
            label: 'Fecha de Venta (Histórica)',
            desc: 'Selector de fecha retroactiva para regularizaciones rápidas.',
            icon: <Calendar size={16} className="text-purple-600" />,
            visible: canEditDate,
        },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col"
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <SlidersHorizontal size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Personalizar mi Caja</h3>
                                <p className="text-[11px] text-gray-500">Elige qué accesos rápidos tener fijos en tu ticket.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Lista de Casillas */}
                    <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
                        {options.filter((o) => o.visible).map((opt) => {
                            const isChecked = pinnedWidgets.includes(opt.id);
                            return (
                                <label
                                    key={opt.id}
                                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                                        isChecked
                                            ? 'bg-indigo-50/60 border-indigo-200'
                                            : 'bg-white hover:bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => onToggleWidget(opt.id)}
                                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {opt.icon}
                                            <span className="text-xs font-bold text-gray-900">{opt.label}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{opt.desc}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                            Guardar Preferencias
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
