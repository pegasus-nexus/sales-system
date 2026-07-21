import React, { useState } from 'react';
import {
    LayoutDashboard, Wallet, ShoppingBag, LogOut,
    Tag, Store, Package, ClipboardList, Warehouse, Users,
    Menu, Percent, RotateCcw, X, QrCode, BarChart3, Banknote, Truck, Settings, Building, Layers, Shield,
    Briefcase, ChevronDown, TrendingUp, FileText, DollarSign, Clock, Ban
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLocalStorage } from 'usehooks-ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'framer-motion';
import { getMe, pingUser } from '../api/api';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LayoutProps {
    children: React.ReactNode;
}

interface NavSubItem {
    icon: any;
    label: string;
    path: string;
    feature: string | null;
    roles: string[];
}

interface NavGroup {
    groupKey: string;
    title: string;
    icon: any;
    items: NavSubItem[];
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout, user, role, hasFeature } = useAuthStore();

    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useLocalStorage('choco-sidebar-collapsed', false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Estado de acordeones desplegables
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        dashboard: true,
        ventas_caja: true,
        analitica_reportes: true,
        inventario_productos: true,
        gestion_contactos: false,
        sistema: false
    });

    React.useEffect(() => {
        pingUser().catch(() => {});
        const interval = setInterval(() => {
            pingUser().catch(() => {});
        }, 45000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        logout();
        navigate('/login');
    };

    const isItemActive = (itemPath: string) => {
        const fullPath = location.pathname + location.search;
        if (itemPath.includes('?')) {
            return fullPath === itemPath;
        }
        return location.pathname === itemPath || (itemPath !== '/' && location.pathname.startsWith(itemPath) && !location.search);
    };

    const getNavGroups = (): NavGroup[] => {
        if (role === 'SUPERADMIN') {
            return [
                {
                    groupKey: 'saas',
                    title: 'Administración SaaS',
                    icon: Building,
                    items: [
                        { icon: LayoutDashboard, label: 'Panel SaaS', path: '/admin/dashboard', feature: null, roles: ['SUPERADMIN'] },
                        { icon: Building, label: 'Empresas', path: '/admin/empresas', feature: null, roles: ['SUPERADMIN'] },
                        { icon: Layers, label: 'Planes', path: '/admin/planes', feature: null, roles: ['SUPERADMIN'] },
                        { icon: BarChart3, label: 'Plataforma Analítica', path: '/inteligencia', feature: null, roles: ['SUPERADMIN'] },
                        { icon: TrendingUp, label: 'Evolución Mensual', path: '/reportes?tab=evolucion_mensual', feature: null, roles: ['SUPERADMIN'] },
                        { icon: Shield, label: 'Auditoría', path: '/auditoria', feature: null, roles: ['SUPERADMIN'] },
                    ]
                }
            ];
        }

        const rawGroups: NavGroup[] = [
            {
                groupKey: 'dashboard',
                title: 'Principal',
                icon: LayoutDashboard,
                items: [
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard-sucursal', feature: null, roles: ['ADMIN_SUCURSAL'] },
                ]
            },
            {
                groupKey: 'analitica_reportes',
                title: 'Analítica & Reportes',
                icon: BarChart3,
                items: [
                    { icon: BarChart3, label: 'Plataforma Analítica BI', path: '/inteligencia', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: TrendingUp, label: 'Evolución Mensual (MoM)', path: '/reportes?tab=evolucion_mensual', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: FileText, label: 'Reporte de Jornada', path: '/reportes?tab=daily', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: DollarSign, label: 'Finanzas y Márgenes', path: '/reportes?tab=finanzas', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Wallet, label: 'Reporte de Gastos', path: '/reportes?tab=gastos', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Clock, label: 'Ventas por Hora', path: '/reportes?tab=hourly', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Package, label: 'Inventario Valorado', path: '/reportes?tab=inventario_valorado', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Users, label: 'Desempeño Staff', path: '/reportes?tab=staff', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Store, label: 'Matriz BCG', path: '/reportes?tab=matriz_bcg', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Ban, label: 'Anulaciones', path: '/reportes?tab=anulaciones', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Users, label: 'Compras por Cliente', path: '/reportes?tab=compras_cliente', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                ]
            },
            {
                groupKey: 'ventas_caja',
                title: 'Ventas & Caja',
                icon: ShoppingBag,
                items: [
                    { icon: ShoppingBag, label: 'POS (Punto de Venta)', path: '/pos', feature: 'VENTAS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: RotateCcw, label: 'Ventas', path: '/ventas', feature: 'VENTAS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'FACTURADOR', 'CAJERO'] },
                    { icon: Wallet, label: 'Caja', path: '/caja', feature: 'CAJA', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Banknote, label: 'Créditos', path: '/creditos', feature: 'CREDITOS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                ]
            },
            {
                groupKey: 'inventario_productos',
                title: 'Inventario & Productos',
                icon: Package,
                items: [
                    { icon: Package, label: 'Catálogo', path: '/catalogo', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Warehouse, label: 'Inventario', path: '/inventario', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: Tag, label: 'Categorías', path: '/categories', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'] },
                    { icon: Truck, label: 'Traslados', path: '/traslados', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: ClipboardList, label: 'Pedidos Internos', path: '/pedidos', feature: 'PEDIDOS_INTERNOS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: Percent, label: 'Descuentos', path: '/descuentos', feature: 'DESCUENTOS_AVANZADOS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'] },
                    { icon: Tag, label: 'Solicitudes Precio', path: '/solicitudes-precio', feature: 'LISTAS_PRECIOS', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                ]
            },
            {
                groupKey: 'gestion_contactos',
                title: 'Gestión & Contactos',
                icon: Users,
                items: [
                    { icon: Store, label: 'Sucursales', path: '/sucursales', feature: 'MULTI_SUCURSAL', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: Users, label: 'Personal', path: '/usuarios', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR'] },
                    { icon: Users, label: 'Clientes', path: '/clientes', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Briefcase, label: 'Proveedores', path: '/proveedores', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR'] },
                    { icon: QrCode, label: 'Control QR', path: '/qr-control', feature: 'CONTROL_QR', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'USER', 'SUPERVISOR'] },
                ]
            },
            {
                groupKey: 'sistema',
                title: 'Sistema & Auditoría',
                icon: Settings,
                items: [
                    { icon: Users, label: 'Comunidad', path: '/comunidad', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Settings, label: 'Configuración', path: '/configuracion', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: Shield, label: 'Auditoría', path: '/auditoria', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                ]
            }
        ];

        return rawGroups.map(group => {
            const filteredItems = group.items.filter(item => {
                if (!item.roles.includes(role ?? '')) return false;
                if (['/pos', '/ventas', '/caja', '/inventario', '/creditos', '/qr-control'].includes(item.path)) {
                    return true;
                }
                return !item.feature || hasFeature(item.feature);
            });
            return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0);
    };

    const navGroups = getNavGroups();
    const allFlatNavItems = navGroups.flatMap(g => g.items);
    const mobileBottomItems = allFlatNavItems.slice(0, 4);

    // Desplegar automáticamente el grupo que contenga la ruta activa
    React.useEffect(() => {
        navGroups.forEach(g => {
            if (g.items.some(item => isItemActive(item.path))) {
                setOpenGroups(prev => ({ ...prev, [g.groupKey]: true }));
            }
        });
    }, [location.pathname, location.search]);

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* ── Desktop Sidebar ── */}
                <aside className={cn("hidden md:flex flex-col p-4 gap-4 transition-all duration-300 relative select-none", isCollapsed ? "w-20" : "w-56")}>

                    {/* Header (Menu Toggle + Brand) */}
                    <div className="flex items-center gap-3 px-1 h-8">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                        >
                            <Menu size={20} />
                        </button>
                        <div className={cn("flex items-center overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            <span className="text-base font-bold tracking-tight whitespace-nowrap">Sales System</span>
                        </div>
                    </div>

                    {/* Navigation Groups (Desplegables) */}
                    <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                        {navGroups.map((group) => {
                            const isGroupActive = group.items.some(item => isItemActive(item.path));
                            const isOpen = !!openGroups[group.groupKey];

                            // Si el grupo solo tiene 1 ítem (ej. Dashboard), renderizar ítem directo
                            if (group.items.length === 1) {
                                const singleItem = group.items[0];
                                const isActive = isItemActive(singleItem.path);
                                return (
                                    <Link
                                        key={singleItem.path}
                                        to={singleItem.path}
                                        title={isCollapsed ? singleItem.label : undefined}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-sm shrink-0',
                                            isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'py-2.5 px-3',
                                            isActive
                                                ? 'bg-white text-black shadow-lg shadow-white/10 font-bold'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <singleItem.icon size={isCollapsed ? 18 : 16} className={cn("transition-colors shrink-0", isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                                        <div className={cn("overflow-hidden transition-all duration-300 flex items-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                            <span className="whitespace-nowrap">{singleItem.label}</span>
                                        </div>
                                    </Link>
                                );
                            }

                            return (
                                <div key={group.groupKey} className="flex flex-col gap-0.5">
                                    {/* Cabecera del Grupo Desplegable */}
                                    {!isCollapsed ? (
                                        <button
                                            onClick={() => toggleGroup(group.groupKey)}
                                            className={cn(
                                                "w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
                                                isGroupActive ? "text-indigo-400 bg-white/5" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <group.icon size={15} className={cn("transition-colors", isGroupActive ? "text-indigo-400" : "text-gray-400")} />
                                                <span>{group.title}</span>
                                            </div>
                                            <ChevronDown size={14} className={cn("transition-transform duration-200 text-gray-500", isOpen ? "rotate-180 text-white" : "")} />
                                        </button>
                                    ) : (
                                        <div className="w-full text-center py-1">
                                            <div className="w-8 h-0.5 bg-gray-800 mx-auto my-1 rounded-full"></div>
                                        </div>
                                    )}

                                    {/* Sub-ítems desplegables */}
                                    {(isOpen || isCollapsed) && (
                                        <div className={cn("flex flex-col gap-1 transition-all", !isCollapsed ? "pl-2 ml-2 border-l border-white/10" : "")}>
                                            {group.items.map((item) => {
                                                const isActive = isItemActive(item.path);
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        title={isCollapsed ? item.label : undefined}
                                                        className={cn(
                                                            'flex items-center gap-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-sm shrink-0',
                                                            isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'py-2 px-3',
                                                            isActive
                                                                ? 'bg-white text-black shadow-lg shadow-white/10 font-bold'
                                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                        )}
                                                    >
                                                        <item.icon size={isCollapsed ? 18 : 15} className={cn("transition-colors shrink-0", isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                                                        <div className={cn("overflow-hidden transition-all duration-300 flex items-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                                            <span className="whitespace-nowrap font-medium text-xs">{item.label}</span>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="mt-auto pt-3 border-t border-gray-800 flex flex-col gap-2">
                        <div className={cn("flex items-center gap-2 p-1 rounded-xl", isCollapsed ? "justify-center" : "")}>
                            <div className="w-8 h-8 rounded-full border-2 border-gray-700 bg-white/10 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-white uppercase">
                                    {(user?.username || 'U')[0].toUpperCase()}
                                </span>
                            </div>
                            <div className={cn("overflow-hidden transition-all duration-300 flex flex-col justify-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                <p className="text-xs font-medium text-white truncate">{user?.username || 'Usuario'}</p>
                                <p className="text-[10px] text-gray-500 truncate">{user?.role || 'Miembro'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowLogoutConfirm(true)} title={isCollapsed ? "Cerrar Sesión" : undefined} className={cn("flex items-center gap-2 w-full p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors group", isCollapsed ? "justify-center" : "")}>
                            <LogOut size={16} className="shrink-0" />
                            <div className={cn("overflow-hidden transition-all duration-300 flex items-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                <span className="text-xs font-medium whitespace-nowrap">Cerrar Sesión</span>
                            </div>
                        </button>
                    </div>
                </aside>


            {/* ── Exit Impersonation Banner ── */}
            {useAuthStore(state => state.originalToken) && (
                <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
                    <span className="text-xs font-medium truncate pr-2">Viendo como <strong>{user?.username}</strong></span>
                    <button 
                            onClick={async () => {
                                const store = useAuthStore.getState();
                                if (store.originalToken) {
                                    try {
                                        // Temporarily override the API token
                                        useAuthStore.setState({ token: store.originalToken });
                                        // Fetch the real original user
                                        const originalUser = await getMe();
                                        store.login(store.originalToken, originalUser);
                                        store.setOriginalToken(null);
                                        store.setFeatures([]);
                                        window.location.href = '/';
                                    } catch (e) {
                                        store.logout();
                                        window.location.href = '/login';
                                    }
                                }
                            }}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap"
                    >
                        Volver
                    </button>
                </div>
            )}

            {/* ── Main Content Shell ── */}
            <main className={cn("flex-1 flex flex-col min-w-0 bg-[#0a0a0a] md:pr-4 md:py-4", useAuthStore(state => state.originalToken) ? "mt-10 md:mt-0" : "")}>
                {/* Desktop Exit Impersonation Banner */}
                {useAuthStore(state => state.originalToken) && (
                    <div className="hidden md:flex mb-2 bg-indigo-600 text-white px-4 py-2 rounded-xl items-center justify-between shadow-md">
                        <span className="text-sm font-medium">Estás navegando la cuenta como <strong>{user?.username}</strong></span>
                        <button 
                            onClick={async () => {
                                const store = useAuthStore.getState();
                                if (store.originalToken) {
                                    try {
                                        // Temporarily override the API token
                                        useAuthStore.setState({ token: store.originalToken });
                                        // Fetch the real original user
                                        const originalUser = await getMe();
                                        store.login(store.originalToken, originalUser);
                                        store.setOriginalToken(null);
                                        store.setFeatures([]);
                                        window.location.href = '/';
                                    } catch (e) {
                                        store.logout();
                                        window.location.href = '/login';
                                    }
                                }
                            }}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                            Volver a mi cuenta original
                        </button>
                    </div>
                )}
                
                <div className="h-full bg-[#f2f4f7] md:rounded-2xl flex flex-col overflow-hidden relative shadow-2xl shadow-black/50 border border-white/5">
                    {/* Mobile Top Bar (hidden for CAJERO) */}
                    {role !== 'CAJERO' && (
                        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
                            <img src="/vite.svg" alt="Sales System" className="h-7 w-auto object-contain" />
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600"
                            >
                                <Menu size={20} />
                            </button>
                        </div>
                    )}


                    {/* Scrollable Content */}
                    <div className={`flex-1 min-h-0 relative scroll-smooth ${location.pathname === '/pos'
                        ? 'overflow-hidden flex flex-col'
                        : 'overflow-y-auto overflow-x-hidden'
                        }`}>
                        {/* Add bottom padding on mobile so content is not hidden behind bottom nav */}
                        <div className="md:h-0 h-0" />
                        {children}
                    </div>
                </div>
            </main>

            {/* ── Mobile Bottom Nav Bar ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch">
                {mobileBottomItems.map((item) => {
                    const isActive = item.path !== '/' && location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                                isActive ? 'text-indigo-600' : 'text-gray-400'
                            )}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </Link>
                    );
                })}
                {/* "Más" button if there are more items */}
                {allFlatNavItems.length > 4 && (
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400"
                    >
                        <Menu size={20} />
                        <span className="text-[10px] font-semibold">Más</span>
                    </button>
                )}
            </nav>

            {/* ── Mobile Full Menu Drawer ── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/60 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0f0f0f] flex flex-col p-6 gap-4 overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <img src="/vite.svg" alt="Sales System" className="h-8 w-auto object-contain" />
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* User */}
                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
                                <div className="w-10 h-10 rounded-full border-2 border-gray-700 bg-white/10 flex items-center justify-center shrink-0 text-white font-bold text-lg">
                                    {(user?.username || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{user?.username || 'Usuario'}</p>
                                    <p className="text-xs text-gray-500">{user?.role || 'Miembro'}</p>
                                </div>
                            </div>

                            {/* All Nav Items */}
                            <div className="flex flex-col gap-1 flex-1">
                                {allFlatNavItems.map((item: NavSubItem) => {
                                    const isActive = item.path !== '/' && location.pathname.startsWith(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl py-3 px-3 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-white text-black'
                                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                            )}
                                        >
                                            <item.icon size={18} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                                className="flex items-center gap-3 rounded-xl py-3 px-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors mt-auto"
                            >
                                <LogOut size={18} />
                                Cerrar Sesión
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Logout Confirm Modal ── */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                    <LogOut size={24} />
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 text-center mb-2">¿Seguro que deseas salir?</h3>
                            <p className="text-sm text-gray-500 text-center mb-6">Tu sesión actual se cerrará y se limpiarán los datos temporales del navegador.</p>

                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-200 flex items-center justify-center gap-2">
                                    Salir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
