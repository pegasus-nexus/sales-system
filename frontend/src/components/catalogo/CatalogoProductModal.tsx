import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadCatalogImage } from '../../api/catalogoApi';
import type { 
    CatalogoProducto, 
    CatalogoProductoCreate, 
    CatalogoProductoUpdate 
} from '../../api/catalogoApi';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    productToEdit?: CatalogoProducto | null;
    currencySymbol?: string;
}

export default function CatalogoProductModal({
    isOpen,
    onClose,
    onSaved,
    productToEdit,
    currencySymbol = 'Bs.'
}: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<string>('');
    const [category, setCategory] = useState('General');
    const [imageUrl, setImageUrl] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setTitle(productToEdit.title);
            setDescription(productToEdit.description || '');
            setPrice(productToEdit.price.toString());
            setCategory(productToEdit.category || 'General');
            setImageUrl(productToEdit.images?.[0] || '');
            setIsAvailable(productToEdit.is_available);
            setIsFeatured(productToEdit.is_featured);
        } else {
            setTitle('');
            setDescription('');
            setPrice('');
            setCategory('General');
            setImageUrl('');
            setIsAvailable(true);
            setIsFeatured(false);
        }
    }, [productToEdit, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadCatalogImage(file);
            setImageUrl(url);
            toast.success('Foto subida con éxito');
        } catch {
            toast.error('Error al subir la imagen.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
            toast.error('Por favor ingresa un precio válido.');
            return;
        }

        setIsSaving(true);
        try {
            const { createCatalogProduct, updateCatalogProduct } = await import('../../api/catalogoApi');

            if (productToEdit) {
                const updateData: CatalogoProductoUpdate = {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    price: numPrice,
                    category: category.trim() || 'General',
                    images: imageUrl ? [imageUrl] : [],
                    is_available: isAvailable,
                    is_featured: isFeatured,
                };
                await updateCatalogProduct(productToEdit.id, updateData);
                toast.success('Producto actualizado con éxito');
            } else {
                const createData: CatalogoProductoCreate = {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    price: numPrice,
                    currency_symbol: currencySymbol,
                    category: category.trim() || 'General',
                    images: imageUrl ? [imageUrl] : [],
                    is_available: isAvailable,
                    is_featured: isFeatured,
                };
                await createCatalogProduct(createData);
                toast.success('Producto creado y visible en tu catálogo');
            }

            onSaved();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al guardar producto';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            {productToEdit ? 'Editar Producto del Catálogo' : 'Nuevo Producto para Catálogo'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            Llena los datos para mostrar este producto a tus clientes.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Image Preview & Upload */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Foto del Producto
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={32} className="text-slate-400" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                                        <Loader2 size={24} className="animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                                    <Upload size={14} />
                                    <span>{imageUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                        className="hidden"
                                    />
                                </label>
                                {imageUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl('')}
                                        className="block text-xs text-rose-600 hover:underline font-semibold"
                                    >
                                        Quitar foto
                                    </button>
                                )}
                                <p className="text-[11px] text-slate-500">
                                    JPG o PNG. Se optimiza automáticamente en la nube.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nombre del Producto *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Torta de Tres Leches"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Price & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Precio ({currencySymbol}) *
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                required
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Categoría
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Ej. Tortas, Postres, Ropa"
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Descripción / Detalles
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe ingredientes, tallas, porciones o detalles clave para tus clientes..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-gray-900 bg-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    {/* Switches */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAvailable}
                                onChange={(e) => setIsAvailable(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Disponible para la venta</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span className="flex items-center gap-1">
                                <Sparkles size={12} className="text-amber-500" />
                                Producto Destacado
                            </span>
                        </label>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || isUploading}
                            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSaving && <Loader2 size={14} className="animate-spin" />}
                            <span>{productToEdit ? 'Guardar Cambios' : 'Crear Producto'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
