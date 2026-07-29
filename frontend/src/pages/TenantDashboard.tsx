import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTenantStats, getProducts, getUsers, getCategories, createProduct, updateProduct, createEmployee } from '../api/api';
import { Plus, Users, Package, DollarSign, Store, ShoppingBag, Loader2, X, Upload, ImageIcon, KeyRound, AlertTriangle, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import type { Product, ProductCreate, EmployeeCreate } from '../api/types';
import { toast } from 'sonner';

import { Link } from 'react-router-dom';
import { BASE_URL } from '../api/client';
import PasswordField from '../components/PasswordField';
import Pagination from '../components/Pagination';

const BLANK_PRODUCT: ProductCreate = {
    descripcion: '', categoria_id: '', precio_venta: 0, costo_producto: 0,
    codigo_corto: '', codigo_largo: '', image_url: '',
};

export default function TenantDashboard() {
    const user = useAuthStore(state => state.user);
    const queryClient = useQueryClient();
    const [showProductModal, setShowProductModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [productForm, setProductForm] = useState<ProductCreate>(BLANK_PRODUCT);
    const [employeeForm, setEmployeeForm] = useState<EmployeeCreate>({ username: '', password: '', full_name: '', email: '' });
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [credentials, setCredentials] = useState<{ username: string; password: string; full_name: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const { data: stats } = useQuery({ queryKey: ['tenant-stats'], queryFn: getTenantStats });
    const { data: productsData, isLoading: loadingProducts } = useQuery({ queryKey: ['products'], queryFn: () => getProducts(1, 1000) });
    const products = productsData?.items || [];
    const { data: employees, isLoading: loadingEmployees } = useQuery({ queryKey: ['employees'], queryFn: getUsers });
    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

    const [currentPageProducts, setCurrentPageProducts] = useState(1);
    const [currentPageEmployees, setCurrentPageEmployees] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const paginatedProducts = useMemo(() => {
        if (!products) return [];
        const startIndex = (currentPageProducts - 1) * ITEMS_PER_PAGE;
        return products.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [products, currentPageProducts]);

    const paginatedEmployees = useMemo(() => {
        if (!employees) return [];
        const startIndex = (currentPageEmployees - 1) * ITEMS_PER_PAGE;
        return employees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [employees, currentPageEmployees]);

    const createProductMutation = useMutation({
        mutationFn: (data: ProductCreate) => createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowProductModal(false);
            setProductForm(BLANK_PRODUCT);
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProductCreate }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setShowProductModal(false);
            setEditingProduct(null);
            setProductForm(BLANK_PRODUCT);
        },
    });

    const createEmployeeMutation = useMutation({
        mutationFn: (data: EmployeeCreate) => createEmployee(data),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            setCredentials({ username: vars.username, password: vars.password!, full_name: vars.full_name });
            setShowEmployeeModal(false);
            setEmployeeForm({ username: '', password: '', full_name: '', email: '' });
            setConfirmPassword('');
        },
    });

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            descripcion: product.descripcion,
            categoria_id: product.categoria_id,
            precio_venta: product.precio_venta,
            costo_producto: product.costo_producto ?? 0,
            codigo_corto: product.codigo_corto ?? '',
            codigo_largo: product.codigo_largo ?? '',
            image_url: product.image_url ?? '',
        });
        setShowProductModal(true);
    };

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProductMutation.mutate({ id: editingProduct._id, data: productForm });
        } else {
            createProductMutation.mutate(productForm);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) setProductForm(prev => ({ ...prev, image_url: data.url }));
        } catch {
            toast.error('Error al subir imagen');
        }
    };

    const handleCopy = () => {
        if (!credentials) return;
        navigator.clipboard.writeText(`Cajero: ${credentials.full_name}\nUsuario: ${credentials.username}\nContraseña: ${credentials.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const pf = (key: keyof ProductCreate, val: string | number) =>
        setProductForm(f => ({ ...f, [key]: val }));

    const canSubmitEmployee = employeeForm.password === confirmPassword && employeeForm.password!.length >= 8;

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-4">

            {/* ── Credentials Modal ─────────────────────────────────────── */}
            {credentials && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <KeyRound size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Cajero creado</h2>
                                <p className="text-sm text-gray-500">{credentials.full_name}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-2 text-amber-800 text-sm mb-3">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                <span>Guarda estas credenciales ahora. La contraseña no se mostrará nuevamente.</span>
                            </div>
                            <div className="space-y-2">
                                {[{ label: 'Usuario', val: credentials.username }, { label: 'Contraseña', val: credentials.password }].map(({ label, val }) => (
                                    <div key={label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-200">
                                        <span className="text-xs text-gray-500">{label}</span>
                                        <span className="font-mono font-semibold text-gray-900">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleCopy}
                                className="flex items-center gap-2 flex-1 justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-xl text-sm font-medium transition-colors">
                                {copied ? <><Check size={16} className="text-green-600" /> Copiado</> : <><Copy size={16} /> Copiar</>}
                            </button>
                            <button onClick={() => setCredentials(null)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="std-title-page">Hola, {user?.full_name?.split(' ')[0] ?? user?.username} 👋</h1>
                    <p className="std-description">Gestiona tu negocio desde aquí</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingProduct(null); setProductForm(BLANK_PRODUCT); setShowProductModal(true); }}
                        className="std-btn-primary">
                        <Plus size={16} /> Nuevo Producto
                    </button>
                    <button onClick={() => setShowEmployeeModal(true)}
                        className="std-btn-secondary">
                        <Users size={16} /> Nuevo Cajero
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white shadow-xs">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-white/15 rounded-lg"><DollarSign size={20} /></div>
                        <span className="text-indigo-100 font-medium text-xs">Ventas Hoy</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-0.5">Bs. {(stats?.total_sales ?? 0).toFixed(2)}</h3>
                    <p className="text-indigo-100/75 text-xs">Actualizado hace un momento</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-amber-50 rounded-lg"><Package size={20} className="text-amber-600" /></div>
                        <span className="text-gray-400 font-medium text-xs">Catálogo</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.active_products ?? 0}</h3>
                    <p className="text-gray-400 text-xs">Productos activos</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs hover:border-gray-300 transition-all">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg"><Store size={20} className="text-blue-600" /></div>
                        <span className="text-gray-400 font-medium text-xs">Personal</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.active_employees ?? 0}</h3>
                    <p className="text-gray-400 text-xs">Cajeros registrados</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Products List */}
                <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h2 className="std-title-section text-sm">Productos Recientes</h2>
                        <Link to="/catalogo" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Ver todos</Link>
                    </div>
                    {loadingProducts ? (
                        <div className="flex justify-center p-6"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
                    ) : (
                        <div className="space-y-2">
                            {paginatedProducts.map(product => (
                                <div key={product._id}
                                    className="group p-2.5 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 cursor-pointer border border-transparent hover:border-gray-200/60"
                                    onClick={() => handleEditProduct(product)}>
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.descripcion} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-xs truncate group-hover:text-indigo-600 transition-colors">{product.descripcion}</h4>
                                        <p className="text-xs text-gray-400">
                                            <span className="font-bold text-gray-700">Bs. {product.precio_venta.toFixed(2)}</span>
                                            {product.codigo_corto && <span className="ml-2 font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{product.codigo_corto}</span>}
                                        </p>
                                    </div>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded shrink-0 border border-indigo-100">
                                        {product.categoria_nombre ?? '—'}
                                    </span>
                                </div>
                            ))}
                            {products?.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <ShoppingBag size={36} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">No hay productos aún.</p>
                                </div>
                            )}
                            {products && products.length > ITEMS_PER_PAGE && (
                                <div className="pt-2">
                                    <Pagination 
                                        currentPage={currentPageProducts}
                                        totalPages={Math.ceil(products.length / ITEMS_PER_PAGE)}
                                        onPageChange={setCurrentPageProducts}
                                        totalItems={products.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Employees List */}
                <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h2 className="std-title-section text-sm">Equipo</h2>
                    </div>
                    {loadingEmployees ? (
                        <div className="flex justify-center p-6"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
                    ) : (
                        <div className="space-y-2">
                            {paginatedEmployees.map(emp => (
                                <div key={emp._id} className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-xs">{emp.full_name ?? emp.username}</h4>
                                        <p className="text-[11px] text-gray-400 font-mono">@{emp.username}</p>
                                    </div>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Activo</span>
                                </div>
                            ))}
                            {employees?.length === 0 && (
                                <p className="text-center text-gray-400 text-xs py-8">No hay cajeros registrados.</p>
                            )}
                            {employees && employees.length > ITEMS_PER_PAGE && (
                                <div className="pt-2">
                                    <Pagination 
                                        currentPage={currentPageEmployees}
                                        totalPages={Math.ceil(employees.length / ITEMS_PER_PAGE)}
                                        onPageChange={setCurrentPageEmployees}
                                        totalItems={employees.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Product Modal ──────────────────────────────────────────────────── */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-gray-900">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setShowProductModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="space-y-3">
                            {/* Image */}
                            <div className="flex justify-center mb-2">
                                <div className="relative group w-24 h-24 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-indigo-400 transition-colors">
                                    {productForm.image_url ? (
                                        <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-gray-400" size={24} />
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold text-[10px]">
                                        <Upload size={14} className="mr-1" /> {productForm.image_url ? 'Cambiar' : 'Subir'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="std-label text-xs">Descripción / Nombre *</label>
                                <input type="text" required placeholder="Ej: Chocolate Amargo 70%"
                                    className="std-input"
                                    value={productForm.descripcion} onChange={e => pf('descripcion', e.target.value)} />
                            </div>

                            <div>
                                <label className="std-label text-xs">Categoría *</label>
                                <select required
                                    className="std-input cursor-pointer"
                                    value={productForm.categoria_id} onChange={e => pf('categoria_id', e.target.value)}>
                                    <option value="">Seleccionar Categoría…</option>
                                    {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="std-label text-xs">Precio de Venta *</label>
                                    <input type="number" step="0.01" min="0" required placeholder="0.00"
                                        className="std-input"
                                        value={productForm.precio_venta || ''} onChange={e => pf('precio_venta', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="std-label text-xs">Costo de Producción</label>
                                    <input type="number" step="0.01" min="0" placeholder="0.00"
                                        className="std-input"
                                        value={productForm.costo_producto || ''} onChange={e => pf('costo_producto', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="std-label text-xs">Código Corto</label>
                                    <input type="text" placeholder="CHO-001" className="std-input font-mono"
                                        value={productForm.codigo_corto ?? ''} onChange={e => pf('codigo_corto', e.target.value)} />
                                </div>
                                <div>
                                    <label className="std-label text-xs">Código de Barras</label>
                                    <input type="text" placeholder="7891234..." className="std-input font-mono"
                                        value={productForm.codigo_largo ?? ''} onChange={e => pf('codigo_largo', e.target.value)} />
                                </div>
                            </div>

                            {(createProductMutation.isError || updateProductMutation.isError) && (
                                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {((createProductMutation.error || updateProductMutation.error) as any)?.message ?? 'Error al guardar'}
                                </p>
                            )}

                            <button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}
                                className="std-btn-primary w-full py-2.5 mt-2 disabled:opacity-60">
                                {createProductMutation.isPending || updateProductMutation.isPending
                                    ? <Loader2 className="animate-spin" size={16} />
                                    : (editingProduct ? 'Actualizar Producto' : 'Guardar Producto')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Employee Modal ─────────────────────────────────────────────────── */}
            {showEmployeeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-gray-900">Nuevo Cajero</h2>
                            <button onClick={() => setShowEmployeeModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
                        </div>
                        <form onSubmit={e => {
                            e.preventDefault();
                            if (!canSubmitEmployee) return;
                            createEmployeeMutation.mutate(employeeForm);
                        }} className="space-y-3">
                            <div className="space-y-2">
                                <label className="std-label text-xs">Datos Personales</label>
                                <input type="text" placeholder="Nombre Completo" required
                                    className="std-input"
                                    value={employeeForm.full_name} onChange={e => setEmployeeForm({ ...employeeForm, full_name: e.target.value })} />
                                <input type="text" placeholder="Usuario para Login" required
                                    className="std-input"
                                    value={employeeForm.username} onChange={e => setEmployeeForm({ ...employeeForm, username: e.target.value })} />
                                <input type="email" placeholder="Correo Electrónico" required
                                    className="std-input"
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
