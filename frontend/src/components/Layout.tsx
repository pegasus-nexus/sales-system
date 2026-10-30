import React, { useState, useEffect } from 'react';
import {
    User as UserIcon, Camera, Check, Loader2,
    LayoutDashboard, Wallet, ShoppingBag, LogOut, Calculator,
    Tag, Store, Package, ClipboardList, Warehouse, Users, Globe,
    Menu, Percent, RotateCcw, X, QrCode, BarChart3, Banknote, Truck, Settings, Building, Layers,
    Briefcase, ChevronDown, TrendingUp, FileText, DollarSign, Clock, Ban, Scale, Shield, Activity, HeartPulse, KeyRound, Lock, Eye, EyeOff, ShoppingCart, History, BookOpen
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLocalStorage } from 'usehooks-ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'framer-motion';
import { getMe, pingUser, changePassword, getSucursales, updateMyProfile, uploadImage } from '../api/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import ViewSearchModal from './ViewSearchModal';
import WhatsNewModal, { CURRENT_RELEASE_VERSION } from './WhatsNewModal';
import { Sparkles } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LayoutProps {
    children: React.ReactNode;
}

interface NavSubItem {
    icon: any;
    label: string;
    path: string;
    feature: string | null;
    roles: string[];
}

interface NavGroup {
    groupKey: string;
    title: string;
    icon: any;
    items: NavSubItem[];
}

function TrialWarningBanner() {
    const { planExpiresAt, role } = useAuthStore();
    if (role === "SUPERADMIN" || role === "SUPERADMIN_STAFF" || !planExpiresAt) return null;
    const today = new Date();
    const expiry = new Date(planExpiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && diffDays > 0) {
        return (
            <div className="mb-2 bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold flex justify-center items-center text-center shadow-md z-50 animate-pulse">
                ⚠️ Tu periodo de prueba vence en {diffDays} {diffDays === 1 ? "día" : "días"}. Contacta a soporte para renovar tu suscripción.
            </div>
        );
    }
    return null;
}

export default function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { logout, user, role, hasFeature } = useAuthStore();

    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useLocalStorage('choco-sidebar-collapsed', false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [whatsNewOpen, setWhatsNewOpen] = useState(false);
    const [seenRelease, setSeenRelease] = useLocalStorage<string>('pegasus_seen_release', '');

    // Si es la primera vez que inicia sesión con esta versión, o si hace clic en el botón
    const hasUnreadNews = seenRelease !== CURRENT_RELEASE_VERSION;

    const handleOpenWhatsNew = () => {
        setWhatsNewOpen(true);
        setSeenRelease(CURRENT_RELEASE_VERSION);
    };

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

    // Estado de acordeones desplegables
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        dashboard: true,
        ventas_caja: false,
        analitica_reportes: false,
        inventario_productos: false,
        gestion_contactos: false,
        sistema: false
    });

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales_layout'],
        queryFn: () => getSucursales(true),
        staleTime: 5 * 60 * 1000,
        enabled: !!user?.tenant_id,
    });

    React.useEffect(() => {
        pingUser().catch(() => {});
        getMe().then(freshUser => {
            if (freshUser) {
                useAuthStore.setState({ user: freshUser, role: freshUser.role });
            }
        }).catch(() => {});
        const interval = setInterval(() => {
            pingUser().catch(() => {});
        }, 45000);
        return () => clearInterval(interval);
    }, []);

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [profileTab, setProfileTab] = useState<'profile' | 'password'>('profile');
    const [fullNameInput, setFullNameInput] = useState('');
    const [avatarUrlInput, setAvatarUrlInput] = useState('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const openProfileModal = (tab: 'profile' | 'password' = 'profile') => {
        setFullNameInput(user?.full_name || '');
        setAvatarUrlInput(user?.avatar_url || '');
        setProfileTab(tab);
        setIsChangePasswordOpen(true);
    };

    const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        try {
            const res = await uploadImage(file);
            setAvatarUrlInput(res.url);
            toast.success('Foto subida. Haz clic en "Guardar Cambios" para confirmar.');
        } catch (err: any) {
            toast.error(err.message || 'Error al subir la imagen');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await updateMyProfile({
                full_name: fullNameInput,
                avatar_url: avatarUrlInput
            });
            toast.success('Perfil actualizado correctamente');
            useAuthStore.setState(prev => ({
                user: prev.user ? { ...prev.user, full_name: fullNameInput, avatar_url: avatarUrlInput } : prev.user
            }));
            setIsChangePasswordOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Error al actualizar perfil');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }
        setIsChangingPassword(true);
        try {
            await changePassword({ current_password: currentPassword, new_password: newPassword });
            toast.success('Contraseña actualizada exitosamente');
            setIsChangePasswordOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err: any) {
            toast.error(err.message || 'Error al cambiar contraseña');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        logout();
        navigate('/login');
    };

    const isItemActive = (itemPath: string) => {
        const fullPath = location.pathname + location.search;
        if (itemPath.includes('?')) {
            return fullPath === itemPath;
        }
        return location.pathname === itemPath || (itemPath !== '/' && location.pathname.startsWith(itemPath + '/') && !location.search);
    };

    const getNavGroups = (): NavGroup[] => {
        if (role === 'SUPERADMIN' || role === 'SUPERADMIN_STAFF') {
            return [
                {
                    groupKey: 'saas',
                    title: 'Administración SaaS',
                    icon: Building,
                    items: [
                        { icon: Activity, label: 'Dashboard SaaS', path: '/admin/dashboard', feature: null, roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'] },
                        { icon: Building, label: 'Empresas y Módulos', path: '/admin/empresas', feature: null, roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'] },
                        { icon: Layers, label: 'Facturación y Planes', path: '/admin/planes', feature: null, roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'] },
                        { icon: HeartPulse, label: 'Salud del Sistema', path: '/admin/health', feature: null, roles: ['SUPERADMIN', 'SUPERADMIN_STAFF'] },
                        ...(role === 'SUPERADMIN' ? [{ icon: Users, label: 'Equipo SaaS', path: '/admin/colaboradores', feature: null, roles: ['SUPERADMIN'] }] : [])
                    ]
                }
            ];
        }

        const userSucursal = sucursales.find(s => s._id === user?.sucursal_id);
        const sucursalName = (userSucursal?.nombre || user?.sucursal_nombre || '').toLowerCase();
        const userText = `${user?.username || ''} ${user?.email || ''} ${user?.full_name || ''} ${sucursalName}`.toLowerCase();
        const isSupermercado = Boolean(
            userText.includes('supermercado') ||
            userText.includes('super') ||
            sucursalName.includes('super') ||
            sucursalName.includes('mercado')
        );
        const hasHistoricoAccess = Boolean(
            ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN'].includes(role || '') ||
            user?.permisos_especiales?.includes('INGRESO_HISTORICO_INVENTARIO') ||
            isSupermercado
        );

        const rawGroups: NavGroup[] = [
            {
                groupKey: 'dashboard',
                title: 'Principal',
                icon: LayoutDashboard,
                items: [
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard-sucursal', feature: null, roles: ['ADMIN_SUCURSAL'] },
                ]
            },
            {
                groupKey: 'analitica_reportes',
                title: 'Analítica & Reportes',
                icon: BarChart3,
                items: [
                    { icon: BarChart3, label: 'Panel General BI', path: '/reportes?tab=bi', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: BarChart3, label: 'Plataforma Analítica BI', path: '/inteligencia', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: TrendingUp, label: 'Evolución Mensual (MoM)', path: '/reportes?tab=evolucion_mensual', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: TrendingUp, label: 'Visión General', path: '/reportes?tab=general', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Store, label: 'Rendimiento Sucursales', path: '/reportes?tab=sucursales', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: FileText, label: 'Reporte de Jornada', path: '/reportes?tab=daily', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: DollarSign, label: 'Finanzas y Márgenes', path: '/reportes?tab=finanzas', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Scale, label: 'Auditoría', path: '/reportes?tab=conciliacion', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Wallet, label: 'Reporte de Gastos', path: '/reportes?tab=gastos', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Clock, label: 'Ventas por Hora', path: '/reportes?tab=hourly', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Wallet, label: 'Ventas por Caja', path: '/reportes?tab=caja_ventas', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Package, label: 'Inventario Valorado', path: '/reportes?tab=inventario_valorado', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Users, label: 'Desempeño Staff', path: '/reportes?tab=staff', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: BarChart3, label: 'Matriz de Ventas', path: '/reportes?tab=matrix', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: TrendingUp, label: 'Tendencias', path: '/reportes?tab=tendencias', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: BarChart3, label: 'Estadísticas de Producto', path: '/reportes?tab=product_stats', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Store, label: 'Cartera de Productos', path: '/reportes?tab=matriz_bcg', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Ban, label: 'Anulaciones', path: '/reportes?tab=anulaciones', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                    { icon: Users, label: 'Compras por Cliente', path: '/reportes?tab=compras_cliente', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERADMIN'] },
                ]
            },
            {
                groupKey: 'ventas_caja',
                title: 'Ventas & Caja',
                icon: ShoppingBag,
                items: [
                    { icon: ShoppingBag, label: 'POS (Punto de Venta)', path: '/pos', feature: 'VENTAS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: RotateCcw, label: 'Ventas', path: '/ventas', feature: 'VENTAS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'FACTURADOR', 'CAJERO'] },
                    { icon: Wallet, label: 'Caja', path: '/caja', feature: 'CAJA', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Banknote, label: 'Créditos', path: '/creditos', feature: 'CREDITOS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: FileText, label: 'Cotizaciones (B2B)', path: '/cotizaciones', feature: 'COTIZACIONES', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                ]
            },
            {
                groupKey: 'inventario_productos',
                title: 'Inventario & Productos',
                icon: Package,
                items: [
                    { icon: Package, label: 'Catálogo', path: '/catalogo', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Calculator, label: 'Simulador de Márgenes', path: '/calculadora-margenes', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                    { icon: Warehouse, label: 'Inventario', path: '/inventario', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: ClipboardList, label: 'Conteo Fisico', path: '/auditoria-inventario', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'CAJERO'] },
                    { icon: Tag, label: 'Categorías', path: '/categories', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'] },
                    { icon: Truck, label: 'Traslados', path: '/traslados', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: ClipboardList, label: 'Pedidos Internos', path: '/pedidos', feature: 'PEDIDOS_INTERNOS', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'VENDEDOR', 'CAJERO'] },
                    { icon: Package, label: 'Pedidos Compra', path: '/compras/pedidos', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR'] },
                    { icon: ShoppingCart, label: 'Ingresar Compra', path: '/compras/recepciones', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'CAJERO'] },
                    { icon: History, label: 'Ingreso Histórico', path: '/compras/historico', feature: 'INVENTARIO', roles: hasHistoricoAccess ? ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'VENDEDOR', 'FACTURADOR', 'SUPERVISOR', 'USER'] : ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: ClipboardList, label: 'Historial Ingresos', path: '/compras/historial', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR', 'CAJERO'] },
                    { icon: Percent, label: 'Descuentos', path: '/descuentos', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'] },
                    { icon: Tag, label: 'Solicitudes Precio', path: '/solicitudes-precio', feature: 'LISTAS_PRECIOS', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                ]
            },
            {
                groupKey: 'pagina_web',
                title: 'Página Web',
                icon: Globe,
                items: [
                    { icon: Globe, label: 'Configuración Web', path: '/web-config', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: Globe, label: 'Catálogo Web', path: '/catalogo-web', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: Globe, label: 'Premios Web', path: '/premios-web', feature: 'INVENTARIO', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                ]
            },
            {
                groupKey: 'gestion_contactos',
                title: 'Gestión & Contactos',
                icon: Users,
                items: [
                    { icon: Store, label: 'Sucursales', path: '/sucursales', feature: 'MULTI_SUCURSAL', roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: Users, label: 'Personal', path: '/usuarios', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR'] },
                    { icon: Users, label: 'Clientes', path: '/clientes', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'USER', 'SUPERVISOR', 'VENDEDOR'] },
                    { icon: Briefcase, label: 'Proveedores', path: '/proveedores', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'SUPERVISOR'] },
                    { icon: QrCode, label: 'Control QR', path: '/qr-control', feature: 'CONTROL_QR', roles: ['ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL', 'CAJERO', 'USER', 'SUPERVISOR'] },
                ]
            },
            {
                groupKey: 'contabilidad',
                title: 'Contabilidad',
                icon: BookOpen,
                items: [
                    { icon: BookOpen, label: 'Contabilidad', path: '/contabilidad', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] }
                ]
            },
            {
                groupKey: 'sistema',
                title: 'Sistema & Auditoría',
                icon: Settings,
                items: [
                    { icon: Users, label: 'Comunidad', path: '/comunidad', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN', 'CAJERO', 'VENDEDOR', 'SUPERVISOR'] },
                    { icon: Settings, label: 'Configuración', path: '/configuracion', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN'] },
                    { icon: Shield, label: 'Auditoría', path: '/auditoria', feature: null, roles: ['ADMIN_MATRIZ', 'ADMIN', 'SUPERADMIN'] },
                ]
            }
        ];

        return rawGroups.map(group => {
            const filteredItems = group.items.filter(item => {
                if (!item.roles.includes(role ?? '')) return false;
                if (['/pos', '/ventas', '/caja', '/inventario', '/pedidos', '/traslados', '/creditos', '/qr-control'].includes(item.path)) {
                    return true;
                }
                return !item.feature || hasFeature(item.feature);
            });
            return { ...group, items: filteredItems };
        }).filter(group => group.items.length > 0);
    };

    const navGroups = getNavGroups();
    const allFlatNavItems = navGroups.flatMap(g => g.items);
    const mobileBottomItems = allFlatNavItems.slice(0, 4);

    // Desplegar automáticamente el grupo que contenga la ruta activa
    React.useEffect(() => {
        navGroups.forEach(g => {
            if (g.items.some(item => isItemActive(item.path))) {
                setOpenGroups(prev => ({ ...prev, [g.groupKey]: true }));
            }
        });
    }, [location.pathname, location.search]);

    const toggleGroup = (key: string) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* ── Desktop Sidebar ── */}
                <aside className={cn("hidden md:flex flex-col bg-[#07090e] border-r border-white/10 transition-all duration-300 relative select-none shrink-0 z-20", isCollapsed ? "w-20 p-3 gap-3" : "w-64 p-4 gap-4")}>

                    {/* Header (Menu Toggle + Brand) */}
                    <div className="flex items-center gap-3 px-1 h-8">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            title={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                        >
                            <Menu size={20} />
                        </button>
                        <div className={cn("flex items-center overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                            <span className="text-base font-bold tracking-tight whitespace-nowrap">Sales System</span>
                        </div>
                    </div>

                    {/* Navigation Groups (Desplegables) */}
                    <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                        {navGroups.map((group) => {
                            const isGroupActive = group.items.some(item => isItemActive(item.path));
                            const isOpen = !!openGroups[group.groupKey];

                            // Si el grupo solo tiene 1 ítem (ej. Dashboard), renderizar ítem directo
                            if (group.items.length === 1) {
                                const singleItem = group.items[0];
                                const isActive = isItemActive(singleItem.path);
                                return (
                                    <Link
                                        key={singleItem.path}
                                        to={singleItem.path}
                                        title={isCollapsed ? singleItem.label : undefined}
                                        className={cn(
                                            'flex items-center gap-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-sm shrink-0',
                                            isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'py-2.5 px-3',
                                            isActive
                                                ? 'bg-white text-black shadow-lg shadow-white/10 font-bold'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <singleItem.icon size={isCollapsed ? 18 : 16} className={cn("transition-colors shrink-0", isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                                        <div className={cn("overflow-hidden transition-all duration-300 flex items-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                            <span className="whitespace-nowrap">{singleItem.label}</span>
                                        </div>
                                    </Link>
                                );
                            }

                            return (
                                <div key={group.groupKey} className="flex flex-col gap-0.5">
                                    {/* Cabecera del Grupo Desplegable */}
                                    {!isCollapsed ? (
                                        <button
                                            onClick={() => toggleGroup(group.groupKey)}
                                            className={cn(
                                                "w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
                                                isGroupActive ? "text-indigo-400 bg-white/5" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <group.icon size={15} className={cn("transition-colors", isGroupActive ? "text-indigo-400" : "text-gray-400")} />
                                                <span>{group.title}</span>
                                            </div>
                                            <ChevronDown size={14} className={cn("transition-transform duration-200 text-gray-500", isOpen ? "rotate-180 text-white" : "")} />
                                        </button>
                                    ) : (
                                        <div className="w-full text-center py-1">
                                            <div className="w-8 h-0.5 bg-gray-800 mx-auto my-1 rounded-full"></div>
                                        </div>
                                    )}

                                    {/* Sub-ítems desplegables */}
                                    {(isOpen || isCollapsed) && (
                                        <div className={cn("flex flex-col gap-1 transition-all", !isCollapsed ? "pl-2 ml-2 border-l border-white/10" : "")}>
                                            {group.items.map((item) => {
                                                const isActive = isItemActive(item.path);
                                                return (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        title={isCollapsed ? item.label : undefined}
                                                        className={cn(
                                                            'flex items-center gap-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-sm shrink-0',
                                                            isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'py-2 px-3',
                                                            isActive
                                                                ? 'bg-white text-black shadow-lg shadow-white/10 font-bold'
                                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                        )}
                                                    >
                                                        <item.icon size={isCollapsed ? 18 : 15} className={cn("transition-colors shrink-0", isActive ? "text-black" : "text-gray-400 group-hover:text-white")} />
                                                        <div className={cn("overflow-hidden transition-all duration-300 flex items-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                                            <span className="whitespace-nowrap font-medium text-xs">{item.label}</span>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="mt-auto pt-3 border-t border-gray-800 flex flex-col gap-1.5">
                        {/* Botón de Novedades del Sistema */}
                        <button
                            onClick={handleOpenWhatsNew}
                            title={isCollapsed ? "Ver Novedades del Sistema" : undefined}
                            className={cn(
                                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 text-xs font-semibold group border border-indigo-500/30 hover:border-indigo-400/60 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 hover:from-indigo-900/80 hover:to-purple-900/60 text-indigo-200 shadow-xs",
                                isCollapsed ? "justify-center px-0 py-2" : ""
                            )}
                        >
                            <div className="relative shrink-0">
                                <Sparkles size={15} className="text-indigo-400 group-hover:text-indigo-200 group-hover:scale-110 transition-transform" />
                                {hasUnreadNews && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                                )}
                            </div>
                            <div className={cn("overflow-hidden transition-all duration-300 flex items-center justify-between flex-1", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
                                <span className="whitespace-nowrap font-bold text-[11px] text-indigo-200 group-hover:text-white">Novedades</span>
                                {hasUnreadNews && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-gray-950 px-1.5 py-0.2 rounded-full shadow-2xs">
                                        Nuevo
                                    </span>
                                )}
                            </div>
                        </button>
                        <button 
                            onClick={() => openProfileModal('profile')}
                            title={isCollapsed ? (user?.full_name || user?.username || 'Mi Perfil') : 'Personalizar mi perfil y contraseña'}
                            className={cn(
                                "flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-all text-left group w-full border border-transparent hover:border-white/10 cursor-pointer",
                                isCollapsed ? "justify-center p-1" : ""
                            )}
                        >
                            <div className="relative shrink-0">
                                {user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-xs"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full border border-gray-700 bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xs">
                                        <span className="text-xs font-bold text-white uppercase">
                                            {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
                            </div>
                            <div className={cn("overflow-hidden transition-all duration-300 flex flex-col justify-center", isCollapsed ? "w-0 opacity-0 hidden" : "w-full opacity-100")}>
                                <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition-colors">
                                    {user?.full_name || user?.username || 'Usuario'}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                    <span>{user?.role || 'Miembro'}</span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-indigo-400 font-semibold group-hover:underline">Perfil</span>
                                </p>
                            </div>
                        </button>

                        <button onClick={() => setShowLogoutConfirm(true)} title={isCollapsed ? "Cerrar Sesión" : undefined} className={cn("flex items-center gap-2 w-full p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors group", isCollapsed ? "justify-center" : "")}>
                            <LogOut size={16} className="shrink-0" />
                            <div className={cn("overflow-hidden transition-all duration-300 flex items-center", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
                                <span className="text-xs font-medium whitespace-nowrap">Cerrar Sesión</span>
                            </div>
                        </button>
                    </div>
                </aside>


            {/* ── Exit Impersonation Banner ── */}
            {useAuthStore(state => state.originalToken) && (
                <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
                    <span className="text-xs font-medium truncate pr-2">Viendo como <strong>{user?.username}</strong></span>
                    <button 
                            onClick={async () => {
                                const store = useAuthStore.getState();
                                if (store.originalToken) {
                                    try {
                                        // Temporarily override the API token
                                        useAuthStore.setState({ token: store.originalToken });
                                        // Fetch the real original user
                                        const originalUser = await getMe();
                                        store.login(store.originalToken, originalUser);
                                        store.setOriginalToken(null);
                                        store.setFeatures([]);
                                        window.location.href = '/';
                                    } catch (e) {
                                        store.logout();
                                        window.location.href = '/login';
                                    }
                                }
                            }}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap"
                    >
                        Volver
                    </button>
                </div>
            )}

            {/* ── Main Content Partition (Full Screen Split) ── */}
            <main className={cn("flex-1 flex flex-col min-w-0 h-full bg-[#f4f6f8] relative overflow-hidden", useAuthStore(state => state.originalToken) ? "mt-10 md:mt-0" : "")}>
                <TrialWarningBanner />
                {/* Desktop Exit Impersonation Banner */}
                {useAuthStore(state => state.originalToken) && (
                    <div className="hidden md:flex mx-4 mt-3 mb-2 bg-indigo-600 text-white px-4 py-2 rounded-xl items-center justify-between shadow-md">
                        <span className="text-sm font-medium">Estás navegando la cuenta como <strong>{user?.username}</strong></span>
                        <button 
                            onClick={async () => {
                                const store = useAuthStore.getState();
                                if (store.originalToken) {
                                    try {
                                        // Temporarily override the API token
                                        useAuthStore.setState({ token: store.originalToken });
                                        // Fetch the real original user
                                        const originalUser = await getMe();
                                        store.login(store.originalToken, originalUser);
                                        store.setOriginalToken(null);
                                        store.setFeatures([]);
                                        window.location.href = '/';
                                    } catch (e) {
                                        store.logout();
                                        window.location.href = '/login';
                                    }
                                }
                            }}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                            Volver a mi cuenta original
                        </button>
                    </div>
                )}
                
                {/* Top Bar móvil (limpio en desktop para maximizar espacio de trabajo) */}
                    <div className="md:hidden bg-white border-b border-gray-200/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-xs">
                        <div className="flex items-center gap-2">
                            <img src="/vite.svg" alt="Sales System" className="h-6 w-auto object-contain" />
                            <span className="font-bold text-xs text-gray-900">Pegasus Nexus</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => openProfileModal('profile')}
                                className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1.5"
                            >
                                <UserIcon size={14} className="text-indigo-600" />
                                <span>Perfil</span>
                            </button>
                            {role !== 'CAJERO' && (
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600"
                                >
                                    <Menu size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* View Search Modal */}
                    <ViewSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
                    <WhatsNewModal isOpen={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />


                    {/* Scrollable Content */}
                    <div className={`flex-1 min-h-0 relative scroll-smooth ${location.pathname === '/pos'
                        ? 'overflow-hidden flex flex-col'
                        : 'overflow-y-auto overflow-x-hidden'
                        }`}>
                        {/* Add bottom padding on mobile so content is not hidden behind bottom nav */}
                        <div className="md:h-0 h-0" />
                        {children}
                    </div>
            </main>

            {/* ── Mobile Bottom Nav Bar ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-stretch">
                {mobileBottomItems.map((item) => {
                    const isActive = item.path === '/' ? location.pathname === '/' : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                                isActive ? 'text-indigo-600' : 'text-gray-400'
                            )}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                        </Link>
                    );
                })}
                {/* "Más" button if there are more items */}
                {allFlatNavItems.length > 4 && (
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400"
                    >
                        <Menu size={20} />
                        <span className="text-[10px] font-semibold">Más</span>
                    </button>
                )}
            </nav>

            {/* ── Mobile Full Menu Drawer ── */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/60 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0f0f0f] flex flex-col p-6 gap-4 overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <img src="/vite.svg" alt="Sales System" className="h-8 w-auto object-contain" />
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* User */}
                            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
                                <div className="w-10 h-10 rounded-full border-2 border-gray-700 bg-white/10 flex items-center justify-center shrink-0 text-white font-bold text-lg">
                                    {(user?.username || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{user?.username || 'Usuario'}</p>
                                    <p className="text-xs text-gray-500">{user?.role || 'Miembro'}</p>
                                </div>
                            </div>

                            {/* All Nav Items */}
                            <div className="flex flex-col gap-1 flex-1">
                                {allFlatNavItems.map((item: NavSubItem) => {
                                    const isActive = item.path === '/' ? location.pathname === '/' : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl py-3 px-3 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-white text-black'
                                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                            )}
                                        >
                                            <item.icon size={18} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                                className="flex items-center gap-3 rounded-xl py-3 px-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors mt-auto"
                            >
                                <LogOut size={18} />
                                Cerrar Sesión
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Logout Confirm Modal ── */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                                    <LogOut size={24} />
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 text-center mb-2">¿Seguro que deseas salir?</h3>
                            <p className="text-sm text-gray-500 text-center mb-6">Tu sesión actual se cerrará y se limpiarán los datos temporales del navegador.</p>

                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-200 flex items-center justify-center gap-2">
                                    Salir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ── Modal de Personalización de Perfil & Seguridad ── */}
            <AnimatePresence>
                {isChangePasswordOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-gray-900 border border-gray-100">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 px-6 py-5 text-white flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                                        <UserIcon className="w-5 h-5 text-indigo-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold tracking-tight">Mi Perfil & Seguridad</h3>
                                        <p className="text-xs text-gray-400 font-medium">Personaliza tus datos de acceso en Pegasus Nexus</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsChangePasswordOpen(false)} 
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-gray-300 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Tabs Switcher */}
                            <div className="flex border-b border-gray-200 bg-gray-50/70 p-1.5 gap-2 px-6">
                                <button
                                    type="button"
                                    onClick={() => setProfileTab('profile')}
                                    className={cn(
                                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                        profileTab === 'profile'
                                            ? "bg-white text-indigo-700 shadow-sm border border-gray-200/80"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    <UserIcon size={14} />
                                    <span>Datos Personales & Foto</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProfileTab('password')}
                                    className={cn(
                                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                        profileTab === 'password'
                                            ? "bg-white text-indigo-700 shadow-sm border border-gray-200/80"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    <KeyRound size={14} />
                                    <span>Cambiar Contraseña</span>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                {profileTab === 'profile' ? (
                                    <form onSubmit={handleSaveProfile} className="space-y-5">
                                        {/* Avatar Picker */}
                                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="relative group shrink-0">
                                                {avatarUrlInput ? (
                                                    <img
                                                        src={avatarUrlInput}
                                                        alt="Foto de perfil"
                                                        className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center border-2 border-indigo-200 shadow-md">
                                                        <span className="text-2xl font-black text-white uppercase">
                                                            {(fullNameInput || user?.username || 'U')[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploadingAvatar}
                                                    className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1"
                                                >
                                                    {isUploadingAvatar ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Camera size={16} />
                                                            <span>Cambiar</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <div className="flex-1 text-center sm:text-left space-y-1.5">
                                                <h4 className="text-sm font-bold text-gray-900">Foto de Perfil</h4>
                                                <p className="text-xs text-gray-500">Sube una imagen cuadrada (.jpg, .png) para personalizar tu avatar.</p>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarFileSelect}
                                                    className="hidden"
                                                />
                                                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploadingAvatar}
                                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5"
                                                    >
                                                        {isUploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                                                        <span>Subir foto</span>
                                                    </button>
                                                    {avatarUrlInput && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAvatarUrlInput('')}
                                                            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors font-medium"
                                                        >
                                                            Quitar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={fullNameInput}
                                                onChange={(e) => setFullNameInput(e.target.value)}
                                                placeholder="Ej. Juan Pérez"
                                                className="w-full px-3.5 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium outline-none transition-all"
                                            />
                                        </div>

                                        {/* Read-Only Info Pills */}
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuario / Login</span>
                                                <span className="text-xs font-bold text-gray-800 truncate block mt-0.5">{user?.username}</span>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rol de Sistema</span>
                                                <span className="text-xs font-bold text-indigo-600 truncate block mt-0.5">{user?.role}</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsChangePasswordOpen(false)} 
                                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={isSavingProfile || isUploadingAvatar} 
                                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                                            >
                                                {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                <span>{isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                                        <p className="text-xs text-gray-500 mb-2">Para proteger tu cuenta ({user?.username}), ingresa tu contraseña actual y luego define una nueva segura.</p>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña Actual</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type={showCurrentPw ? 'text' : 'password'}
                                                    required
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm outline-none"
                                                    placeholder="Ingresa tu contraseña actual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPw(prev => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm outline-none"
                                                    placeholder="Mín. 8 caracteres, números y símbolos"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPw(prev => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type={showConfirmPw ? 'text' : 'password'}
                                                    required
                                                    value={confirmNewPassword}
                                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm outline-none"
                                                    placeholder="Repite la nueva contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPw(prev => !prev)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-3 flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsChangePasswordOpen(false)} 
                                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={isChangingPassword} 
                                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                                            >
                                                {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                                <span>{isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

