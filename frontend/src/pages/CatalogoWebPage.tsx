import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { Loader2, Globe, Eye, EyeOff, Search, ChevronDown, ChevronUp, Save, Star } from 'lucide-react';
import type { Category, Product, ProductUpdate } from '../api/types';
import { toast } from 'sonner';

const SUCURSAL_CBA = "69cd80098f3f6866d4cfbb64"; // Heroinas
const SUCURSAL_LPZ = "69ce6b7e8a00124dac6ecc99"; // Calacoto

export default function CatalogoWebPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
    
    const [pendingCatChanges, setPendingCatChanges] = useState<Record<string, boolean>>({});
    const [pendingProdChanges, setPendingProdChanges] = useState<Record<string, boolean>>({});
    const [pendingDestacadoChanges, setPendingDestacadoChanges] = useState<Record<string, boolean>>({});

    const { data: categories, isLoading: isLoadingCat } = useQuery({
        queryKey: ['categories'],
        queryFn: () => client<Category[]>('/categories')
    });

    const { data: productsData, isLoading: isLoadingProd } = useQuery({
        queryKey: ['products', 'web-catalog'],
        queryFn: () => client<{ items: Product[] }>('/products?limit=2000')
    });

    const products = productsData?.items || [];

    const updateCategoryMutation = useMutation({
        mutationFn: (data: { id: string, show_on_web: boolean }) => 
            client<Category>(`/categories/${data.id}`, { method: 'PATCH', body: { show_on_web: data.show_on_web } })
    });

    const updateProductMutation = useMutation({
        mutationFn: (data: { id: string, show_on_web?: boolean, is_destacado?: boolean }) => 
            client<Product>(`/products/${data.id}`, { method: 'PUT', body: { ...data } as unknown as ProductUpdate })
    });

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [categories, search]);

    const handleToggleCat = (catId: string, currentVal: boolean) => {
        setPendingCatChanges(prev => ({
            ...prev,
            [catId]: prev[catId] !== undefined ? !prev[catId] : !currentVal
        }));
    };

    const handleToggleProd = (prodId: string, currentVal: boolean) => {
        setPendingProdChanges(prev => ({
            ...prev,
            [prodId]: prev[prodId] !== undefined ? !prev[prodId] : !currentVal
        }));
    };

    const handleToggleDestacado = (prodId: string, currentVal: boolean) => {
        setPendingDestacadoChanges(prev => ({
            ...prev,
            [prodId]: prev[prodId] !== undefined ? !prev[prodId] : !currentVal
        }));
    };

    const toggleExpand = (catId: string) => {
        setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const handleApply = async () => {
        const catPromises = Object.entries(pendingCatChanges).map(([id, val]) => 
            updateCategoryMutation.mutateAsync({ id, show_on_web: val })
        );

        const productUpdates: Record<string, { show_on_web?: boolean, is_destacado?: boolean }> = {};
        Object.entries(pendingProdChanges).forEach(([id, val]) => {
            productUpdates[id] = { ...productUpdates[id], show_on_web: val };
        });
        Object.entries(pendingDestacadoChanges).forEach(([id, val]) => {
            productUpdates[id] = { ...productUpdates[id], is_destacado: val };
        });

        const prodPromises = Object.entries(productUpdates).map(([id, data]) => 
            updateProductMutation.mutateAsync({ id, ...data })
        );

        try {
            await Promise.all([...catPromises, ...prodPromises]);
            toast.success('Cambios guardados correctamente');
            setPendingCatChanges({});
            setPendingProdChanges({});
            setPendingDestacadoChanges({});
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['products', 'web-catalog'] });
        } catch (error) {
            toast.error('Hubo un error al guardar los cambios');
        }
    };

    const hasPendingChanges = Object.keys(pendingCatChanges).length > 0 || Object.keys(pendingProdChanges).length > 0 || Object.keys(pendingDestacadoChanges).length > 0;
    const isSaving = updateCategoryMutation.isPending || updateProductMutation.isPending;

    if (isLoadingCat || isLoadingProd) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-3 py-4 md:p-4 space-y-6 pb-20 md:pb-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden gap-4">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Globe className="text-blue-300" size={32} />
                        Catálogo Web
                    </h1>
                    <p className="text-blue-200 mt-2 text-lg">Controla la visibilidad de tus productos en chocolatestaboada.pro</p>
                </div>
                
                <div className="relative z-10 flex shrink-0">
                    <button 
                        onClick={handleApply}
                        disabled={!hasPendingChanges || isSaving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${hasPendingChanges && !isSaving ? 'bg-white text-blue-900 hover:bg-gray-100 hover:scale-105' : 'bg-white/20 text-white/50 cursor-not-allowed'}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? 'Guardando...' : 'Aplicar Cambios'}
                    </button>
                </div>

                <div className="absolute -right-10 -top-10 opacity-10 blur-2xl">
                    <Globe size={200} />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <div className="sticky top-0 z-20 bg-white pt-2 pb-4 border-b border-gray-100 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text"
                            placeholder="Buscar categoría..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredCategories.map(category => {
                        const categoryProducts = products.filter(p => p.categoria_id === category._id);
                        
                        const isCatVisibleOriginal = category.show_on_web !== false; 
                        const isCatVisible = pendingCatChanges[category._id] !== undefined ? pendingCatChanges[category._id] : isCatVisibleOriginal;
                        
                        const isExpanded = expandedCats[category._id];

                        return (
                            <div key={category._id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-blue-200 transition-colors">
                                <div className="flex items-center justify-between p-4 bg-white cursor-pointer select-none" onClick={() => toggleExpand(category._id)}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`p-2 rounded-xl ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                                            <p className="text-sm text-gray-500">{categoryProducts.length} productos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                        <span className={`text-sm font-bold ${isCatVisible ? 'text-green-600' : 'text-red-500'}`}>
                                            {isCatVisible ? 'Visible en Web' : 'Oculto en Web'}
                                        </span>
                                        <button 
                                            onClick={() => handleToggleCat(category._id, isCatVisibleOriginal)}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isCatVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isCatVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                
                                {isExpanded && categoryProducts.length > 0 && (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border-t border-gray-100 bg-gray-50/50">
                                        {categoryProducts.map(product => {
                                            const isProdVisibleOriginal = product.show_on_web !== false;
                                            const isProdVisible = pendingProdChanges[product._id] !== undefined ? pendingProdChanges[product._id] : isProdVisibleOriginal;

                                            const isDestacadoOriginal = product.is_destacado === true;
                                            const isDestacado = pendingDestacadoChanges[product._id] !== undefined ? pendingDestacadoChanges[product._id] : isDestacadoOriginal;

                                            const precioCba = product.precios_sucursales?.[SUCURSAL_CBA];
                                            const precioLpz = product.precios_sucursales?.[SUCURSAL_LPZ];

                                            return (
                                                <div key={product._id} className={`flex items-center justify-between p-4 rounded-xl border bg-white transition-all ${!isCatVisible ? 'opacity-50 grayscale' : ''} ${isProdVisible ? 'border-gray-200 hover:shadow-md' : 'border-red-200 bg-red-50/50'}`}>
                                                    <div className="flex items-start gap-4 overflow-hidden flex-1">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.descripcion} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 shadow-sm" />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0 border border-gray-200 font-medium">Sin img</div>
                                                        )}
                                                        <div className="truncate flex-1">
                                                            <p className="font-bold text-gray-900 truncate" title={product.descripcion}>{product.descripcion}</p>
                                                            <p className="text-xs font-medium text-gray-500 mb-2">{product.codigo_corto || 'Sin SKU'}</p>
                                                            
                                                            <div className="flex flex-wrap gap-2">
                                                                <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold border border-indigo-100/50">
                                                                    CBA: {precioCba !== undefined ? `Bs. ${precioCba.toFixed(2)}` : 'N/A'}
                                                                </div>
                                                                <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs font-bold border border-orange-100/50">
                                                                    LPZ: {precioLpz !== undefined ? `Bs. ${precioLpz.toFixed(2)}` : 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            disabled={!isCatVisible}
                                                            onClick={() => handleToggleDestacado(product._id, isDestacadoOriginal)}
                                                            title={!isCatVisible ? "Categoría entera está oculta" : "Destacar producto"}
                                                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${!isCatVisible ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isDestacado ? 'bg-amber-100 text-amber-500 hover:bg-amber-200 shadow-inner' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        >
                                                            <Star size={20} fill={isDestacado && isCatVisible ? "currentColor" : "none"} />
                                                        </button>
                                                        <button 
                                                            disabled={!isCatVisible}
                                                            onClick={() => handleToggleProd(product._id, isProdVisibleOriginal)}
                                                            title={!isCatVisible ? "Categoría entera está oculta" : "Alternar visibilidad"}
                                                            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${!isCatVisible ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isProdVisible ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                        >
                                                            {isProdVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredCategories.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                            <Search className="mx-auto text-gray-300 mb-3" size={40} />
                            <h3 className="text-lg font-bold text-gray-900">No se encontraron categorías</h3>
                            <p className="text-gray-500">Prueba buscando con otro término.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
