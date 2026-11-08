import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Store,
    LogOut, 
    Plus, 
    ExternalLink, 
    Copy, 
    Check, 
    Palette, 
    Package, 
    Upload, 
    Trash2, 
    Edit, 
    Loader2, 
    Sparkles,
    Lock, 
    Eye, 
    EyeOff 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    getMyCatalogConfig, 
    getMyCatalogProducts, 
    updateMyCatalogConfig, 
    deleteCatalogProduct, 
    updateCatalogProduct,
    uploadCatalogImage 
} from '../api/catalogoApi';
import type { CatalogoProducto } from '../api/catalogoApi';
import CatalogoProductModal from '../components/catalogo/CatalogoProductModal';
import PhoneCountryInput from '../components/catalogo/PhoneCountryInput';

const COLOR_PRESETS = [
    { name: 'Índigo Moderno', primary: '#4f46e5', secondary: '#06b6d4' },
    { name: 'Esmeralda Fresco', primary: '#059669', secondary: '#10b981' },
    { name: 'Rosa Pasión', primary: '#e11d48', secondary: '#f59e0b' },
    { name: 'Elegante Noche', primary: '#0f172a', secondary: '#d97706' },
    { name: 'Morado Real', primary: '#7c3aed', secondary: '#ec4899' },
];

export default function CatalogoAdminPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const [activeTab, setActiveTab] = useState<'products' | 'branding'>('products');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<CatalogoProducto | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        document.title = 'Mi Catálogo Digital - Panel de Administración | Pegasus';
    }, []);

    // Queries
    const { data: config, isLoading: isConfigLoading } = useQuery({
        queryKey: ['my-catalog-config'],
        queryFn: getMyCatalogConfig,
    });

    const { data: products = [], isLoading: isProductsLoading } = useQuery({
        queryKey: ['my-catalog-products'],
        queryFn: getMyCatalogProducts,
    });

    // Branding Form State
    const [businessName, setBusinessName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
    const [logoUrl, setLogoUrl] = useState('');
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isSavingBranding, setIsSavingBranding] = useState(false);

    // Sync form state when config loads
    React.useEffect(() => {
        if (config) {
            setBusinessName(config.business_name || '');
            setSlug(config.slug || '');
            setDescription(config.description || '');
            setWhatsapp(config.whatsapp_number || '');
            setPrimaryColor(config.primary_color || '#4f46e5');
            setSecondaryColor(config.secondary_color || '#06b6d4');
            setLogoUrl(config.logo_url || '');
        }
    }, [config]);

    const publicUrl = config?.slug
        ? `${window.location.origin}/c/${config.slug}`
        : '';

    const handleCopyLink = () => {
        if (!publicUrl) return;
        navigator.clipboard.writeText(publicUrl);
        setCopiedLink(true);
        toast.success('¡Enlace copiado al portapapeles!');
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        try {
            const url = await uploadCatalogImage(file);
            setLogoUrl(url);
            toast.success('Logotipo subido con éxito.');
        } catch {
            toast.error('Error al subir el logotipo.');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSaveBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingBranding(true);
        try {
            await updateMyCatalogConfig({
                business_name: businessName.trim(),
                description: description.trim() || undefined,
                whatsapp_number: whatsapp.trim(),
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                logo_url: logoUrl || undefined,
            });
            await queryClient.invalidateQueries({ queryKey: ['my-catalog-config'] });
            toast.success('Personalización guardada con éxito.');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar configuración.';
            toast.error(msg);
        } finally {
            setIsSavingBranding(false);
        }
    };

    const handleToggleAvailability = async (product: CatalogoProducto) => {
        try {
            await updateCatalogProduct(product.id, { is_available: !product.is_available });
            await queryClient.invalidateQueries({ queryKey: ['my-catalog-products'] });
            toast.success(
                product.is_available ? 'Producto pausado (oculto en catálogo)' : 'Producto visible para tus clientes'
            );
        } catch {
            toast.error('Error al cambiar disponibilidad.');
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este producto del catálogo?')) return;
        try {
            await deleteCatalogProduct(productId);
            await queryClient.invalidateQueries({ queryKey: ['my-catalog-products'] });
            toast.success('Producto eliminado del catálogo.');
        } catch {
            toast.error('Error al eliminar producto.');
        }
    };

    if (isConfigLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
            {/* Top Navigation */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                            <Store size={22} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 leading-tight">
                                {config?.business_name || 'Mi Catálogo'}
                            </h1>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Panel de Administración
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {publicUrl && (
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                            >
                                <ExternalLink size={14} />
                                <span>Ver Catálogo en Vivo</span>
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setEditingProduct(null);
                                setIsProductModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Nuevo Producto</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                navigate('/catalogo/auth?mode=login');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                            title="Cerrar sesión"
                        >
                            <LogOut size={15} />
                            <span className="hidden sm:inline">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Shareable Public URL Card */}
                {publicUrl && (
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                                    <Sparkles size={12} />
                                    Tu catálogo está online
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold">Enlace público para compartir:</h2>
                            <p className="text-xs sm:text-sm text-indigo-200 font-mono break-all">
                                {publicUrl}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                                {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                <span>{copiedLink ? 'Copiado!' : 'Copiar Enlace'}</span>
                            </button>
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/30"
                            >
                                <ExternalLink size={16} />
                                <span>Abrir</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* Tabs Switcher */}
                <div className="flex border-b border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-colors ${
                            activeTab === 'products'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Package size={16} />
                        <span>Productos ({products.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('branding')}
                        className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-colors ${
                            activeTab === 'branding'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Palette size={16} />
                        <span>Personalización y WhatsApp</span>
                    </button>
                </div>

                {/* Tab 1: Products */}
                {activeTab === 'products' && (
                    <div className="space-y-4">
                        {isProductsLoading ? (
                            <div className="p-12 text-center text-slate-500 text-xs">
                                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                                Cargando tus productos...
                            </div>
                        ) : products.length === 0 ? (
                            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 max-w-md mx-auto space-y-3">
                                <Package size={40} className="text-slate-300 mx-auto" />
                                <h3 className="text-base font-bold text-gray-900">Aún no has agregado productos</h3>
                                <p className="text-xs text-slate-500">
                                    Agrega tus primeros productos con fotos y precios para que tus clientes puedan verlos en tu catálogo digital.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setIsProductModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                                >
                                    <Plus size={16} />
                                    <span>Agregar mi Primer Producto</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className={`bg-white rounded-2xl border p-4 shadow-xs flex gap-3 transition-all ${
                                            product.is_available
                                                ? 'border-slate-200'
                                                : 'border-slate-200/60 bg-slate-50/50 opacity-70'
                                        }`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Store size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {product.category || 'General'}
                                                </span>
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                    {product.title}
                                                </h4>
                                                <p className="text-xs font-black text-indigo-600 mt-0.5">
                                                    {product.currency_symbol} {product.price.toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleAvailability(product)}
                                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer ${
                                                        product.is_available
                                                            ? 'text-emerald-600 hover:text-emerald-700'
                                                            : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                    title={product.is_available ? 'Ocultar' : 'Hacer visible'}
                                                >
                                                    {product.is_available ? <Eye size={14} /> : <EyeOff size={14} />}
                                                    <span>{product.is_available ? 'Activo' : 'Pausado'}</span>
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setIsProductModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                                        title="Editar"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Branding & Settings */}
                {activeTab === 'branding' && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl space-y-6">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Personalización de tu Tienda</h3>
                            <p className="text-xs text-slate-500">
                                Configura tus colores corporativos, logotipo y número de WhatsApp para pedidos.
                            </p>
                        </div>

                        <form onSubmit={handleSaveBranding} className="space-y-5">
                            {/* Logo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Logotipo del Negocio
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Store size={32} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                                            <Upload size={14} />
                                            <span>{logoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                disabled={isUploadingLogo}
                                                className="hidden"
                                            />
                                        </label>
                                        <p className="text-[11px] text-slate-500">
                                            PNG o JPG recomendado para mejor visualización.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Business Name & Slug */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Nombre Comercial
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="Ej. Pastelería Dulce"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Enlace de tu Catálogo
                                        </label>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            <Lock size={10} />
                                            Fijo en Plan Gratuito
                                        </span>
                                    </div>
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                                        <span className="px-3 text-xs text-slate-500 font-mono">/c/</span>
                                        <input
                                            type="text"
                                            readOnly
                                            disabled
                                            value={slug}
                                            className="w-full py-2.5 pr-3 text-slate-600 bg-slate-100 text-xs sm:text-sm font-mono font-medium cursor-not-allowed select-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Tu enlace se asigna automáticamente al registrarte. La personalización de enlaces estará disponible en los planes de pago.
                                    </p>
                                </div>
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Número de WhatsApp para Pedidos *
                                </label>
                                <PhoneCountryInput
                                    value={whatsapp}
                                    onChange={setWhatsapp}
                                    required
                                    placeholder="67998576"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Los clientes enviarán sus carritos de compra directamente a este número con código de país.
                                </p>
                            </div>

                            {/* Welcome Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Descripción / Eslogan
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Una breve frase que describa tu negocio para que tus clientes la vean en el encabezado..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>

                            {/* Color Palettes & Custom Colors */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Colores de Marca
                                </label>

                                {/* Presets */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => {
                                                setPrimaryColor(preset.primary);
                                                setSecondaryColor(preset.secondary);
                                            }}
                                            className="p-2 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white text-left transition-all cursor-pointer flex flex-col gap-1 shadow-xs"
                                        >
                                            <div className="flex h-4 w-full rounded-md overflow-hidden">
                                                <div className="w-1/2 h-full" style={{ backgroundColor: preset.primary }} />
                                                <div className="w-1/2 h-full" style={{ backgroundColor: preset.secondary }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700 truncate">
                                                {preset.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Color Principal
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-gray-900 bg-white text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Color Secundario
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-gray-900 bg-white text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSavingBranding}
                                    className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSavingBranding && <Loader2 size={16} className="animate-spin" />}
                                    <span>Guardar Cambios</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Product Create / Edit Modal */}
            <CatalogoProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSaved={async () => { await queryClient.invalidateQueries({ queryKey: ['my-catalog-products'] }); await queryClient.refetchQueries({ queryKey: ['my-catalog-products'] }); }}
                productToEdit={editingProduct}
                currencySymbol={config?.currency_symbol || 'Bs.'}
            />
        </div>
    );
}
