import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Plus, X, Sparkles, User, LogOut,
    Activity, Building2, Layers, HeartPulse, Users, ShieldCheck
} from 'lucide-react';
import { useSaasTabStore, type SaasTabItem } from './saasTabStore';
import { useAuthStore } from '../../store/authStore';

const ICON_MAP: Record<string, React.ElementType> = {
    dashboard: Activity,
    empresas: Building2,
    planes: Layers,
    health: HeartPulse,
    colaboradores: Users,
    auditoria: ShieldCheck,
};

interface SaasBrowserBarProps {
    onOpenWhatsNew: () => void;
    onOpenProfile: () => void;
    onOpenLogout: () => void;
    hasUnreadNews: boolean;
}

export default function SaasBrowserBar({
    onOpenWhatsNew,
    onOpenProfile,
    onOpenLogout,
    hasUnreadNews,
}: SaasBrowserBarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { tabs, activeTabId, closeTab, setActiveTab } = useSaasTabStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isLauncherActive = location.pathname === '/admin' || location.pathname === '/admin/';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectTab = (tab: SaasTabItem) => {
        setActiveTab(tab.id);
        navigate(tab.path);
    };

    const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        const nextPath = closeTab(tabId);
        navigate(nextPath);
    };

    const handleOpenLauncher = () => {
        navigate('/admin');
    };

    return (
        <header className="h-12 w-full bg-[#0b0e17] border-b border-white/10 flex items-center justify-between px-2 sm:px-3 text-white select-none shrink-0 relative z-40">
            {/* Izquierda: Botón Apps (Odoo) + Pestañas de Navegador */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
                {/* Botón Odoo 9-dots (Lanzador de Apps) */}
                <button
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
                    {tabs.map((tab) => {
                        const Icon = ICON_MAP[tab.iconName] || Activity;
                        const isActive = !isLauncherActive && (activeTabId === tab.id || location.pathname === tab.path);

                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleSelectTab(tab)}
                                className={`group h-8.5 px-3 rounded-t-xl rounded-b-md flex items-center gap-2 text-xs font-medium cursor-pointer transition-all border shrink-0 ${
                                    isActive
                                        ? 'bg-[#181d2c] border-indigo-500/40 border-t-2 border-t-indigo-500 text-white shadow-xs'
                                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-transparent text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'} />
                                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                                    {tab.shortTitle}
                                </span>
                                <button
                                    onClick={(e) => handleCloseTab(e, tab.id)}
                                    title="Cerrar pestaña"
                                    className="w-4 h-4 rounded hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors -mr-1"
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Botón [+] Nueva Pestaña */}
                    <button
                        onClick={handleOpenLauncher}
                        title="Abrir nuevo módulo en pestaña (+)"
                        className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer border border-white/5"
                    >
                        <Plus size={15} />
                    </button>
                </div>
            </div>

            {/* Derecha: Botón Novedades + Avatar SuperAdmin */}
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {/* Botón Novedades */}
                <button
                    onClick={onOpenWhatsNew}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                    title="Novedades de la versión"
                >
                    <Sparkles size={14} className="text-amber-400" />
                    <span className="hidden md:inline text-[11px]">Novedades</span>
                    {hasUnreadNews && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0b0e17] animate-pulse" />
                    )}
                </button>

                {/* Dropdown de Usuario SuperAdmin */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setUserMenuOpen(prev => !prev)}
                        className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                        <div className="flex flex-col text-right hidden sm:block">
                            <span className="text-xs font-bold text-white leading-tight">
                                {user?.full_name || user?.username || 'SuperAdmin'}
                            </span>
                            <span className="text-[10px] text-indigo-400 font-mono font-medium">
                                SaaS Admin
                            </span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                            {(user?.username || 'S')[0].toUpperCase()}
                        </div>
                    </button>

                    {/* Menú Desplegable */}
                    {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#121622] border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs backdrop-blur-md">
                            <div className="px-3 py-2 border-b border-white/10 mb-1">
                                <p className="font-bold text-white truncate">{user?.full_name || user?.username}</p>
                                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    onOpenProfile();
                                }}
                                className="w-full px-3 py-2 text-left text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                                <User size={14} className="text-indigo-400" />
                                <span>Mi Perfil y Seguridad</span>
                            </button>
                            <button
                                onClick={() => {
                                    setUserMenuOpen(false);
                                    onOpenLogout();
                                }}
                                className="w-full px-3 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
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
}
