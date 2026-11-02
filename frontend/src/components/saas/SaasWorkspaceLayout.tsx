import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import SaasBrowserBar from './SaasBrowserBar';
import WhatsNewModal, { CURRENT_RELEASE_VERSION } from '../WhatsNewModal';
import { useLocalStorage } from 'usehooks-ts';
import { useSaasTabStore } from './saasTabStore';
import { useAuthStore } from '../../store/authStore';

interface SaasWorkspaceLayoutProps {
    children: React.ReactNode;
}

export default function SaasWorkspaceLayout({ children }: SaasWorkspaceLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const { syncWithRoute } = useSaasTabStore();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const [seenRelease, setSeenRelease] = useLocalStorage<string>('pegasus_seen_release', '');

    const hasUnreadNews = seenRelease !== CURRENT_RELEASE_VERSION;

    const handleOpenWhatsNew = () => {
        setWhatsNewOpen(true);
        setSeenRelease(CURRENT_RELEASE_VERSION);
    };

    // Sincronizar ruta actual con las pestañas abiertas
    useEffect(() => {
        syncWithRoute(location.pathname);
    }, [location.pathname, syncWithRoute]);

    const isLauncherPath = location.pathname === '/admin' || location.pathname === '/admin/';

    const handleConfirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#080a11] text-white overflow-hidden select-none">
            {/* ── Top Browser Bar (Odoo 9-dots + Tabs + Controls) ── */}
            <SaasBrowserBar
                onOpenWhatsNew={handleOpenWhatsNew}
                onOpenProfile={() => setWhatsNewOpen(true)}
                onOpenLogout={() => setShowLogoutConfirm(true)}
                hasUnreadNews={hasUnreadNews}
            />

            {/* ── Main Canvas (100% de la pantalla sin sidebar abrumador) ── */}
            <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-[#0c0f17]">
                <div className={`h-full w-full overflow-y-auto custom-scrollbar ${
                    isLauncherPath ? 'bg-[#0c0f17]' : 'bg-[#f4f6f8] text-gray-900'
                }`}>
                    {children}
                </div>
            </main>

            {/* ── Modal Novedades ── */}
            <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />

            {/* ── Modal Confirmación Salir ── */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950/70 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#121622] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-white"
                        >
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center">
                                    <LogOut size={22} />
                                </div>
                            </div>
                            <h3 className="text-base font-bold text-center mb-1">
                                ¿Cerrar sesión de SuperAdmin?
                            </h3>
                            <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                                Tu sesión del centro de control SaaS se cerrará de forma segura.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-gray-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmLogout}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
                                >
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
