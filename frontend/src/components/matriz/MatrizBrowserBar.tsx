import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutGrid,
    Plus,
    X,
    Search,
    User,
    LogOut,
    Sparkles,
    LayoutTemplate,
    Building2,
    Settings,
    Activity
} from 'lucide-react';
import { useMatrizTabStore, type MatrizTabItem } from './matrizTabStore';
import { MATRIZ_APPS } from './matrizApps';
import { useAuthStore } from '../../store/authStore';

interface Props {
    onOpenSearch: () => void;
    onOpenLogout: () => void;
    onOpenProfile: () => void;
    onOpenWhatsNew: () => void;
    hasUnreadNews?: boolean;
}

export const MatrizBrowserBar: React.FC<Props> = ({
    onOpenSearch,
    onOpenLogout,
    onOpenProfile,
    onOpenWhatsNew,
    hasUnreadNews = false,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, tenantSettings } = useAuthStore();
    const {
        tabs,
        activeTabId,
        closeTab,
        setActiveTab,
        isWorkspaceMode,
        setWorkspaceMode,
    } = useMatrizTabStore();

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

    const handleSelectTab = (tab: MatrizTabItem) => {
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
                {/* Botón Apps Odoo 9-dots */}
                <button
                    type="button"
                    onClick={handleOpenLauncher}
                    title="Lanzador de Aplicaciones (Apps)"
                    className={`h-9 px-3 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shrink-0 cursor-pointer ${
                        isLauncherActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                    }`}
                >
                    <LayoutGrid size={16} className={isLauncherActive ? 'text-white' : 'text-indigo-400'} />
                    <span className="hidden sm:inline">Apps</span>
                </button>

                <div className="h-5 w-px bg-white/10 mx-1 shrink-0" />

                {/* Lista de Pestañas Abiertas */}
                <div className="flex items-center gap-1.5 min-w-0">
                    {tabs.map(tab => {
                        const appDef = MATRIZ_APPS.find(a => a.id === tab.id);
                        const Icon = appDef?.icon || Activity;
                        const fullLocation = location.search ? `${location.pathname}${location.search}` : location.pathname;
                        const isActive =
                            !isLauncherActive &&
                            (activeTabId === tab.id || fullLocation === tab.path || location.pathname === tab.path.split('?')[0]);

                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleSelectTab(tab)}
                                className={`group h-8.5 px-3 rounded-t-xl rounded-b-md flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all border shrink-0 max-w-[200px] ${
                                    isActive
                                        ? 'bg-[#181d2c] border-indigo-500/40 border-t-2 border-t-indigo-500 text-white shadow-xs'
                                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-indigo-400 shrink-0' : 'text-gray-500 shrink-0 group-hover:text-gray-300'} />
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

                    {/* Botón [+] Nueva Pestaña */}
                    <button
                        type="button"
                        onClick={handleOpenLauncher}
                        title="Abrir nuevo módulo en pestaña (+)"
                        className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-white/5"
                    >
                        <Plus size={15} />
                    </button>
                </div>
            </div>

            {/* Lado Derecho: Empresa + Búsqueda + Novedades + Perfil */}
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Badge de Matriz / Empresa */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                    <Building2 size={13} className="text-indigo-400" />
                    <span className="truncate max-w-[150px]">
                        {tenantSettings?.slug ? tenantSettings.slug.toUpperCase() : (user?.sucursal_nombre || 'Matriz Central')}
                    </span>
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

                {/* Botón Novedades */}
                <button
                    type="button"
                    onClick={onOpenWhatsNew}
                    className="relative p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Novedades de la versión"
                >
                    <Sparkles size={16} className="text-amber-400" />
                    {hasUnreadNews && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0a0d14] animate-pulse" />
                    )}
                </button>

                {/* Menú de Usuario */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-1 pl-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                    >
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {(user?.full_name || user?.username || 'A')[0].toUpperCase()}
                        </div>
                        <span className="hidden sm:inline text-xs font-semibold text-gray-200 max-w-[110px] truncate">
                            {user?.full_name || user?.username}
                        </span>
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 top-11 w-64 bg-[#121622] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in duration-150">
                            <div className="px-3 py-2 border-b border-white/10 mb-1">
                                <p className="font-bold text-white truncate">{user?.full_name || user?.username}</p>
                                <p className="text-[11px] text-indigo-400 font-medium">Administrador de Empresa</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                    {tenantSettings?.slug ? tenantSettings.slug.toUpperCase() : (user?.sucursal_nombre || 'Matriz Central')}
                                </p>
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
                                    <LayoutTemplate size={14} className="text-indigo-400" />
                                    <span>Modo Ventanas / Pestañas</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isWorkspaceMode ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400'
                                }`}>
                                    {isWorkspaceMode ? 'Activo' : 'Clásico'}
                                </span>
                            </button>

                            {/* Configuración Rápida */}
                            <button
                                type="button"
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    navigate('/configuracion');
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                            >
                                <Settings size={14} className="text-gray-400" />
                                <span>Configuración del Negocio</span>
                            </button>

                            {/* Mi Perfil */}
                            <button
                                type="button"
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    onOpenProfile();
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                            >
                                <User size={14} className="text-gray-400" />
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
