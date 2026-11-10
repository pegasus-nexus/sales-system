import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutGrid, X, Search, Bell, Store, User, LogOut,
    ShoppingCart, LayoutDashboard, Wallet, Package, Truck,
    ClipboardList, Receipt, FileText, Users, BarChart3, MessageSquare,
    Sparkles, LayoutTemplate, Layers
} from 'lucide-react';
import { useBranchTabStore, type BranchTabItem } from './branchTabStore';
import { useAuthStore } from '../../store/authStore';

const ICON_MAP: Record<string, React.ElementType> = {
    pos: ShoppingCart,
    dashboard: LayoutDashboard,
    caja: Wallet,
    inventario: Package,
    traslados: Truck,
    pedidos: ClipboardList,
    ventas: Receipt,
    cotizaciones: FileText,
    clientes: Users,
    recordatorios: Bell,
    reporte_diario: BarChart3,
    compras: Store,
    whatsapp: MessageSquare,
    momentos_taboada: Sparkles,
};

interface Props {
    onOpenSearch: () => void;
    onOpenLogout: () => void;
    onOpenProfile: () => void;
}

export const BranchBrowserBar: React.FC<Props> = ({
    onOpenSearch,
    onOpenLogout,
    onOpenProfile,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const {
        tabs,
        activeTabId,
        closeTab,
        setActiveTab,
        isWorkspaceMode,
        setWorkspaceMode,
    } = useBranchTabStore();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isLauncherActive = location.pathname === '/apps' || location.pathname === '/apps/';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectTab = (tab: BranchTabItem) => {
        setActiveTab(tab.id);
        navigate(tab.path);
    };

    const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        const nextPath = closeTab(tabId);
        navigate(nextPath);
    };

    const handleOpenLauncher = () => {
        navigate('/apps');
    };

    return (
        <header className="h-12 w-full bg-[#0a0d14] border-b border-white/10 flex items-center justify-between px-2 sm:px-4 text-white select-none shrink-0 relative z-40">
            {/* Lado Izquierdo: Botón Apps (Odoo 9-dots) + Pestañas de Navegador */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
                {/* Botón Apps Odoo */}
                <button
                    type="button"
                    onClick={handleOpenLauncher}
                    title="Lanzador de Aplicaciones (Apps)"
                    className={`h-9 px-3 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shrink-0 cursor-pointer ${
                        isLauncherActive
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                >
                    <LayoutGrid size={16} className={isLauncherActive ? 'text-white' : 'text-purple-400'} />
                    <span className="hidden sm:inline">Apps</span>
                </button>

                <div className="h-5 w-px bg-white/10 mx-1 shrink-0" />

                {/* Lista de Pestañas Abiertas */}
                <div className="flex items-center gap-1.5 min-w-0">
                    {tabs.map(tab => {
                        const Icon = ICON_MAP[tab.iconName] || Layers;
                        const fullLocation = location.search ? `${location.pathname}${location.search}` : location.pathname;
                        const isActive =
                            !isLauncherActive &&
                            (activeTabId === tab.id || fullLocation === tab.path || location.pathname === tab.path.split('?')[0]);

                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleSelectTab(tab)}
                                className={`group h-8.5 px-3 rounded-t-xl rounded-b-md flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all border shrink-0 max-w-[190px] ${
                                    isActive
                                        ? 'bg-[#1a1f2e] border-purple-500/40 border-t-2 border-t-purple-500 text-white shadow-xs'
                                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-purple-400 shrink-0' : 'text-gray-500 shrink-0'} />
                                <span className="truncate">{tab.shortTitle}</span>
                                <button
                                    type="button"
                                    onClick={e => handleCloseTab(e, tab.id)}
                                    title="Cerrar pestaña"
                                    className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all ml-1 shrink-0 text-gray-400 hover:text-white cursor-pointer"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lado Derecho: Sucursal + Búsqueda + Notificaciones + Perfil */}
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Badge de Sucursal */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                    <Store size={13} className="text-purple-400" />
                    <span className="truncate max-w-[130px]">{user?.sucursal_nombre || 'Sucursal'}</span>
                </div>

                {/* Buscador Rápido (⌘K) */}
                <button
                    type="button"
                    onClick={onOpenSearch}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-xs font-medium transition-colors cursor-pointer"
                    title="Buscar vista o entidad (Ctrl + K)"
                >
                    <Search size={14} />
                    <kbd className="hidden lg:inline text-[10px] bg-white/10 px-1 rounded text-gray-400 font-mono">⌘K</kbd>
                </button>

                {/* Acceso Rápido Recordatorios */}
                <button
                    type="button"
                    onClick={() => {
                        navigate('/recordatorios');
                    }}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        location.pathname === '/recordatorios'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                    }`}
                    title="Recordatorios e Incidencias"
                >
                    <Bell size={16} />
                </button>

                {/* Menú de Usuario */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-1 pl-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                    >
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                        </div>
                        <span className="hidden sm:inline text-xs font-semibold text-gray-200 max-w-[100px] truncate">
                            {user?.full_name || user?.username}
                        </span>
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 top-11 w-64 bg-[#121622] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in duration-150">
                            <div className="px-3 py-2 border-b border-white/10 mb-1">
                                <p className="font-bold text-white truncate">{user?.full_name || user?.username}</p>
                                <p className="text-[11px] text-purple-400 font-medium">{user?.role || 'ADMIN_SUCURSAL'}</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.sucursal_nombre}</p>
                            </div>

                            {/* Toggle modo interfaz */}
                            <button
                                type="button"
                                onClick={() => {
                                    setWorkspaceMode(!isWorkspaceMode);
                                    setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <LayoutTemplate size={14} className="text-purple-400" />
                                    <span>Modo Pestañas Odoo</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isWorkspaceMode ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'
                                }`}>
                                    {isWorkspaceMode ? 'Activo' : 'Clásico'}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    onOpenProfile();
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                            >
                                <User size={14} />
                                <span>Mi Perfil & Contraseña</span>
                            </button>

                            <div className="h-px bg-white/10 my-1" />

                            <button
                                type="button"
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    onOpenLogout();
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-semibold"
                            >
                                <LogOut size={14} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
