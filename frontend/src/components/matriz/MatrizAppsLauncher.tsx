import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Building2, Shield } from 'lucide-react';
import { MATRIZ_APPS, type MatrizApp, type MatrizCategory } from './matrizApps';
import { useMatrizTabStore } from './matrizTabStore';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES: ('Todas' | MatrizCategory)[] = [
    'Todas',
    'Dirección',
    'Ventas & Caja',
    'Inventario & Compras',
    'Reportes & BI',
    'Página Web',
    'Administración',
];

export const MatrizAppsLauncher: React.FC = () => {
    const navigate = useNavigate();
    const { user, hasFeature, tenantSettings } = useAuthStore();
    const { openTab } = useMatrizTabStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

    const isTaboada = Boolean(
        user?.tenant_id === '69cd7f0a8f3f6866d4cfbb62' ||
        user?.username?.toLowerCase().includes('taboada') ||
        user?.email?.toLowerCase().includes('taboada') ||
        tenantSettings?.slug?.toLowerCase().includes('taboada')
    );

    const accessibleApps = useMemo(() => {
        return MATRIZ_APPS.filter(app => {
            if (app.requiresTaboada && !isTaboada) {
                return false;
            }
            if (app.feature && !hasFeature(app.feature)) {
                return false;
            }
            if (selectedCategory !== 'Todas' && app.category !== selectedCategory) {
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
    }, [searchQuery, selectedCategory, isTaboada, hasFeature]);

    const handleLaunchApp = (app: MatrizApp) => {
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
            {/* Luces de fondo ambientales cósmicas */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-[380px] h-[260px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[320px] h-[240px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header del Launchpad */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-4xl flex flex-col items-center text-center mb-8 relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 shadow-xs">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                    <span>Pegasus Nexus OS</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300 font-mono text-[11px] flex items-center gap-1">
                        <Building2 size={11} className="text-indigo-400" />
                        {tenantSettings?.slug ? tenantSettings.slug.toUpperCase() : (user?.sucursal_nombre || 'Matriz Central')}
                    </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                    Centro de Comando Matriz
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 max-w-lg">
                    Bienvenido, <span className="text-gray-200 font-medium">{user?.full_name || user?.username || 'Administrador'}</span>. Abre cualquier aplicación en tus pestañas superiores para operar tu empresa en multitarea.
                </p>

                {/* Buscador Rápido estilo Spotlight / Odoo */}
                <div className="mt-6 w-full max-w-md relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar módulo o tarea ejecutiva (Presiona Enter)..."
                        autoFocus
                        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.1] border border-white/10 focus:border-indigo-500/60 text-white placeholder-gray-500 text-sm shadow-xl focus:outline-hidden transition-all backdrop-blur-md"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10 cursor-pointer"
                        >
                            Esc
                        </button>
                    )}
                </div>

                {/* Filtro de Categorías con scroll horizontal suave en móvil */}
                <div className="flex overflow-x-auto hide-scrollbar sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mt-5 max-w-full sm:max-w-3xl px-2 py-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Grilla de Aplicaciones Odoo Style */}
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 relative z-10"
            >
                <AnimatePresence>
                    {accessibleApps.map((app, index) => {
                        const Icon = app.icon;
                        return (
                            <motion.div
                                key={app.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.22, delay: index * 0.02 }}
                                onClick={() => handleLaunchApp(app)}
                                className="group relative bg-[#121622]/85 hover:bg-[#181d2e] border border-white/10 hover:border-indigo-500/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col items-start justify-between cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 backdrop-blur-xs overflow-hidden"
                            >
                                {/* Badge si tiene */}
                                {app.badge && (
                                    <span className="absolute top-3.5 right-3.5 text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full shadow-2xs">
                                        {app.badge}
                                    </span>
                                )}

                                <div className="w-full">
                                    {/* Icono con Gradiente */}
                                    <div
                                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                        style={{ boxShadow: `0 8px 24px -4px ${app.shadowColor}` }}
                                    >
                                        <Icon size={24} />
                                    </div>

                                    {/* Título y Descripción */}
                                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                        {app.title}
                                    </h3>
                                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                        {app.description}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/5 w-full flex items-center justify-between text-[11px] text-gray-500 group-hover:text-indigo-400 font-semibold transition-colors">
                                    <span>Abrir en pestaña</span>
                                    <span>→</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {accessibleApps.length === 0 && (
                <div className="text-center py-16 text-gray-500 relative z-10">
                    <Shield size={36} className="mx-auto text-gray-600 mb-2 opacity-40" />
                    <p className="text-sm">No se encontraron módulos coincidentes con "{searchQuery}".</p>
                </div>
            )}
        </div>
    );
};
