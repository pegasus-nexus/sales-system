import React, { useState, useRef, useEffect } from 'react';
import { 
    Search, X, Filter, Tag, AlertTriangle, Package, History, 
    Calendar, ChevronDown, RotateCcw, Layers, ArrowUpDown, 
    Check, LayoutGrid, List, Sparkles, Clock, Scale 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CategoryItem {
    _id: string;
    name: string;
}

interface OdooSearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    tab: 'stock' | 'kardex' | 'masivo' | 'lotes';
    categories?: CategoryItem[];
    selectedCategory: string;
    setSelectedCategory: (catId: string) => void;
    stockBajoOnly: boolean;
    setStockBajoOnly: (val: boolean) => void;
    stockFilter?: 'ALL' | 'DISPONIBLE' | 'AGOTADO';
    setStockFilter?: (val: 'ALL' | 'DISPONIBLE' | 'AGOTADO') => void;
    kardexProductoNombre: string | null;
    onClearKardexProducto: () => void;
    tipoMovimiento: string;
    setTipoMovimiento: (val: string) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    onResetAllFilters: () => void;
    // Odoo GroupBy & Sort
    groupByCategory?: boolean;
    setGroupByCategory?: (val: boolean) => void;
    sortBy?: 'default' | 'nombre' | 'stock_desc' | 'stock_asc' | 'precio_desc';
    setSortBy?: (val: 'default' | 'nombre' | 'stock_desc' | 'stock_asc' | 'precio_desc') => void;
    // Odoo View Switcher
    viewMode?: 'lista' | 'kanban';
    setViewMode?: (mode: 'lista' | 'kanban') => void;
    // Odoo Tab / Operations Switcher
    setTab?: (tab: 'stock' | 'kardex' | 'masivo' | 'lotes') => void;
    esAdminSucursal?: boolean;
}

const MOV_LABELS: Record<string, string> = {
    COMPRA: 'Compras / Ingresos',
    VENTA: 'Ventas',
    ENTRADA_MANUAL: 'Entradas Manuales',
    SALIDA_MANUAL: 'Salidas / Mermas',
    TRASLADO: 'Traslados',
    AJUSTE_FISICO: 'Ajustes Físicos',
    ANULACION: 'Anulaciones',
};

export const OdooSearchBar: React.FC<OdooSearchBarProps> = ({
    searchTerm,
    setSearchTerm,
    tab,
    categories = [],
    selectedCategory,
    setSelectedCategory,
    stockBajoOnly,
    setStockBajoOnly,
    stockFilter = 'ALL',
    setStockFilter,
    kardexProductoNombre,
    onClearKardexProducto,
    tipoMovimiento,
    setTipoMovimiento,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onResetAllFilters,
    groupByCategory = false,
    setGroupByCategory,
    sortBy = 'default',
    setSortBy,
    viewMode = 'lista',
    setViewMode,
    setTab,
    esAdminSucursal = false,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCatObj = categories.find((c) => c._id === selectedCategory);

    const hasActiveFilters =
        (tab === 'stock' && (selectedCategory !== 'ALL' || stockBajoOnly || stockFilter !== 'ALL' || groupByCategory || sortBy !== 'default')) ||
        (tab === 'kardex' && (kardexProductoNombre || tipoMovimiento || startDate || endDate)) ||
        Boolean(searchTerm.trim());

    return (
        <div className="relative w-full" ref={menuRef}>
            {/* Odoo Search Omnibar Capsule */}
            <div 
                onClick={() => {
                    inputRef.current?.focus();
                    if (!isMenuOpen) setIsMenuOpen(true);
                }}
                className={`w-full min-h-[46px] px-3.5 py-1.5 bg-white border rounded-xl transition-all shadow-xs flex flex-wrap items-center gap-2 cursor-text ${
                    isMenuOpen 
                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300'
                }`}
            >
                {/* Search Icon */}
                <div className="flex items-center text-gray-400 pl-0.5 shrink-0">
                    <Search size={17} className="text-indigo-600" />
                </div>

                {/* Filter Tags (Facet Chips with 'X' inside the input) */}
                <AnimatePresence>
                    {/* Tag: Tab / Operación activa si no es stock */}
                    {tab === 'kardex' && (
                        <motion.span
                            key="tag-tab-kardex"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-lg shrink-0 shadow-2xs"
                        >
                            <History size={12} className="text-indigo-600" />
                            <span>Kárdex de Movimientos</span>
                            {setTab && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTab('stock');
                                    }}
                                    className="p-0.5 ml-0.5 hover:bg-indigo-200/60 text-indigo-800 rounded transition-colors"
                                    title="Volver a Stock Actual"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </motion.span>
                    )}
                    {tab === 'masivo' && (
                        <motion.span
                            key="tag-tab-masivo"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold rounded-lg shrink-0 shadow-2xs"
                        >
                            <Scale size={12} className="text-purple-600" />
                            <span>Ajuste Rápido</span>
                            {setTab && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTab('stock');
                                    }}
                                    className="p-0.5 ml-0.5 hover:bg-purple-200/60 text-purple-800 rounded transition-colors"
                                    title="Volver a Stock Actual"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </motion.span>
                    )}
                    {tab === 'lotes' && (
                        <motion.span
                            key="tag-tab-lotes"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold rounded-lg shrink-0 shadow-2xs"
                        >
                            <Clock size={12} className="text-teal-600" />
                            <span>Lotes & Caducidades</span>
                            {setTab && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTab('stock');
                                    }}
                                    className="p-0.5 ml-0.5 hover:bg-teal-200/60 text-teal-800 rounded transition-colors"
                                    title="Volver a Stock Actual"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </motion.span>
                    )}
                    {/* Tag: Solo Stock Bajo */}
                    {tab === 'stock' && stockBajoOnly && (
                        <motion.span
                            key="tag-stock-bajo"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <AlertTriangle size={12} className="text-amber-600" />
                            <span>Stock Bajo</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStockBajoOnly(false);
                                }}
                                className="p-0.5 ml-0.5 hover:bg-amber-500/30 text-amber-800 rounded transition-colors"
                                title="Quitar filtro"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Estado de Stock (Disponible / Agotado) */}
                    {tab === 'stock' && stockFilter === 'DISPONIBLE' && (
                        <motion.span
                            key="tag-stock-disp"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>En Stock</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStockFilter && setStockFilter('ALL');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-emerald-200 text-emerald-800 rounded transition-colors"
                                title="Quitar filtro"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {tab === 'stock' && stockFilter === 'AGOTADO' && (
                        <motion.span
                            key="tag-stock-agotado"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Agotados</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStockFilter && setStockFilter('ALL');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-red-200 text-red-800 rounded transition-colors"
                                title="Quitar filtro"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Categoría */}
                    {tab === 'stock' && selectedCategory !== 'ALL' && selectedCatObj && (
                        <motion.span
                            key="tag-category"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <Tag size={12} className="text-indigo-600" />
                            <span>{selectedCatObj.name}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory('ALL');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-indigo-200 text-indigo-700 rounded transition-colors"
                                title="Quitar filtro de categoría"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Agrupar por Categoría */}
                    {tab === 'stock' && groupByCategory && (
                        <motion.span
                            key="tag-group-category"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-300 text-cyan-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <Layers size={12} className="text-cyan-600" />
                            <span>Agrupado: Categoría</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setGroupByCategory && setGroupByCategory(false);
                                }}
                                className="p-0.5 ml-0.5 hover:bg-cyan-200 text-cyan-800 rounded transition-colors"
                                title="Quitar agrupación"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Ordenamiento */}
                    {tab === 'stock' && sortBy !== 'default' && (
                        <motion.span
                            key="tag-sort"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <ArrowUpDown size={12} className="text-slate-600" />
                            <span>
                                {sortBy === 'stock_desc' && 'Mayor Stock'}
                                {sortBy === 'stock_asc' && 'Menor Stock'}
                                {sortBy === 'precio_desc' && 'Mayor Precio'}
                                {sortBy === 'nombre' && 'Nombre A-Z'}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSortBy && setSortBy('default');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-slate-200 text-slate-800 rounded transition-colors"
                                title="Quitar orden"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Producto Kárdex */}
                    {tab === 'kardex' && kardexProductoNombre && (
                        <motion.span
                            key="tag-kardex-prod"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <Package size={12} className="text-purple-600" />
                            <span>{kardexProductoNombre}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClearKardexProducto();
                                }}
                                className="p-0.5 ml-0.5 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                                title="Ver todos los productos"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Tipo Movimiento Kárdex */}
                    {tab === 'kardex' && tipoMovimiento && (
                        <motion.span
                            key="tag-kardex-mov"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <History size={12} className="text-blue-600" />
                            <span>{MOV_LABELS[tipoMovimiento] || tipoMovimiento}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setTipoMovimiento('');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                title="Quitar filtro de movimiento"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Fechas Kárdex */}
                    {tab === 'kardex' && (startDate || endDate) && (
                        <motion.span
                            key="tag-kardex-date"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg shrink-0 shadow-xs"
                        >
                            <Calendar size={12} className="text-emerald-600" />
                            <span>{startDate || '...'} a {endDate || '...'}</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-emerald-200 text-emerald-700 rounded transition-colors"
                                title="Quitar filtro de fechas"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Main Search Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsMenuOpen(true)}
                    placeholder={hasActiveFilters ? "Buscar más..." : "Buscar productos..."}
                    className="flex-1 min-w-[140px] outline-none bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 font-medium py-1"
                />

                {/* Actions Right: Clear button & Popover trigger */}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onResetAllFilters();
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Restablecer todos los filtros"
                        >
                            <RotateCcw size={14} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors ${
                            isMenuOpen ? 'text-indigo-600 bg-indigo-50' : ''
                        }`}
                        title="Ver filtros y opciones estilo Odoo"
                    >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Odoo Canonical 3-Column Popover */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.14 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200/90 rounded-2xl shadow-2xl z-50 p-4 text-xs text-gray-800"
                    >
                        {/* 3 Columns Grid (Filtros | Agrupar por | Favoritos / Vistas) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            
                            {/* COLUMNA 1: 🔻 FILTROS */}
                            <div className="space-y-3 pt-2 md:pt-0">
                                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                                    <Filter size={15} />
                                    <span>Filtros</span>
                                </div>

                                <div className="space-y-1.5">
                                    {/* Solo Stock Bajo */}
                                    <button
                                        type="button"
                                        onClick={() => setStockBajoOnly(!stockBajoOnly)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left ${
                                            stockBajoOnly 
                                                ? 'bg-amber-50 text-amber-900 font-bold' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <AlertTriangle size={13} className={stockBajoOnly ? 'text-amber-600' : 'text-gray-400'} />
                                            Solo Stock Bajo
                                        </span>
                                        {stockBajoOnly && <Check size={14} className="text-amber-600" />}
                                    </button>

                                    {/* En Stock (> 0) */}
                                    <button
                                        type="button"
                                        onClick={() => setStockFilter && setStockFilter(stockFilter === 'DISPONIBLE' ? 'ALL' : 'DISPONIBLE')}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left ${
                                            stockFilter === 'DISPONIBLE' 
                                                ? 'bg-emerald-50 text-emerald-900 font-bold' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Con Existencias ({'>'} 0)
                                        </span>
                                        {stockFilter === 'DISPONIBLE' && <Check size={14} className="text-emerald-600" />}
                                    </button>

                                    {/* Agotados (= 0) */}
                                    <button
                                        type="button"
                                        onClick={() => setStockFilter && setStockFilter(stockFilter === 'AGOTADO' ? 'ALL' : 'AGOTADO')}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left ${
                                            stockFilter === 'AGOTADO' 
                                                ? 'bg-red-50 text-red-900 font-bold' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500" />
                                            Agotados (Stock 0)
                                        </span>
                                        {stockFilter === 'AGOTADO' && <Check size={14} className="text-red-600" />}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 pt-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Categoría de Producto
                                    </span>
                                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('ALL')}
                                            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors text-left ${
                                                selectedCategory === 'ALL'
                                                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                    : 'hover:bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            <span>Todas las Categorías</span>
                                            {selectedCategory === 'ALL' && <Check size={13} className="text-indigo-600" />}
                                        </button>
                                        {categories.map((c) => (
                                            <button
                                                key={c._id}
                                                type="button"
                                                onClick={() => setSelectedCategory(selectedCategory === c._id ? 'ALL' : c._id)}
                                                className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors text-left ${
                                                    selectedCategory === c._id
                                                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                                                        : 'hover:bg-gray-50 text-gray-600'
                                                }`}
                                            >
                                                <span className="truncate">{c.name}</span>
                                                {selectedCategory === c._id && <Check size={13} className="text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Si estamos en pestaña Kárdex: Opciones específicas */}
                                {tab === 'kardex' && (
                                    <div className="border-t border-gray-100 pt-2 space-y-1.5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                            Tipo de Movimiento
                                        </span>
                                        {Object.entries(MOV_LABELS).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setTipoMovimiento(tipoMovimiento === key ? '' : key)}
                                                className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition-colors text-left ${
                                                    tipoMovimiento === key
                                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                                        : 'hover:bg-gray-50 text-gray-600'
                                                }`}
                                            >
                                                <span>{label}</span>
                                                {tipoMovimiento === key && <Check size={13} className="text-blue-600" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* COLUMNA 2: 🥞 AGRUPAR POR & ORDENAR */}
                            <div className="space-y-3 pt-3 md:pt-0 md:pl-6">
                                <div className="flex items-center gap-2 text-cyan-700 font-bold text-xs uppercase tracking-wider">
                                    <Layers size={15} />
                                    <span>Agrupar y Ordenar</span>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                        Agrupación Odoo
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setGroupByCategory && setGroupByCategory(!groupByCategory)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left ${
                                            groupByCategory 
                                                ? 'bg-cyan-50 text-cyan-900 font-bold' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Layers size={13} className={groupByCategory ? 'text-cyan-600' : 'text-gray-400'} />
                                            Agrupar por Categoría
                                        </span>
                                        {groupByCategory && <Check size={14} className="text-cyan-600" />}
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 pt-2 space-y-1.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                        Ordenar Resultados
                                    </span>
                                    {[
                                        { id: 'default', label: 'Orden Predeterminado' },
                                        { id: 'stock_desc', label: 'Mayor Stock Físico' },
                                        { id: 'stock_asc', label: 'Menor Stock Físico' },
                                        { id: 'precio_desc', label: 'Mayor Precio de Venta' },
                                        { id: 'nombre', label: 'Nombre Alfabético (A-Z)' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSortBy && setSortBy(opt.id as any)}
                                            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors text-left ${
                                                sortBy === opt.id
                                                    ? 'bg-slate-100 text-slate-900 font-bold'
                                                    : 'hover:bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            <span>{opt.label}</span>
                                            {sortBy === opt.id && <Check size={13} className="text-slate-700" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* COLUMNA 3: ⭐ VISTAS & ACCIONES */}
                            <div className="space-y-3 pt-3 md:pt-0 md:pl-6">
                                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                                    <Sparkles size={15} />
                                    <span>Vistas y Acciones</span>
                                </div>

                                {setTab && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                            Operación del Módulo
                                        </span>
                                        <div className="grid grid-cols-2 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTab('stock');
                                                    setIsMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    tab === 'stock'
                                                        ? 'bg-white text-indigo-700 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <Package size={13} className={tab === 'stock' ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span>Stock Físico</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTab('kardex');
                                                    setIsMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    tab === 'kardex'
                                                        ? 'bg-white text-indigo-700 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <History size={13} className={tab === 'kardex' ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span>Kárdex</span>
                                            </button>
                                            {esAdminSucursal && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTab('masivo');
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        tab === 'masivo'
                                                            ? 'bg-white text-indigo-700 shadow-sm'
                                                            : 'text-gray-600 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <Scale size={13} className={tab === 'masivo' ? 'text-indigo-600' : 'text-gray-400'} />
                                                    <span>Ajuste Rápido</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTab('lotes');
                                                    setIsMenuOpen(false);
                                                }}
                                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    tab === 'lotes'
                                                        ? 'bg-white text-indigo-700 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <Clock size={13} className={tab === 'lotes' ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span>Lotes</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {setViewMode && (
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                            Modo de Visualización
                                        </span>
                                        <div className="grid grid-cols-2 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('kanban')}
                                                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    viewMode === 'kanban'
                                                        ? 'bg-white text-indigo-700 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                            >
                                                <LayoutGrid size={14} />
                                                <span>Tarjetas</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setViewMode('lista')}
                                                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    viewMode === 'lista'
                                                        ? 'bg-white text-indigo-700 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                            >
                                                <List size={14} />
                                                <span>Tabla</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 pt-3 space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onResetAllFilters();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-700 rounded-xl text-xs font-semibold transition-colors border border-gray-200 hover:border-red-200"
                                    >
                                        <RotateCcw size={13} />
                                        <span>Restablecer Filtros</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-indigo-200"
                                    >
                                        Cerrar Panel
                                    </button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
