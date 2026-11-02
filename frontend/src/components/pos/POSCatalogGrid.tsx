import { Search, Tag, Loader2 } from 'lucide-react';
import Pagination from '../Pagination';
import type { Product, Category, Almacen } from '../../api/types';

interface POSCatalogGridProps {
    search: string;
    onSearchChange: (val: string) => void;
    categories: Category[];
    selectedCat: string;
    onSelectCat: (catId: string) => void;
    almacenes: Almacen[];
    selectedAlmacenId: string;
    onSelectAlmacenId: (id: string) => void;
    products: Product[];
    stockMap: Record<string, number>;
    itemsInCart: { product: Product; quantity: number }[];
    isLoading: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onProductClick: (product: Product) => void;
}

const fmt = (n?: number) => (n || 0).toFixed(2);

export function POSCatalogGrid({
    search,
    onSearchChange,
    categories,
    selectedCat,
    onSelectCat,
    almacenes,
    selectedAlmacenId,
    onSelectAlmacenId,
    products,
    stockMap,
    itemsInCart,
    isLoading,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onProductClick,
}: POSCatalogGridProps) {
    return (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-100">
            {/* Search & Warehouse Subbar */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 shrink-0">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        id="pos-search-input"
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar producto por nombre o código (F1)..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                </div>
                {almacenes.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl shrink-0">
                        <span className="font-bold">Almacén:</span>
                        <select
                            value={selectedAlmacenId}
                            onChange={(e) => onSelectAlmacenId(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-indigo-900 py-0 pl-0 pr-5 focus:ring-0 cursor-pointer"
                        >
                            {almacenes.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Category Pills Bar */}
            <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
                <button
                    type="button"
                    onClick={() => onSelectCat('all')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedCat === 'all'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Todos
                </button>
                {categories.map((c) => (
                    <button
                        key={c._id}
                        type="button"
                        onClick={() => onSelectCat(c._id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedCat === c._id
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 size={32} className="animate-spin text-indigo-400" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Tag size={40} className="mb-2 opacity-30" />
                        <p className="text-sm font-semibold">Sin productos encontrados</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full justify-between">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                            {products.map((p) => {
                                const stock = stockMap[p._id] ?? 0;
                                const inCart = itemsInCart
                                    .filter((i) => i.product._id === p._id)
                                    .reduce((s, i) => s + i.quantity, 0);
                                const noStock = stock <= 0;

                                return (
                                    <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => !noStock && onProductClick(p)}
                                        disabled={noStock}
                                        className={`relative bg-white rounded-2xl border p-2.5 text-left shadow-2xs flex flex-col transition-all cursor-pointer ${
                                            noStock
                                                ? 'opacity-40 cursor-not-allowed border-gray-100'
                                                : 'hover:shadow-md hover:border-indigo-300 border-gray-200 active:scale-97'
                                        }`}
                                    >
                                        <div className="w-full aspect-square bg-gray-50 rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                                            {p.image_url ? (
                                                <img
                                                    src={p.image_url}
                                                    alt={p.descripcion}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-gray-300">
                                                    {p.descripcion.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-900 font-bold truncate leading-tight">
                                            {p.descripcion}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-1.5">
                                            <span className="text-xs font-black text-gray-900 font-mono">
                                                Bs. {fmt(p.precio_venta)}
                                            </span>
                                            <span
                                                className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                                                    noStock
                                                        ? 'bg-red-100 text-red-600'
                                                        : stock > 5
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {noStock ? 'Agotado' : `${stock}u`}
                                            </span>
                                        </div>
                                        {inCart > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                                                {inCart}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {totalItems > itemsPerPage && (
                            <div className="pt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={onPageChange}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
