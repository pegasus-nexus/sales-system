import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus, getProveedores, getProducts } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { 
    ShoppingCart, Plus, PackageOpen, X, XCircle, 
    Loader2, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function PedidosCompraPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const sucursalId = user?.sucursal_id || 'CENTRAL';

    // Form State
    const [proveedorId, setProveedorId] = useState('');
    const [proveedorNombre, setProveedorNombre] = useState('');
    const [detalles, setDetalles] = useState<any[]>([]);
    
    // Add product logic
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [cantidadPedida, setCantidadPedida] = useState(1);
    const [costoEstimado, setCostoEstimado] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters for table
    const [statusFilter, setStatusFilter] = useState('');
    const [providerFilter, setProviderFilter] = useState('');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['purchase_orders', sucursalId],
        queryFn: () => getPurchaseOrders(sucursalId),
        enabled: !!sucursalId
    });

    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores'],
        queryFn: () => getProveedores()
    });

    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: () => getProducts(1, 1000)
    });
    const products = productsData?.items || [];

    const createMut = useMutation({
        mutationFn: createPurchaseOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
            toast.success('Pedido creado exitosamente');
            closeModal();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || 'Error al crear pedido');
        }
    });

    const statusMut = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updatePurchaseOrderStatus(sucursalId, id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
            toast.success('Estado actualizado');
        }
    });

    const totalEstimado = detalles.reduce((acc, item) => acc + (item.cantidad_pedida * item.costo_unitario_estimado), 0);

    const handleAddProduct = () => {
        if (!selectedProduct) return;
        setDetalles(prev => [
            ...prev,
            {
                producto_id: selectedProduct._id,
                nombre_producto: selectedProduct.descripcion,
                codigo_producto: selectedProduct.codigo_corto || selectedProduct.codigo_sistema,
                cantidad_pedida: cantidadPedida,
                costo_unitario_estimado: costoEstimado,
                subtotal: cantidadPedida * costoEstimado
            }
        ]);
        setSelectedProduct(null);
        setCantidadPedida(1);
        setCostoEstimado(0);
    };

    const handleRemoveProduct = (index: number) => {
        setDetalles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!proveedorId || detalles.length === 0) {
            toast.error('Selecciona proveedor y agrega al menos un producto');
            return;
        }
        createMut.mutate({
            sucursal_id: sucursalId,
            proveedor_id: proveedorId,
            proveedor_nombre: proveedorNombre,
            numero_pedido: `PO-${Date.now().toString().slice(-6)}`,
            detalles: detalles,
            total_estimado: totalEstimado
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setProveedorId('');
        setProveedorNombre('');
        setDetalles([]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'BORRADOR': return 'bg-gray-100 text-gray-700';
            case 'ENVIADO': return 'bg-blue-100 text-blue-700';
            case 'PARCIAL': return 'bg-yellow-100 text-yellow-700';
            case 'COMPLETADO': return 'bg-emerald-100 text-emerald-700';
            case 'CANCELADO': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-black" />
                        Pedidos de Compra
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona las órdenes a proveedores</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-black/20"
                >
                    <Plus size={20} />
                    Nuevo Pedido
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <select
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Todos los Estados</option>
                    <option value="BORRADOR">Borrador</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="PARCIAL">Parcial</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                </select>
                
                <select
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                >
                    <option value="">Todos los Proveedores</option>
                    {proveedores.map((p: any) => (
                        <option key={p._id || p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Número</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Proveedor</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Total Est.</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders
                                    .filter((o: any) => (statusFilter ? o.estado === statusFilter : true))
                                    .filter((o: any) => (providerFilter ? o.proveedor_nombre === providerFilter : true))
                                    .map((o: any) => (
                                    <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 font-bold text-gray-900">{o.numero_pedido}</td>
                                        <td className="p-5 font-medium text-gray-700">{o.proveedor_nombre}</td>
                                        <td className="p-5 text-gray-500">
                                            {new Date(o.fecha_emision).toLocaleDateString()}
                                        </td>
                                        <td className="p-5 font-bold text-gray-900">Bs. {o.total_estimado}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(o.estado)}`}>
                                                {o.estado}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            {o.estado === 'BORRADOR' && (
                                                <button
                                                    onClick={() => statusMut.mutate({ id: o._id, status: 'CANCELADO' })}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            <PackageOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="font-medium text-gray-900">No se encontraron pedidos de compra.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            className="relative bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <ShoppingCart className="w-6 h-6 text-black" />
                                    Nuevo Pedido de Compra
                                </h2>
                                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
                                {/* Cabecera */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Proveedor</label>
                                        <select
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                                            value={proveedorId}
                                            onChange={(e) => {
                                                setProveedorId(e.target.value);
                                                const prov = proveedores.find((p: any) => (p._id || p.id) === e.target.value);
                                                if (prov) setProveedorNombre(prov.nombre);
                                            }}
                                        >
                                            <option value="">Seleccione un proveedor...</option>
                                            {proveedores.map((p: any) => (
                                                <option key={p._id || p.id} value={p._id || p.id}>{p.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Buscador de productos */}
                                <div className="bg-gray-50 rounded-[24px] p-6 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Agregar Productos</h3>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar producto por nombre o código..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-12 p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                                                />
                                            </div>
                                            <select
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900 h-32"
                                                size={4}
                                                value={selectedProduct?._id || ''}
                                                onChange={(e) => {
                                                    const prod = products.find((p: any) => (p._id || p.id) === e.target.value);
                                                    setSelectedProduct(prod || null);
                                                    setCostoEstimado(prod ? (prod.costo_producto || prod.precio_venta || 0) : 0);
                                                }}
                                            >
                                                {(proveedorNombre ? products.filter((p: any) => p.proveedores?.includes(proveedorNombre) || p.proveedor === proveedorNombre) : products)
                                                    .filter((p: any) => p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) || p.codigo_corto?.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map((p: any) => (
                                                        <option key={p._id || p.id} value={p._id || p.id} className="p-2 border-b border-gray-100 last:border-0 hover:bg-gray-100">
                                                            {p.descripcion} ({p.codigo_corto}) - Costo Ref: Bs.{p.costo_producto || p.precio_venta || 0}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Cant."
                                                value={cantidadPedida}
                                                onChange={(e) => setCantidadPedida(Number(e.target.value))}
                                                className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-center text-gray-900"
                                            />
                                        </div>
                                        <div className="w-40 relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Bs.</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={costoEstimado}
                                                onChange={(e) => setCostoEstimado(Number(e.target.value))}
                                                className="w-full pl-12 pr-4 p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                                            />
                                            <span className="absolute -top-6 right-0 text-xs font-bold text-gray-500">Costo Unit.</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-end px-4">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subtotal</p>
                                                <p className="text-xl font-black text-emerald-600">Bs. {(cantidadPedida * costoEstimado).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddProduct}
                                            disabled={!selectedProduct}
                                            className="bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                                        >
                                            <Plus />
                                        </button>
                                    </div>
                                </div>

                                {/* Detalle */}
                                <div>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100">
                                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase">Producto</th>
                                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-center">Cant.</th>
                                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-right">Costo Est.</th>
                                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-right">Subtotal</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {detalles.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-4">
                                                        <p className="font-bold text-gray-900">{item.nombre_producto}</p>
                                                        <p className="text-xs text-gray-500">{item.codigo_producto}</p>
                                                    </td>
                                                    <td className="py-4 text-center font-bold text-gray-700">{item.cantidad_pedida}</td>
                                                    <td className="py-4 text-right font-medium text-gray-700">Bs. {item.costo_unitario_estimado}</td>
                                                    <td className="py-4 text-right font-black text-gray-900">Bs. {item.subtotal}</td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProduct(idx)}
                                                            className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {detalles.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                                                        No hay productos en el pedido
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Estimado</p>
                                    <p className="text-3xl font-black text-gray-900">Bs. {totalEstimado.toFixed(2)}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-4 text-gray-700 font-bold hover:bg-gray-200 rounded-2xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        disabled={createMut.isPending || detalles.length === 0}
                                        className="bg-black text-white px-8 py-4 font-bold rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {createMut.isPending ? 'Guardando...' : 'Crear Pedido'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
