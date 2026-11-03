import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/usePosStore';
import { useSesionActiva } from '../hooks/useCaja';
import { usePOSData } from '../hooks/usePOSData';
import { client } from '../api/client';
import { Search, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalStorage } from 'usehooks-ts';
import { toast } from 'sonner';
import type { Sale, Product } from '../api/types';

import { POSTicketSidebar } from '../components/pos/POSTicketSidebar';
import { POSActionsModal } from '../components/pos/POSActionsModal';
import { POSPaymentModal } from '../components/pos/POSPaymentModal';
import { POSAlmacenModal } from '../components/pos/POSAlmacenModal';
import { POSCatalogGrid } from '../components/pos/POSCatalogGrid';
import { POSModals } from '../components/pos/POSModals';
import { POSCustomizeModal, type POSQuickWidget } from '../components/pos/POSCustomizeModal';
import POSSettleDueModal from '../components/pos/POSSettleDueModal';

const fmt = (n?: number) => (n || 0).toFixed(2);

export default function POSPage() {
    const { user, tenantSettings } = useAuthStore();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const sucursalId = user?.sucursal_id || 'CENTRAL';

    const { data: sesionActiva, isLoading: loadingSesion } = useSesionActiva();

    const {
        almacen_id, setAlmacenId,
        items, addItem, removeItem, updateQty, setQty,
        cliente, setCliente,
        vendedor, setVendedor,
        pagos, pendingPago, setPendingPago, addPago, removePago,
        descuento, setDescuento,
        total, totalCubierto, restante, cambio, canFinalize,
        reset,
        parkedTickets, parkTicket, restoreTicket, removeParkedTicket,
        sendWhatsApp, setSendWhatsApp
    } = usePosStore();

    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);

    useEffect(() => {
        if (items.length > 0 && !selectedItemKey) {
            setSelectedItemKey(`${items[0].product._id}-${items[0].almacen_id}`);
        } else if (items.length === 0) {
            setSelectedItemKey(null);
        }
    }, [items, selectedItemKey]);

    const activeItem = useMemo(() => {
        if (!selectedItemKey) return items[0] || null;
        return items.find((i) => `${i.product._id}-${i.almacen_id}` === selectedItemKey) || items[0] || null;
    }, [items, selectedItemKey]);

    const [search, setSearch] = useLocalStorage('pos-search', '');
    const [selectedCat, setSelectedCat] = useLocalStorage('pos-selected-cat', 'all');
    const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
    const [pinnedWidgets, setPinnedWidgets] = useLocalStorage<POSQuickWidget[]>('pos-pinned-widgets', ['descuento']);

    const [almacenSelectorProduct, setAlmacenSelectorProduct] = useState<Product | null>(null);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [pendingConfirmDuplicate, setPendingConfirmDuplicate] = useState(false);
    const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
    const [fechaVenta, setFechaVenta] = useState<string>('');
    const [isSettleDueOpen, setIsSettleDueOpen] = useState(false);

    const canEditDate = user?.permisos_especiales?.includes('EDITAR_FECHA_VENTA') ||
        ['SUPERADMIN', 'ADMIN_MATRIZ', 'ADMIN', 'ADMIN_SUCURSAL'].includes(user?.role || '');

    // Consolidated POS Data Query Hook
    const {
        products, loadingP, categories, descuentosDisponibles,
        loadingD, vendedores, sucursales, almacenes, stockMap
    } = usePOSData(sucursalId, almacen_id);

    useEffect(() => {
        if (almacenes.length > 0 && (almacen_id === 'default' || !almacenes.find((a) => a.id === almacen_id))) {
            const def = almacenes.find((a) => a.is_default);
            if (def && def.id) setAlmacenId(def.id);
            else if (almacenes[0]?.id) setAlmacenId(almacenes[0].id);
        }
    }, [almacenes, almacen_id, setAlmacenId]);

    // Hotkeys & Barcode Scanner
    useEffect(() => {
        let currentString = '';
        let lastTimestamp = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('pos-search-input')?.focus();
                return;
            }
            if (e.key === 'F2') {
                e.preventDefault();
                setIsPaymentModalOpen(true);
                return;
            }
            if (e.key === 'F4') {
                e.preventDefault();
                if (items.length === 0) {
                    toast.error('Agrega productos al ticket antes de cobrar');
                    return;
                }
                if (!isPaymentModalOpen) {
                    setIsPaymentModalOpen(true);
                } else if (canFinalize()) {
                    executeSale();
                }
                return;
            }

            if (isPaymentModalOpen || lastSale) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (activeItem) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    updateQty(activeItem.product._id, activeItem.almacen_id, 1);
                    return;
                }
                if (e.key === '-') {
                    e.preventDefault();
                    updateQty(activeItem.product._id, activeItem.almacen_id, -1);
                    return;
                }
                if (e.key === 'Delete') {
                    e.preventDefault();
                    removeItem(activeItem.product._id, activeItem.almacen_id);
                    return;
                }
            }

            const now = Date.now();
            if (now - lastTimestamp > 50) currentString = '';
            lastTimestamp = now;

            if (e.key === 'Enter') {
                if (currentString.length > 2) {
                    e.preventDefault();
                    const match = products.find((p) => p.codigo_largo === currentString || p.codigo_corto === currentString);
                    if (match && match.is_active !== false) {
                        const stock = stockMap[match._id] ?? 0;
                        if (stock > 0) {
                            addItem(match, almacen_id, almacenes.find((a) => a.id === almacen_id)?.nombre);
                        } else {
                            toast.error(`Producto sin stock: ${match.descripcion}`);
                        }
                    }
                }
                currentString = '';
            } else if (e.key.length === 1) {
                currentString += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products, stockMap, addItem, almacen_id, almacenes, isPaymentModalOpen, lastSale, items.length, canFinalize, activeItem, updateQty, removeItem]);

    const filtered = useMemo(() => products.filter((p) => {
        const q = search.toLowerCase();
        const matchQ = !q || p.descripcion.toLowerCase().includes(q) || (p.codigo_corto ?? '').toLowerCase().includes(q) || (p.codigo_largo ?? '').toLowerCase().includes(q);
        return matchQ && (selectedCat === 'all' || p.categoria_id === selectedCat) && p.is_active !== false;
    }), [products, search, selectedCat]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 24;

    useEffect(() => {
        requestAnimationFrame(() => setCurrentPage(1));
    }, [search, selectedCat]);

    const paginatedFiltered = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    const isSubmittingRef = useRef(false);
    const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

    const resetSaleState = () => {
        idempotencyKeyRef.current = crypto.randomUUID();
        isSubmittingRef.current = false;
        setPendingConfirmDuplicate(false);
        setShowDuplicateWarning(false);
        setIsPaymentModalOpen(false);
        setIsActionsModalOpen(false);
        reset();
    };

    const saleMut = useMutation({
        mutationFn: () => client<Sale>('/ventas', {
            body: {
                sucursal_id: sucursalId,
                almacen_id: almacen_id,
                items: items.map((i) => ({
                    producto_id: i.product._id,
                    cantidad: i.quantity,
                    precio_unitario: i.precio,
                    almacen_id: i.almacen_id,
                })),
                pagos: pagos.map((p) => ({ metodo: p.metodo, monto: p.monto })),
                descuento: descuento.valor ? { nombre: descuento.nombre, tipo: descuento.tipo, valor: parseFloat(descuento.valor) } : undefined,
                cliente_id: cliente.cliente_id || undefined,
                cliente: cliente.es_factura || cliente.nit || cliente.razon_social ? {
                    nit: cliente.nit || undefined,
                    razon_social: cliente.razon_social || undefined,
                    email: cliente.email || undefined,
                    telefono: cliente.telefono || undefined,
                    es_factura: cliente.es_factura,
                    is_miembro_comunidad: cliente.is_miembro_comunidad || false,
                } : undefined,
                vendedor_id: vendedor.vendedor_id || undefined,
                vendedor_name: vendedor.vendedor_name || undefined,
                fecha_venta: fechaVenta ? new Date(fechaVenta).toISOString() : undefined,
                send_whatsapp: sendWhatsApp && (!!cliente.telefono || !!cliente.cliente_id),
                idempotency_key: idempotencyKeyRef.current,
                confirm_duplicate: pendingConfirmDuplicate,
            },
        }),
        onSettled: () => {
            isSubmittingRef.current = false;
        },
        onSuccess: (data) => {
            almacenes.forEach((a) => {
                if (a.id) qc.invalidateQueries({ queryKey: ['inventario', sucursalId, a.id] });
            });
            qc.invalidateQueries({ queryKey: ['pos-stats'] });
            setLastSale(data);
            setFechaVenta('');
            setPendingConfirmDuplicate(false);
            setIsPaymentModalOpen(false);
        },
        onError: (err: unknown) => {
            const msg = (err as { message?: string })?.message || 'Error al procesar la venta';
            toast.error(msg);
        },
    });

    const executeSale = (confirmedDuplicate = false) => {
        if (isSubmittingRef.current) return;

        if (cliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
            toast.error('El formato del correo electrónico es inválido');
            return;
        }

        if (lastSale && !confirmedDuplicate) {
            const lastTime = lastSale.created_at ? new Date(lastSale.created_at).getTime() : Date.now();
            const timeDiff = Date.now() - lastTime;
            if (timeDiff < 20000) {
                const currentItemsSorted = items.map((i) => `${i.product._id}:${i.quantity}`).sort().join(',');
                const lastItemsSorted = lastSale.items.map((i) => `${i.producto_id}:${i.cantidad}`).sort().join(',');
                if (currentItemsSorted === lastItemsSorted && currentItemsSorted.length > 0) {
                    setShowDuplicateWarning(true);
                    return;
                }
            }
        }

        isSubmittingRef.current = true;
        setShowDuplicateWarning(false);
        saleMut.mutate();
    };

    const totalVal = total();
    const cubierto = totalCubierto();
    const subtotalVal = items.reduce((acc, i) => acc + i.precio * i.quantity, 0);
    const descAmount = subtotalVal - totalVal;

    if (!loadingSesion && !sesionActiva) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50 p-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-5 text-center max-w-sm">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center shadow-inner">
                        <Lock size={36} className="text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 mb-1">Caja Cerrada</h2>
                        <p className="text-sm text-gray-500">Debes abrir turno de caja antes de realizar ventas.</p>
                    </div>
                    <button onClick={() => navigate('/caja')} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer">
                        Ir al Módulo de Caja →
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full bg-gray-100 overflow-hidden select-none">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden shrink-0 flex border-b border-gray-200 bg-white">
                <button onClick={() => setMobileTab('catalog')} className={`flex-1 py-3 text-xs font-black transition-colors border-b-2 flex items-center justify-center gap-1.5 ${mobileTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
                    <Search size={14} /> Catálogo
                </button>
                <button onClick={() => setMobileTab('cart')} className={`flex-1 py-3 text-xs font-black transition-colors border-b-2 flex items-center justify-center gap-1.5 relative ${mobileTab === 'cart' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
                    <span>Ticket ({items.length})</span>
                    <span className="font-mono text-gray-900 font-bold ml-1">Bs. {fmt(totalVal)}</span>
                </button>
            </div>

            {/* ══════════════ LEFT COLUMN: Odoo-Style Ticket & Numpad ══════════════ */}
            <POSTicketSidebar
                isMobileTabActive={mobileTab === 'cart'}
                parkedTickets={parkedTickets}
                onRestoreTicket={restoreTicket}
                onRemoveParkedTicket={removeParkedTicket}
                onParkTicket={parkTicket}
                items={items}
                username={user?.username}
                selectedItemKey={selectedItemKey}
                onSelectItemKey={setSelectedItemKey}
                onUpdateQty={updateQty}
                onSetQty={setQty}
                onRemoveItem={removeItem}
                hasMultipleAlmacenes={almacenes.length > 1}
                cliente={cliente}
                setCliente={setCliente}
                onOpenActionsModal={() => setIsActionsModalOpen(true)}
                onOpenCustomizeModal={() => setIsCustomizeModalOpen(true)}
                descAmount={descAmount}
                totalVal={totalVal}
                activeItem={activeItem}
                onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                pinnedWidgets={pinnedWidgets}
                vendedor={vendedor}
                setVendedor={setVendedor}
                vendedores={vendedores}
                descuento={descuento}
                setDescuento={setDescuento}
                descuentosDisponibles={descuentosDisponibles}
                loadingDescuentos={loadingD}
                sendWhatsApp={sendWhatsApp}
                setSendWhatsApp={setSendWhatsApp}
                hasWhatsAppEnabled={tenantSettings?.whatsapp?.enabled}
                fechaVenta={fechaVenta}
                setFechaVenta={setFechaVenta}
                canEditDate={canEditDate}
                onOpenSettleDue={() => setIsSettleDueOpen(true)}
            />

            {/* ══════════════ RIGHT COLUMN: High-Density Catalog Grid ══════════════ */}
            <POSCatalogGrid
                search={search}
                onSearchChange={setSearch}
                categories={categories}
                selectedCat={selectedCat}
                onSelectCat={setSelectedCat}
                almacenes={almacenes}
                selectedAlmacenId={almacen_id}
                onSelectAlmacenId={setAlmacenId}
                products={paginatedFiltered}
                stockMap={stockMap}
                itemsInCart={items}
                isLoading={loadingP}
                currentPage={currentPage}
                totalPages={Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                onProductClick={(p) => {
                    if (almacenes.length <= 1) {
                        addItem(p, almacen_id, almacenes[0]?.nombre);
                    } else {
                        setAlmacenSelectorProduct(p);
                    }
                }}
            />

            {/* ══════════════ MODALS ══════════════ */}
            <POSCustomizeModal
                isOpen={isCustomizeModalOpen}
                onClose={() => setIsCustomizeModalOpen(false)}
                pinnedWidgets={pinnedWidgets}
                onToggleWidget={(w) => {
                    if (pinnedWidgets.includes(w)) setPinnedWidgets(pinnedWidgets.filter((x) => x !== w));
                    else setPinnedWidgets([...pinnedWidgets, w]);
                }}
                canEditDate={canEditDate}
                hasWhatsApp={!!tenantSettings?.whatsapp?.enabled}
            />

            <POSActionsModal
                isOpen={isActionsModalOpen}
                onClose={() => setIsActionsModalOpen(false)}
                cliente={cliente}
                setCliente={setCliente}
                vendedor={vendedor}
                setVendedor={setVendedor}
                vendedores={vendedores}
                fechaVenta={fechaVenta}
                setFechaVenta={setFechaVenta}
                canEditDate={canEditDate}
                descuento={descuento}
                setDescuento={setDescuento}
                descuentosDisponibles={descuentosDisponibles}
                loadingDescuentos={loadingD}
                sendWhatsApp={sendWhatsApp}
                setSendWhatsApp={setSendWhatsApp}
                hasWhatsAppEnabled={tenantSettings?.whatsapp?.enabled}
                onParkTicket={parkTicket}
                onClearTicket={resetSaleState}
                hasItems={items.length > 0}
                onOpenSettleDue={() => setIsSettleDueOpen(true)}
            />

            <POSSettleDueModal
                isOpen={isSettleDueOpen}
                onClose={() => setIsSettleDueOpen(false)}
                initialClientNit={cliente.nit}
                initialClientName={cliente.razon_social}
                onPaymentSuccess={() => {
                    qc.invalidateQueries({ queryKey: ['sesion_activa'] });
                }}
            />

            <POSPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={totalVal}
                subtotal={subtotalVal}
                descuentoValor={descAmount}
                descuentoLabel={descuento.nombre}
                totalCubierto={cubierto}
                restante={restante()}
                cambio={cambio()}
                pagos={pagos}
                pendingPago={pendingPago}
                setPendingPago={setPendingPago}
                onAddPago={addPago}
                onRemovePago={removePago}
                cliente={cliente}
                canFinalize={canFinalize()}
                isSubmitting={saleMut.isPending}
                onFinalize={() => executeSale(false)}
            />

            <POSAlmacenModal
                product={almacenSelectorProduct}
                almacenes={almacenes}
                sucursalId={sucursalId}
                onSelectAlmacen={(almId, almNombre) => {
                    if (almacenSelectorProduct) {
                        addItem(almacenSelectorProduct, almId, almNombre);
                        setAlmacenSelectorProduct(null);
                    }
                }}
                onClose={() => setAlmacenSelectorProduct(null)}
            />

            <POSModals
                showDuplicateWarning={showDuplicateWarning}
                onCancelDuplicate={() => setShowDuplicateWarning(false)}
                onConfirmDuplicate={() => {
                    setPendingConfirmDuplicate(true);
                    setShowDuplicateWarning(false);
                    executeSale(true);
                }}
                lastSale={lastSale}
                onPrint={() => window.print()}
                onNextSale={() => {
                    saleMut.reset();
                    setLastSale(null);
                    resetSaleState();
                }}
                tenantName={user?.tenant_id || 'Mi Tienda'}
                sucursalName={sucursales.find((s) => s._id === sucursalId)?.nombre}
                ticketFooter={tenantSettings?.ticket_footer}
                logoBase64={tenantSettings?.logo_base64}
                direccion={tenantSettings?.direccion}
                telefono={tenantSettings?.telefono}
            />
        </div>
    );
}
