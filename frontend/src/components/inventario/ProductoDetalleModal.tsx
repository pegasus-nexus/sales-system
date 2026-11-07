import React, { useState, useEffect } from 'react';
import { 
    X, Package, Scale, History, Archive, 
    Building2, RefreshCw, CheckCircle2, 
    ShieldAlert
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProductDetail, deactivateProduct, updateProduct, recalcularKardex } from '../../api/api';
import type { InventarioItem, ProductoDetalleResponse } from '../../api/types';
import { useAuthStore } from '../../store/authStore';

interface Props {
    isOpen: boolean;
    item: InventarioItem | null;
    selectedSucursal: string;
    onClose: () => void;
    onAjustarStock: (item: { id: string; name: string }) => void;
    onVerKardex: (item: { id: string; name: string }) => void;
}

export const ProductoDetalleModal: React.FC<Props> = ({
    isOpen,
    item,
    selectedSucursal,
    onClose,
    onAjustarStock,
    onVerKardex,
}) => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const esAdminMatriz = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN_MATRIZ' || user?.role === 'ADMIN';
    const esAdminSucursal = esAdminMatriz || user?.role === 'ADMIN_SUCURSAL';

    const productId = item?.producto_id || '';

    // Consultar detalle completo en tiempo real
    const { 
        data: detail, 
        isLoading, 
        refetch 
    } = useQuery<ProductoDetalleResponse>({
        queryKey: ['product_detail', productId],
        queryFn: () => getProductDetail(productId),
        enabled: isOpen && Boolean(productId),
        staleTime: 1000 * 30,
    });

    useEffect(() => {
        if (!isOpen) {
            setConfirmArchiveOpen(false);
            setIsProcessing(false);
        }
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const productoNombre = detail?.descripcion || item.producto_nombre;
    const precioBase = detail?.precio_venta ?? item.precio;
    const precioSucursal = item.precio_sucursal;
    const codigoCorto = detail?.codigo_corto || item.codigo_corto;
    const codigoLargo = detail?.codigo_largo || item.codigo_largo || item.codigo_barras;
    const codigoSistema = detail?.codigo_sistema || item.codigo_sistema;
    const categoriaNombre = detail?.categoria_nombre || item.categoria_nombre || 'Sin Categoría';
    const tipoItem = detail?.tipo_item || item.tipo_item || 'FISICO';
    const imageUrl = detail?.image_url || item.image_url;
    const isActive = detail?.is_active ?? (item.is_active !== false);
    const stockTotal = detail?.stock_total ?? item.cantidad;
    const stockDesglose = detail?.stock_desglose || [];

    const handleArchiveProduct = async () => {
        try {
            setIsProcessing(true);
            await deactivateProduct(productId);
            toast.success(`Producto "${productoNombre}" archivado exitosamente.`);
            queryClient.invalidateQueries({ queryKey: ['inventario'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product_detail', productId] });
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al archivar el producto';
            toast.error(msg);
        } finally {
            setIsProcessing(false);
            setConfirmArchiveOpen(false);
        }
    };

    const handleReactivateProduct = async () => {
        try {
            setIsProcessing(true);
            await updateProduct(productId, { is_active: true } as any);
            toast.success(`Producto "${productoNombre}" reactivado exitosamente.`);
            queryClient.invalidateQueries({ queryKey: ['inventario'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            refetch();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al reactivar el producto';
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    const [isCuadrandoKardex, setIsCuadrandoKardex] = useState(false);

    const handleCuadrarKardex = async () => {
        if (!productId) return;
        setIsCuadrandoKardex(true);
        try {
            const res = await recalcularKardex(productId, selectedSucursal, 'default');
            const detalle = res.data?.detalles?.find(d => d.producto_id === productId);
            if (detalle && Math.abs(detalle.stock_anterior - detalle.stock_nuevo) > 0.001) {
                toast.success(`Kárdex cuadrado: stock ajustado de ${detalle.stock_anterior} a ${detalle.stock_nuevo} u.`);
            } else {
                toast.success(`Kárdex verificado: el stock físico coincide con los movimientos registrados.`);
            }
            queryClient.invalidateQueries({ queryKey: ['inventario'] });
            queryClient.invalidateQueries({ queryKey: ['product_detail', productId] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            refetch();
        } catch (err: any) {
            toast.error(err?.message || 'Error al cuadrar el Kárdex del producto');
        } finally {
            setIsCuadrandoKardex(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-200">
                {/* Header Modal */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                            <Package className="w-6 h-6 text-indigo-300" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    {categoriaNombre}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    isActive 
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                                        : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                                }`}>
                                    {isActive ? 'Activo en Catálogo' : 'Archivado (Inactivo)'}
                                </span>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate mt-1" title={productoNombre}>
                                {productoNombre}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido Principal con Scroll */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
                    {/* Tarjeta Superior: Imagen + Datos Clave */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                        {/* Imagen del Producto */}
                        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={productoNombre}
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300';
                                    }}
                                />
                            ) : (
                                <Package size={44} className="text-gray-300" />
                            )}
                        </div>

                        {/* Información Resumida */}
                        <div className="flex-1 w-full space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-150">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Código Corto
                                    </span>
                                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-900 mt-0.5 block truncate">
                                        {codigoCorto || 'N/A'}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-150">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Código Barras
                                    </span>
                                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-900 mt-0.5 block truncate">
                                        {codigoLargo || 'N/A'}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-150">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Cód. Sistema
                                    </span>
                                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-900 mt-0.5 block truncate">
                                        {codigoSistema || 'N/A'}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-150">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Tipo
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 block truncate">
                                        {tipoItem}
                                    </span>
                                </div>
                            </div>

                            {/* Precios */}
                            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-150 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                                        Precio al Público
                                    </span>
                                    <span className="text-base sm:text-lg font-black font-mono text-gray-900">
                                        Bs. {precioBase.toFixed(2)}
                                    </span>
                                </div>

                                {precioSucursal !== undefined && precioSucursal !== null && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                                            Precio en esta Sucursal
                                        </span>
                                        <span className="text-base sm:text-lg font-black font-mono text-amber-900">
                                            Bs. {precioSucursal.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {esAdminMatriz && detail?.costo_producto !== undefined && detail?.costo_producto !== null && (
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                            Costo Producto
                                        </span>
                                        <span className="text-sm font-bold font-mono text-gray-700">
                                            Bs. {detail.costo_producto.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Stock en Tienda Activa
                                    </span>
                                    <span className={`text-base sm:text-lg font-black font-mono ${
                                        item.cantidad > 10 ? 'text-emerald-700' : item.cantidad > 0 ? 'text-amber-700' : 'text-rose-700'
                                    }`}>
                                        {item.cantidad} u.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desglose de Existencias por Sucursal */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Building2 size={16} className="text-indigo-600" />
                                <span>Existencias Físicas en Todas las Sucursales</span>
                            </h3>
                            <span className="text-xs font-black text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                                Total Empresa: {stockTotal} u.
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="py-6 flex justify-center items-center gap-2 text-xs text-gray-500">
                                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                                <span>Cargando inventario multi-sucursal...</span>
                            </div>
                        ) : stockDesglose.length > 0 ? (
                            <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-bold text-[10px] uppercase tracking-wider border-b border-gray-200">
                                        <tr>
                                            <th className="px-3.5 py-2">Sucursal</th>
                                            <th className="px-3.5 py-2">Almacén</th>
                                            <th className="px-3.5 py-2 text-center">Stock</th>
                                            <th className="px-3.5 py-2 text-right">Precio Sucursal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-150">
                                        {stockDesglose.map((s) => {
                                            const isSelected = s.sucursal_id === selectedSucursal;
                                            return (
                                                <tr
                                                    key={`${s.sucursal_id}_${s.almacen_id}`}
                                                    className={isSelected ? 'bg-indigo-50/50 font-bold' : 'hover:bg-gray-50'}
                                                >
                                                    <td className="px-3.5 py-2.5 flex items-center gap-1.5">
                                                        <span className="text-gray-900">{s.sucursal_nombre}</span>
                                                        {isSelected && (
                                                            <span className="text-[10px] text-indigo-600 font-semibold px-1.5 py-0.2 rounded bg-indigo-100">
                                                                Actual
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-gray-500 font-mono text-[11px]">
                                                        {s.almacen_id}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-center">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                            s.cantidad > 10 ? 'bg-emerald-100 text-emerald-800' :
                                                            s.cantidad > 0 ? 'bg-amber-100 text-amber-800' :
                                                            'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {s.cantidad} u.
                                                        </span>
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right font-mono text-gray-700">
                                                        {s.precio_sucursal !== null && s.precio_sucursal !== undefined
                                                            ? `Bs. ${s.precio_sucursal.toFixed(2)}`
                                                            : `Bs. ${precioBase.toFixed(2)} (Base)`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-4 text-center text-xs text-gray-500">
                                No se encontraron registros de inventario en otras sucursales.
                            </div>
                        )}
                    </div>

                    {/* Diálogo de Confirmación de Archivo (Soft Delete) */}
                    {confirmArchiveOpen && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in duration-100">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div className="text-xs text-rose-900 space-y-1">
                                    <h4 className="font-bold text-sm text-rose-950">
                                        ¿Archivar "{productoNombre}"?
                                    </h4>
                                    <p className="text-rose-800">
                                        Esta acción realiza un <strong>soft-delete</strong>: el producto se ocultará de los puntos de venta y del inventario activo, pero <strong>no se borrará</strong> ningún registro histórico de ventas o movimientos pasados.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setConfirmArchiveOpen(false)}
                                    disabled={isProcessing}
                                    className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold bg-white hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleArchiveProduct}
                                    disabled={isProcessing}
                                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? 'Archivando...' : 'Sí, Archivar Producto'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con Botones de Acción */}
                <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        {esAdminSucursal && isActive && !confirmArchiveOpen && (
                            <button
                                type="button"
                                onClick={() => setConfirmArchiveOpen(true)}
                                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                                title="Archivar o desactivar este producto (soft delete)"
                            >
                                <Archive size={14} />
                                <span>Archivar Producto</span>
                            </button>
                        )}

                        {esAdminSucursal && !isActive && (
                            <button
                                type="button"
                                onClick={handleReactivateProduct}
                                disabled={isProcessing}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                                title="Reactivar producto archivado"
                            >
                                <CheckCircle2 size={14} />
                                <span>Reactivar Producto</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {esAdminSucursal && (
                            <button
                                type="button"
                                onClick={handleCuadrarKardex}
                                disabled={isCuadrandoKardex}
                                className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                title="Recalcular secuencialmente el Kárdex y alinear el stock físico de este producto"
                            >
                                <RefreshCw size={14} className={isCuadrandoKardex ? "animate-spin text-amber-600" : "text-amber-600"} />
                                <span>{isCuadrandoKardex ? "Cuadrando..." : "Cuadrar Kárdex"}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                onVerKardex({ id: productId, name: productoNombre });
                                onClose();
                            }}
                            className="px-3.5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                            title="Ver movimientos históricos en Kárdex"
                        >
                            <History size={14} />
                            <span>Ver Kárdex</span>
                        </button>

                        {esAdminSucursal && (
                            <button
                                type="button"
                                onClick={() => {
                                    onAjustarStock({ id: productId, name: productoNombre });
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                                title="Ajustar stock de este producto"
                            >
                                <Scale size={14} />
                                <span>Ajustar Stock</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
