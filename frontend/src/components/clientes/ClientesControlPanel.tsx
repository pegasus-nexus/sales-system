import React from 'react';
import { Search, X, LayoutGrid, List, Plus, CreditCard, Sparkles } from 'lucide-react';

export type ClienteFilterType = 'ALL' | 'CON_TARJETA' | 'SIN_TARJETA' | 'CON_TELEFONO' | 'CON_COMPRAS';
export type ViewMode = 'kanban' | 'list';

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    currentFilter: ClienteFilterType;
    onFilterChange: (filter: ClienteFilterType) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onNuevoCliente: () => void;
    counts: {
        total: number;
        conTarjeta: number;
        sinTarjeta: number;
        conTelefono: number;
        conCompras: number;
    };
}

export const ClientesControlPanel: React.FC<Props> = ({
    searchTerm,
    onSearchChange,
    currentFilter,
    onFilterChange,
    viewMode,
    onViewModeChange,
    onNuevoCliente,
    counts,
}) => {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-xs mb-6 space-y-4">
            {/* Top row: Search + Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar with explicit contrast */}
                <div className="relative flex-1 group">
                    <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, NIT, teléfono o Tarjeta Taboada (TAB-...)..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-xs"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* Right controls: View Switcher + New Button */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                    {/* View Switcher (Odoo style) */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                        <button
                            type="button"
                            title="Vista Kanban (Tarjetas Odoo)"
                            onClick={() => onViewModeChange('kanban')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'kanban'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <LayoutGrid size={16} />
                            <span className="hidden sm:inline">Kanban</span>
                        </button>
                        <button
                            type="button"
                            title="Vista Lista (Tabla)"
                            onClick={() => onViewModeChange('list')}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewMode === 'list'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <List size={16} />
                            <span className="hidden sm:inline">Lista</span>
                        </button>
                    </div>

                    {/* Nuevo Cliente */}
                    <button
                        type="button"
                        onClick={onNuevoCliente}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Bottom row: Filter Chips (Odoo style) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar text-xs">
                <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1">
                    Filtros:
                </span>

                <button
                    type="button"
                    onClick={() => onFilterChange('ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentFilter === 'ALL'
                            ? 'bg-gray-900 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                >
                    Todos ({counts.total})
                </button>

                <button
                    type="button"
                    onClick={() => onFilterChange('CON_TARJETA')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentFilter === 'CON_TARJETA'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                >
                    <CreditCard size={13} />
                    Comunidad Taboada ({counts.conTarjeta})
                </button>

                <button
                    type="button"
                    onClick={() => onFilterChange('SIN_TARJETA')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentFilter === 'SIN_TARJETA'
                            ? 'bg-gray-800 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Sparkles size={13} />
                    Sin Tarjeta ({counts.sinTarjeta})
                </button>

                <button
                    type="button"
                    onClick={() => onFilterChange('CON_TELEFONO')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentFilter === 'CON_TELEFONO'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                >
                    Con Teléfono ({counts.conTelefono})
                </button>

                <button
                    type="button"
                    onClick={() => onFilterChange('CON_COMPRAS')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        currentFilter === 'CON_COMPRAS'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                >
                    Con Compras ({counts.conCompras})
                </button>
            </div>
        </div>
    );
};
