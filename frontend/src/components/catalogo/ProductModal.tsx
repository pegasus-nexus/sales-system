import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Loader2, Check, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { createProduct, updateProduct, uploadImage } from '../../api/api';
import type { Product, ProductCreate, Category, Sucursal, ProductVariantItem } from '../../api/types';
import ProductVariantsBuilder from './ProductVariantsBuilder';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    categories: Category[];
    sucursales: Sucursal[];
    isBranchAdmin?: boolean;
    proveedores?: Array<{ id?: string; _id?: string; nombre: string }>;
}

export default function ProductModal({
    onClose,
    product,
    categories,
    sucursales,
    isBranchAdmin,
    proveedores = [],
}: ProductModalProps) {
    const isEditing = !!product;
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const [hasVariants, setHasVariants] = useState<boolean>(product?.has_variants || false);
    const [variantsList, setVariantsList] = useState<ProductVariantItem[]>(product?.variantes_resumen || []);

    const [formData, setFormData] = useState<ProductCreate>({
        descripcion: product?.descripcion || '',
        categoria_id: product?.categoria_id || (categories.length > 0 ? categories[0]._id : ''),
        precio_venta: product?.precio_venta || 0,
        costo_producto: product?.costo_producto || 0,
        codigo_corto: product?.codigo_corto || '',
        codigo_largo: product?.codigo_largo || '',
        proveedores: product?.proveedores || [],
        image_url: product?.image_url || '',
        precios_sucursales: product?.precios_sucursales || {},
        sucursales_permitidas: product?.sucursales_permitidas || [],
        meal_plan_template_id: product?.meal_plan_template_id || '',
        has_variants: product?.has_variants || false,
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 5MB.');
            return;
        }

        try {
            setIsUploading(true);
            const res = await uploadImage(file);
            setFormData({ ...formData, image_url: res.url });
            toast.success('Foto del producto subida correctamente.');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error al subir la foto';
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handlePriceChange = (sucursalId: string, val: string) => {
        const numVal = parseFloat(val);
        setFormData((prev) => ({
            ...prev,
            precios_sucursales: {
                ...(prev.precios_sucursales || {}),
                [sucursalId]: isNaN(numVal) ? 0 : numVal,
            },
        }));
    };

    const createMut = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto guardado correctamente');
            onClose();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error al crear producto';
            toast.error(msg);
        },
    });

    const updateMut = useMutation({
        mutationFn: (data: ProductCreate) => updateProduct(product!._id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto actualizado correctamente');
            onClose();
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error al actualizar producto';
            toast.error(msg);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: ProductCreate = {
            ...formData,
            has_variants: hasVariants,
            variantes_payload: hasVariants ? variantsList : [],
            variantes_resumen: hasVariants ? variantsList : [],
        };

        if (isEditing) {
            updateMut.mutate(payload);
        } else {
            createMut.mutate(payload);
        }
    };

    const isPending = createMut.isPending || updateMut.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            {isBranchAdmin ? 'Gestionar Foto del Producto' : (isEditing ? 'Editar Producto' : 'Crear Producto en Catálogo')}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {isEditing ? 'Actualiza los datos y variantes del artículo' : 'Define la información base y opcionalmente sus atributos'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar text-gray-900">
                    {isBranchAdmin && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                            🔒 Como Administrador de Sucursal solo puedes actualizar la foto del producto. Los nombres, precios y variantes son administrados por Matriz.
                        </div>
                    )}

                    {/* Nombre / Descripción */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Nombre del Producto o Plantilla
                        </label>
                        <input
                            required
                            type="text"
                            disabled={isBranchAdmin}
                            className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900 placeholder-gray-400 font-medium disabled:opacity-60 disabled:bg-gray-100"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            placeholder="Ej: Chocolate Bombón Surtido o Zapatilla Pegasus Runner"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Categoría
                        </label>
                        <select
                            required
                            disabled={isBranchAdmin}
                            className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900 disabled:opacity-60 disabled:bg-gray-100"
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                        >
                            <option value="" disabled>Seleccionar categoría...</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Precios y Códigos Base */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                SKU / Código Corto
                            </label>
                            <input
                                type="text"
                                disabled={isBranchAdmin}
                                className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900 placeholder-gray-400 uppercase font-mono disabled:opacity-60 disabled:bg-gray-100"
                                value={formData.codigo_corto || ''}
                                onChange={(e) => setFormData({ ...formData, codigo_corto: e.target.value })}
                                placeholder="Ej: CHO-BOM-01"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Código de Barras (EAN / UPC)
                            </label>
                            <input
                                type="text"
                                disabled={isBranchAdmin}
                                className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900 placeholder-gray-400 font-mono disabled:opacity-60 disabled:bg-gray-100"
                                value={formData.codigo_largo || ''}
                                onChange={(e) => setFormData({ ...formData, codigo_largo: e.target.value })}
                                placeholder="Ej: 777123456789"
                            />
                        </div>

                        {!isBranchAdmin && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Precio de Venta Base (Bs)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900 font-bold"
                                        value={formData.precio_venta === 0 ? '' : formData.precio_venta}
                                        onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Costo de Adquisición (Bs)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900"
                                        value={formData.costo_producto === 0 ? '' : formData.costo_producto}
                                        onChange={(e) => setFormData({ ...formData, costo_producto: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* CONSTRUCTOR DE VARIANTES ODOO STYLE */}
                    {!isBranchAdmin && (
                        <ProductVariantsBuilder
                            baseName={formData.descripcion}
                            basePrice={formData.precio_venta || 0}
                            baseCost={formData.costo_producto || 0}
                            baseSku={formData.codigo_corto}
                            hasVariants={hasVariants}
                            onToggleVariants={setHasVariants}
                            onChangeVariants={setVariantsList}
                        />
                    )}

                    {/* Proveedores */}
                    {!isBranchAdmin && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Proveedores (Opcional)
                            </label>
                            <select
                                className="w-full bg-white border border-gray-300 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 rounded-xl px-4 py-2.5 outline-hidden transition-all text-sm text-gray-900"
                                value=""
                                onChange={(e) => {
                                    if (!e.target.value) return;
                                    const current = formData.proveedores || [];
                                    if (!current.includes(e.target.value)) {
                                        setFormData({ ...formData, proveedores: [...current, e.target.value] });
                                    }
                                }}
                            >
                                <option value="">Añadir proveedor...</option>
                                {proveedores
                                    .filter((p) => !(formData.proveedores || []).includes(p.nombre))
                                    .map((p) => (
                                        <option key={p.id || p._id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                            </select>

                            {(formData.proveedores || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(formData.proveedores || []).map((provName) => (
                                        <span
                                            key={provName}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        >
                                            {provName}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, proveedores: (formData.proveedores || []).filter((n) => n !== provName) })}
                                                className="hover:bg-indigo-200 text-indigo-900 p-0.5 rounded-full transition-colors cursor-pointer"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fotografía */}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Fotografía del Producto (Opcional)
                            </label>
                            <label className={`flex items-center justify-center w-full h-12 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:border-indigo-400 ${isUploading ? 'opacity-50' : ''}`}>
                                <span className="flex items-center space-x-2 text-gray-600">
                                    {isUploading ? <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
                                    <span className="font-medium text-xs text-gray-700">{isUploading ? 'Subiendo imagen...' : 'Subir imagen (JPG, PNG, WebP)'}</span>
                                </span>
                                <input type="file" name="file_upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        </div>
                        {formData.image_url && (
                            <div className="shrink-0 relative group h-12 w-12 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Eliminar foto"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Precios específicos por sucursal */}
                    {!isBranchAdmin && sucursales.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Tag size={14} className="text-indigo-600" />
                                <span>Precios Específicos por Sucursal (Opcional)</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {sucursales.map((suc) => (
                                    <div key={suc._id} className="bg-gray-50 rounded-xl p-2.5 border border-gray-200">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 truncate" title={suc.nombre}>
                                            {suc.nombre}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Bs.</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="w-full bg-white border border-gray-300 focus:border-indigo-500 rounded-lg pl-8 pr-2.5 py-1 text-xs text-gray-900 font-bold"
                                                value={formData.precios_sucursales?.[suc._id] ?? ''}
                                                onChange={(e) => handlePriceChange(suc._id, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer con Botones */}
                    <div className="flex gap-3 pt-3 border-t border-gray-100 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            <span>{isBranchAdmin ? 'Guardar Foto' : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
