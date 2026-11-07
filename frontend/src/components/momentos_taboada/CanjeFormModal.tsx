import React, { useState } from 'react';
import { Gift, Search, AlertCircle, CheckCircle2, User, Phone, Store, CreditCard, Sparkles } from 'lucide-react';
import type { PremioMomentosTaboada, Sucursal, ClienteSellosResponse } from '../../api/types';
import { getMomentosTaboadaClienteSellos, registrarMomentosTaboadaCanje } from '../../api/api';
import { CartillaProgresoCard } from './CartillaProgresoCard';

interface Props {
    premios: PremioMomentosTaboada[];
    sucursales: Sucursal[];
    onCanjeExitoso: () => void;
}

export const CanjeFormModal: React.FC<Props> = ({ premios, sucursales, onCanjeExitoso }) => {
    const [searchPhone, setSearchPhone] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [clienteData, setClienteData] = useState<ClienteSellosResponse | null>(null);
    const [selectedPremioId, setSelectedPremioId] = useState<string>('');
    const [selectedSucursalId, setSelectedSucursalId] = useState<string>(
        sucursales[0]?._id || sucursales[0]?.id || ''
    );
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
    const [notas, setNotas] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchPhone.trim()) return;

        try {
            setIsSearching(true);
            setErrorMsg(null);
            setSuccessMsg(null);
            const res = await getMomentosTaboadaClienteSellos(searchPhone.trim());
            setClienteData(res);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al buscar cliente';
            setErrorMsg(msg);
            setClienteData(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleRegistrarCanje = async () => {
        if (!clienteData) {
            setErrorMsg('Primero debes buscar e identificar al cliente.');
            return;
        }
        if (!selectedPremioId) {
            setErrorMsg('Selecciona el premio que el cliente desea canjear.');
            return;
        }
        if (!selectedSucursalId) {
            setErrorMsg('Selecciona la sucursal donde se entrega el premio.');
            return;
        }

        const premio = premios.find(p => (p.id || p._id) === selectedPremioId);
        if (!premio) return;

        // Validar sellos
        if (clienteData.balance.sellos_disponibles < premio.sellos_requeridos) {
            setErrorMsg(
                `Sellos insuficientes. Se requieren ${premio.sellos_requeridos} sellos pero el cliente tiene ${clienteData.balance.sellos_disponibles}.`
            );
            return;
        }

        // Validar stock
        const stockActual = premio.stock_por_sucursal[selectedSucursalId] ?? 0;
        if (stockActual <= 0) {
            setErrorMsg(`El premio '${premio.nombre}' no tiene stock disponible en esta sucursal.`);
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMsg(null);
            const res = await registrarMomentosTaboadaCanje({
                premio_id: selectedPremioId,
                sucursal_id: selectedSucursalId,
                cliente_telefono: clienteData.cliente.telefono,
                cliente_nombre: clienteData.cliente.nombre,
                metodo_pago: metodoPago,
                notas: notas.trim() || undefined,
            });

            setSuccessMsg(
                `¡Canje exitoso! Se descontaron ${res.sellos_descontados} sellos y se recaudaron Bs ${res.copago_recaudado_bs.toFixed(2)} en el fondo de la promoción.`
            );
            setSelectedPremioId('');
            setNotas('');
            // Actualizar datos de sellos del cliente
            await handleSearch();
            onCanjeExitoso();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al registrar canje';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedPremio = premios.find(p => (p.id || p._id) === selectedPremioId);
    const stockSucursalPremio = selectedPremio && selectedSucursalId
        ? (selectedPremio.stock_por_sucursal[selectedSucursalId] ?? 0)
        : 0;

    return (
        <div className="space-y-6">
            {/* Buscador de Cliente */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-600" />
                    Identificar Cliente & Consultar Sellos
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                    Ingresa el número de celular o nombre del cliente para auditar sus sellos y habilitar el canje.
                </p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Ej: 71234567 o nombre del cliente..."
                            value={searchPhone}
                            onChange={e => setSearchPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSearching || !searchPhone.trim()}
                        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        <span>{isSearching ? 'Calculando...' : 'Consultar Sellos'}</span>
                    </button>
                </form>

                {errorMsg && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}
            </div>

            {/* Si se encontró cliente: Formulario de Canje + Cartilla */}
            {clienteData && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Panel Izquierdo: Formulario de Canje */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Gift className="w-5 h-5 text-amber-600" />
                                Validar y Registrar Canje
                            </h4>

                            {/* Cliente Seleccionado */}
                            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-900">
                                            {clienteData.cliente.nombre}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                            {clienteData.cliente.telefono}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-amber-800 block">
                                        Saldo
                                    </span>
                                    <span className="text-base font-black text-amber-900">
                                        {clienteData.balance.sellos_disponibles} sellos
                                    </span>
                                </div>
                            </div>

                            {/* Sucursal de entrega */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Store className="w-3.5 h-3.5 text-gray-500" />
                                    Sucursal donde se entrega el premio:
                                </label>
                                <select
                                    value={selectedSucursalId}
                                    onChange={e => setSelectedSucursalId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    {sucursales.map(s => {
                                        const sId = s._id || s.id || '';
                                        return (
                                            <option key={sId} value={sId}>
                                                {s.nombre} ({s.ciudad})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Selector de Premio */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <Gift className="w-3.5 h-3.5 text-gray-500" />
                                    Premio a Canjear:
                                </label>
                                <div className="space-y-2">
                                    {premios.map(p => {
                                        const pId = p.id || p._id || '';
                                        const isSelected = selectedPremioId === pId;
                                        const stockEnTienda = p.stock_por_sucursal[selectedSucursalId] ?? 0;
                                        const tieneSellos = clienteData.balance.sellos_disponibles >= p.sellos_requeridos;
                                        const puedeCanjear = tieneSellos && stockEnTienda > 0;

                                        return (
                                            <div
                                                key={pId}
                                                onClick={() => puedeCanjear && setSelectedPremioId(pId)}
                                                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-amber-50 border-amber-500 shadow-sm'
                                                        : puedeCanjear
                                                        ? 'bg-white border-gray-200 hover:border-amber-300'
                                                        : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                                                }`}
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        {p.nombre}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {p.sellos_requeridos} sellos + Bs {p.copago_bs.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            stockEnTienda > 0
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}
                                                    >
                                                        {stockEnTienda > 0 ? `${stockEnTienda} en stock` : 'Sin stock'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Método de pago del aporte */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                                    Método de Pago del Copago ({selectedPremio ? `Bs ${selectedPremio.copago_bs.toFixed(2)}` : 'Bs 0'}):
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('EFECTIVO')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            metodoPago === 'EFECTIVO'
                                                ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        💵 Efectivo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('QR')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                            metodoPago === 'QR'
                                                ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        📱 Pago QR
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Este dinero irá directo al Fondo de la Promoción (separado de la caja del día).
                                </p>
                            </div>

                            {/* Notas opcionales */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Observaciones / Notas (Opcional):
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Entregado con bolsa de regalo..."
                                    value={notas}
                                    onChange={e => setNotas(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Botón de Confirmación */}
                        <div className="pt-4 mt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleRegistrarCanje}
                                disabled={isSubmitting || !selectedPremioId || stockSucursalPremio <= 0}
                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                                    !selectedPremioId || stockSucursalPremio <= 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>{isSubmitting ? 'Procesando canje...' : 'Confirmar & Registrar Canje'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Panel Derecho: Cartilla Visual de Sellos del Cliente */}
                    <div className="lg:col-span-7">
                        <CartillaProgresoCard data={clienteData} />
                    </div>
                </div>
            )}
        </div>
    );
};
