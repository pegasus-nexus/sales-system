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

    if (user?.role !== 'SUPERADMIN') return <div className="p-8 text-center text-red-500">Acceso Restringido</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 md:pb-8">
            <div className="mb-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Planes SaaS</h1>
                <p className="text-gray-500 font-medium mt-1">Crea, edita y configura los planes que ofrecerás a tus clientes.</p>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <p className="font-bold text-gray-400 animate-pulse">Cargando planes...</p>
                </div>
            ) : (
                <PlanBuilder existingPlans={plansList} />
            )}
        </div>
    );
}
