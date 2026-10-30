import { useState, useEffect, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ShoppingCart, Package, BarChart3, Receipt,
    Wallet, Users, Truck, Store, BookOpen, Settings,
    Search, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AppLauncherModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SystemApp {
    id: string;
    title: string;
    description: string;
    path: string;
    icon: ElementType;
    color: string;
    bgColor: string;
    roles?: string[];
    feature?: string;
    badge?: string;
}

const SYSTEM_APPS: SystemApp[] = [
    {
        id: 'pos',
        title: 'Punto de Venta',
        description: 'Ventas en vivo, cobro QR, efectivo y emisión de tickets',
        path: '/pos',
        icon: ShoppingCart,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20',
        badge: 'En vivo',
    },
    {
        id: 'inventario',
        title: 'Inventario & Stock',
        description: 'Control de almacenes, existencias, traslados y mermas',
        path: '/inventario',
        icon: Package,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20',
    },
    {
        id: 'bi',
        title: 'Inteligencia & BI',
        description: 'Métricas C-Level, analítica multi-sucursal y proyecciones',
        path: '/inteligencia',
        icon: BarChart3,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
        badge: 'C-Level',
    },
    {
        id: 'ventas',
        title: 'Ventas & Órdenes',
        description: 'Historial de ventas, cotizaciones y pedidos',
        path: '/ventas',
        icon: Receipt,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',
    },
    {
        id: 'caja',
        title: 'Caja & Arqueos',
        description: 'Aperturas, cierres de turno, gastos y movimientos',
        path: '/caja',
        icon: Wallet,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',
    },
    {
        id: 'clientes',
        title: 'Clientes & Créditos',
        description: 'Directorio de clientes, cuentas corrientes y límites',
        path: '/clientes',
        icon: Users,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
    },
    {
        id: 'proveedores',
        title: 'Proveedores & Compras',
        description: 'Órdenes de compra, recepciones y cuentas por pagar',
        path: '/proveedores',
        icon: Truck,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20',
    },
    {
        id: 'sucursales',
        title: 'Sucursales & Sedes',
        description: 'Gestión de tiendas, administradores y puntos de venta',
        path: '/sucursales',
        icon: Store,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20',
        roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'],
    },
    {
        id: 'contabilidad',
        title: 'Contabilidad',
        description: 'Plan de cuentas, balance general y libro diario',
        path: '/contabilidad',
        icon: BookOpen,
        color: 'text-teal-500',
        bgColor: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20',
        roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'],
    },
    {
        id: 'configuracion',
        title: 'Configuración',
        description: 'Parámetros del tenant, branding, usuarios y permisos',
        path: '/configuracion',
        icon: Settings,
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20',
        roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'],
    },
];

export default function AppLauncherModal({ isOpen, onClose }: AppLauncherModalProps) {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredApps = SYSTEM_APPS.filter(app => {
        if (app.roles && role && !app.roles.includes(role)) {
            return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            app.title.toLowerCase().includes(q) ||
            app.description.toLowerCase().includes(q)
        );
    });

    const handleSelectApp = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop con desenfoque */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-4xl bg-[#0f131c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header estilo Odoo */}
                    <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4 bg-gradient-to-r from-white/[0.03] to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    Aplicaciones del Sistema
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        Ecosistema Modular
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-400">
                                    Selecciona el módulo de trabajo operativo que deseas gestionar
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Barra de búsqueda interactiva */}
                    <div className="px-6 pt-4 pb-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar aplicación o herramienta..."
                                autoFocus
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-hidden focus:border-indigo-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Grilla de Aplicaciones */}
                    <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredApps.map((app) => {
                            const Icon = app.icon;
                            return (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelectApp(app.path)}
                                    className={`group text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 relative overflow-hidden ${app.bgColor}`}
                                >
                                    <div className={`w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${app.color}`}>
                                        <Icon size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors truncate">
                                                {app.title}
                                            </h4>
                                            {app.badge && (
                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 border border-white/10">
                                                    {app.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                                            {app.description}
                                        </p>
                                    </div>
                                    <ArrowRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </button>
                            );
                        })}

                        {filteredApps.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                <Package size={32} className="mx-auto text-gray-600 mb-2 opacity-50" />
                                <p className="text-sm">No se encontraron aplicaciones con ese término.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer informativo */}
                    <div className="px-6 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-[11px] text-gray-400">
                        <span>💡 Tip: Presiona <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-gray-300">ESC</kbd> para cerrar</span>
                        <span className="font-mono text-gray-500">Pegasus Modular Architecture</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
