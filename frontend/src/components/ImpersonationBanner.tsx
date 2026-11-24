import React from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/api';
import { ArrowLeft, Shield } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
    const { user, impersonationChain, originalToken } = useAuthStore();
    const isImpersonating = (impersonationChain && impersonationChain.length > 0) || Boolean(originalToken);

    if (!isImpersonating) return null;

    const handleRevert = async (targetIndex?: number) => {
        const store = useAuthStore.getState();
        if (targetIndex !== undefined && store.revertToImpersonationIndex) {
            const target = store.revertToImpersonationIndex(targetIndex);
            if (target?.token) {
                try {
                    useAuthStore.setState({ token: target.token });
                    const restoredUser = await getMe();
                    store.login(target.token, restoredUser);
                    store.setFeatures([]);
                    window.location.href = '/admin';
                    return;
                } catch (e) {
                    store.logout();
                    window.location.href = '/login';
                    return;
                }
            }
        }

        if (store.originalToken) {
            try {
                useAuthStore.setState({ token: store.originalToken });
                const originalUser = await getMe();
                store.login(store.originalToken, originalUser);
                store.clearImpersonation?.();
                store.setOriginalToken(null);
                store.setFeatures([]);
                window.location.href = '/admin';
            } catch (e) {
                store.logout();
                window.location.href = '/login';
            }
        }
    };

    return (
        <div className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between shadow-lg text-xs font-medium z-50 shrink-0 border-b border-amber-400/40">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar min-w-0 mr-2">
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping shrink-0" />
                <span className="font-extrabold text-amber-200 flex items-center gap-1 shrink-0">
                    <Shield size={13} />
                    <span className="hidden sm:inline">SuperAdmin</span> Impersonation:
                </span>
                <span className="text-white/90 truncate text-[11px] sm:text-xs">
                    Viendo como <strong className="text-white">{user?.full_name || user?.username}</strong> ({user?.role})
                </span>
            </div>

            <button
                type="button"
                onClick={() => handleRevert(impersonationChain && impersonationChain.length > 0 ? impersonationChain.length - 1 : 0)}
                className="px-2.5 sm:px-3 py-1 bg-white text-amber-950 hover:bg-amber-100 rounded-xl font-bold flex items-center gap-1 transition-all shadow-md text-xs shrink-0 cursor-pointer"
                title="Salir del modo suplantación y volver al panel SuperAdmin SaaS"
            >
                <ArrowLeft size={12} />
                <span className="hidden sm:inline">Volver al Panel SaaS →</span>
                <span className="sm:hidden font-extrabold">Volver</span>
            </button>
        </div>
    );
};

export default ImpersonationBanner;
