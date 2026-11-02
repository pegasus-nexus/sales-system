import type { ElementType } from 'react';
import {
    Activity, Building2, Layers, HeartPulse, Users, ShieldCheck
} from 'lucide-react';

export interface SaasApp {
    id: string;
    title: string;
    shortTitle?: string;
    description: string;
    path: string;
    icon: ElementType;
    gradient: string;
    shadowColor: string;
    badge?: string;
    roles?: string[];
}

export const SAAS_APPS: SaasApp[] = [
    {
        id: 'dashboard',
        title: 'Dashboard SaaS',
        shortTitle: 'Dashboard',
        description: 'Métricas de MRR, adopción, empresas clientes e infraestructura',
        path: '/admin/dashboard',
        icon: Activity,
        gradient: 'from-violet-600 via-indigo-600 to-indigo-700',
        shadowColor: 'rgba(99, 102, 241, 0.35)',
        badge: 'Pulse',
        roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'],
    },
    {
        id: 'empresas',
        title: 'Empresas & Módulos',
        shortTitle: 'Empresas',
        description: 'Gestión de tenants clientes, activación de módulos y estados',
        path: '/admin/empresas',
        icon: Building2,
        gradient: 'from-blue-500 via-blue-600 to-cyan-600',
        shadowColor: 'rgba(59, 130, 246, 0.35)',
        badge: 'Tenants',
        roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'],
    },
    {
        id: 'planes',
        title: 'Facturación & Planes',
        shortTitle: 'Planes',
        description: 'Catálogo de planes, precios, límites de usuarios y facturación',
        path: '/admin/planes',
        icon: Layers,
        gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
        shadowColor: 'rgba(16, 185, 129, 0.35)',
        badge: 'Billing',
        roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'],
    },
    {
        id: 'health',
        title: 'Salud del Sistema',
        shortTitle: 'Salud',
        description: 'Monitor de MongoDB Atlas, latencias, conexiones y health check',
        path: '/admin/health',
        icon: HeartPulse,
        gradient: 'from-rose-500 via-red-600 to-pink-600',
        shadowColor: 'rgba(244, 63, 94, 0.35)',
        badge: 'Atlas',
        roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'],
    },
    {
        id: 'colaboradores',
        title: 'Equipo SaaS',
        shortTitle: 'Equipo',
        description: 'Colaboradores internos de Pegasus y permisos de administración',
        path: '/admin/colaboradores',
        icon: Users,
        gradient: 'from-amber-500 via-orange-600 to-amber-700',
        shadowColor: 'rgba(245, 158, 11, 0.35)',
        roles: ['SUPERADMIN'],
    },
    {
        id: 'auditoria',
        title: 'Auditoría Global',
        shortTitle: 'Auditoría',
        description: 'Bitácora general de seguridad, accesos y eventos críticos',
        path: '/auditoria',
        icon: ShieldCheck,
        gradient: 'from-slate-600 via-slate-700 to-zinc-800',
        shadowColor: 'rgba(100, 116, 139, 0.35)',
        roles: ['SUPERADMIN'],
    },
];
