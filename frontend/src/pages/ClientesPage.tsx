import React, { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from '../hooks/useClientes';
import { useConfirm } from '../components/ConfirmModal';
import type { Cliente } from '../api/clientes';
import { asignarTarjetaTaboada } from '../api/clientes';
import { generarPaseGoogleWallet } from '../api/api';
import type { GoogleWalletPassResponse } from '../api/types';

import { ClientesKPIBar } from '../components/clientes/ClientesKPIBar';
import { 
    ClientesControlPanel, 
    type ClienteFilterType, 
    type ViewMode 
} from '../components/clientes/ClientesControlPanel';
import { ClientesKanbanView } from '../components/clientes/ClientesKanbanView';
import { ClientesListView } from '../components/clientes/ClientesListView';
import { ClienteFormModal } from '../components/clientes/ClienteFormModal';
import { ClienteDetailsModal } from '../components/clientes/ClienteDetailsModal';
import { GoogleWalletModal } from '../components/momentos_taboada/GoogleWalletModal';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): [T] {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return [debouncedValue];
}

export default function ClientesPage() {
    const confirm = useConfirm();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch] = useDebounce(searchTerm, 400);
    const [page] = useState(1);

    // Filter & View State
    const [currentFilter, setCurrentFilter] = useState<ClienteFilterType>('ALL');
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');

    // API Queries
    const { data: rawClientes = [], isLoading, refetch } = useClientes(page, 100, debouncedSearch);
    const createMut = useCreateCliente();
    const updateMut = useUpdateCliente();
    const deleteMut = useDeleteCliente();

    // Modals state
    const [selectedClienteDetails, setSelectedClienteDetails] = useState<Cliente | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    // Google Wallet modal state
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [walletData, setWalletData] = useState<GoogleWalletPassResponse | null>(null);
    const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);
    const [selectedWalletCliente, setSelectedWalletCliente] = useState<Cliente | null>(null);

    // Assign card loading state
    const [isAssigningCardId, setIsAssigningCardId] = useState<string | null>(null);

    // Filtered clients list based on active filter chip
    const filteredClientes = useMemo(() => {
        if (!rawClientes) return [];
        switch (currentFilter) {
            case 'CON_TARJETA':
                return rawClientes.filter((c) => Boolean(c.numero_tarjeta));
            case 'SIN_TARJETA':
                return rawClientes.filter((c) => !c.numero_tarjeta);
            case 'CON_TELEFONO':
                return rawClientes.filter((c) => Boolean(c.telefono && c.telefono.trim()));
            case 'CON_COMPRAS':
                return rawClientes.filter((c) => (c.cantidad_compras || 0) > 0);
            case 'ALL':
            default:
                return rawClientes;
        }
    }, [rawClientes, currentFilter]);

    // Summary counts for filter chips
    const filterCounts = useMemo(() => {
        const total = rawClientes.length;
        const conTarjeta = rawClientes.filter((c) => Boolean(c.numero_tarjeta)).length;
        const sinTarjeta = total - conTarjeta;
        const conTelefono = rawClientes.filter((c) => Boolean(c.telefono && c.telefono.trim())).length;
        const conCompras = rawClientes.filter((c) => (c.cantidad_compras || 0) > 0).length;
        return { total, conTarjeta, sinTarjeta, conTelefono, conCompras };
    }, [rawClientes]);

    // Handle Assigning Taboada Card
    const handleAsignarTarjeta = async (cliente: Cliente) => {
        try {
            setIsAssigningCardId(cliente._id);
            const updated = await asignarTarjetaTaboada(cliente._id);
            toast.success(`¡Tarjeta asignada con éxito! N°: ${updated.numero_tarjeta}`);
            await refetch();
            return updated;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al asignar tarjeta Taboada';
            toast.error(msg);
            return null;
        } finally {
            setIsAssigningCardId(null);
        }
    };

    // Handle Opening / Generating Google Wallet Pass
    const handleOpenWallet = async (cliente: Cliente) => {
        setSelectedWalletCliente(cliente);
        setIsWalletModalOpen(true);
        setIsGeneratingWallet(true);
        setWalletError(null);
        setWalletData(null);

        try {
            let activeCard = cliente.numero_tarjeta;
            // Si el cliente no tiene tarjeta aún, asignarla en el backend
            if (!activeCard) {
                const updated = await handleAsignarTarjeta(cliente);
                if (updated && updated.numero_tarjeta) {
                    activeCard = updated.numero_tarjeta;
                }
            }

            const response = await generarPaseGoogleWallet({
                cliente_id: cliente._id,
                numero_tarjeta: activeCard,
                telefono: cliente.telefono,
                nombre: cliente.nombre,
            });

            setWalletData(response);
            await refetch();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se pudo generar el pase de Google Wallet';
            setWalletError(msg);
        } finally {
            setIsGeneratingWallet(false);
        }
    };

    // Form Modal Handlers
    const handleOpenCreateModal = () => {
        setEditingCliente(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (cliente: Cliente) => {
        setEditingCliente(cliente);
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: {
        nombre: string;
        telefono: string;
        email: string;
        nit_ci: string;
        direccion: string;
        notas: string;
    }) => {
        if (editingCliente) {
            updateMut.mutate(
                { id: editingCliente._id, data: formData },
                {
                    onSuccess: () => {
                        toast.success('Cliente actualizado correctamente');
                        setIsFormModalOpen(false);
                        refetch();
                    },
                }
            );
        } else {
            createMut.mutate(formData, {
                onSuccess: () => {
                    toast.success('Cliente creado correctamente');
                    setIsFormModalOpen(false);
                    refetch();
                },
            });
        }
    };

    const handleDeleteCliente = async (id: string, nombre: string) => {
        if (
            await confirm({
                title: '¿Eliminar cliente?',
                message: `¿Estás seguro de eliminar a "${nombre}"? Los datos históricos de ventas se preservarán.`,
                type: 'danger',
                confirmLabel: 'Eliminar',
                cancelLabel: 'Cancelar',
            })
        ) {
            deleteMut.mutate(id, {
                onSuccess: () => {
                    toast.success('Cliente eliminado exitosamente');
                    refetch();
                },
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fc] text-gray-800">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-2xs">
                        <Users size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Directorio de Clientes</h1>
                        <p className="text-xs text-gray-500 font-medium">
                            Comunidad Taboada, fidelización y billetera digital Google Wallet
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar">
                {/* KPI Ribbon */}
                <ClientesKPIBar clientes={rawClientes} />

                {/* Control Panel (Search, Filters, View Switcher, New Button) */}
                <ClientesControlPanel
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    currentFilter={currentFilter}
                    onFilterChange={setCurrentFilter}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onNuevoCliente={handleOpenCreateModal}
                    counts={filterCounts}
                />

                {/* View Render (Kanban vs List) */}
                {viewMode === 'kanban' ? (
                    <ClientesKanbanView
                        clientes={filteredClientes}
                        isLoading={isLoading}
                        searchTerm={searchTerm}
                        onSelectCliente={setSelectedClienteDetails}
                        onEditCliente={handleOpenEditModal}
                        onDeleteCliente={handleDeleteCliente}
                        onOpenWallet={handleOpenWallet}
                        onAsignarTarjeta={handleAsignarTarjeta}
                        isAssigningCardId={isAssigningCardId}
                    />
                ) : (
                    <ClientesListView
                        clientes={filteredClientes}
                        isLoading={isLoading}
                        searchTerm={searchTerm}
                        onSelectCliente={setSelectedClienteDetails}
                        onEditCliente={handleOpenEditModal}
                        onDeleteCliente={handleDeleteCliente}
                        onOpenWallet={handleOpenWallet}
                        onAsignarTarjeta={handleAsignarTarjeta}
                        isAssigningCardId={isAssigningCardId}
                    />
                )}
            </div>

            {/* Google Wallet Modal */}
            <GoogleWalletModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                walletData={walletData}
                isLoading={isGeneratingWallet}
                error={walletError}
                clienteTelefono={selectedWalletCliente?.telefono}
            />

            {/* Form Create/Edit Modal */}
            <ClienteFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                editingCliente={editingCliente}
                onSubmit={handleFormSubmit}
                isPending={createMut.isPending || updateMut.isPending}
            />

            {/* Cliente Details & Meal Plans Modal */}
            <ClienteDetailsModal
                cliente={selectedClienteDetails}
                onClose={() => setSelectedClienteDetails(null)}
                onOpenWallet={handleOpenWallet}
                onAsignarTarjeta={handleAsignarTarjeta}
            />
        </div>
    );
}
