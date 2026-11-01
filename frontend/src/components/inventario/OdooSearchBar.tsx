import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Tag, AlertTriangle, Package, History, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
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
    kardexProductoNombre: string | null;
    onClearKardexProducto: () => void;
    tipoMovimiento: string;
    setTipoMovimiento: (val: string) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    onResetAllFilters: () => void;
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
    kardexProductoNombre,
    onClearKardexProducto,
    tipoMovimiento,
    setTipoMovimiento,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onResetAllFilters,
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
        (tab === 'stock' && (selectedCategory !== 'ALL' || stockBajoOnly)) ||
        (tab === 'kardex' && (kardexProductoNombre || tipoMovimiento || startDate || endDate)) ||
        Boolean(searchTerm.trim());

    return (
        <div className="relative w-full" ref={menuRef}>
            {/* Odoo-style Omnibar Container */}
            <div 
                onClick={() => inputRef.current?.focus()}
                className="w-full min-h-[46px] px-3 py-1.5 bg-white border border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/50 rounded-xl transition-all shadow-sm flex flex-wrap items-center gap-1.5 cursor-text"
            >
                {/* Search Icon */}
                <div className="flex items-center text-gray-400 pl-1 pr-1.5 shrink-0">
                    <Search size={18} className="text-indigo-500" />
                </div>

                {/* Filter Tags (Facet Chips with 'X') */}
                <AnimatePresence>
                    {/* Tag: Categoría */}
                    {tab === 'stock' && selectedCategory !== 'ALL' && selectedCatObj && (
                        <motion.span
                            key="tag-category"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg shrink-0 shadow-xs"
                        >
                            <Tag size={12} className="text-indigo-500" />
                            <span>Categoría: <strong>{selectedCatObj.name}</strong></span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory('ALL');
                                }}
                                className="p-0.5 ml-0.5 hover:bg-indigo-200 text-indigo-600 rounded transition-colors"
                                title="Quitar filtro de categoría"
                            >
                                <X size={12} />
                            </button>
                        </motion.span>
                    )}

                    {/* Tag: Solo Stock Bajo */}
                    {tab === 'stock' && stockBajoOnly && (
                        <motion.span
                            key="tag-stock-bajo"
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg shrink-0 shadow-xs"
                        >
                            <AlertTriangle size={12} className="text-amber-600" />
                            <span>Solo Stock Bajo</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStockBajoOnly(false);
                                }}
                                className="p-0.5 ml-0.5 hover:bg-amber-200 text-amber-700 rounded transition-colors"
                                title="Quitar filtro de stock bajo"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-lg shrink-0 shadow-xs"
                        >
                            <Package size={12} className="text-purple-600" />
                            <span>Producto: <strong>{kardexProductoNombre}</strong></span>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-lg shrink-0 shadow-xs"
                        >
                            <History size={12} className="text-blue-600" />
                            <span>Movimiento: <strong>{MOV_LABELS[tipoMovimiento] || tipoMovimiento}</strong></span>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shrink-0 shadow-xs"
                        >
                            <Calendar size={12} className="text-emerald-600" />
                            <span>Fechas: <strong>{startDate || '...'} a {endDate || '...'}</strong></span>
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

                {/* Main Interactive Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                        hasActiveFilters 
                            ? "Escribe para filtrar más..." 
                            : "Buscar productos por nombre, código o descripción..."
                    }
                    className="flex-1 min-w-[170px] outline-none bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 font-medium py-1"
                />

                {/* Right Actions: Clear all & Filter dropdown */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onResetAllFilters();
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold rounded-lg transition-colors"
                            title="Restablecer todos los filtros"
                        >
                            <RotateCcw size={12} />
                            <span className="hidden sm:inline">Limpiar</span>
                        </button>
                    )}

                    {/* Odoo Filter Menu Trigger */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isMenuOpen 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                        title="Abrir panel de filtros"
                    >
                        <Filter size={13} />
                        <span>Filtros</span>
                        <ChevronDown size={13} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Odoo Filter Popover Dropdown */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3.5 space-y-3.5 text-xs text-gray-800"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                <Filter size={14} className="text-indigo-600" />
                                Opciones de Filtrado
                            </span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => onResetAllFilters()}
                                    className="text-[11px] text-red-600 hover:underline font-semibold"
                                >
                                    Restablecer todo
                                </button>
                            )}
                        </div>

                        {/* Stock Tab Options */}
                        {tab === 'stock' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Estado de Existencias
                                    </label>
                                    <label 
                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                                            stockBajoOnly 
                                                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                                                : 'bg-gray-50 border-gray-100 hover:bg-gray-100/70 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className={stockBajoOnly ? 'text-amber-600' : 'text-gray-400'} />
                                            <span className="font-semibold text-xs">Solo productos con stock bajo</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={stockBajoOnly}
                                            onChange={(e) => setStockBajoOnly(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </label>
                                </div>

                                {categories.length > 0 && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                            Filtrar por Categoría
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="ALL">Todas las Categorías</option>
                                            {categories.map((c) => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Kárdex Tab Options */}
                        {tab === 'kardex' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Tipo de Movimiento
                                    </label>
                                    <select
                                        value={tipoMovimiento}
                                        onChange={(e) => setTipoMovimiento(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    >
                                        <option value="">Todos los Movimientos</option>
                                        <option value="VENTA">Ventas</option>
                                        <option value="COMPRA">Compras / Ingresos</option>
                                        <option value="ENTRADA_MANUAL">Entradas Manuales</option>
                                        <option value="SALIDA_MANUAL">Salidas / Mermas</option>
                                        <option value="TRASLADO">Traslados entre Sucursales</option>
                                        <option value="AJUSTE_FISICO">Ajustes Físicos</option>
                                        <option value="ANULACION">Anulaciones</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        Rango de Fechas
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[10px] text-gray-500 block mb-0.5">Desde</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 block mb-0.5">Hasta</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900 outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(false)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
