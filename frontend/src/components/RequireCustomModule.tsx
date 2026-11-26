import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hasCustomModule } from '../utils/tenantModules';

/** Bloquea una ruta de un módulo a medida si el tenant no lo tiene en modulos_activos. */
export const RequireCustomModule: React.FC<{ modulo: string; children: React.ReactNode }> = ({
    modulo,
    children,
}) => {
    const { role, modulos_activos } = useAuthStore();
    if (!hasCustomModule(modulo, role, modulos_activos)) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};
