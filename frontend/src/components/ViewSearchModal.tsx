import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, LayoutDashboard, Wallet, ShoppingBag, RotateCcw,
    Tag, Store, Package, ClipboardList, Warehouse, Users,
    Percent, QrCode, BarChart3, Banknote, Truck, Settings, Shield,
    Briefcase, TrendingUp, X, Sparkles, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ViewItem {
    id: string;
    title: string;
    category: string;
    path: string;
    icon: any;
    keywords: string[];
    roles?: string[];
}

export default function ViewSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const ALL_VIEWS: ViewItem[] = [
        // Ventas & Operaciones
        { id: 'pos', title: 'Punto de Venta (POS)', category: 'Ventas & Caja', path: '/pos', icon: ShoppingBag, keywords: ['pos', 'vender', 'caja pos', 'cajero', 'punto de venta', 'ticket'] },
        { id: 'ventas', title: 'Historial de Ventas', category: 'Ventas & Caja', path: '/ventas', icon: RotateCcw, keywords: ['ventas', 'historial', 'tickets', 'facturas', 'facturador', 'anulaciones'] },
        { id: 'caja', title: 'Caja & Arqueo', category: 'Ventas & Caja', path: '/caja', icon: Wallet, keywords: ['caja', 'arqueo', 'abrir caja', 'cerrar caja', 'gastos', 'movimientos', 'efectivo'] },
        { id: 'creditos', title: 'Créditos & Cobranzas', category: 'Ventas & Caja', path: '/creditos', icon: Banknote, keywords: ['creditos', 'deuda', 'cobro', 'cuotas', 'pagos', 'cobranza'] },

        // Inventario & Productos
        { id: 'pedidos', title: 'Pedidos Internos (B2B)', category: 'Inventario & Logística', path: '/pedidos', icon: ClipboardList, keywords: ['pedidos', 'pedidos internos', 'solicitud stock', 'b2b', 'reposicion', 'despacho'] },
        { id: 'inventario', title: 'Inventario & Stock', category: 'Inventario & Logística', path: '/inventario', icon: Warehouse, keywords: ['inventario', 'stock', 'almacen', 'existencias', 'ajuste'] },
        { id: 'catalogo', title: 'Catálogo de Productos', category: 'Inventario & Logística', path: '/catalogo', icon: Package, keywords: ['catalogo', 'productos', 'precios', 'items', 'costos'] },
        { id: 'traslados', title: 'Traslados de Inventario', category: 'Inventario & Logística', path: '/traslados', icon: Truck, keywords: ['traslados', 'mover stock', 'envio entre sucursales'] },
        { id: 'categories', title: 'Categorías de Productos', category: 'Inventario & Logística', path: '/categories', icon: Tag, keywords: ['categorias', 'familias', 'grupos de productos'] },
        { id: 'descuentos', title: 'Promociones & Descuentos', category: 'Inventario & Logística', path: '/descuentos', icon: Percent, keywords: ['descuentos', 'promociones', 'ofertas'] },

        // Reportes & BI
        { id: 'inteligencia', title: 'Plataforma Analítica (BI)', category: 'Reportes & Inteligencia', path: '/inteligencia', icon: BarChart3, keywords: ['bi', 'analitica', 'inteligencia', 'dashboards', 'kpi', 'bcg'] },
        { id: 'reportes_fin', title: 'Reportes Financieros', category: 'Reportes & Inteligencia', path: '/reportes?tab=financiero', icon: TrendingUp, keywords: ['reportes', 'finanzas', 'ganancias', 'margen', 'utilidad'] },
        { id: 'reportes_diario', title: 'Reporte Diario', category: 'Reportes & Inteligencia', path: '/reportes?tab=diario', icon: TrendingUp, keywords: ['reporte diario', 'cierre del dia', 'resumen hoy'] },

        // Gestión & Contactos
        { id: 'sucursales', title: 'Gestión de Sucursales', category: 'Gestión & Contactos', path: '/sucursales', icon: Store, keywords: ['sucursales', 'locales', 'tiendas', 'matriz'] },
        { id: 'usuarios', title: 'Usuarios & Personal', category: 'Gestión & Contactos', path: '/usuarios', icon: Users, keywords: ['usuarios', 'personal', 'empleados', 'cajeros', 'roles'] },
        { id: 'clientes', title: 'Clientes', category: 'Gestión & Contactos', path: '/clientes', icon: Users, keywords: ['clientes', 'compradores', 'nit', 'razon social'] },
        { id: 'proveedores', title: 'Proveedores', category: 'Gestión & Contactos', path: '/proveedores', icon: Briefcase, keywords: ['proveedores', 'compras', 'marcas'] },
        { id: 'qr_control', title: 'Control QR & Pagos Digitales', category: 'Gestión & Contactos', path: '/qr-control', icon: QrCode, keywords: ['qr', 'banco', 'confirmacion qr', 'transferencias'] },

        // Sistema
        { id: 'comunidad', title: 'Comunidad', category: 'Sistema & Ajustes', path: '/comunidad', icon: Users, keywords: ['comunidad', 'red'] },
        { id: 'configuracion', title: 'Configuración del Sistema', category: 'Sistema & Ajustes', path: '/configuracion', icon: Settings, keywords: ['configuracion', 'empresa', 'logo', 'ticket layout'] },
        { id: 'auditoria', title: 'Auditoría & Historial de Cambios', category: 'Sistema & Ajustes', path: '/auditoria', icon: Shield, keywords: ['auditoria', 'logs', 'seguridad', 'cambios'] },
    ];

    const filteredViews = useMemo(() => {
        if (!query.trim()) return ALL_VIEWS.slice(0, 8);
        const q = query.toLowerCase().trim();
        return ALL_VIEWS.filter(item => 
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.keywords.some(k => k.toLowerCase().includes(q))
        );
    }, [query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const handleSelect = (item: ViewItem) => {
        onClose();
        navigate(item.path);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredViews.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredViews.length) % Math.max(1, filteredViews.length));
        } else if (e.key === 'Enter' && filteredViews[selectedIndex]) {
            e.preventDefault();
            handleSelect(filteredViews[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
                >
                    {/* Header Input */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50/50">
                        <Search size={20} className="text-indigo-600 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Buscar vista (ej. Pedidos, Ventas, Caja, Inventario...)"
                            className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X size={16} />
                            </button>
                        )}
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md shadow-xs">
                            ESC
                        </kbd>
                    </div>

                    {/* Results List */}
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {filteredViews.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">
                                No se encontraron vistas para "<strong className="text-gray-700">{query}</strong>"
                            </div>
                        ) : (
                            filteredViews.map((item, index) => {
                                const IconComponent = item.icon;
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                                            isSelected 
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                                <IconComponent size={16} />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-bold truncate">{item.title}</p>
                                                <p className={`text-[10px] font-medium truncate ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                    {item.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {item.path}
                                            </span>
                                            <ArrowRight size={14} className={isSelected ? 'text-white' : 'opacity-0'} />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                        <div className="flex items-center gap-3">
                            <span><kbd className="bg-white border px-1 rounded">↑↓</kbd> Navegar</span>
                            <span><kbd className="bg-white border px-1 rounded">↵</kbd> Abrir vista</span>
                        </div>
                        <div className="flex items-center gap-1 text-indigo-600 font-bold">
                            <Sparkles size={12} /> Búsqueda Rápida
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
