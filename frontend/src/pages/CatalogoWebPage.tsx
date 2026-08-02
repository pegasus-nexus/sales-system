import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../api/client';
import { Loader2, Globe, Eye, EyeOff, Search, ChevronDown, ChevronUp, Save, Star, FolderTree, Plus, Image as ImageIcon, Trash2, Edit2 } from 'lucide-react';
import type { Category, Product, ProductUpdate, WebCollection, WebCollectionCreate, WebCollectionUpdate } from '../api/types';
import { toast } from 'sonner';

const SUCURSAL_CBA = "69cd80098f3f6866d4cfbb64"; // Heroinas
const SUCURSAL_LPZ = "69ce6b7e8a00124dac6ecc99"; // Calacoto

export default function CatalogoWebPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
    
    // State for pending changes
    const [pendingCatChanges, setPendingCatChanges] = useState<Record<string, boolean>>({});
    const [pendingProdChanges, setPendingProdChanges] = useState<Record<string, boolean>>({});
    const [pendingDestacadoChanges, setPendingDestacadoChanges] = useState<Record<string, boolean>>({});
    
    // State for collections editing
    const [editingCollection, setEditingCollection] = useState<WebCollection | null>(null);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionImage, setNewCollectionImage] = useState('');

    const { data: categories, isLoading: isLoadingCat } = useQuery({
        queryKey: ['categories'],
        queryFn: () => client<Category[]>('/categories')
    });

    const { data: collections, isLoading: isLoadingCol } = useQuery({
        queryKey: ['web_collections'],
        queryFn: () => client<WebCollection[]>('/web-collections')
    });

    const { data: productsData, isLoading: isLoadingProd } = useQuery({
        queryKey: ['products', 'web-catalog'],
        queryFn: () => client<{ items: Product[] }>('/products?limit=2000')
    });

    const products = productsData?.items || [];
    const activeCollections = collections || [];
    const activeCategories = categories || [];

    const updateCategoryMutation = useMutation({
        mutationFn: (data: { id: string, show_on_web?: boolean }) => 
            client<Category>(`/categories/${data.id}`, { method: 'PATCH', body: data })
    });

    const updateProductMutation = useMutation({
        mutationFn: (data: { id: string, show_on_web?: boolean, is_destacado?: boolean }) => 
            client<Product>(`/products/${data.id}`, { method: 'PUT', body: { ...data } as unknown as ProductUpdate })
    });

    const createCollectionMutation = useMutation({
        mutationFn: (data: WebCollectionCreate) => 
            client<WebCollection>('/web-collections', { method: 'POST', body: data })
    });

    const updateCollectionMutation = useMutation({
        mutationFn: (data: { id: string } & WebCollectionUpdate) => 
            client<WebCollection>(`/web-collections/${data.id}`, { method: 'PATCH', body: data })
    });

    const deleteCollectionMutation = useMutation({
        mutationFn: (id: string) => 
            client(`/web-collections/${id}`, { method: 'DELETE' })
    });

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) return toast.error("El nombre es requerido");
        try {
            await createCollectionMutation.mutateAsync({ name: newCollectionName, image_url: newCollectionImage });
            toast.success("Colección creada");
            setNewCollectionName('');
            setNewCollectionImage('');
            setIsCreatingCollection(false);
            queryClient.invalidateQueries({ queryKey: ['web_collections'] });
        } catch (e) {
            toast.error("Error creando colección");
        }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta colección? Las categorías volverán a estar sueltas.")) return;
        try {
            await deleteCollectionMutation.mutateAsync(id);
            toast.success("Colección eliminada");
            queryClient.invalidateQueries({ queryKey: ['web_collections'] });
        } catch (e) {
            toast.error("Error eliminando colección");
        }
    };

    const toggleCategoryInCollection = async (collection: WebCollection, categoryId: string) => {
        const currentIds = collection.categories_ids || [];
        const isIncluded = currentIds.includes(categoryId);
        const newIds = isIncluded ? currentIds.filter(id => id !== categoryId) : [...currentIds, categoryId];
        
        try {
            await updateCollectionMutation.mutateAsync({ id: collection._id, categories_ids: newIds });
            queryClient.invalidateQueries({ queryKey: ['web_collections'] });
        } catch (e) {
            toast.error("Error actualizando colección");
        }
    };

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

    if (isLoadingCat || isLoadingProd || isLoadingCol) {
        return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;
    }

    // Identify which categories are inside which collection
    const categoriesInCollections = new Set<string>();
    activeCollections.forEach(c => c.categories_ids.forEach(id => categoriesInCollections.add(id)));

    const renderCategory = (category: Category, isInsideCollection: boolean) => {
        // filter logic
        if (search && !category.name.toLowerCase().includes(search.toLowerCase())) return null;

        const categoryProducts = products.filter(p => p.categoria_id === category._id);
        const isCatVisibleOriginal = category.show_on_web !== false; 
        const isCatVisible = pendingCatChanges[category._id] !== undefined ? pendingCatChanges[category._id] : isCatVisibleOriginal;
        const isExpanded = expandedCats[category._id];

        return (
            <div key={category._id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-indigo-200 transition-colors shadow-sm">
                <div className="flex items-center justify-between p-4 bg-white cursor-pointer select-none" onClick={() => toggleExpand(category._id)}>
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-xl ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                            <p className="text-sm text-gray-500">{categoryProducts.length} productos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                        <span className={`text-sm font-bold hidden md:inline ${isCatVisible ? 'text-green-600' : 'text-red-500'}`}>
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
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 bg-gray-50/50">
                        {categoryProducts.map(product => {
                            const isProdVisibleOriginal = product.show_on_web !== false;
                            const isProdVisible = pendingProdChanges[product._id] !== undefined ? pendingProdChanges[product._id] : isProdVisibleOriginal;
                            const isDestacadoOriginal = product.is_destacado === true;
                            const isDestacado = pendingDestacadoChanges[product._id] !== undefined ? pendingDestacadoChanges[product._id] : isDestacadoOriginal;

                            return (
                                <div key={product._id} className={`flex items-center justify-between p-3 rounded-xl border bg-white transition-all ${!isCatVisible ? 'opacity-50 grayscale' : ''} ${isProdVisible ? 'border-gray-200' : 'border-red-200 bg-red-50/50'}`}>
                                    <div className="flex items-start gap-3 overflow-hidden flex-1">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.descripcion} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] shrink-0 border border-gray-200 font-medium">Sin img</div>
                                        )}
                                        <div className="truncate flex-1">
                                            <p className="font-bold text-sm text-gray-900 truncate" title={product.descripcion}>{product.descripcion}</p>
                                            <p className="text-[10px] font-medium text-gray-500">{product.codigo_corto || 'Sin SKU'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={!isCatVisible}
                                            onClick={() => handleToggleDestacado(product._id, isDestacadoOriginal)}
                                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${!isCatVisible ? 'bg-gray-200 text-gray-400' : isDestacado ? 'bg-amber-100 text-amber-500' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            <Star size={16} fill={isDestacado && isCatVisible ? "currentColor" : "none"} />
                                        </button>
                                        <button 
                                            disabled={!isCatVisible}
                                            onClick={() => handleToggleProd(product._id, isProdVisibleOriginal)}
                                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${!isCatVisible ? 'bg-gray-200 text-gray-400' : isProdVisible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                                        >
                                            {isProdVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-3 py-4 md:p-4 space-y-6 pb-20 md:pb-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-gradient-to-r from-blue-900 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden gap-4">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Globe className="text-blue-300" size={32} />
                        Colecciones y Catálogo
                    </h1>
                    <p className="text-blue-200 mt-2 text-lg">Agrupa tus categorías y controla la visibilidad en tu tienda web.</p>
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row shrink-0 gap-3">
                    <button 
                        onClick={() => setIsCreatingCollection(!isCreatingCollection)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg bg-indigo-500 text-white hover:bg-indigo-400"
                    >
                        <Plus size={20} />
                        Nueva Colección
                    </button>
                    <button 
                        onClick={handleApply}
                        disabled={!hasPendingChanges || isSaving}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${hasPendingChanges && !isSaving ? 'bg-white text-blue-900 hover:scale-105' : 'bg-white/20 text-white/50 cursor-not-allowed'}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Guardar Visibilidad
                    </button>
                </div>

                <div className="absolute -right-10 -top-10 opacity-10 blur-2xl">
                    <Globe size={200} />
                </div>
            </div>

            {isCreatingCollection && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-200 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FolderTree className="text-indigo-500" />
                        Crear Nueva Colección
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la Colección</label>
                            <input 
                                type="text"
                                placeholder="Ej: Día de la Madre 2026"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-indigo-400"
                                value={newCollectionName}
                                onChange={e => setNewCollectionName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">URL de Imagen (Opcional, para banner)</label>
                            <input 
                                type="text"
                                placeholder="https://..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-indigo-400"
                                value={newCollectionImage}
                                onChange={e => setNewCollectionImage(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsCreatingCollection(false)} className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={handleCreateCollection} disabled={createCollectionMutation.isPending} className="px-6 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md flex items-center gap-2">
                            {createCollectionMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Crear Colección
                        </button>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-30 bg-gray-50/90 backdrop-blur-md pt-2 pb-2 mb-2">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Buscar categoría..."
                        className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-800 font-medium shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-8">
                {/* Render Collections First */}
                {activeCollections.map(collection => (
                    <div key={collection._id} className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {collection.image_url ? (
                                    <img src={collection.image_url} alt={collection.name} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-400">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-black text-indigo-900">{collection.name}</h2>
                                    <p className="text-sm font-medium text-indigo-600/70">{collection.categories_ids?.length || 0} categorías enlazadas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Agregar / Quitar categorias selector */}
                                <div className="relative group">
                                    <button className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors flex items-center gap-2">
                                        <Plus size={18} />
                                        Gestionar Categorías
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 max-h-96 overflow-y-auto">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">Selecciona categorías</p>
                                        {activeCategories.map(cat => {
                                            const isChecked = collection.categories_ids.includes(cat._id);
                                            return (
                                                <label key={cat._id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                                                    <span className="font-medium text-sm text-gray-700">{cat.name}</span>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked}
                                                        onChange={() => toggleCategoryInCollection(collection, cat._id)}
                                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                    />
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteCollection(collection._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-gray-50/50">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {collection.categories_ids.length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <FolderTree className="mx-auto mb-2 opacity-50" size={32} />
                                        <p className="font-medium">Esta colección está vacía.</p>
                                        <p className="text-sm">Usa el botón "Gestionar Categorías" para agregar contenido.</p>
                                    </div>
                                ) : (
                                    collection.categories_ids.map(catId => {
                                        const cat = activeCategories.find(c => c._id === catId);
                                        return cat ? renderCategory(cat, true) : null;
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Render Unassigned Categories */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                        Categorías sin Colección
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {activeCategories.filter(cat => !categoriesInCollections.has(cat._id)).map(cat => renderCategory(cat, false))}
                        {activeCategories.filter(cat => !categoriesInCollections.has(cat._id)).length === 0 && (
                            <div className="col-span-full text-center py-6 text-gray-400">
                                <p className="font-medium">Todas tus categorías ya están asignadas a colecciones.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
