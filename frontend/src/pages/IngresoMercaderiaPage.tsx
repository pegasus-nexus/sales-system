import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchaseOrders, getProveedores, getProducts, createPurchaseReception } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { 
    Barcode, PackageCheck, AlertTriangle, Trash2, 
    CheckCircle2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function IngresoMercaderiaPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const sucursalId = user?.sucursal_id || 'CENTRAL';

    // State
    const [proveedorId, setProveedorId] = useState('');
    const [proveedorNombre, setProveedorNombre] = useState('');
    const [purchaseOrderId, setPurchaseOrderId] = useState('');
    const [numeroDocumento, setNumeroDocumento] = useState('');
    
    // Scanner and Products
    const [scannerInput, setScannerInput] = useState('');
    const scannerInputRef = useRef<HTMLInputElement>(null);
    const [detalles, setDetalles] = useState<any[]>([]);

    // Data Fetching
    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores'],
        queryFn: () => getProveedores()
    });

    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts(1, 1000)
    });
    const products = productsData?.items || [];

    const { data: orders = [] } = useQuery({
        queryKey: ['purchase_orders', sucursalId],
        queryFn: () => getPurchaseOrders(sucursalId),
        enabled: !!sucursalId
    });

    // Mutations
    const createMut = useMutation({
        mutationFn: createPurchaseReception,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase_receptions'] });
            toast.success('Ingreso registrado exitosamente. Precios y Kárdex actualizados.');
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al registrar ingreso');
        }
    });

    // Handle PO Selection
    const handleSelectOrder = (orderId: string) => {
        setPurchaseOrderId(orderId);
        const order = orders.find((o: any) => o._id === orderId);
        if (order) {
            setProveedorId(order.proveedor_id);
            setProveedorNombre(order.proveedor_nombre);
            
            // Map PO details to Reception details
            const newDetalles = order.detalles.map((item: any) => {
                const product = products.find((p: any) => p._id === item.producto_id);
                return {
                    producto_id: item.producto_id,
                    nombre_producto: item.nombre_producto,
                    codigo_producto: item.codigo_producto,
                    // By default, received is 0, user scans to increment
                    cantidad_recibida: 0, 
                    cantidad_pedida: item.cantidad_pedida - item.cantidad_recibida, // Remaining
                    costo_unitario_real: item.costo_unitario_estimado,
                    costo_historico: product ? product.costo_producto : 0,
                    subtotal: 0
                };
            });
            setDetalles(newDetalles);
        }
    };

    // Keep scanner focused
    useEffect(() => {
        const handleGlobalClick = () => {
            if (scannerInputRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
                scannerInputRef.current.focus();
            }
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    // Scanner logic
    const handleScannerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = scannerInput.trim();
        if (!code) return;

        const product = products.find((p: any) => p.codigo_corto === code || p.codigo_sistema === code || p.codigo_largo === code);
        
        if (!product) {
            toast.error(`Producto no encontrado con código: ${code}`);
            setScannerInput('');
            return;
        }

        // Check if product is already in the list
        const existingIndex = detalles.findIndex(d => d.producto_id === product._id);
        
        if (existingIndex >= 0) {
            const newDetalles = [...detalles];
            newDetalles[existingIndex].cantidad_recibida += 1;
            newDetalles[existingIndex].subtotal = newDetalles[existingIndex].cantidad_recibida * newDetalles[existingIndex].costo_unitario_real;
            setDetalles(newDetalles);
            toast.success(`+1 ${product.descripcion}`, { duration: 1000 });
        } else {
            // Add new if it wasn't in the PO
            setDetalles(prev => [
                {
                    producto_id: product._id,
                    nombre_producto: product.descripcion,
                    codigo_producto: product.codigo_corto || product.codigo_sistema,
                    cantidad_recibida: 1,
                    cantidad_pedida: 0, // Not expected
                    costo_unitario_real: product.costo_producto,
                    costo_historico: product.costo_producto,
                    subtotal: product.costo_producto
                },
                ...prev
            ]);
            toast.success(`Agregado: ${product.descripcion}`, { duration: 1000 });
        }
        
        setScannerInput('');
    };

    const updateItem = (index: number, field: string, value: number) => {
        const newDetalles = [...detalles];
        newDetalles[index][field] = value;
        newDetalles[index].subtotal = newDetalles[index].cantidad_recibida * newDetalles[index].costo_unitario_real;
        setDetalles(newDetalles);
    };

    const removeItem = (index: number) => {
        setDetalles(prev => prev.filter((_, i) => i !== index));
    };

    const totalReal = detalles.reduce((acc, item) => acc + item.subtotal, 0);

    const handleSubmit = () => {
        if (!proveedorId || !numeroDocumento || detalles.length === 0) {
            toast.error('Faltan datos obligatorios');
            return;
        }

        const payload = {
            sucursal_id: sucursalId,
            proveedor_id: proveedorId,
            proveedor_nombre: proveedorNombre,
            purchase_order_id: purchaseOrderId || null,
            numero_documento: numeroDocumento,
            total_real: totalReal,
            detalles: detalles.filter(d => d.cantidad_recibida > 0).map(d => ({
                producto_id: d.producto_id,
                nombre_producto: d.nombre_producto,
                codigo_producto: d.codigo_producto,
                cantidad_recibida: d.cantidad_recibida,
                costo_unitario_real: d.costo_unitario_real,
                subtotal: d.subtotal
            }))
        };

        createMut.mutate(payload);
    };

    const resetForm = () => {
        setProveedorId('');
        setProveedorNombre('');
        setPurchaseOrderId('');
        setNumeroDocumento('');
        setDetalles([]);
        setScannerInput('');
    };

    const pendingOrders = orders.filter((o: any) => o.estado === 'BORRADOR' || o.estado === 'ENVIADO' || o.estado === 'PARCIAL');

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <PackageCheck className="w-8 h-8 text-black" />
                    Ingreso de Mercadería
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Recepción y escaneo de productos de compras</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
                {/* Panel Izquierdo: Datos de Cabecera */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Origen</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cargar desde Pedido</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                                    value={purchaseOrderId}
                                    onChange={(e) => handleSelectOrder(e.target.value)}
                                >
                                    <option value="">Ingreso Directo (Sin pedido)</option>
                                    {pendingOrders.map((o: any) => (
                                        <option key={o._id} value={o._id}>{o.numero_pedido} - {o.proveedor_nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Proveedor</label>
                                <select 
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                                    value={proveedorId}
                                    disabled={!!purchaseOrderId}
                                    onChange={(e) => {
                                        setProveedorId(e.target.value);
                                        const prov = proveedores.find((p: any) => p._id === e.target.value);
                                        if (prov) setProveedorNombre(prov.nombre);
                                    }}
                                >
                                    <option value="">Seleccione proveedor...</option>
                                    {proveedores.map((p: any) => (
                                        <option key={p._id} value={p._id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nro. Documento (Factura/Recibo)</label>
                                <input 
                                    type="text"
                                    required
                                    value={numeroDocumento}
                                    onChange={(e) => setNumeroDocumento(e.target.value)}
                                    placeholder="Ej. FAC-00123"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-black p-6 rounded-[32px] shadow-xl text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Barcode className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-lg font-bold">Escáner Activo</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">El lector está listo. Escanea los productos para agregarlos o sumar cantidades.</p>
                        <form onSubmit={handleScannerSubmit}>
                            <input
                                ref={scannerInputRef}
                                type="text"
                                value={scannerInput}
                                onChange={(e) => setScannerInput(e.target.value)}
                                placeholder="Escanea el código de barras..."
                                className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white focus:text-black transition-all font-medium placeholder:text-gray-500"
                                autoFocus
                            />
                        </form>
                    </div>
                </div>

                {/* Panel Derecho: Grilla de Productos */}
                <div className="lg:col-span-3 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Cant. Recibida</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Costo Unit. (Bs)</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Subtotal</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {detalles.map((item, idx) => {
                                    const isCostHigher = item.costo_unitario_real > item.costo_historico;
                                    const isComplete = purchaseOrderId && item.cantidad_recibida >= item.cantidad_pedida;

                                    return (
                                        <tr key={idx} className={`transition-colors ${isComplete ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}>
                                            <td className="p-5">
                                                <p className="font-bold text-gray-900">{item.nombre_producto}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {item.codigo_producto}
                                                    </span>
                                                    {purchaseOrderId && (
                                                        <span className="text-xs font-medium text-blue-600">
                                                            Pedido: {item.cantidad_pedida}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    className="w-24 p-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-black text-lg outline-none focus:ring-2 focus:ring-black"
                                                    value={item.cantidad_recibida || ''}
                                                    onChange={(e) => updateItem(idx, 'cantidad_recibida', Number(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <input 
                                                        type="number" 
                                                        min="0" step="0.1"
                                                        className={`w-28 p-3 bg-gray-50 border rounded-xl text-right font-bold outline-none focus:ring-2 focus:ring-black ${isCostHigher ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-gray-200 text-gray-900'}`}
                                                        value={item.costo_unitario_real || ''}
                                                        onChange={(e) => updateItem(idx, 'costo_unitario_real', Number(e.target.value))}
                                                    />
                                                    {isCostHigher && (
                                                        <span className="flex items-center gap-1 text-[10px] text-orange-600 mt-1 font-bold">
                                                            <AlertTriangle size={12} />
                                                            Mayor al hist. ({item.costo_historico})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-black text-xl text-gray-900">
                                                {item.subtotal.toFixed(2)}
                                            </td>
                                            <td className="p-5 text-center">
                                                <button 
                                                    onClick={() => removeItem(idx)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {detalles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <PackageCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-500 font-medium">No hay productos. Usa el escáner o selecciona un pedido.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Panel Inferior */}
                    <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total a Ingresar</p>
                            <p className="text-4xl font-black text-gray-900">Bs. {totalReal.toFixed(2)}</p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={createMut.isPending || detalles.length === 0}
                            className="w-full md:w-auto bg-emerald-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {createMut.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                            Confirmar Ingreso
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
