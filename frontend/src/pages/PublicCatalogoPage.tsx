import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    ShoppingBag, 
    Search, 
    Plus, 
    Minus, 
    Trash2, 
    X, 
    Share2, 
    MessageCircle, 
    Store, 
    Sparkles, 
    ArrowRight,
    AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { getPublicCatalog } from '../api/catalogoApi';
import type { CatalogoProducto, PublicCatalogoResponse } from '../api/catalogoApi';

interface CartItem {
    product: CatalogoProducto;
    quantity: number;
}

export default function PublicCatalogoPage() {
    const { slug } = useParams<{ slug: string }>();

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    // Selected product for modal preview
    const [activeProduct, setActiveProduct] = useState<CatalogoProducto | null>(null);
    const [modalQuantity, setModalQuantity] = useState(1);

    // Query Catalog Data
    const { data, isLoading, isError } = useQuery<PublicCatalogoResponse>({
        queryKey: ['public-catalog', slug],
        queryFn: () => getPublicCatalog(slug || ''),
        enabled: !!slug,
        staleTime: 60_000,
    });

    const config = data?.config;
    const products = data?.products || [];

    // Dynamically update page title, favicon and meta tags with merchant branding
    useEffect(() => {
        if (!config) return;

        const originalTitle = document.title;
        const iconLink: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        const originalIcon = iconLink?.href;

        // 1. Update Document Title
        document.title = `${config.business_name} | Catálogo Digital`;

        // 2. Update Favicon with Merchant Logo
        if (config.logo_url && iconLink) {
            iconLink.href = config.logo_url;
        }

        // 3. Helper to update or inject Open Graph / Twitter Meta Tags
        const updateMeta = (propOrName: string, content: string) => {
            let el = document.querySelector(`meta[property="${propOrName}"], meta[name="${propOrName}"]`);
            if (!el) {
                el = document.createElement('meta');
                if (propOrName.startsWith('twitter:')) {
                    el.setAttribute('name', propOrName);
                } else {
                    el.setAttribute('property', propOrName);
                }
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        updateMeta('og:title', `${config.business_name} | Catálogo Digital`);
        updateMeta('og:description', config.description || `Explora el catálogo digital de ${config.business_name} y haz tu pedido directamente por WhatsApp.`);
        updateMeta('og:type', 'website');
        updateMeta('og:url', window.location.href);
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', `${config.business_name} | Catálogo Digital`);
        updateMeta('twitter:description', config.description || `Explora nuestro catálogo digital y realiza tu pedido.`);

        if (config.logo_url) {
            updateMeta('og:image', config.logo_url);
            updateMeta('twitter:image', config.logo_url);
        }

        return () => {
            document.title = originalTitle;
            if (iconLink && originalIcon) {
                iconLink.href = originalIcon;
            }
        };
    }, [config]);
    const categories = data?.categories || [];

    // Filtered products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = 
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    // Cart calculations
    const cartTotalItems = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.quantity, 0);
    }, [cart]);

    const cartTotalPrice = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
    }, [cart]);

    const addToCart = (product: CatalogoProducto, quantity = 1) => {
        setCart((prev) => {
            const index = prev.findIndex((i) => i.product.id === product.id);
            if (index >= 0) {
                const next = [...prev];
                next[index] = { ...next[index], quantity: next[index].quantity + quantity };
                return next;
            }
            return [...prev, { product, quantity }];
        });
        toast.success(`"${product.title}" agregado al carrito`);
    };

    const updateCartQuantity = (productId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.product.id === productId) {
                        const newQ = item.quantity + delta;
                        return newQ > 0 ? { ...item, quantity: newQ } : null;
                    }
                    return item;
                })
                .filter((item): item is CartItem => item !== null);
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    // Format WhatsApp single inquiry
    // Helper to clean and ensure international country code (default +591 for Bolivia 8-digit mobile)
const sanitizeWhatsAppPhone = (rawPhone: string): string => {
    if (!rawPhone) return '';
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.length === 8 && (clean.startsWith('6') || clean.startsWith('7'))) {
        clean = '591' + clean;
    }
    return clean;
};

    const sendSingleProductInquiry = (product: CatalogoProducto) => {
        if (!config?.whatsapp_number) {
            toast.warning('Este negocio aún no ha configurado su número de WhatsApp.');
            return;
        }

        const cleanPhone = sanitizeWhatsAppPhone(config.whatsapp_number);
        const currentUrl = window.location.href;
        const text = `¡Hola ${config.business_name}! Vi el producto *${product.title}* (${product.currency_symbol} ${product.price.toFixed(2)}) en su catálogo digital y me gustaría consultar disponibilidad:\n\n${currentUrl}`;
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Format WhatsApp consolidated order
    const sendCartWhatsAppOrder = () => {
        if (!config?.whatsapp_number) {
            toast.warning('Este negocio aún no ha configurado su número de WhatsApp.');
            return;
        }

        if (cart.length === 0) {
            toast.warning('Tu carrito está vacío.');
            return;
        }

        const cleanPhone = sanitizeWhatsAppPhone(config.whatsapp_number);
        const currentUrl = window.location.href;

        let message = `¡Hola *${config.business_name}*! Quisiera realizar el siguiente pedido desde su catálogo digital:\n\n`;

        cart.forEach((item) => {
            const subtotal = item.quantity * item.product.price;
            message += `• ${item.quantity}x *${item.product.title}* - ${item.product.currency_symbol} ${subtotal.toFixed(2)}\n`;
        });

        message += `\n💰 *Total:* ${config.currency_symbol || 'Bs.'} ${cartTotalPrice.toFixed(2)}\n`;

        if (customerName.trim()) {
            message += `👤 *Cliente:* ${customerName.trim()}\n`;
        }

        if (customerNotes.trim()) {
            message += `📍 *Entrega / Notas:* ${customerNotes.trim()}\n`;
        }

        message += `\nCatálogo: ${currentUrl}`;

        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setIsCartOpen(false);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: config?.business_name || 'Catálogo Digital',
                    text: `Mira nuestro catálogo digital con todos los productos:`,
                    url: window.location.href,
                });
            } catch {
                // User cancelled or unsupported
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('¡Enlace del catálogo copiado al portapapeles!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">Cargando catálogo digital...</p>
                </div>
            </div>
        );
    }

    if (isError || !config) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-slate-200 space-y-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Catálogo No Disponible</h2>
                    <p className="text-xs text-slate-500">
                        El catálogo que buscas no existe o se encuentra inactivo momentáneamente.
                    </p>
                    <Link
                        to="/catalogo/auth"
                        className="inline-flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                        <span>Crear mi propio catálogo</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    const primaryColor = config.primary_color || '#4f46e5';
    const secondaryColor = config.secondary_color || '#06b6d4';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28">
            {/* Top Brand Banner */}
            <div 
                className="w-full text-white pt-8 pb-12 px-4 sm:px-6 relative shadow-md"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                }}
            >
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                    {/* Business Logo */}
                    {config.logo_url ? (
                        <img
                            src={config.logo_url}
                            alt={config.business_name}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-white p-1 shadow-lg shrink-0 border-2 border-white/40"
                        />
                    ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shadow-lg shrink-0 border-2 border-white/40">
                            <Store size={40} />
                        </div>
                    )}

                    {/* Business Info */}
                    <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
                                {config.business_name}
                            </h1>
                            <button
                                type="button"
                                onClick={handleShare}
                                className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-xs rounded-lg text-white transition-all cursor-pointer"
                                title="Compartir catálogo"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                        {config.description && (
                            <p className="text-xs sm:text-sm text-white/90 max-w-xl line-clamp-2">
                                {config.description}
                            </p>
                        )}
                        {config.whatsapp_number && (
                            <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-white/95">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-xs shadow-xs">
                                    <MessageCircle size={14} />
                                    <span>Pedidos WhatsApp: {config.whatsapp_number}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Search & Categories Bar */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 py-3">
                <div className="max-w-4xl mx-auto space-y-2.5">
                    {/* Search Input */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar productos en el catálogo..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Category Tabs */}
                    {categories.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('ALL')}
                                className={`px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                                    selectedCategory === 'ALL'
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Todos ({products.length})
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                                        selectedCategory === cat
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 max-w-md mx-auto my-12 space-y-2">
                        <Store size={36} className="text-slate-400 mx-auto" />
                        <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
                        <p className="text-xs text-slate-500">
                            {searchQuery ? 'Prueba con otra palabra de búsqueda.' : 'Este catálogo no tiene productos disponibles por el momento.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                            >
                                {/* Product Image */}
                                <div
                                    onClick={() => {
                                        setActiveProduct(product);
                                        setModalQuantity(1);
                                    }}
                                    className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
                                >
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0]}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Store size={36} />
                                        </div>
                                    )}

                                    {product.is_featured && (
                                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                                            <Sparkles size={10} />
                                            Destacado
                                        </span>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {product.category || 'General'}
                                        </span>
                                        <h3
                                            onClick={() => {
                                                setActiveProduct(product);
                                                setModalQuantity(1);
                                            }}
                                            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors cursor-pointer mt-0.5"
                                        >
                                            {product.title}
                                        </h3>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                                        <div>
                                            <span className="text-xs sm:text-base font-black text-slate-900">
                                                {product.currency_symbol} {product.price.toFixed(2)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => addToCart(product, 1)}
                                            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                            title="Agregar al carrito"
                                        >
                                            <Plus size={14} />
                                            <span className="hidden sm:inline">Agregar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Sticky Floating Shopping Cart Bar */}
            {cartTotalItems > 0 && (
                <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40">
                    <button
                        type="button"
                        onClick={() => setIsCartOpen(true)}
                        className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-2xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] border border-white/20 backdrop-blur-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative p-2 bg-white/20 rounded-xl">
                                <ShoppingBag size={20} />
                                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                                    {cartTotalItems}
                                </span>
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-medium text-slate-300">
                                    {cartTotalItems} {cartTotalItems === 1 ? 'producto' : 'productos'}
                                </p>
                                <p className="text-sm font-black">
                                    Total: {config.currency_symbol || 'Bs.'} {cartTotalPrice.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors shadow-xs">
                            <MessageCircle size={16} />
                            <span>Ver y Pedir</span>
                        </div>
                    </button>
                </div>
            )}

            {/* Cart Slide-Over / Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
                        {/* Cart Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Tu Pedido</h3>
                                    <p className="text-xs text-slate-500">
                                        {cartTotalItems} {cartTotalItems === 1 ? 'ítem' : 'ítems'} seleccionados
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div className="p-4 sm:p-5 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-3">
                            {cart.map((item) => (
                                <div key={item.product.id} className="pt-3 first:pt-0 flex items-center gap-3">
                                    {item.product.images?.[0] ? (
                                        <img
                                            src={item.product.images[0]}
                                            alt={item.product.title}
                                            className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <Store size={20} />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-slate-900 truncate">
                                            {item.product.title}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {item.product.currency_symbol} {item.product.price.toFixed(2)} c/u
                                        </p>
                                        <p className="text-xs font-black text-slate-900 mt-0.5">
                                            Subtotal: {item.product.currency_symbol} {(item.quantity * item.product.price).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => updateCartQuantity(item.product.id, -1)}
                                            className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 shadow-xs cursor-pointer"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-6 text-center text-xs font-bold text-slate-900">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateCartQuantity(item.product.id, 1)}
                                            className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 shadow-xs cursor-pointer"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Order Form & Checkout CTA */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Tu Nombre (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Ej. María López"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Dirección de Entrega / Notas Adicionales
                                    </label>
                                    <input
                                        type="text"
                                        value={customerNotes}
                                        onChange={(e) => setCustomerNotes(e.target.value)}
                                        placeholder="Ej. Calle 5 #234, enviar para las 15:00"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-sm font-bold border-t border-slate-200">
                                <span className="text-slate-600">Total a pagar:</span>
                                <span className="text-lg font-black text-slate-900">
                                    {config.currency_symbol || 'Bs.'} {cartTotalPrice.toFixed(2)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={sendCartWhatsAppOrder}
                                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-[0.99]"
                            >
                                <MessageCircle size={18} />
                                <span>Enviar Pedido por WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {activeProduct && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
                        {/* Image Preview */}
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                            {activeProduct.images?.[0] ? (
                                <img
                                    src={activeProduct.images[0]}
                                    alt={activeProduct.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Store size={48} />
                                </div>
                            )}
                            <button
                                onClick={() => setActiveProduct(null)}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {activeProduct.category || 'General'}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                                    {activeProduct.title}
                                </h3>
                                <p className="text-xl font-black text-slate-900 mt-1">
                                    {activeProduct.currency_symbol} {activeProduct.price.toFixed(2)}
                                </p>
                            </div>

                            {activeProduct.description && (
                                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {activeProduct.description}
                                </div>
                            )}

                            {/* Quantity & Actions */}
                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                                            className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 shadow-xs cursor-pointer"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-slate-900">
                                            {modalQuantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setModalQuantity(modalQuantity + 1)}
                                            className="p-1 rounded-lg bg-white text-slate-700 hover:bg-slate-200 shadow-xs cursor-pointer"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        addToCart(activeProduct, modalQuantity);
                                        setActiveProduct(null);
                                    }}
                                    className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                                >
                                    <ShoppingBag size={16} />
                                    <span>Agregar al Carrito ({activeProduct.currency_symbol} {(activeProduct.price * modalQuantity).toFixed(2)})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => sendSingleProductInquiry(activeProduct)}
                                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <MessageCircle size={16} />
                                    <span>Consultar sólo este producto por WhatsApp</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
