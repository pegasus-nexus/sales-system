import { BASE_URL } from '../api/client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardMatriz, getSucursales, getCategories, createProduct, updateProduct, createEmployee } from '../api/api';
import { Plus, Users, Package, DollarSign, Store, ShoppingBag, Loader2, X, Upload, ImageIcon, Eye, EyeOff, XCircle, RefreshCw } from 'lucide-react';
import type { Product, ProductCreate, EmployeeCreate, Sucursal } from '../api/types';
import { toast } from 'sonner';


import PasswordField from '../components/PasswordField';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceLine } from 'recharts';

const BLANK_PRODUCT: ProductCreate = {
    descripcion: '', categoria_id: '', precio_venta: 0, costo_producto: 0,
    codigo_corto: '', codigo_largo: '', image_url: '',
};

export default function TenantDashboard() {
    const queryClient = useQueryClient();
    
    const [selectedSucursal, setSelectedSucursal] = useState<string>('all');
    const [showVentasHoy, setShowVentasHoy] = useState(false);
    
    // Modals
    const [showProductModal, setShowProductModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [productForm, setProductForm] = useState<ProductCreate>(BLANK_PRODUCT);
    const [employeeForm, setEmployeeForm] = useState<EmployeeCreate>({ username: '', password: '', full_name: '', email: '' });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [confirmPassword, setConfirmPassword] = useState('');

    const { data: sucursales = [] } = useQuery<Sucursal[]>({ queryKey: ['sucursales'], queryFn: () => getSucursales(true) });
    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
    const { data: metrics, isLoading: loadingMetrics, refetch } = useQuery({ 
        queryKey: ['dashboard-matriz', selectedSucursal], 
        queryFn: () => getDashboardMatriz(selectedSucursal),
        refetchInterval: 300000 // Refresh every 5 mins
    });

    const createProductMutation = useMutation({
        mutationFn: (data: ProductCreate) => createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowProductModal(false);
            setProductForm(BLANK_PRODUCT);
            toast.success("Producto creado exitosamente");
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProductCreate }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm(BLANK_PRODUCT);
            toast.success("Producto actualizado");
        },
    });

    const createEmployeeMutation = useMutation({
        mutationFn: (data: EmployeeCreate) => createEmployee(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setShowEmployeeModal(false);
            setEmployeeForm({ username: '', password: '', full_name: '', email: '' });
            setConfirmPassword('');
            toast.success("Cajero creado exitosamente");
        },
    });

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProductMutation.mutate({ id: editingProduct._id, data: productForm });
        } else {
            createProductMutation.mutate(productForm);
        }
    };

    const canSubmitEmployee = employeeForm.username && employeeForm.password && employeeForm.password === confirmPassword && employeeForm.full_name;



    const pf = (key: keyof ProductCreate, val: string | number) =>
        setProductForm((prev) => ({ ...prev, [key]: val }));

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        toast.promise(
            fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData }).then(res => res.json()),
            {
                loading: 'Subiendo...',
                success: (data) => {
                    setProductForm(prev => ({ ...prev, image_url: data.url }));
                    return 'Imagen subida';
                },
                error: 'Error al subir imagen'
            }
        );
    };

    return (

        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard General</h1>
                    <p className="text-gray-500 mt-1 font-medium">Panel de control de Matriz</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200/60 shadow-sm flex items-center gap-3">
                        <Store size={18} className="text-indigo-500" />
                        <select 
                            value={selectedSucursal}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="bg-transparent outline-none text-sm font-bold text-gray-700 min-w-[150px] cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {sucursales.map(s => (
                                <option key={s._id} value={s._id}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={() => refetch()} className="p-3 bg-white text-gray-600 rounded-2xl border border-gray-200/60 shadow-sm hover:bg-gray-50 transition-all active:scale-95">
                        <RefreshCw size={20} className={loadingMetrics ? "animate-spin" : ""} />
                    </button>
                    
                    <button onClick={() => { setEditingProduct(null); setProductForm(BLANK_PRODUCT); setShowProductModal(true); }}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={18} /> Producto
                    </button>
                    
                    <button onClick={() => setShowEmployeeModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95">
                        <Users size={18} /> Cajero
                    </button>
                </div>
            </div>

            {loadingMetrics ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
            ) : metrics ? (
                <>
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                            <div className="flex justify-between items-start mb-4 relative">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><DollarSign size={24} /></div>
                                <button onClick={() => setShowVentasHoy(!showVentasHoy)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                                    {showVentasHoy ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                            <h3 className="text-4xl font-black mb-1 tracking-tight">
                                {showVentasHoy ? `Bs. ${metrics.ventas_hoy.toFixed(2)}` : '****'}
                            </h3>
                            <p className="text-indigo-100 font-medium text-sm">Ventas Hoy</p>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-2xl"><ShoppingBag size={24} className="text-blue-500" /></div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-1">{metrics.transacciones_ventas}</h3>
                            <p className="text-gray-500 font-medium text-sm">Transacciones de Venta Hoy</p>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-2xl"><Package size={24} className="text-green-500" /></div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-1">{metrics.transacciones_compras}</h3>
                            <p className="text-gray-500 font-medium text-sm">Transacciones de Compra Hoy</p>
                        </div>

                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-2xl"><XCircle size={24} className="text-red-500" /></div>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-1">{metrics.anulaciones_hoy}</h3>
                            <p className="text-gray-500 font-medium text-sm">Anulaciones Hoy</p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Monthly Bar Chart */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Evolucin Anual (Mes a Mes)</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics.grafico_mensual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `Bs${val/1000}k`} />
                                        <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        
                                        <Bar dataKey="margen_distribuidor" name="Margen Dist. (15%)" stackId="a" fill="#8b5cf6" radius={[0,0,4,4]} />
                                        <Bar dataKey="margen_cliente" name="Margen Cliente (85%)" stackId="a" fill="#indigo-300" radius={[4,4,0,0]} />
                                        
                                        <ReferenceLine x={metrics.grafico_mensual.find((m: any) => m.mes_index === metrics.mes_actual)?.mes} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Mes Actual', fill: '#ef4444', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Daily Line Chart */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Ventas Diarias (Mes Actual)</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.grafico_diario} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `Bs${val/1000}k`} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        
                                        <Line type="monotone" dataKey="ventas_totales" name="Ventas Totales" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="margen_distribuidor" name="Margen Dist. (15%)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="margen_cliente" name="Margen Cliente (85%)" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Products */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Productos Ms Vendidos Hoy</h2>
                            {metrics.productos_mas_vendidos.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay ventas registradas hoy.</p>
                            ) : (
                                <div className="space-y-4">
                                    {metrics.productos_mas_vendidos.map((prod: any, idx: number) => (
                                        <div key={prod.producto_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{prod.nombre}</p>
                                                    <p className="text-xs text-gray-500">{prod.cantidad} unidades vendidas</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-indigo-600">Bs. {prod.ingresos.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Personnel */}
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Activo Hoy (Vendiendo)</h2>
                            {metrics.personal_activo.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay personal con ventas hoy.</p>
                            ) : (
                                <div className="space-y-4">
                                    {metrics.personal_activo.map((emp: any) => (
                                        <div key={emp.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl hover:border-indigo-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                    {emp.nombre.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{emp.nombre}</p>
                                                    <p className="text-xs text-gray-500">{emp.transacciones} transacciones hoy</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">Bs. {emp.ventas_hoy.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : null}

                        {showProductModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="space-y-4">
                            {/* Image */}
                            <div className="flex justify-center">
                                <div className="relative group w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                                    {productForm.image_url ? (
                                        <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-gray-400" size={32} />
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold text-xs">
                                        <Upload size={16} className="mr-1" /> {productForm.image_url ? 'Cambiar' : 'Subir'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción / Nombre *</label>
                                <input type="text" required placeholder="Ej: Chocolate Amargo 70%"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                                    value={productForm.descripcion} onChange={e => pf('descripcion', e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría *</label>
                                <select required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 appearance-none"
                                    value={productForm.categoria_id} onChange={e => pf('categoria_id', e.target.value)}>
                                    <option value="">Seleccionar Categoría…</option>
                                    {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Precio de Venta *</label>
                                    <input type="number" step="0.01" min="0" required placeholder="0.00"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                                        value={productForm.precio_venta || ''} onChange={e => pf('precio_venta', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Costo de Producción</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                                        value={productForm.costo_producto || ''} onChange={e => pf('costo_producto', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Código Corto</label>
                                    <input type="text" placeholder="CHO-001" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 font-mono"
                                        value={productForm.codigo_corto ?? ''} onChange={e => pf('codigo_corto', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Código de Barras</label>
                                    <input type="text" placeholder="7891234..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900 font-mono"
                                        value={productForm.codigo_largo ?? ''} onChange={e => pf('codigo_largo', e.target.value)} />
                                </div>
                            </div>

                            {(createProductMutation.isError || updateProductMutation.isError) && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                    {((createProductMutation.error || updateProductMutation.error) as any)?.message ?? 'Error al guardar'}
                                </p>
                            )}

                            <button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {createProductMutation.isPending || updateProductMutation.isPending
                                    ? <Loader2 className="animate-spin" />
                                    : (editingProduct ? 'Actualizar Producto' : 'Guardar Producto')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Employee Modal ─────────────────────────────────────────────────── */}
            {showEmployeeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Nuevo Cajero</h2>
                            <button onClick={() => setShowEmployeeModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={e => {
                            e.preventDefault();
                            if (!canSubmitEmployee) return;
                            createEmployeeMutation.mutate(employeeForm);
                        }} className="space-y-4">
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-gray-500">Datos Personales</label>
                                <input type="text" placeholder="Nombre Completo" required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                                    value={employeeForm.full_name} onChange={e => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} />
                                <input type="text" placeholder="Usuario para Login" required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                                    value={employeeForm.username} onChange={e => setEmployeeForm({ ...employeeForm, username: e.target.value })} />
                                <input type="email" placeholder="Correo Electrónico" required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-300 text-gray-900"
                                    value={employeeForm.email || ''} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
                            </div>

                            <PasswordField
                                value={employeeForm.password!}
                                onChange={v => setEmployeeForm({ ...employeeForm, password: v })}
                                confirmValue={confirmPassword}
                                onConfirmChange={setConfirmPassword}
                            />

                            <button type="submit" disabled={createEmployeeMutation.isPending || !canSubmitEmployee}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
                                {createEmployeeMutation.isPending ? <Loader2 className="animate-spin" /> : 'Crear Cajero'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
