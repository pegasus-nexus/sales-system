import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User as UserIcon, Lock, Check, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { MatrizBrowserBar } from './MatrizBrowserBar';
import { MatrizAppsLauncher } from './MatrizAppsLauncher';
import { useMatrizTabStore } from './matrizTabStore';
import { useAuthStore } from '../../store/authStore';
import ViewSearchModal from '../ViewSearchModal';
import WhatsNewModal, { CURRENT_RELEASE_VERSION } from '../WhatsNewModal';
import { useLocalStorage } from 'usehooks-ts';
import { changePassword } from '../../api/api';
import { toast } from 'sonner';

interface Props {
    children: React.ReactNode;
}

export const MatrizWorkspaceLayout: React.FC<Props> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { syncWithRoute } = useMatrizTabStore();

    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [seenRelease, setSeenRelease] = useLocalStorage<string>('pegasus_seen_release', '');

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [isChangingPw, setIsChangingPw] = useState(false);

    const hasUnreadNews = seenRelease !== CURRENT_RELEASE_VERSION;

    const handleOpenWhatsNew = () => {
        setWhatsNewOpen(true);
        setSeenRelease(CURRENT_RELEASE_VERSION);
    };

    // Sincronizar ruta actual con la barra de pestañas
    useEffect(() => {
        syncWithRoute(location.pathname, location.search);
    }, [location.pathname, location.search, syncWithRoute]);

    // Listener para Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchModalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const isLauncherPath = location.pathname === '/apps' || location.pathname === '/apps/';

    const handleConfirmLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate('/login');
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            toast.error('Por favor completa todos los campos');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }

        try {
            setIsChangingPw(true);
            await changePassword({ current_password: currentPassword, new_password: newPassword });
            toast.success('Contraseña actualizada correctamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setProfileModalOpen(false);
        } catch (err: unknown) {
            const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(errorMsg || 'Error al cambiar contraseña');
        } finally {
            setIsChangingPw(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#080a11] text-white overflow-hidden select-none">
            {/* Top Browser Bar (Odoo 9-dots + Tabs + Controles Matriz) */}
            <MatrizBrowserBar
                onOpenSearch={() => setSearchModalOpen(true)}
                onOpenLogout={() => setShowLogoutConfirm(true)}
                onOpenProfile={() => setProfileModalOpen(true)}
                onOpenWhatsNew={handleOpenWhatsNew}
                hasUnreadNews={hasUnreadNews}
            />

            {/* Main Canvas (100% de la pantalla sin sidebar abrumador) */}
            <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-[#0c0f17]">
                <div
                    className={`h-full w-full overflow-y-auto custom-scrollbar ${
                        isLauncherPath ? 'bg-[#0c0f17]' : 'bg-[#f4f6f8] text-gray-900'
                    }`}
                >
                    {isLauncherPath ? <MatrizAppsLauncher /> : children}
                </div>
            </main>

            {/* Buscador Rápido Global (⌘K) */}
            <ViewSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

            {/* Modal de Novedades */}
            <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />

            {/* Modal de Perfil & Contraseña */}
            <AnimatePresence>
                {profileModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950/75 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#121622] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 text-white"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                        <UserIcon size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Mi Perfil & Contraseña</h3>
                                        <p className="text-[11px] text-gray-400">Administrador de Matriz</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setProfileModalOpen(false)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Info de Usuario */}
                            <div className="bg-white/5 rounded-2xl p-3 border border-white/5 mb-4 space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Usuario:</span>
                                    <span className="font-bold text-gray-200">{user?.username}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Nombre:</span>
                                    <span className="font-medium text-gray-200">{user?.full_name || 'Sin especificar'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Rol:</span>
                                    <span className="font-bold text-indigo-400">{user?.role}</span>
                                </div>
                            </div>

                            {/* Formulario de Cambio de Contraseña */}
                            <form onSubmit={handleChangePassword} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">Contraseña Actual</label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="Ingresa tu contraseña actual"
                                            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-hidden focus:border-indigo-500 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">Nueva Contraseña</label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-hidden focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1">Confirmar Nueva Contraseña</label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repite la nueva contraseña"
                                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-hidden focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setProfileModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isChangingPw}
                                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50"
                                    >
                                        {isChangingPw ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                        <span>Actualizar Clave</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmación de Cierre de Sesión */}
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
                                ¿Cerrar sesión de Matriz?
                            </h3>
                            <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
                                Tu sesión de trabajo central se cerrará de forma segura.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-gray-300 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmLogout}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-lg shadow-red-600/30"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
