import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '../api/api';
import { useAuthStore } from '../store/authStore';
import PlanBuilder from '../components/admin/PlanBuilder';

interface Plan {
    code: string;
    name: string;
    max_sucursales?: number;
    max_usuarios_por_sucursal?: number;
    is_public: boolean;
    precio_mensual?: number;
    features: string[];
}

export default function PlanesAdminPage() {
    const { user } = useAuthStore();

    const { data: dbPlans, isLoading } = useQuery({
        queryKey: ['admin-plans'],
        queryFn: () => client<Plan[]>('/tenants/admin/plans'),
    });

    const plansList = useMemo(() => {
        if (dbPlans && dbPlans.length > 0) return dbPlans;
        return [
            { code: 'BASICO', name: 'Plan Básico', is_public: true, features: [] },
            { code: 'PRO', name: 'Plan Profesional', is_public: true, features: [] },
            { code: 'ENTERPRISE', name: 'Plan Enterprise', is_public: true, features: [] },
            { code: 'ILIMITADO', name: 'Plan Ilimitado', is_public: false, features: [] },
        ];
    }, [dbPlans]);

    if (user?.role !== 'SUPERADMIN' && user?.role !== 'SUPERADMIN_STAFF') return <div className="p-8 text-center text-red-500">Acceso Restringido</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="std-title-page">Gestión de Planes SaaS</h1>
                    <p className="std-description">Crea, edita y configura los planes que ofrecerás a tus clientes.</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <p className="text-xs text-gray-400 font-medium animate-pulse">Cargando planes...</p>
                </div>
            ) : (
                <PlanBuilder existingPlans={plansList} />
            )}
        </div>
    );
}
