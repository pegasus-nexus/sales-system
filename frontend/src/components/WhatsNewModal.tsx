import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, X, Check, ShoppingCart,
    DollarSign, SlidersHorizontal, LayoutGrid, Layers
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface WhatsNewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CURRENT_RELEASE_VERSION = 'v2026.11-pos-ergonomic';

export default function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
    const { role } = useAuthStore();
    const esMatriz = ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN'].includes(role || '');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[220] flex items-center justify-center bg-gray-950/70 backdrop-blur-md p-4 select-none"
                >
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col text-gray-900 border border-gray-100 max-h-[90vh]"
                    >
                        {/* Cabecera con Degradé Futurista */}
                        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl" />
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                                    <Sparkles className="w-6 h-6 text-indigo-300 animate-pulse" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                            Noviembre 2026
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">Pegasus Nexus v2.5</span>
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                                        Novedades & Nueva Experiencia POS
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-gray-300 hover:text-white shrink-0 relative z-10"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Contenido Dinámico */}
                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-sm">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Te presentamos la actualización más completa del Punto de Venta (POS) y la plataforma Pegasus, diseñada para máxima velocidad operativa, ergonomía y orden:
                            </p>

                            {/* 1. Rediseño Ergonómico de POS */}
                            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
                                <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                                    <ShoppingCart size={16} className="text-indigo-600" />
                                    <span>Punto de Venta Ergonómico (Estilo Odoo + iZi Solutions)</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-indigo-950 list-disc list-inside">
                                    <li>
                                        <strong>Teclado Táctil Integrado:</strong> Teclado numérico táctil para modificar cantidades, aplicar descuentos en porcentaje (%), ajustar precios o borrar ítems con un solo toque.
                                    </li>
                                    <li>
                                        <strong>Órdenes en Espera:</strong> Pestañas superiores para pausar un ticket y atender a otro cliente al instante (botón <b>+ Espera</b>).
                                    </li>
                                    <li>
                                        <strong>Modo Escritorio / Tablet:</strong> Puedes ocultar el teclado táctil con el botón <b>[⌨ Teclado]</b> para que la lista de productos del ticket aproveche el 100% de la altura de tu pantalla.
                                    </li>
                                    <li>
                                        <strong>Atajos Rápidos de Teclado Físico:</strong> Presiona <kbd className="px-1 py-0.5 bg-white border border-indigo-300 rounded text-[11px] font-mono">+</kbd> para sumar, <kbd className="px-1 py-0.5 bg-white border border-indigo-300 rounded text-[11px] font-mono">-</kbd> para restar, <kbd className="px-1 py-0.5 bg-white border border-indigo-300 rounded text-[11px] font-mono">Supr</kbd> para eliminar el ítem seleccionado, <kbd className="px-1 py-0.5 bg-white border border-indigo-300 rounded text-[11px] font-mono">F1</kbd> para buscar producto y <kbd className="px-1 py-0.5 bg-white border border-indigo-300 rounded text-[11px] font-mono">F2</kbd> para pagar.
                                    </li>
                                </ul>
                            </div>

                            {/* 2. Cobro en Efectivo Inteligente & Vuelto Gigante */}
                            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                                    <DollarSign size={16} className="text-emerald-600" />
                                    <span>Cobro Directo de Efectivo & Vuelto Gigante</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-emerald-950 list-disc list-inside">
                                    <li>
                                        <strong>Ingreso Directo del Monto Recibido:</strong> No pierdas tiempo sumando monedas. Si la venta es de Bs. 32 y el cliente te paga con un billete de 20, uno de 10 y una moneda de 5 (total Bs. 35), simplemente escribe <b>35</b> en la casilla de efectivo.
                                    </li>
                                    <li>
                                        <strong>Display de Vuelto Gigante:</strong> El cambio a devolver se muestra en números grandes y con alto contraste verde/negro para evitar cualquier error de cobro.
                                    </li>
                                    <li>
                                        <strong>Billetes Rápidos y Botón Exacto:</strong> Accesos directos a Bs. 10, 20, 50, 100, 200 y botón <b>Exacto</b> en un solo clic.
                                    </li>
                                </ul>
                            </div>

                            {/* 3. Personalización de Caja por Cajero */}
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                    <SlidersHorizontal size={16} className="text-amber-600" />
                                    <span>Personalización de Pantalla para Cada Cajero</span>
                                </div>
                                <p className="text-xs text-amber-950 leading-relaxed">
                                    Cada cajero puede personalizar su propia estación de cobro pulsando el botón <b>[⚙]</b> en el ticket: puedes elegir qué casillas de acceso rápido tener siempre a la vista (Descuentos, Vendedor comisionista, Factura/NIT, WhatsApp y Fecha histórica). Tu configuración se guarda automáticamente en tu navegador.
                                </p>
                            </div>

                            {/* 4. Lanzador de Apps & Control de Sucursales */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                    <LayoutGrid size={16} className="text-slate-600" />
                                    <span>Lanzador de Apps & Navegación Simplificada</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-800 list-disc list-inside">
                                    <li>
                                        <strong>Permisos Estrictos por Sucursal:</strong> El nuevo modal de <b>Apps</b> ahora filtra automáticamente los módulos según el rol del usuario: el personal de tienda y caja solo verá las herramientas a las que tiene acceso operativo.
                                    </li>
                                    <li>
                                        <strong>Barra Superior Despejada:</strong> Se retiró el selector redundante de sucursales para ofrecer una cabecera más amplia, limpia y libre de distracciones.
                                    </li>
                                </ul>
                            </div>

                            {/* 5. Novedades para Matriz y Administración SaaS */}
                            {esMatriz && (
                                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
                                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                                        <Layers size={16} className="text-purple-600" />
                                        <span>Gestión Multi-Tenant SaaS & Métricas MRR</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-purple-950 list-disc list-inside">
                                        <li>
                                            <strong>Separación de Empresas Activas y Archivadas:</strong> Pestañas dedicadas en el panel administrativo para organizar empresas sin borrar ningún dato histórico.
                                        </li>
                                        <li>
                                            <strong>Métricas en Vivo:</strong> Cálculo automático del Ingreso Mensual Recurrente (MRR), total de almacenes, ventas y consumo de almacenamiento por tenant.
                                        </li>
                                        <li>
                                            <strong>Limpieza de Caracteres:</strong> Normalización integral de textos, acentos y codificación UTF-8 en todo el sistema.
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Pie del Modal con Botón de Confirmación */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                            <span className="text-[11px] text-gray-500 font-medium">
                                Pegasus Sales System • Versión 2026.11
                            </span>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                            >
                                <Check size={14} />
                                <span>¡Excelente, Entendido!</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
