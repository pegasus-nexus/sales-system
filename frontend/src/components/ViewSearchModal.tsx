import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Wallet, ShoppingBag, RotateCcw,
    Tag, Store, Package, ClipboardList, Warehouse, Users,
    Percent, QrCode, BarChart3, Banknote, Truck, Settings, Shield,
    Briefcase, TrendingUp, X, Sparkles, ArrowRight, User as UserIcon, Loader2, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts, getClientes } from '../api/api';
import type { Product, Cliente } from '../api/types';

interface ViewItem {
    id: string;
    title: string;
    category: string;
    path: string;
    icon: React.ElementType;
    keywords: string[];
    roles?: string[];
}

export default function ViewSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Live entity results
    const [liveProducts, setLiveProducts] = useState<Product[]>([]);
    const [liveClients, setLiveClients] = useState<Cliente[]>([]);
    const [searchingEntities, setSearchingEntities] = useState(false);

    const ALL_VIEWS: ViewItem[] = [
        // Ventas & Operaciones
        { id: 'pos', title: 'Punto de Venta (POS)', category: 'Ventas & Caja', path: '/pos', icon: ShoppingBag, keywords: ['pos', 'vender', 'caja pos', 'cajero', 'punto de venta', 'ticket'] },
        { id: 'ventas', title: 'Historial de Ventas', category: 'Ventas & Caja', path: '/ventas', icon: RotateCcw, keywords: ['ventas', 'historial', 'tickets', 'facturas', 'facturador', 'anulaciones'] },
        { id: 'caja', title: 'Caja & Arqueo', category: 'Ventas & Caja', path: '/caja', icon: Wallet, keywords: ['caja', 'arqueo', 'abrir caja', 'cerrar caja', 'gastos', 'movimientos', 'efectivo'] },
        { id: 'creditos', title: 'Créditos & Cobranzas', category: 'Ventas & Caja', path: '/creditos', icon: Banknote, keywords: ['creditos', 'deuda', 'cobro', 'cuotas', 'pagos', 'cobranza', 'settle due'] },
        { id: 'whatsapp', title: 'WhatsApp Nexus', category: 'Ventas & Caja', path: '/whatsapp', icon: MessageSquare, keywords: ['whatsapp', 'mensajes', 'comprobantes', 'plantillas', 'notificaciones', 'chat'] },

        // Inventario & Productos
        { id: 'pedidos', title: 'Pedidos Internos (B2B)', category: 'Inventario & Logística', path: '/pedidos', icon: ClipboardList, keywords: ['pedidos', 'pedidos internos', 'solicitud stock', 'b2b', 'reposicion', 'despacho'] },
        { id: 'inventario', title: 'Inventario & Stock', category: 'Inventario & Logística', path: '/inventario', icon: Warehouse, keywords: ['inventario', 'stock', 'almacen', 'existencias', 'ajuste', 'escaner', 'barcode'] },
        { id: 'catalogo', title: 'Catálogo de Productos', category: 'Inventario & Logística', path: '/catalogo', icon: Package, keywords: ['catalogo', 'productos', 'precios', 'items', 'costos'] },
        { id: 'traslados', title: 'Traslados de Inventario', category: 'Inventario & Logística', path: '/traslados', icon: Truck, keywords: ['traslados', 'mover stock', 'envio entre sucursales'] },
        { id: 'categories', title: 'Categorías de Productos', category: 'Inventario & Logística', path: '/categories', icon: Tag, keywords: ['categorias', 'familias', 'grupos de productos'] },
        { id: 'descuentos', title: 'Promociones & Descuentos', category: 'Inventario & Logística', path: '/descuentos', icon: Percent, keywords: ['descuentos', 'promociones', 'ofertas'] },

        // Reportes & BI
        { id: 'bi', title: 'Panel General BI', category: 'Reportes & Inteligencia', path: '/reportes?tab=bi', icon: BarChart3, keywords: ['bi', 'analitica', 'inteligencia', 'panel general', 'kpi', 'metricas'] },
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
        if (!query.trim()) return ALL_VIEWS.slice(0, 7);
        const q = query.toLowerCase().trim();
        return ALL_VIEWS.filter(item => 
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.keywords.some(k => k.toLowerCase().includes(q))
        ).slice(0, 6);
    }, [query]);

    // Búsqueda en vivo de productos y clientes estilo Odoo 19 Command Palette
    useEffect(() => {
        const q = query.trim();
        if (q.length < 2) {
            setLiveProducts([]);
            setLiveClients([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchingEntities(true);
            try {
                const [prodsRes, clientsRes] = await Promise.allSettled([
                    getProducts(1, 4, q),
                    getClientes(q),
                ]);

                if (prodsRes.status === 'fulfilled' && prodsRes.value?.items) {
                    setLiveProducts(prodsRes.value.items.slice(0, 4));
                } else {
                    setLiveProducts([]);
                }

                if (clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value)) {
                    setLiveClients((clientsRes.value as Cliente[]).slice(0, 3));
                } else {
                    setLiveClients([]);
                }
            } catch {
                // Silencioso
            } finally {
                setSearchingEntities(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setLiveProducts([]);
            setLiveClients([]);
        }
    }, [isOpen]);

    const handleSelectView = (item: ViewItem) => {
        onClose();
        navigate(item.path);
    };

    const handleSelectProduct = (p: Product) => {
        onClose();
        navigate(`/catalogo?q=${encodeURIComponent(p.descripcion)}`);
    };

    const handleSelectClient = (c: Cliente) => {
        onClose();
        navigate(`/clientes?q=${encodeURIComponent(c.nombre)}`);
    };

    const totalResultsCount = filteredViews.length + liveProducts.length + liveClients.length;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResultsCount));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalResultsCount) % Math.max(1, totalResultsCount));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Determinar qué ítem está seleccionado según selectedIndex
            if (selectedIndex < filteredViews.length) {
                handleSelectView(filteredViews[selectedIndex]);
            } else if (selectedIndex < filteredViews.length + liveProducts.length) {
                const pIdx = selectedIndex - filteredViews.length;
                handleSelectProduct(liveProducts[pIdx]);
            } else {
                const cIdx = selectedIndex - filteredViews.length - liveProducts.length;
                if (liveClients[cIdx]) handleSelectClient(liveClients[cIdx]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-20 px-4 select-none">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-gray-900 max-h-[85vh]"
                >
                    {/* Header Input con estilo Odoo Command Palette */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/70">
                        <Search size={20} className="text-indigo-600 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe para buscar vistas, productos o clientes..."
                            className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none"
                        />
                        {searchingEntities && (
                            <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0" />
                        )}
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                                <X size={16} />
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg shadow-2xs font-mono">
                                ESC
                            </kbd>
                            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" title="Cerrar (ESC)">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Results Container con Secciones Odoo */}
                    <div className="overflow-y-auto p-3 space-y-3.5 custom-scrollbar flex-1">
                        {/* Seccion 1: Vistas y Modulos */}
                        {filteredViews.length > 0 && (
                            <div className="space-y-1">
                                <div className="px-3 py-1 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                    Vistas y Módulos
                                </div>
                                {filteredViews.map((item, index) => {
                                    const IconComponent = item.icon;
                                    const isSelected = index === selectedIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectView(item)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                                    : 'text-gray-700 hover:bg-gray-100/70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                    <IconComponent size={14} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold truncate">{item.title}</p>
                                                    <p className={`text-[10px] font-medium truncate ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                        {item.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {item.path}
                                                </span>
                                                <ArrowRight size={13} className={isSelected ? 'text-white' : 'opacity-0'} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Seccion 2: Productos en Vivo (Odoo Palette) */}
                        {liveProducts.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-gray-100">
                                <div className="px-3 py-1 text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1">
                                    <Package size={11} /> Productos en Catálogo
                                </div>
                                {liveProducts.map((p, pIdx) => {
                                    const globalIndex = filteredViews.length + pIdx;
                                    const isSelected = globalIndex === selectedIndex;
                                    return (
                                        <button
                                            key={p._id}
                                            onClick={() => handleSelectProduct(p)}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                                    : 'text-gray-700 hover:bg-gray-100/70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    <Package size={14} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold truncate">{p.descripcion}</p>
                                                    <p className={`text-[10px] font-mono truncate ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                        Cod: {p.codigo_largo || p.codigo_corto || p.codigo_sistema || 'S/C'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-xs font-black font-mono ${
                                                    isSelected ? 'text-white' : 'text-emerald-600'
                                                }`}>
                                                    Bs. {(p.precio_venta || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Seccion 3: Clientes en Vivo (Odoo Palette) */}
                        {liveClients.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-gray-100">
                                <div className="px-3 py-1 text-[10px] font-black uppercase text-cyan-600 tracking-wider flex items-center gap-1">
                                    <UserIcon size={11} /> Clientes Registrados
                                </div>
                                {liveClients.map((c, cIdx) => {
                                    const globalIndex = filteredViews.length + liveProducts.length + cIdx;
                                    const isSelected = globalIndex === selectedIndex;
                                    return (
                                        <button
                                            key={c._id}
                                            onClick={() => handleSelectClient(c)}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                                    : 'text-gray-700 hover:bg-gray-100/70'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-cyan-50 text-cyan-600'
                                                }`}>
                                                    <UserIcon size={14} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold truncate">{c.nombre}</p>
                                                    <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                        NIT: {c.nit_ci || 'S/N'} • Tel: {c.telefono || 'S/T'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-[11px] font-bold ${
                                                    isSelected ? 'text-white' : 'text-indigo-600'
                                                }`}>
                                                    Ver Cliente →
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {totalResultsCount === 0 && (
                            <div className="py-10 text-center text-gray-400 text-xs">
                                No se encontraron vistas, productos ni clientes coincidentes con "<strong className="text-gray-700">{query}</strong>"
                            </div>
                        )}
                    </div>

                    {/* Footer estilo Odoo Command Palette */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                        <div className="flex items-center gap-3">
                            <span><kbd className="bg-white border px-1 rounded shadow-2xs font-mono">↑↓</kbd> Navegar</span>
                            <span><kbd className="bg-white border px-1 rounded shadow-2xs font-mono">↵</kbd> Abrir</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                            <Sparkles size={13} className="text-indigo-500" />
                            <span>TIP — Abre con <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700 font-mono text-[10px]">Ctrl + K</kbd></span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
