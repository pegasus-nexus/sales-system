import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Save, Search, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getProducts, updateProduct } from '../api/api';
import type { Product } from '../api/types';

export default function CalculadoraMargenesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    // Local state for edits: { [productId]: { precio_venta: number } }
    const [edits, setEdits] = useState<Record<string, { precio_venta: number }>>({});

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handlePriceChange = (id: string, newPrice: number) => {
        setEdits(prev => ({ ...prev, [id]: { precio_venta: newPrice } }));
    };

    const handleMarginChange = (id: string, cost: number, newMarginPct: number) => {
        if (cost <= 0) return;
        const newPrice = cost * (1 + newMarginPct / 100);
        setEdits(prev => ({ ...prev, [id]: { precio_venta: parseFloat(newPrice.toFixed(2)) } }));
    };

    const handleSave = async (product: Product) => {
        const edit = edits[product._id!];
        if (!edit) return;
        
        setSavingId(product._id!);
        try {
            await updateProduct(product._id!, {
                ...product,
                precio_venta: edit.precio_venta
            });
            setSuccessId(product._id!);
            setProducts(prev => prev.map(p => p._id === product._id ? { ...p, precio_venta: edit.precio_venta } : p));
            setTimeout(() => setSuccessId(null), 2000);
        } catch (error) {
            console.error("Error saving product price", error);
        } finally {
            setSavingId(null);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Calculator className="text-indigo-600" />
                        Calculadora y GestiA3n de MA!rgenes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                        Simula y ajusta los precios de venta basados en el margen de utilidad deseado.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <Search className="text-gray-400 ml-2" size={20} />
                    <input 
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm font-bold text-gray-700 placeholder-gray-400"
                    />
                </div>

                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <RefreshCw className="animate-spin text-indigo-500" size={32} />
                        <p className="font-bold">Cargando catA!logo...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left">
                                    <th className="px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Producto</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-rose-400 uppercase tracking-widest border-b border-gray-100">Costo FA!brica</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-gray-100">Margen Deseado (%)</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-gray-100">Utilidad Neta (Bs)</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100">Precio Venta (Bs)</th>
                                    <th className="px-4 py-3 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">AcciA3n</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.map(p => {
                                    const cost = p.costo_producto || 0;
                                    const currentPrice = edits[p._id!]?.precio_venta ?? p.precio_venta;
                                    const utility = currentPrice - cost;
                                    const marginPct = cost > 0 ? (utility / cost) * 100 : 0;
                                    const isEdited = edits[p._id!] !== undefined && edits[p._id!].precio_venta !== p.precio_venta;

                                    return (
                                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-bold text-gray-900">{p.nombre}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{p.categoria_nombre}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                                    Bs. {cost.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <input 
                                                        type="number" 
                                                        value={marginPct.toFixed(1)}
                                                        onChange={(e) => handleMarginChange(p._id!, cost, parseFloat(e.target.value) || 0)}
                                                        className="w-20 text-center text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    />
                                                    <span className="text-xs font-bold text-indigo-400">%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={	ext-sm font-black }>
                                                    Bs. {utility.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-xs font-bold text-gray-400">Bs.</span>
                                                    <input 
                                                        type="number" 
                                                        value={currentPrice}
                                                        onChange={(e) => handlePriceChange(p._id!, parseFloat(e.target.value) || 0)}
                                                        className="w-24 text-right text-sm font-black text-gray-900 bg-white border border-gray-200 rounded-xl px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {isEdited ? (
                                                    <button 
                                                        onClick={() => handleSave(p)}
                                                        disabled={savingId === p._id}
                                                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                    >
                                                        {savingId === p._id ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                                        Guardar
                                                    </button>
                                                ) : successId === p._id ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-black bg-emerald-50 px-3 py-1.5 rounded-xl">
                                                        <CheckCircle2 size={14} />
                                                        A!xito
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-300">Sin cambios</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredProducts.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-gray-400 font-bold">
                                No se encontraron productos.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
