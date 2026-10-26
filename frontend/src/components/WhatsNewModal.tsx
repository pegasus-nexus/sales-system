import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, ShieldCheck, RefreshCw, UserCheck, Package } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface WhatsNewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CURRENT_RELEASE_VERSION = 'v2026.10-release';

export default function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
    const { role } = useAuthStore();
    const esMatriz = ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN'].includes(role || '');
    const esSucursal = role === 'ADMIN_SUCURSAL';
    const esSupervisor = role === 'SUPERVISOR';

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
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-gray-900 border border-gray-100 max-h-[90vh]"
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
                                        <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/20">
                                            Octubre 2026
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">Pegasus Nexus</span>
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                                        Novedades & Mejoras del Sistema
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

                        {/* Contenido Dinámico Adaptado por Rol */}
                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-sm">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Hemos actualizado la plataforma con optimizaciones de rendimiento en la nube, personalización y nuevas herramientas para facilitar tu día a día:
                            </p>

                            {/* 1. Novedades para Todos: Mi Perfil y Navegación Limpia */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                                    <UserCheck size={16} />
                                    <span>Para Todo el Personal: Mi Perfil & Espacio Limpio</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-gray-700 list-disc list-inside">
                                    <li>
                                        <strong>Personaliza tu Perfil:</strong> Ahora puedes hacer clic en tu nombre o avatar (en la barra lateral izquierda) para subir tu propia <b>foto de perfil</b>, editar tu nombre y actualizar tu contraseña de forma segura.
                                    </li>
                                    <li>
                                        <strong>Pantalla Más Limpia:</strong> La barra superior fue simplificada para darte mayor área de trabajo. Puedes abrir el buscador de pantallas en cualquier momento presionando <b>Ctrl + K</b> (o Cmd + K).
                                    </li>
                                    <li>
                                        <strong>Acceso Más Rápido y Seguro:</strong> Se modernizó el sistema de inicio de sesión con encriptación ultrarrápida, eliminando bloqueos de conexión.
                                    </li>
                                </ul>
                            </div>

                            {/* 2. Novedad Exclusiva para Administradores de Sucursal */}
                            {esSucursal && (
                                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                                        <RefreshCw size={16} className="text-amber-700" />
                                        <span>Tu Nueva Herramienta: Cuadre de Inventario con Kárdex</span>
                                    </div>
                                    <p className="text-xs text-amber-900 leading-relaxed">
                                        Ahora dispones del botón <b>"Cuadrar con Kárdex"</b> en la pestaña de <i>Inventario &gt; Stock Actual</i>. Con un solo clic, el sistema revisa matemáticamente todas las entradas, salidas y ventas registradas en la bitácora de tu sucursal y alinea el stock físico real para que no existan desfases.
                                    </p>
                                </div>
                            )}

                            {/* 3. Novedad Exclusiva para Supervisores */}
                            {esSupervisor && (
                                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                                        <Package size={16} className="text-emerald-700" />
                                        <span>Historial de Ingresos Habilitado</span>
                                    </div>
                                    <p className="text-xs text-emerald-900 leading-relaxed">
                                        Se regularizaron los permisos de tu cuenta de Supervisión: ya puedes consultar con total normalidad las compras e <b>Historial de Ingresos</b> de tu sucursal sin ventanas de advertencia.
                                    </p>
                                </div>
                            )}

                            {/* 4. Novedades para Administración General (Matriz / SaaS) */}
                            {esMatriz && (
                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                                        <ShieldCheck size={16} className="text-indigo-700" />
                                        <span>Gobierno & Control Ejecutivo (Matriz)</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-indigo-950 list-disc list-inside">
                                        <li>
                                            <strong>Centro de Inteligencia (BI) Blindado:</strong> La plataforma de BI consolidado, rentabilidad y métricas de todas las sucursales ahora es de <b>acceso confidencial y exclusivo para Matriz</b>, quedando oculto de la vista de administradores de sucursal.
                                        </li>
                                        <li>
                                            <strong>Migración de Base de Datos Exitosa:</strong> Operando sobre el nuevo clúster de alta disponibilidad <i>Pegasus-Nexus</i> en MongoDB Atlas con 132,000+ registros sincronizados con 100% de paridad.
                                        </li>
                                        <li>
                                            <strong>Herramienta de Conciliación de Stock:</strong> Se dotó a los administradores de sucursal de un algoritmo de recálculo secuencial para auditar y cuadrar stock directamente contra el Kárdex de almacén.
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Pie del Modal con Botón de Confirmación */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                            <span className="text-[11px] text-gray-500 font-medium">
                                Pegasus Sales System • Versión 2026
                            </span>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
                            >
                                <Check size={14} />
                                <span>Entendido</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
