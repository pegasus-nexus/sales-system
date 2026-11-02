import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Shield } from 'lucide-react';
import { SAAS_APPS, type SaasApp } from './saasApps';
import { useSaasTabStore } from './saasTabStore';
import { useAuthStore } from '../../store/authStore';

export default function SaasAppsLauncher() {
    const navigate = useNavigate();
    const { role, user } = useAuthStore();
    const { openTab } = useSaasTabStore();
    const [searchQuery, setSearchQuery] = useState('');

    const accessibleApps = useMemo(() => {
        return SAAS_APPS.filter(app => {
            if (app.roles && role && !app.roles.includes(role)) {
                return false;
            }
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                app.title.toLowerCase().includes(q) ||
                app.description.toLowerCase().includes(q) ||
                (app.shortTitle && app.shortTitle.toLowerCase().includes(q))
            );
        });
    }, [role, searchQuery]);

    const handleLaunchApp = (app: SaasApp) => {
        openTab(app);
        navigate(app.path);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && accessibleApps.length > 0) {
            handleLaunchApp(accessibleApps[0]);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0c0f17] via-[#080a10] to-[#040508] text-white flex flex-col items-center justify-start px-4 sm:px-6 py-8 sm:py-12 select-none overflow-x-hidden">
            {/* Luces de fondo ambientales */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header del Launcher */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-4xl flex flex-col items-center text-center mb-8 sm:mb-12 relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4 shadow-xs">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>Pegasus Multi-Tenant OS</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400 font-mono text-[11px]">SaaS Workspace</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                    Ecosistema Modular SaaS
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 max-w-lg">
                    Bienvenido, <span className="text-gray-200 font-medium">{user?.full_name || user?.username || 'SuperAdmin'}</span>. Selecciona el módulo con el que deseas trabajar en tu navegador.
                </p>

                {/* Buscador Rápido estilo Spotlight / Odoo */}
                <div className="mt-6 w-full max-w-md relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar módulo de administración (Presiona Enter)..."
                        autoFocus
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/10 focus:border-indigo-500/60 text-white placeholder-gray-500 text-sm shadow-xl focus:outline-hidden transition-all backdrop-blur-md"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10"
                        >
                            Esc
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Grilla de Aplicaciones Odoo Style */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 relative z-10"
            >
                <AnimatePresence>
                    {accessibleApps.map((app, index) => {
                        const Icon = app.icon;
                        return (
                            <motion.button
                                key={app.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2, delay: index * 0.03 }}
                                onClick={() => handleLaunchApp(app)}
                                className="group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 relative"
                            >
                                {/* Contenedor Cuadrado del Ícono con Gradiente Odoo */}
                                <div
                                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 group-hover:-translate-y-1.5 relative border border-white/15`}
                                    style={{
                                        boxShadow: `0 12px 24px -6px ${app.shadowColor}`,
                                    }}
                                >
                                    <Icon size={34} className="text-white drop-shadow-md transition-transform duration-200 group-hover:scale-110" />

                                    {/* Badge flotante opcional */}
                                    {app.badge && (
                                        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-xs">
                                            {app.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Título de la App debajo del ícono */}
                                <span className="mt-2.5 text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-white transition-colors text-center tracking-tight leading-snug">
                                    {app.shortTitle || app.title}
                                </span>

                                <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors line-clamp-1 max-w-[120px] text-center mt-0.5">
                                    {app.description}
                                </span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {accessibleApps.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-500">
                        <Shield size={36} className="mx-auto text-gray-600 mb-2 opacity-40" />
                        <p className="text-sm">No se encontraron módulos coincidentes con "{searchQuery}"</p>
                    </div>
                )}
            </motion.div>

            {/* Footer Informativo */}
            <div className="mt-auto pt-12 pb-4 text-center text-xs text-gray-600 flex items-center gap-2">
                <span>💡 Tip: Cada módulo se abrirá como una pestaña de trabajo individual en tu navegador</span>
            </div>
        </div>
    );
}
