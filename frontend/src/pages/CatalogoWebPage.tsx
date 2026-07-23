import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { Loader2, Globe, Eye, EyeOff, Search } from 'lucide-react';
import type { Category, Product, ProductUpdate } from '../api/types';

export default function CatalogoWebPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

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
            client<Category>(`/categories/${data.id}`, { method: 'PATCH', body: { show_on_web: data.show_on_web } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });

    const updateProductMutation = useMutation({
        mutationFn: (data: { id: string, show_on_web: boolean }) => 
            client<Product>(`/products/${data.id}`, { method: 'PUT', body: { show_on_web: data.show_on_web } as ProductUpdate }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products', 'web-catalog'] });
        }
    });

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [categories, search]);

    if (isLoadingCat || isLoadingProd) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-3 py-4 md:p-4 space-y-6 pb-20 md:pb-4">
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Globe className="text-blue-300" size={32} />
                        Catálogo Web
                    </h1>
                    <p className="text-blue-200 mt-2 text-lg">Controla la visibilidad de tus productos en chocolatestaboada.pro</p>
                </div>
                <div className="absolute -right-10 -top-10 opacity-10 blur-2xl">
                    <Globe size={200} />
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Buscar categoría..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 font-medium"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="space-y-6">
                    {filteredCategories.map(category => {
                        const categoryProducts = products.filter(p => p.categoria_id === category._id);
                        // show_on_web defaults to true if undefined
                        const isCatVisible = category.show_on_web !== false; 

                        return (
                            <div key={category._id} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
                                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                                        <p className="text-sm text-gray-500">{categoryProducts.length} productos</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-bold ${isCatVisible ? 'text-green-600' : 'text-red-500'}`}>
                                            {isCatVisible ? 'Visible en Web' : 'Oculto en Web'}
                                        </span>
                                        <button 
                                            disabled={updateCategoryMutation.isPending}
                                            onClick={() => updateCategoryMutation.mutate({ id: category._id, show_on_web: !isCatVisible })}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isCatVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isCatVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                
                                {categoryProducts.length > 0 && (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categoryProducts.map(product => {
                                            const isProdVisible = product.show_on_web !== false;
                                            return (
                                                <div key={product._id} className={`flex items-center justify-between p-3 rounded-xl border bg-white transition-opacity ${!isCatVisible ? 'opacity-50 grayscale' : ''} ${isProdVisible ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.descripcion} className="w-12 h-12 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs shrink-0">Sin img</div>
                                                        )}
                                                        <div className="truncate">
                                                            <p className="font-semibold text-gray-900 truncate" title={product.descripcion}>{product.descripcion}</p>
                                                            <p className="text-xs text-gray-500">{product.codigo_corto || 'Sin SKU'}</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        disabled={!isCatVisible || updateProductMutation.isPending}
                                                        onClick={() => updateProductMutation.mutate({ id: product._id, show_on_web: !isProdVisible })}
                                                        title={!isCatVisible ? "Categoría entera está oculta" : "Alternar visibilidad"}
                                                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${!isCatVisible ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isProdVisible ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                    >
                                                        {isProdVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredCategories.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            No se encontraron categorías.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
