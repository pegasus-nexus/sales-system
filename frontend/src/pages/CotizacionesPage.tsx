import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Plus, Search,
    Loader2, Share2, ArrowRightCircle
} from 'lucide-react';
import {
    getCotizaciones, createCotizacion,
    convertirCotizacionAVenta,
    getSucursales, getProducts
} from '../api/api';
import type { CotizacionPayload } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function CotizacionesPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const esMatriz = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MATRIZ';

    const [selectedSucursal, setSelectedSucursal] = useState<string>(esMatriz ? 'CENTRAL' : (user?.sucursal_id || 'CENTRAL'));
    const [search, setSearch] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Formulario Nueva Cotización
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteNit, setClienteNit] = useState('');
    const [clienteTelefono, setClienteTelefono] = useState('');
    const [validezDias, setValidezDias] = useState(15);
    const [notas, setNotas] = useState('');
    const [items, setItems] = useState<Array<{ producto_id: string; descripcion: string; cantidad: number; precio_unitario: number }>>([]);
    const [prodSearch, setProdSearch] = useState('');

    const { data: sucursales = [] } = useQuery({
        queryKey: ['sucursales'],
        queryFn: getSucursales,
        enabled: esMatriz,
    });

    const { data: cotizaciones = [], isLoading } = useQuery({
        queryKey: ['cotizaciones', selectedSucursal, estadoFilter, search],
        queryFn: () => getCotizaciones(selectedSucursal, estadoFilter || undefined, search || undefined),
    });

    const { data: productsData } = useQuery({
        queryKey: ['products-catalog-lite', prodSearch],
        queryFn: () => getProducts(1, 10, prodSearch || undefined),
        enabled: isCreateModalOpen && prodSearch.length > 1,
    });

    const createMutation = useMutation({
        mutationFn: (payload: CotizacionPayload) => createCotizacion(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
            toast.success('Cotización creada exitosamente');
            setIsCreateModalOpen(false);
            resetForm();
        },
        onError: (err: any) => toast.error(err?.message || 'Error al crear cotización')
    });

    const convertMutation = useMutation({
        mutationFn: ({ id, metodo }: { id: string; metodo: string }) => convertirCotizacionAVenta(id, metodo),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
            queryClient.invalidateQueries({ queryKey: ['inventario'] });
            toast.success(`Cotización convertida en Venta #${res.numero_cotizacion}. Stock actualizado.`);
        },
        onError: (err: any) => toast.error(err?.message || 'Error al facturar cotización')
    });

    const resetForm = () => {
        setClienteNombre('');
        setClienteNit('');
        setClienteTelefono('');
        setValidezDias(15);
        setNotas('');
        setItems([]);
        setProdSearch('');
    };

    const handleAddItem = (prod: any) => {
        const existing = items.find(i => i.producto_id === prod.id || i.producto_id === prod._id);
        if (existing) {
            setItems(items.map(i => (i.producto_id === existing.producto_id ? { ...i, cantidad: i.cantidad + 1 } : i)));
        } else {
            setItems([...items, {
                producto_id: prod.id || prod._id,
                descripcion: prod.descripcion,
                cantidad: 1,
                precio_unitario: prod.precio_venta || 0
            }]);
        }
        setProdSearch('');
    };

    const totalCalculado = items.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0);

    const handleShareWhatsApp = (cot: any) => {
        const text = `Hola *${cot.cliente.nombre_razon_social}*, te enviamos la proforma *${cot.numero_cotizacion}* por un total de *Bs. ${Number(cot.total).toFixed(2)}*. Validez: ${cot.validez_dias} días.`;
        const phone = (cot.cliente.telefono || '').replace(/\D/g, '');
        const url = phone ? `https://wa.me/591${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const productList = productsData && 'items' in productsData ? productsData.items : [];

    return (
        <div className="max-w-7xl mx-auto space-y-4 p-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Ventas Institucionales & Cotizaciones (B2B)
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">Genera presupuestos y proformas sin descontar stock hasta que el cliente apruebe y facture.</p>
                </div>

                <div className="flex items-center gap-2">
                    {esMatriz && (
                        <select
                            value={selectedSucursal}
                            onChange={e => setSelectedSucursal(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-900 shadow-sm"
                        >
                            <option value="CENTRAL">Almacén Central</option>
                            {sucursales.map(s => <option key={s._id} value={s._id}>{s.nombre}</option>)}
                        </select>
                    )}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <Plus size={16} />
                        Nueva Cotización
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-1 min-w-[260px] relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por número o cliente..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 focus:bg-white outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={estadoFilter}
                        onChange={e => setEstadoFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-900"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="ENVIADA">Enviada</option>
                        <option value="APROBADA">Aprobada</option>
                        <option value="FACTURADA">Facturada</option>
                        <option value="RECHAZADA">Rechazada</option>
                    </select>
                </div>
            </div>

            {/* Tabla de Cotizaciones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-xs text-gray-900">
                    <thead className="bg-gray-50 uppercase text-[10px] font-bold text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-3 py-2.5">N° Proforma</th>
                            <th className="px-3 py-2.5">Cliente</th>
                            <th className="px-3 py-2.5">NIT / CI</th>
                            <th className="px-3 py-2.5 text-right">Total</th>
                            <th className="px-3 py-2.5 text-center">Estado</th>
                            <th className="px-3 py-2.5">Vendedor</th>
                            <th className="px-3 py-2.5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    <Loader2 className="animate-spin mx-auto text-indigo-500 mb-2" size={24} />
                                    Cargando cotizaciones...
                                </td>
                            </tr>
                        ) : cotizaciones.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    No hay cotizaciones registradas para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            cotizaciones.map((cot: any) => (
                                <tr key={cot.id} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-mono font-bold text-indigo-600">{cot.numero_cotizacion}</td>
                                    <td className="px-3 py-2 font-semibold">{cot.cliente?.nombre_razon_social}</td>
                                    <td className="px-3 py-2 text-gray-500">{cot.cliente?.nit_ci || '-'}</td>
                                    <td className="px-3 py-2 text-right font-mono font-black text-gray-900">
                                        Bs. {Number(cot.total).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            cot.estado === 'FACTURADA' ? 'bg-emerald-100 text-emerald-800' :
                                            cot.estado === 'APROBADA' ? 'bg-blue-100 text-blue-800' :
                                            cot.estado === 'ENVIADA' ? 'bg-indigo-100 text-indigo-800' :
                                            cot.estado === 'RECHAZADA' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {cot.estado}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">{cot.vendedor_nombre}</td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleShareWhatsApp(cot)}
                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                title="Enviar por WhatsApp"
                                            >
                                                <Share2 size={15} />
                                            </button>
                                            {cot.estado !== 'FACTURADA' && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`¿Aprobar y Facturar la cotización ${cot.numero_cotizacion}? Esto registrará la venta y descontará el stock en el inventario.`)) {
                                                            convertMutation.mutate({ id: cot.id, metodo: 'EFECTIVO' });
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-bold text-[10px]"
                                                    title="Facturar y Descontar Stock"
                                                >
                                                    <ArrowRightCircle size={13} />
                                                    Facturar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Crear Cotización */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Nueva Cotización B2B / Proforma</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">Razón Social / Cliente *</label>
                                <input
                                    type="text"
                                    value={clienteNombre}
                                    onChange={e => setClienteNombre(e.target.value)}
                                    placeholder="Ej: Constructora San Martín SRL"
                                    className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">NIT / CI</label>
                                <input
                                    type="text"
                                    value={clienteNit}
                                    onChange={e => setClienteNit(e.target.value)}
                                    placeholder="Ej: 1029384021"
                                    className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">Teléfono / WhatsApp</label>
                                <input
                                    type="text"
                                    value={clienteTelefono}
                                    onChange={e => setClienteTelefono(e.target.value)}
                                    placeholder="Ej: 71234567"
                                    className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">Validez (Días)</label>
                                <input
                                    type="number"
                                    value={validezDias}
                                    onChange={e => setValidezDias(Number(e.target.value))}
                                    className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white"
                                />
                            </div>
                        </div>

                        {/* Buscador de productos */}
                        <div className="border-t pt-3">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">Agregar Productos a la Proforma</label>
                            <input
                                type="text"
                                value={prodSearch}
                                onChange={e => setProdSearch(e.target.value)}
                                placeholder="Escribe el nombre del producto..."
                                className="w-full border rounded-lg p-2 text-xs text-gray-900 bg-white"
                            />
                            {productList.length > 0 && (
                                <div className="border rounded-lg mt-1 max-h-32 overflow-y-auto divide-y bg-gray-50">
                                    {productList.map((p: any) => (
                                        <button
                                            key={p.id || p._id}
                                            type="button"
                                            onClick={() => handleAddItem(p)}
                                            className="w-full text-left p-2 hover:bg-indigo-50 text-xs flex justify-between items-center"
                                        >
                                            <span className="font-medium text-gray-800">{p.descripcion}</span>
                                            <span className="font-bold text-indigo-600">Bs. {Number(p.precio_venta || 0).toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Lista de ítems agregados */}
                        {items.length > 0 && (
                            <div className="border rounded-lg overflow-hidden text-xs">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-bold">
                                        <tr>
                                            <th className="p-2">Ítem</th>
                                            <th className="p-2 w-20 text-center">Cant.</th>
                                            <th className="p-2 w-24 text-right">P. Unit</th>
                                            <th className="p-2 w-24 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((it, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2">{it.descripcion}</td>
                                                <td className="p-2 text-center">
                                                    <input
                                                        type="number"
                                                        value={it.cantidad}
                                                        min={1}
                                                        onChange={e => {
                                                            const val = Number(e.target.value);
                                                            setItems(items.map((x, i) => i === idx ? { ...x, cantidad: val } : x));
                                                        }}
                                                        className="w-14 border rounded text-center p-1 bg-white text-gray-900"
                                                    />
                                                </td>
                                                <td className="p-2 text-right">Bs. {it.precio_unitario.toFixed(2)}</td>
                                                <td className="p-2 text-right font-bold">Bs. {(it.cantidad * it.precio_unitario).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-between items-center font-bold text-sm bg-gray-50 p-3 rounded-lg">
                            <span>Total de la Cotización:</span>
                            <span className="text-indigo-600 font-mono text-base">Bs. {totalCalculado.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={createMutation.isPending || items.length === 0 || !clienteNombre.trim()}
                                onClick={() => {
                                    createMutation.mutate({
                                        sucursal_id: selectedSucursal,
                                        cliente: {
                                            nombre_razon_social: clienteNombre,
                                            nit_ci: clienteNit,
                                            telefono: clienteTelefono
                                        },
                                        items: items.map(i => ({
                                            producto_id: i.producto_id,
                                            descripcion: i.descripcion,
                                            cantidad: i.cantidad,
                                            precio_unitario: i.precio_unitario
                                        })),
                                        validez_dias: validezDias,
                                        notas: notas
                                    });
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Guardando...' : 'Crear Cotización'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
