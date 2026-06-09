import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSalesMatrix, getSucursales } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { Loader2, AlertTriangle, Calendar, Download, Search, TrendingUp, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CHART_COLORS = [
    '#4f46e5', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#3b82f6'  // Blue
];

export default function ProductTrendsView() {
    const { role, sucursal_id } = useAuthStore();
    
    // Default to last 30 days
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
    const lastMonthStr = lastMonth.toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
    
    const [startDate, setStartDate] = useState<string>(lastMonthStr);
    const [endDate, setEndDate] = useState<string>(todayStr);
    const [groupBy, setGroupBy] = useState<'day'|'week'|'month'>('week');
    
    const esMatriz = ['SUPERADMIN', 'ADMIN', 'ADMIN_MATRIZ'].includes(role || '');
    const defaultSucursal = esMatriz ? 'all' : (sucursal_id || 'CENTRAL');
    const [selectedSucursal, setSelectedSucursal] = useState<string>(defaultSucursal);

    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales,
        enabled: esMatriz
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ['sales-matrix', startDate, endDate, selectedSucursal],
        queryFn: () => getSalesMatrix(startDate, endDate, selectedSucursal),
    });

    // Extract unique products from the matrix data to populate the selector
    const availableProducts = useMemo(() => {
        if (!data?.products) return [];
        return data.products.map(p => ({
            id: p.producto_id,
            nombre: p.descripcion,
            totalSales: Object.values(p.days).reduce((a: any, b: any) => a + b, 0)
        })).sort((a, b) => b.totalSales - a.totalSales); // Sort by best sellers
    }, [data?.products]);

    // Handle product selection logic
    const filteredAvailableProducts = useMemo(() => {
        return availableProducts.filter(p => 
            p.nombre.toLowerCase().includes(productSearch.toLowerCase()) &&
            !selectedProductIds.includes(p.id)
        );
    }, [availableProducts, productSearch, selectedProductIds]);

    const toggleProductSelection = (id: string) => {
        setSelectedProductIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(p => p !== id);
            }
            if (prev.length >= 10) return prev; // Max 10 lines
            return [...prev, id];
        });
        setProductSearch('');
    };

    // Calculate columns (X-Axis intervals) based on groupBy
    const columns = useMemo(() => {
        const cols: { key: string, label: string }[] = [];
        let curr = new Date(startDate);
        const end = new Date(endDate);
        curr.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        
        const added = new Set<string>();

        while (curr <= end) {
            if (groupBy === 'month') {
                const key = curr.toLocaleDateString('en-CA').substring(0, 7);
                if (!added.has(key)) {
                    added.add(key);
                    const mName = curr.toLocaleString('es-ES', {month: 'short'});
                    cols.push({ key, label: `${mName.toUpperCase()} ${curr.getFullYear()}` });
                }
            } else if (groupBy === 'week') {
                const day = curr.getDay();
                const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
                const mon = new Date(curr);
                mon.setDate(diff);
                const key = mon.toLocaleDateString('en-CA');
                if (!added.has(key)) {
                    added.add(key);
                    const parts = key.split('-');
                    cols.push({ key, label: `Sem ${parts[2]}/${parts[1]}` });
                }
            } else {
                const key = curr.toLocaleDateString('en-CA');
                if (!added.has(key)) {
                    added.add(key);
                    const parts = key.split('-');
                    cols.push({ key, label: `${parts[2]}/${parts[1]}` });
                }
            }
            curr.setDate(curr.getDate() + 1);
        }
        return cols;
    }, [startDate, endDate, groupBy]);

    // Build the data array for Recharts
    // Format: [ { label: "Sem 01/01", "Product A": 5, "Product B": 10 }, ... ]
    const chartData = useMemo(() => {
        if (!data?.products || selectedProductIds.length === 0) return [];

        const selectedProductsData = data.products.filter(p => selectedProductIds.includes(p.producto_id));

        return columns.map(c => {
            const dataPoint: any = { label: c.label, key: c.key };
            selectedProductsData.forEach(p => {
                // aggregate sales for this interval
                let totalForInterval = 0;
                for (const [dateStr, qty] of Object.entries(p.days)) {
                    let matchKey = dateStr;
                    if (groupBy === 'month') {
                        matchKey = dateStr.substring(0, 7);
                    } else if (groupBy === 'week') {
                        const d = new Date(dateStr);
                        d.setHours(12, 0, 0, 0);
                        const day = d.getDay();
                        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                        d.setDate(diff);
                        matchKey = d.toLocaleDateString('en-CA');
                    }
                    if (matchKey === c.key) {
                        totalForInterval += (qty as number);
                    }
                }
                dataPoint[p.descripcion] = totalForInterval;
            });
            return dataPoint;
        });
    }, [data?.products, selectedProductIds, columns, groupBy]);

    const selectedProductObjects = useMemo(() => {
        return selectedProductIds.map(id => availableProducts.find(p => p.id === id)).filter(Boolean) as {id: string, nombre: string}[];
    }, [selectedProductIds, availableProducts]);

    const handleDownloadCSV = () => {
        if (chartData.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Header
        const productNames = selectedProductObjects.map(p => p.nombre);
        const header = ["Período", ...productNames];
        csvContent += header.join(",") + "\n";
        
        // Rows
        chartData.forEach(row => {
            const line = [`"${row.label}"`];
            productNames.forEach(pName => {
                line.push((row[pName] || 0).toString());
            });
            csvContent += line.join(",") + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tendencias_productos_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <TrendingUp className="text-indigo-600" />
                        Comparativa de Tendencias
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        Compara las ventas en unidades de múltiples productos a lo largo del tiempo.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleDownloadCSV}
                        disabled={chartData.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        CSV
                    </button>
                </div>
            </div>
            
            {/* Header Filters */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                max={endDate || todayStr}
                                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <span className="text-gray-400 font-bold">al</span>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                min={startDate}
                                max={todayStr}
                                className="pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-wider hidden md:inline">Agrupar por:</span>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                            className="w-full md:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        >
                            <option value="day">Día</option>
                            <option value="week">Semana</option>
                            <option value="month">Mes</option>
                        </select>
                    </div>

                    {esMatriz && (
                        <select
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="flex-1 md:w-48 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            <option value="CENTRAL">Central</option>
                            {sucursales.filter(s => s.is_active).map(s => (
                                <option key={s._id} value={s._id}>{s.nombre}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Product Selector Section */}
            <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 space-y-4 relative">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">Productos a comparar ({selectedProductIds.length}/10)</h3>
                </div>
                
                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2">
                    {selectedProductObjects.map((p, index) => (
                        <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}>
                            <span className="max-w-[200px] truncate">{p.nombre}</span>
                            <button onClick={() => toggleProductSelection(p.id)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {selectedProductIds.length === 0 && (
                        <span className="text-xs text-gray-400 font-medium italic py-1">Ningún producto seleccionado. Utiliza el buscador para añadir líneas a la gráfica.</span>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar y seleccionar producto..."
                            value={productSearch}
                            onChange={(e) => {
                                setProductSearch(e.target.value);
                                setIsProductDropdownOpen(true);
                            }}
                            onFocus={() => setIsProductDropdownOpen(true)}
                            className="w-full md:w-96 pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            disabled={isLoading || selectedProductIds.length >= 10}
                        />
                    </div>
                    
                    {/* Dropdown Results */}
                    {isProductDropdownOpen && (productSearch || availableProducts.length > 0) && (
                        <div className="absolute top-full left-0 mt-2 w-full md:w-96 max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2">
                            {filteredAvailableProducts.length > 0 ? (
                                filteredAvailableProducts.slice(0, 50).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            toggleProductSelection(p.id);
                                            setIsProductDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium transition-colors"
                                    >
                                        {p.nombre}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-400 text-center font-medium">
                                    No se encontraron más productos para este rango de fechas.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[32px] border border-gray-100">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mb-4" />
                    <p className="text-sm text-gray-400 font-medium">Analizando tendencias de ventas...</p>
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center justify-center h-96 text-red-500 bg-red-50 rounded-[32px]">
                    <AlertTriangle size={40} className="mb-2" />
                    <p className="font-bold">Error al cargar datos</p>
                </div>
            ) : selectedProductIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-[32px] border border-gray-200 border-dashed">
                    <TrendingUp size={48} className="text-gray-300 mb-4" />
                    <p className="font-bold text-gray-500">Selecciona al menos un producto para comenzar a comparar.</p>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm w-full h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="label" 
                                tick={{fontSize: 11, fill: '#6b7280', fontWeight: 'bold'}} 
                                axisLine={{stroke: '#e5e7eb'}}
                                tickLine={false}
                                tickMargin={10}
                            />
                            <YAxis 
                                tick={{fontSize: 11, fill: '#6b7280', fontWeight: 'bold'}}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => val.toLocaleString()}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                                labelStyle={{ fontWeight: 'black', color: '#111827', marginBottom: '8px', fontSize: '13px' }}
                            />
                            <Legend 
                                wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }}
                                iconType="circle"
                            />
                            
                            {selectedProductObjects.map((p, idx) => (
                                <Line 
                                    key={p.id}
                                    type="monotone" 
                                    dataKey={p.nombre} 
                                    name={p.nombre}
                                    stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Overlay to close dropdown when clicking outside */}
            {isProductDropdownOpen && (
                <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProductDropdownOpen(false)}
                />
            )}
        </div>
    );
}
