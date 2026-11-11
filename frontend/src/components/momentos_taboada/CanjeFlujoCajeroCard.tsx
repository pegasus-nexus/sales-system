import React, { useState, useEffect } from 'react';
import {
    Search,
    CreditCard,
    CheckCircle2,
    Gift,
    Sparkles,
    AlertCircle,
    User,
    PlusCircle,
} from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal, ClienteSellosResponse, GoogleWalletPassResponse } from '../../api/types';
import { getMomentosTaboadaClienteSellos, registrarMomentosTaboadaCanje, afiliarTarjetaTaboada, generarPaseGoogleWallet } from '../../api/api';
import { CanjeLiquidacionSection } from './CanjeLiquidacionSection';
import { GoogleWalletModal } from './GoogleWalletModal';

interface Props {
    premios: PremioMomentosTaboada[];
    sucursales: Sucursal[];
    initialQuery?: string;
    onCanjeExitoso: () => void;
}

export const CanjeFlujoCajeroCard: React.FC<Props> = ({
    premios,
    sucursales,
    initialQuery = '',
    onCanjeExitoso,
}) => {
    const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
    const [clienteData, setClienteData] = useState<ClienteSellosResponse | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Selección de premio para canje
    const [selectedPremio, setSelectedPremio] = useState<PremioMomentosTaboada | null>(null);
    const [selectedSucursal, setSelectedSucursal] = useState<string>(
        sucursales[0]?._id || sucursales[0]?.id || ''
    );
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
    const [notas, setNotas] = useState<string>('');

    // Estados de acción
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isActivatingCard, setIsActivatingCard] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    // Modal de Google Wallet
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [walletData, setWalletData] = useState<GoogleWalletPassResponse | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState<string | null>(null);

    const handleAbrirWallet = async () => {
        if (!clienteData) return;
        const tel = clienteData.cliente.telefono || '';
        const numTarj = clienteData.cliente.numero_tarjeta || undefined;
        setWalletModalOpen(true);
        setWalletLoading(true);
        setWalletError(null);
        setWalletData(null);

        try {
            const res = await generarPaseGoogleWallet({
                telefono: tel || undefined,
                numero_tarjeta: numTarj,
                cliente_id: clienteData.cliente.id || undefined,
                nombre: clienteData.cliente.nombre,
            });
            setWalletData(res);
            if (!clienteData.cliente.numero_tarjeta && res.numero_tarjeta) {
                await ejecutarBusqueda(tel || res.numero_tarjeta);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al generar el pase de Google Wallet';
            setWalletError(msg);
        } finally {
            setWalletLoading(false);
        }
    };

    // Búsqueda automática si viene un initialQuery (ej. desde el botón "Canjear" de la tabla)
    useEffect(() => {
        if (initialQuery && initialQuery.trim()) {
            setSearchQuery(initialQuery);
            ejecutarBusqueda(initialQuery);
        }
    }, [initialQuery]);

    const ejecutarBusqueda = async (queryToSearch: string) => {
        const clean = queryToSearch.trim();
        if (!clean) return;

        try {
            setIsSearching(true);
            setSearchError(null);
            setSelectedPremio(null);
            setSuccessMsg(null);
            const res = await getMomentosTaboadaClienteSellos(clean);
            setClienteData(res);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'No se encontró al cliente o no tiene compras registradas';
            setSearchError(msg);
            setClienteData(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        ejecutarBusqueda(searchQuery);
    };

    const handleActivarTarjeta = async () => {
        if (!clienteData) return;
        const tel = clienteData.cliente.telefono;
        if (!tel) {
            setActionError('El cliente no tiene teléfono para afiliar la tarjeta.');
            return;
        }

        try {
            setIsActivatingCard(true);
            setActionError(null);
            const res = await afiliarTarjetaTaboada(tel, clienteData.cliente.nombre);
            setSuccessMsg(`¡Tarjeta ${res.numero_tarjeta} vinculada exitosamente!`);
            // Recargar datos del cliente
            await ejecutarBusqueda(tel);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al activar tarjeta';
            setActionError(msg);
        } finally {
            setIsActivatingCard(false);
        }
    };

    const handleConfirmarCanje = async () => {
        if (!clienteData || !selectedPremio) return;

        const pId = selectedPremio.id || selectedPremio._id || '';
        if (!pId) return;

        try {
            setIsSubmitting(true);
            setActionError(null);
            const res = await registrarMomentosTaboadaCanje({
                premio_id: pId,
                sucursal_id: selectedSucursal,
                cliente_telefono: clienteData.cliente.telefono,
                cliente_nombre: clienteData.cliente.nombre,
                metodo_pago: metodoPago,
                notas: notas.trim() || undefined,
            });

            setSuccessMsg(
                `¡Canje exitoso de "${selectedPremio.nombre}"! Se descontaron ${res.sellos_descontados} tickets. Saldo final: ${res.sellos_restantes} tickets.`
            );
            setSelectedPremio(null);
            setNotas('');
            onCanjeExitoso();
            // Refrescar datos del cliente
            await ejecutarBusqueda(clienteData.cliente.telefono);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al procesar el canje';
            setActionError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const ticketsDisponibles = clienteData ? clienteData.balance.sellos_disponibles : 0;
    const saldoFinalProyectado = selectedPremio
        ? Math.max(0, ticketsDisponibles - selectedPremio.sellos_requeridos)
        : ticketsDisponibles;

    return (
        <div className="space-y-6">
            {/* Buscador Prominente de Cliente */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="max-w-2xl mx-auto text-center space-y-3">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-500/20 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Punto de Atención al Cliente & Canjes
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 font-serif">
                        Canje de Premios "Momentos Taboada"
                    </h2>
                    <p className="text-xs text-gray-500">
                        Ingresa el nombre, celular o número de <b>Tarjeta Taboada</b> para consultar tickets y habilitar los premios disponibles.
                    </p>

                    <form onSubmit={handleSearchSubmit} className="pt-2 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Nombre, Celular o Tarjeta (ej: TAB-829471)..."
                                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-2xl text-gray-900 bg-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching || !searchQuery.trim()}
                            className="px-6 py-3 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-2xl font-bold text-xs md:text-sm shadow-sm transition-all flex items-center gap-2 shrink-0"
                        >
                            <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                            <span>{isSearching ? 'Consultando...' : 'Buscar Cliente'}</span>
                        </button>
                    </form>

                    {searchError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-left flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{searchError}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mensaje de Éxito Global */}
            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* INTERFAZ DEL CLIENTE Y CANJE (Se abre al encontrar al cliente) */}
            {clienteData && (
                <div className="space-y-6">
                    {/* Ficha: Nombre / Tarjeta Taboada & Balance de Tickets */}
                    <div className="bg-gradient-to-r from-[#2c1d11] via-[#4a2e1b] to-[#1f140b] p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            {/* Identidad del Cliente */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider rounded-md border border-amber-500/30">
                                        Cliente Identificado
                                    </span>
                                    <span className="text-xs text-amber-200/70">
                                        Celular: {clienteData.cliente.telefono}
                                    </span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-[#fdf8f2] flex items-center gap-2">
                                    <User className="w-6 h-6 text-amber-400" />
                                    <span>{clienteData.cliente.nombre}</span>
                                </h3>

                                {/* Tarjeta Taboada (Incentivo de uso / Afiliación / Google Wallet) */}
                                <div className="pt-1 flex flex-wrap items-center gap-3">
                                    {clienteData.cliente.numero_tarjeta ? (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-amber-400/40 rounded-xl text-amber-300 font-mono font-bold text-xs shadow-inner">
                                                <CreditCard className="w-4 h-4 text-amber-400" />
                                                <span>Tarjeta Taboada: {clienteData.cliente.numero_tarjeta}</span>
                                            </div>
                                            <button
                                                onClick={handleAbrirWallet}
                                                className="px-3 py-1.5 bg-black hover:bg-gray-900 border border-amber-400/50 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 hover:scale-105"
                                                title="Ver y compartir Tarjeta en Google Wallet"
                                            >
                                                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                                                <span><span className="text-amber-400 font-black">Google</span> Wallet</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-amber-200/80 italic">
                                                Sin Tarjeta Taboada aún
                                            </span>
                                            <button
                                                onClick={handleActivarTarjeta}
                                                disabled={isActivatingCard}
                                                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                                            >
                                                <PlusCircle className="w-3.5 h-3.5" />
                                                <span>{isActivatingCard ? 'Asignando...' : '💳 Activar Tarjeta Taboada'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Indicador de Tickets Acumulados & Disponibles */}
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-6 shrink-0">
                                <div>
                                    <span className="text-[11px] text-amber-200/70 block uppercase font-bold tracking-wider">
                                        Tickets Acumulados
                                    </span>
                                    <span className="text-lg font-black text-white">
                                        {clienteData.balance.sellos_totales_ganados} tickets
                                    </span>
                                    <span className="text-[11px] text-amber-200/60 block">
                                        {clienteData.balance.sellos_canjeados} utilizados
                                    </span>
                                </div>
                                <div className="h-10 w-px bg-white/20" />
                                <div className="text-right">
                                    <span className="text-[11px] text-amber-300 block uppercase font-black tracking-wider">
                                        Disponibles Hoy
                                    </span>
                                    <span className="text-3xl md:text-4xl font-black text-amber-300">
                                        {ticketsDisponibles}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: Qué le permite canjear con esos tickets */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-amber-700" />
                                    <span>¿Qué le permite canjear con sus {ticketsDisponibles} tickets?</span>
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Selecciona el premio deseado para calcular el saldo final y registrar la entrega.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                                4 Premios Oficiales
                            </span>
                        </div>

                        {/* Catálogo de Premios Inteligente */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {premios.map(premio => {
                                const pId = premio.id || premio._id || '';
                                const isSelected = selectedPremio && (selectedPremio.id === pId || selectedPremio._id === pId);
                                const alcanza = ticketsDisponibles >= premio.sellos_requeridos;
                                const faltantes = Math.max(0, premio.sellos_requeridos - ticketsDisponibles);
                                const stockEnSucursal = premio.stock_por_sucursal[selectedSucursal] || 0;

                                return (
                                    <div
                                        key={pId}
                                        onClick={() => alcanza && stockEnSucursal > 0 && setSelectedPremio(premio)}
                                        className={`rounded-2xl border-2 p-4 transition-all flex flex-col justify-between relative cursor-pointer ${
                                            isSelected
                                                ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-500'
                                                : alcanza && stockEnSucursal > 0
                                                ? 'border-emerald-300 bg-white hover:border-amber-400 hover:shadow-sm'
                                                : 'border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div>
                                            {/* Badge Superior */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black text-xs">
                                                    {premio.sellos_requeridos} tickets
                                                </span>
                                                {alcanza ? (
                                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                        ¡Le alcanza!
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                        Faltan {faltantes} tickets
                                                    </span>
                                                )}
                                            </div>

                                            {/* Foto / Placeholder del Premio */}
                                            <div className="h-28 rounded-xl bg-gradient-to-tr from-stone-900 to-stone-700 flex items-center justify-center text-4xl mb-3 overflow-hidden">
                                                {premio.imagen_url ? (
                                                    <img
                                                        src={premio.imagen_url}
                                                        alt={premio.nombre}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>🎁</span>
                                                )}
                                            </div>

                                            <h5 className="font-bold text-gray-900 text-sm">{premio.nombre}</h5>
                                            <p className="text-xs text-gray-500 mt-0.5">{premio.descripcion}</p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] text-gray-400 block font-semibold">Copago</span>
                                                <span className="text-sm font-black text-amber-900">
                                                    Bs {premio.copago_bs.toFixed(2)}
                                                </span>
                                            </div>

                                            <div>
                                                {isSelected ? (
                                                    <span className="px-3 py-1 bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm">
                                                        ✓ Seleccionado
                                                    </span>
                                                ) : alcanza && stockEnSucursal > 0 ? (
                                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-200">
                                                        Elegir
                                                    </span>
                                                ) : stockEnSucursal === 0 && alcanza ? (
                                                    <span className="text-xs text-rose-600 font-bold">Sin Stock</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-medium">Bloqueado</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECCIÓN 4: Saldo Final & Confirmación de Canje */}
                    {selectedPremio && (
                        <CanjeLiquidacionSection
                            selectedPremio={selectedPremio}
                            ticketsDisponibles={ticketsDisponibles}
                            saldoFinalProyectado={saldoFinalProyectado}
                            selectedSucursal={selectedSucursal}
                            onSelectSucursal={setSelectedSucursal}
                            sucursales={sucursales}
                            metodoPago={metodoPago}
                            onSelectMetodoPago={setMetodoPago}
                            notas={notas}
                            onChangeNotas={setNotas}
                            actionError={actionError}
                            isSubmitting={isSubmitting}
                            onConfirmarCanje={handleConfirmarCanje}
                        />
                    )}
                </div>
            )}

            {/* Modal Interactivo de Google Wallet */}
            <GoogleWalletModal
                isOpen={walletModalOpen}
                onClose={() => setWalletModalOpen(false)}
                walletData={walletData}
                isLoading={walletLoading}
                error={walletError}
                clienteTelefono={clienteData?.cliente.telefono}
            />
        </div>
    );
};
export default CanjeFlujoCajeroCard;
