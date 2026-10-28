import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getCuentasCredito, getDeudasPorCuenta, getTransaccionesCuenta, 
    registrarAbonosMultiple, anularAbono, getCreditosResumen, 
    verificarClienteSimilar, crearCuentaCredito, getClientes 
} from '../api/api';
import { 
    Loader2, Search, Wallet, User as UserIcon, PlusCircle, X, 
    History, FileText, ChevronRight, CheckCircle2, Printer, Trash2, 
    AlertTriangle, DollarSign, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../components/Pagination';
import { toast } from 'sonner';
import { useConfirm } from '../components/ConfirmModal';
import { useDebounceValue } from 'usehooks-ts';

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const isoStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    return new Date(isoStr).toLocaleString();
};

const formatOnlyDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const isoStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    return new Date(isoStr).toLocaleDateString();
};

interface CuentaCredito {
    id: string;
    cliente_id: string;
    cliente_nombre: string;
    cliente_nit: string;
    cliente_telefono?: string;
    saldo_total: number;
    limite_credito?: number;
    estado_cuenta: 'AL_DIA' | 'MOROSO';
    created_at: string;
}

interface SimilarCandidate {
    cliente_id: string;
    nombre: string;
    nit_ci?: string;
    telefono?: string;
    score_similitud: number;
    tiene_cuenta_credito: boolean;
    saldo_pendiente: number;
}

export default function CreditosPage() {
    const confirm = useConfirm();
    const qc = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState<'' | 'AL_DIA' | 'MOROSO'>('');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Side panel state
    const [selectedCuenta, setSelectedCuenta] = useState<CuentaCredito | null>(null);
    const [activeTab, setActiveTab] = useState<'DEUDAS' | 'HISTORIAL'>('DEUDAS');

    // Modal Crear Cuenta
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [modoCreacion, setModoCreacion] = useState<'EXISTENTE' | 'NUEVO'>('NUEVO');
    const [selectedExistingClient, setSelectedExistingClient] = useState<any>(null);
    const [clientSearchQuery, setClientSearchQuery] = useState('');
    const [debouncedClientSearch] = useDebounceValue(clientSearchQuery, 300);

    // Formulario de nuevo cliente
    const [newClientForm, setNewClientForm] = useState({
        nombre: '',
        nit_ci: '',
        telefono: '',
        limite_credito: ''
    });
    const [debouncedNewName] = useDebounceValue(newClientForm.nombre, 400);

    // Candidatos similares detectados
    const [similarCandidates, setSimilarCandidates] = useState<SimilarCandidate[]>([]);
    const [ignoredSimilar, setIgnoredSimilar] = useState(false);

    // KPIs Resumen de Cartera
    const { data: resumen, isLoading: loadingResumen } = useQuery({
        queryKey: ['creditos-resumen'],
        queryFn: getCreditosResumen,
        refetchInterval: 30000 // Refresca cada 30 segundos
    });

    // Cuentas Paginadas
    const { data: rawCreditosRes, isLoading } = useQuery({
        queryKey: ['cuentas-credito', page, searchTerm, filterEstado],
        queryFn: () => getCuentasCredito(searchTerm || undefined, filterEstado || undefined, page, limit)
    });
    const creditosRes: any = rawCreditosRes;
    const cuentas: CuentaCredito[] = creditosRes?.items || [];

    // Búsqueda de clientes existentes
    const { data: existingClients = [], isLoading: searchingClients } = useQuery({
        queryKey: ['buscar-clientes-credito', debouncedClientSearch],
        queryFn: () => getClientes(debouncedClientSearch),
        enabled: isCreateModalOpen && modoCreacion === 'EXISTENTE' && debouncedClientSearch.length > 1
    });

    // Detección automática en tiempo real de clientes similares
    useQuery({
        queryKey: ['verificar-similar', debouncedNewName, newClientForm.nit_ci, newClientForm.telefono],
        queryFn: async () => {
            if (!debouncedNewName || debouncedNewName.trim().length < 3) {
                setSimilarCandidates([]);
                return [];
            }
            try {
                const res = await verificarClienteSimilar({
                    nombre: debouncedNewName,
                    nit_ci: newClientForm.nit_ci || undefined,
                    telefono: newClientForm.telefono || undefined
                });
                setSimilarCandidates(res);
                return res;
            } catch {
                return [];
            }
        },
        enabled: isCreateModalOpen && modoCreacion === 'NUEVO' && debouncedNewName.trim().length >= 3
    });

    // Drawer Queries
    const { data: rawDeudas = [], isLoading: loadingDeudas } = useQuery({
        queryKey: ['deudas', selectedCuenta?.id],
        queryFn: () => getDeudasPorCuenta(selectedCuenta?.id as string),
        enabled: !!selectedCuenta
    });
    const deudas: any[] = rawDeudas as any[];

    const { data: rawTransacciones = [], isLoading: loadingHistorial } = useQuery({
        queryKey: ['transacciones', selectedCuenta?.id],
        queryFn: () => getTransaccionesCuenta(selectedCuenta?.id as string),
        enabled: !!selectedCuenta && activeTab === 'HISTORIAL'
    });
    const transacciones: any[] = rawTransacciones as any[];

    // Abono UI State
    const [abonoDrawer, setAbonoDrawer] = useState<{ isOpen: boolean, cuenta: any, deudaId?: string }>({ isOpen: false, cuenta: null });
    const [pagosIn, setPagosIn] = useState<Array<{ metodo: 'EFECTIVO' | 'QR' | 'TARJETA' | 'TRANSFERENCIA', monto: string, qrRef?: string }>>([
        { metodo: 'EFECTIVO', monto: '' }
    ]);

    // Mutación Crear Cuenta de Crédito
    const createCuentaMut = useMutation({
        mutationFn: (data: any) => crearCuentaCredito(data),
        onSuccess: (res) => {
            toast.success(res.message || "Cuenta de crédito procesada exitosamente");
            qc.invalidateQueries({ queryKey: ['cuentas-credito'] });
            qc.invalidateQueries({ queryKey: ['creditos-resumen'] });
            setIsCreateModalOpen(false);
            setNewClientForm({ nombre: '', nit_ci: '', telefono: '', limite_credito: '' });
            setSelectedExistingClient(null);
            setSimilarCandidates([]);
            setIgnoredSimilar(false);
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            if (detail?.code === 'CLIENTE_SIMILAR_DETECTADO') {
                setSimilarCandidates(detail.candidatos || []);
                toast.warning("Se detectaron clientes similares. Revisa la advertencia.");
            } else {
                toast.error(err.message || "Error al crear la cuenta de crédito");
            }
        }
    });

    const abonoMut = useMutation({
        mutationFn: (data: any) => registrarAbonosMultiple(abonoDrawer.cuenta.id, data),
        onSuccess: (res: any) => {
            qc.invalidateQueries({ queryKey: ['cuentas-credito'] });
            qc.invalidateQueries({ queryKey: ['creditos-resumen'] });
            qc.invalidateQueries({ queryKey: ['deudas', selectedCuenta?.id] });
            qc.invalidateQueries({ queryKey: ['transacciones', selectedCuenta?.id] });
            setAbonoDrawer({ isOpen: false, cuenta: null });
            if (selectedCuenta) {
                setSelectedCuenta({ ...selectedCuenta, saldo_total: res.nuevo_saldo });
            }
            toast.success("Abono registrado con éxito.");
        },
        onError: (err: any) => toast.error(err.message || 'Error al registrar el abono.')
    });

    const anularMut = useMutation({
        mutationFn: ({ transaccionId, motivo }: { transaccionId: string, motivo: string }) => 
            anularAbono(selectedCuenta!.id, transaccionId, motivo),
        onSuccess: (res: any) => {
            qc.invalidateQueries({ queryKey: ['cuentas-credito'] });
            qc.invalidateQueries({ queryKey: ['creditos-resumen'] });
            qc.invalidateQueries({ queryKey: ['deudas', selectedCuenta?.id] });
            qc.invalidateQueries({ queryKey: ['transacciones', selectedCuenta?.id] });
            if (selectedCuenta) {
                setSelectedCuenta({ ...selectedCuenta, saldo_total: res.nuevo_saldo });
            }
            toast.success("Abono anulado correctamente.");
        },
        onError: (err: any) => toast.error(err.message || 'Error al anular el abono.')
    });

    const handleAnularAbono = async (t: any) => {
        if (t.anulada) return;
        const motivo = window.prompt("Escriba el motivo de la anulación (Ej. Cobro duplicado, error de monto):");
        if (!motivo) return;
        if (await confirm({
            title: '¿Anular abono?',
            message: '¿Está seguro de anular este abono? El dinero se restará de caja y la deuda retornará.',
            type: 'danger',
            confirmLabel: 'Anular',
            cancelLabel: 'Cancelar'
        })) {
            anularMut.mutate({ transaccionId: t.id, motivo });
        }
    };

    const handleCreateSubmit = (forzarCreacion = false) => {
        if (modoCreacion === 'EXISTENTE') {
            if (!selectedExistingClient) {
                toast.error("Selecciona un cliente de la lista");
                return;
            }
            createCuentaMut.mutate({
                cliente_id: selectedExistingClient._id,
                limite_credito: newClientForm.limite_credito ? parseFloat(newClientForm.limite_credito) : undefined
            });
        } else {
            if (!newClientForm.nombre.trim()) {
                toast.error("El nombre del deudor es obligatorio");
                return;
            }
            if (similarCandidates.length > 0 && !ignoredSimilar && !forzarCreacion) {
                toast.warning("Por favor revisa la advertencia de clientes similares antes de continuar.");
                return;
            }
            createCuentaMut.mutate({
                nombre: newClientForm.nombre.trim(),
                nit_ci: newClientForm.nit_ci.trim() || undefined,
                telefono: newClientForm.telefono.trim() || undefined,
                limite_credito: newClientForm.limite_credito ? parseFloat(newClientForm.limite_credito) : undefined,
                confirmar_similar: forzarCreacion || ignoredSimilar
            });
        }
    };

    const handleSelectSimilar = (candidate: SimilarCandidate) => {
        setModoCreacion('EXISTENTE');
        setSelectedExistingClient({
            _id: candidate.cliente_id,
            nombre: candidate.nombre,
            nit_ci: candidate.nit_ci,
            telefono: candidate.telefono
        });
        setSimilarCandidates([]);
        toast.info(`Seleccionado cliente existente: "${candidate.nombre}". Se vinculará a su cuenta.`);
    };

    // Imprimir extracto oficial de cuenta en PDF / ventana de impresión
    const printEstadoCuentaOficial = () => {
        if (!selectedCuenta) return;
        const printWindow = document.createElement('iframe');
        printWindow.style.position = 'absolute';
        printWindow.style.top = '-1000px';
        document.body.appendChild(printWindow);
        const doc = printWindow.contentWindow?.document;
        if (doc) {
            doc.write(`
                <html>
                <head>
                    <title>Estado de Cuenta - ${selectedCuenta.cliente_nombre}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; margin: 20px; color: #111; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 15px; }
                        .title { font-size: 18px; font-weight: 900; color: #1e1b4b; }
                        .subtitle { font-size: 11px; color: #6b7280; margin-top: 3px; }
                        .client-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                        .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-weight: bold; font-size: 10px; }
                        .badge-moroso { background: #fee2e2; color: #b91c1c; }
                        .badge-aldia { background: #dcfce7; color: #15803d; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th { background: #f3f4f6; color: #374151; font-weight: bold; text-align: left; padding: 8px 10px; font-size: 10px; border-bottom: 1px solid #d1d5db; text-transform: uppercase; }
                        td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
                        .text-right { text-align: right; }
                        .total-box { margin-left: auto; width: 280px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px; }
                        .footer { margin-top: 30px; border-top: 1px dashed #d1d5db; padding-top: 10px; text-align: center; font-size: 10px; color: #9ca3af; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="title">EXTRACTO OFICIAL DE CRÉDITO</div>
                            <div class="subtitle">Pegasus SalesSystem • Estado de Cuenta al ${new Date().toLocaleDateString()}</div>
                        </div>
                        <div style="text-align: right;">
                            <span class="badge ${selectedCuenta.estado_cuenta === 'MOROSO' ? 'badge-moroso' : 'badge-aldia'}">
                                ${selectedCuenta.estado_cuenta === 'MOROSO' ? 'ESTADO: MOROSO' : 'ESTADO: AL DÍA'}
                            </span>
                        </div>
                    </div>

                    <div class="client-card">
                        <div class="grid">
                            <div><strong>Cliente / Razón Social:</strong> ${selectedCuenta.cliente_nombre}</div>
                            <div><strong>NIT / CI:</strong> ${selectedCuenta.cliente_nit || 'Sin Registrar'}</div>
                            <div><strong>Teléfono:</strong> ${selectedCuenta.cliente_telefono || 'Sin Registrar'}</div>
                            <div><strong>Fecha de Apertura:</strong> ${formatOnlyDate(selectedCuenta.created_at)}</div>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 8px; text-transform: uppercase; color: #374151;">Deudas Pendientes y Vigentes</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Ticket / Venta</th>
                                <th>Fecha Emisión</th>
                                <th>Productos / Detalle</th>
                                <th class="text-right">Monto Original</th>
                                <th class="text-right">Saldo Pendiente</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deudas.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding:15px; color:#9ca3af;">No existen deudas registradas</td></tr>' : deudas.map(d => `
                                <tr>
                                    <td><strong>#${d.sale_id_corto}</strong></td>
                                    <td>${formatOnlyDate(d.fecha_emision)}</td>
                                    <td>${d.resumen_items || 'Venta de productos'}</td>
                                    <td class="text-right">Bs. ${d.monto_original.toFixed(2)}</td>
                                    <td class="text-right" style="font-weight:bold; color:#dc2626;">Bs. ${d.saldo_pendiente.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="total-box">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Límite de Crédito:</span>
                            <strong>${selectedCuenta.limite_credito ? 'Bs. ' + selectedCuenta.limite_credito.toFixed(2) : 'Sin Límite'}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold; color:#7e22ce;">
                            <span>TOTAL POR COBRAR:</span>
                            <span>Bs. ${selectedCuenta.saldo_total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        Este documento es un extracto informativo de cuenta corriente de clientes emitido por Pegasus SalesSystem.<br/>
                        Consulte cualquier duda con administración de sucursal.
                    </div>
                </body>
                </html>
            `);
            doc.close();
            setTimeout(() => {
                printWindow.contentWindow?.focus();
                printWindow.contentWindow?.print();
                setTimeout(() => document.body.removeChild(printWindow), 1500);
            }, 600);
        }
    };

    const printAbonoTicket = (t: any) => {
        if (!selectedCuenta) return;
        const printWindow = document.createElement('iframe');
        printWindow.style.position = 'absolute';
        printWindow.style.top = '-1000px';
        document.body.appendChild(printWindow);
        const doc = printWindow.contentWindow?.document;
        if (doc) {
            doc.write(`
                <html>
                <head>
                    <style>
                        body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 300px; color: #000; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: bold; }
                        .title { font-size: 16px; margin-bottom: 5px; }
                        .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        td { padding: 3px 0; }
                        .right { text-align: right; }
                        .text-xs { font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="text-center font-bold title">COMPROBANTE DE PAGO</div>
                    <div class="text-center text-xs">Pago a Crédito / Abono de Cuenta</div>
                    <div class="divider"></div>
                    <table>
                        <tr><td>Fecha:</td><td class="right">${formatDate(t.created_at)}</td></tr>
                        <tr><td>Cliente:</td><td class="right font-bold">${selectedCuenta.cliente_nombre.substring(0,25)}</td></tr>
                        <tr><td>Transacción:</td><td class="right text-xs">#${t.id.substring(t.id.length - 8).toUpperCase()}</td></tr>
                    </table>
                    <div class="divider"></div>
                    <table style="margin-bottom: 10px;">
                        ${(t.pagos || []).map((p: any) => `<tr><td>${p.metodo}</td><td class="right">Bs. ${p.monto.toFixed(2)}</td></tr>`).join('')}
                    </table>
                    <div class="divider"></div>
                    <table>
                        <tr><td class="font-bold">TOTAL ABONADO:</td><td class="right font-bold" style="font-size: 14px;">Bs. ${t.monto.toFixed(2)}</td></tr>
                        <tr><td class="text-xs">SALDO RESTANTE CUENTA:</td><td class="right text-xs">Bs. ${selectedCuenta.saldo_total.toFixed(2)}</td></tr>
                    </table>
                    <div class="divider"></div>
                    <div class="text-center text-xs" style="margin-top:20px;">
                        Verifique su comprobante.<br/>Gracias por su preferencia.
                    </div>
                </body>
                </html>
            `);
            doc.close();
            setTimeout(() => {
                printWindow.contentWindow?.focus();
                printWindow.contentWindow?.print();
                setTimeout(() => document.body.removeChild(printWindow), 1000);
            }, 500);
        }
    };

    const getTotalAbono = () => pagosIn.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);

    const handleAbonoSubmit = () => {
        const total = getTotalAbono();
        if (total <= 0) {
            toast.warning("Ingrese un monto válido");
            return;
        }
        
        const payloadPagos = pagosIn.filter(p => parseFloat(p.monto) > 0).map(p => ({
            metodo: p.metodo,
            monto: parseFloat(p.monto),
            referencia: p.qrRef || undefined
        }));

        abonoMut.mutate({
            pagos: payloadPagos,
            deuda_id: abonoDrawer.deudaId
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-20 relative overflow-hidden">
            {/* Header Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                        <Wallet className="text-indigo-600" />
                        Gestión de Créditos y Cuentas por Cobrar
                    </h1>
                    <p className="text-gray-500 mt-1 text-xs">
                        Control integral de líneas de crédito, detección de duplicados y amortización en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsCreateModalOpen(true);
                            setModoCreacion('NUEVO');
                            setSimilarCandidates([]);
                            setIgnoredSimilar(false);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <PlusCircle size={16} />
                        Nueva Cuenta de Crédito
                    </button>
                </div>
            </div>

            {/* Tarjetas KPIs Ejecutivas de Cartera */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Cartera por Cobrar */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Cartera por Cobrar</span>
                        <div className="text-xl font-black font-mono text-rose-600">
                            {loadingResumen ? <Loader2 size={16} className="animate-spin inline" /> : `Bs. ${(resumen?.total_cartera_por_cobrar || 0).toFixed(2)}`}
                        </div>
                    </div>
                </div>

                {/* Total Cuentas Morosas */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Cuentas con Deuda</span>
                        <div className="text-xl font-black font-mono text-gray-900">
                            {loadingResumen ? <Loader2 size={16} className="animate-spin inline" /> : (resumen?.total_cuentas_morosas || 0)}
                        </div>
                    </div>
                </div>

                {/* Cuentas al Día */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Cuentas al Día (Saldo 0)</span>
                        <div className="text-xl font-black font-mono text-emerald-600">
                            {loadingResumen ? <Loader2 size={16} className="animate-spin inline" /> : (resumen?.total_cuentas_al_dia || 0)}
                        </div>
                    </div>
                </div>

                {/* Recaudación Hoy */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Recaudado Hoy</span>
                        <div className="text-xl font-black font-mono text-indigo-600">
                            {loadingResumen ? <Loader2 size={16} className="animate-spin inline" /> : `Bs. ${(resumen?.total_abonado_hoy || 0).toFixed(2)}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros y Buscador */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setFilterEstado(''); setPage(1); }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterEstado === '' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Todas las Cuentas
                    </button>
                    <button 
                        onClick={() => { setFilterEstado('MOROSO'); setPage(1); }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterEstado === 'MOROSO' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Con Saldo Pendiente
                    </button>
                    <button 
                        onClick={() => { setFilterEstado('AL_DIA'); setPage(1); }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterEstado === 'AL_DIA' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Al Día (Bs. 0.00)
                    </button>
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por Nombre, Teléfono o NIT..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl outline-none text-xs font-medium shadow-2xs"
                    />
                </div>
            </div>

            {/* Listado de Cuentas */}
            {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
            ) : cuentas.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xs">
                    <Wallet size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-700 font-bold text-sm">No se encontraron cuentas de crédito.</p>
                    <p className="text-xs text-gray-400 mt-1">Usa el botón de arriba para abrir la primera cuenta de crédito.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cuentas.map((cuenta: CuentaCredito) => (
                            <motion.div 
                                whileHover={{ scale: 1.01 }}
                                key={cuenta.id} 
                                onClick={() => setSelectedCuenta(cuenta)}
                                className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                                    <div className={`absolute top-4 -right-8 transform rotate-45 text-[9px] font-black tracking-widest py-1 px-10 text-white uppercase shadow-xs ${cuenta.saldo_total > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                        {cuenta.saldo_total > 0 ? 'CON DEUDA' : 'AL DÍA'}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <UserIcon size={20} />
                                    </div>
                                    <div className="pr-8">
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{cuenta.cliente_nombre || 'Desconocido'}</h3>
                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                            CI/NIT: {cuenta.cliente_nit || 'S/N'} {cuenta.cliente_telefono ? `• Tel: ${cuenta.cliente_telefono}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Deuda Pendiente</span>
                                            {cuenta.limite_credito ? (
                                                <span className="text-[10px] text-indigo-600 font-semibold">Límite: Bs. {cuenta.limite_credito.toFixed(2)}</span>
                                            ) : null}
                                        </div>
                                        <span className={`text-lg font-black font-mono ${cuenta.saldo_total > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            Bs. {cuenta.saldo_total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs font-bold text-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <span>Ver extracto y liquidar</span>
                                    <ChevronRight size={16} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {creditosRes && (
                        <div className="mt-6 flex justify-center">
                            <Pagination 
                                currentPage={page}
                                totalPages={creditosRes.pages}
                                onPageChange={setPage}
                                totalItems={creditosRes.total}
                                itemsPerPage={limit}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Modal: Apertura de Cuenta y Detección de Similares */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <PlusCircle size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Aperturar Cuenta de Crédito</h2>
                                    <p className="text-xs text-gray-500">Habilita una línea de crédito con detección de duplicados</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs: Cliente Nuevo vs Existente */}
                        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
                            <button
                                onClick={() => { setModoCreacion('NUEVO'); setSelectedExistingClient(null); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${modoCreacion === 'NUEVO' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Registrar Nuevo Cliente
                            </button>
                            <button
                                onClick={() => { setModoCreacion('EXISTENTE'); setSimilarCandidates([]); }}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${modoCreacion === 'EXISTENTE' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Seleccionar Cliente Existente
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-gray-800">
                            {modoCreacion === 'EXISTENTE' ? (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                        Buscar Cliente en Base de Datos
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Escribe nombre o NIT del cliente..." 
                                        value={clientSearchQuery} 
                                        onChange={e => setClientSearchQuery(e.target.value)} 
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />

                                    {searchingClients && (
                                        <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                                            <Loader2 size={14} className="animate-spin" /> Buscando...
                                        </div>
                                    )}

                                    {existingClients.length > 0 && (
                                        <ul className="mt-2 max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
                                            {existingClients.map((cli: any) => (
                                                <li 
                                                    key={cli._id} 
                                                    onClick={() => setSelectedExistingClient(cli)} 
                                                    className={`p-3 text-xs cursor-pointer transition-colors flex justify-between items-center ${selectedExistingClient?._id === cli._id ? 'bg-indigo-50 border-l-4 border-indigo-600 font-bold' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div>
                                                        <span className="text-gray-900 block">{cli.nombre}</span>
                                                        <span className="text-gray-400 text-[10px]">CI/NIT: {cli.nit_ci || 'S/N'} {cli.telefono ? `• Tel: ${cli.telefono}` : ''}</span>
                                                    </div>
                                                    {selectedExistingClient?._id === cli._id && (
                                                        <CheckCircle2 size={16} className="text-indigo-600" />
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {selectedExistingClient && (
                                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                                            Cliente seleccionado: <strong>{selectedExistingClient.nombre}</strong>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                            Nombre Completo o Razón Social <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Juan Carlos Pérez Gómez" 
                                            value={newClientForm.nombre} 
                                            onChange={e => { setNewClientForm({ ...newClientForm, nombre: e.target.value }); setIgnoredSimilar(false); }} 
                                            className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                                C.I. / NIT
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder="Ej: 4589123" 
                                                value={newClientForm.nit_ci} 
                                                onChange={e => setNewClientForm({ ...newClientForm, nit_ci: e.target.value })} 
                                                className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                                Celular / WhatsApp
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder="Ej: 71234567" 
                                                value={newClientForm.telefono} 
                                                onChange={e => setNewClientForm({ ...newClientForm, telefono: e.target.value })} 
                                                className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* ALERTA DE CLIENTES SIMILARES ENCONTRADOS */}
                                    {similarCandidates.length > 0 && (
                                        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-xs space-y-2.5 animate-in fade-in duration-200">
                                            <div className="flex items-start gap-2 text-amber-900 font-bold">
                                                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                                <span>¡Atención! Se detectaron deudores o clientes similares registrados:</span>
                                            </div>
                                            <p className="text-gray-600 text-[11px]">
                                                Verifica si se trata de la misma persona para no dividir su deuda en cuentas separadas:
                                            </p>
                                            <div className="divide-y divide-amber-200 bg-white/80 rounded-lg p-2 border border-amber-200">
                                                {similarCandidates.map(cand => (
                                                    <div key={cand.cliente_id} className="py-2 flex justify-between items-center text-xs">
                                                        <div>
                                                            <strong className="text-gray-900 block">{cand.nombre}</strong>
                                                            <span className="text-[10px] text-gray-500">
                                                                CI: {cand.nit_ci || 'S/N'} • Coincidencia: <strong>{(cand.score_similitud * 100).toFixed(0)}%</strong>
                                                            </span>
                                                            {cand.saldo_pendiente > 0 && (
                                                                <span className="text-[10px] text-rose-600 font-bold block">
                                                                    Deuda actual: Bs. {cand.saldo_pendiente.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={() => handleSelectSimilar(cand)}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                                                        >
                                                            Usar este cliente
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={ignoredSimilar} 
                                                    onChange={e => setIgnoredSimilar(e.target.checked)} 
                                                    className="w-3.5 h-3.5 text-amber-600 rounded"
                                                />
                                                <span className="text-[11px] font-semibold text-gray-700">
                                                    He verificado y confirmo que es una persona diferente.
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Límite de Crédito Opcional */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Límite de Crédito Permitido (Opcional)
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="Ej: 500.00 (Dejar vacío para crédito sin tope)" 
                                        value={newClientForm.limite_credito} 
                                        onChange={e => setNewClientForm({ ...newClientForm, limite_credito: e.target.value })} 
                                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsCreateModalOpen(false)} 
                                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => handleCreateSubmit(false)} 
                                disabled={createCuentaMut.isPending} 
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {createCuentaMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                                <span>{createCuentaMut.isPending ? 'Guardando...' : 'Aperturar Cuenta'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Details Drawer overlay */}
            <AnimatePresence>
                {selectedCuenta && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setSelectedCuenta(null); setAbonoDrawer({ isOpen: false, cuenta: null }); }}
                            className="fixed inset-0 z-60 bg-gray-900/40 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-70 flex flex-col"
                        >
                            <div className="p-5 border-b border-gray-100 bg-gray-50/70">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3 items-center">
                                        <div className="h-12 w-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                                            <UserIcon size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedCuenta.cliente_nombre}</h2>
                                            <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                                                NIT: {selectedCuenta.cliente_nit || 'S/N'} {selectedCuenta.cliente_telefono ? `| Tel: ${selectedCuenta.cliente_telefono}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCuenta(null)} className="p-1.5 hover:bg-gray-200/60 rounded-xl text-gray-400 transition-colors cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                                <div className="mt-4 flex flex-wrap gap-2.5">
                                    <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex justify-between items-center">
                                        <div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Saldo Total</span>
                                            <span className={`text-base font-black font-mono ${selectedCuenta.saldo_total > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                Bs. {selectedCuenta.saldo_total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={printEstadoCuentaOficial}
                                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        title="Imprimir extracto oficial de cuenta"
                                    >
                                        <Printer size={15} /> Imprimir Extracto
                                    </button>

                                    <button 
                                        onClick={() => { setPagosIn([{ metodo: 'EFECTIVO', monto: '' }]); setAbonoDrawer({ isOpen: true, cuenta: selectedCuenta }); }}
                                        disabled={selectedCuenta.saldo_total <= 0}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs text-xs cursor-pointer"
                                    >
                                        <PlusCircle size={15} /> Abonar General
                                    </button>
                                </div>
                            </div>

                            <div className="flex border-b border-gray-200 bg-white px-6 gap-6">
                                <button 
                                    onClick={() => setActiveTab('DEUDAS')}
                                    className={`py-3.5 font-bold text-xs tracking-wide border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'DEUDAS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                                >
                                    <FileText size={15} /> Estado de Deudas ({deudas.length})
                                </button>
                                <button 
                                    onClick={() => setActiveTab('HISTORIAL')}
                                    className={`py-3.5 font-bold text-xs tracking-wide border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'HISTORIAL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                                >
                                    <History size={15} /> Historial de Abonos
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50/40">
                                {activeTab === 'DEUDAS' ? (
                                    <div className="space-y-3">
                                        {loadingDeudas ? (
                                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
                                        ) : deudas.length === 0 ? (
                                            <p className="text-center py-12 text-gray-400 text-xs italic">No hay deudas pendientes en esta cuenta.</p>
                                        ) : (
                                            deudas.map((d: any) => (
                                                <div key={d.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-2xs hover:border-indigo-100 transition-colors">
                                                    <div>
                                                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                                                            Ticket #{d.sale_id_corto}
                                                        </span>
                                                        <h4 className="font-bold text-gray-900 text-xs mt-1">Saldo: Bs. {d.saldo_pendiente.toFixed(2)}</h4>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(d.fecha_emision)} • {d.resumen_items}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => { 
                                                            setPagosIn([{ metodo: 'EFECTIVO', monto: d.saldo_pendiente.toString() }]); 
                                                            setAbonoDrawer({ isOpen: true, cuenta: selectedCuenta, deudaId: d.id }); 
                                                        }}
                                                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                                                    >
                                                        Liquidar
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {loadingHistorial ? (
                                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" /></div>
                                        ) : transacciones.length === 0 ? (
                                            <p className="text-center py-12 text-gray-400 text-xs italic">No hay movimientos registrados.</p>
                                        ) : (
                                            transacciones.map((h: any) => (
                                                <div key={h.id} className={`bg-white border rounded-2xl p-4 flex justify-between items-center shadow-2xs ${h.anulada ? 'border-rose-100 opacity-60' : 'border-gray-200'}`}>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${h.anulada ? 'bg-rose-100 text-rose-600' : h.tipo === 'ABONO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                {h.anulada ? 'ANULADO' : h.tipo}
                                                            </span>
                                                            {h.tipo === 'ABONO' && !h.anulada && (
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => printAbonoTicket(h)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Imprimir Ticket">
                                                                        <Printer size={13} />
                                                                    </button>
                                                                    <button onClick={() => handleAnularAbono(h)} disabled={anularMut.isPending} className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Anular Abono">
                                                                        {anularMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(h.created_at)} por <strong>{h.cajero_nombre}</strong></p>
                                                        {h.notas && <p className="text-[11px] text-gray-600 mt-0.5 italic">"{h.notas}"</p>}
                                                        {h.anulada && <p className="text-[9px] text-rose-500 font-bold mt-0.5">Anulado por: {h.anulada_por || 'Sistema'}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`font-black text-xs ${h.anulada ? 'text-gray-400 line-through' : h.tipo === 'ABONO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {h.tipo === 'ABONO' ? '-' : '+'} Bs. {h.monto.toFixed(2)}
                                                        </span>
                                                        {h.pagos && h.pagos.length > 0 && !h.anulada && (
                                                            <div className="mt-1 flex flex-col items-end gap-0.5">
                                                                {h.pagos.map((p: any, idx: number) => (
                                                                    <span key={idx} className="text-[8px] font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                                        {p.metodo}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Abono Multiple Drawer */}
            <AnimatePresence>
                {abonoDrawer.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-80 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-black text-gray-900 tracking-tight">Registrar Pago / Abono</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{abonoDrawer.cuenta.cliente_nombre}</p>
                                </div>
                                <button onClick={() => setAbonoDrawer({ isOpen: false, cuenta: null })} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition-colors cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                                {pagosIn.map((pago, index) => (
                                    <div key={index} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5 relative group">
                                        {pagosIn.length > 1 && (
                                            <button 
                                                onClick={() => setPagosIn(pagosIn.filter((_, i) => i !== index))}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-rose-200 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-xs cursor-pointer"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Método</label>
                                                <select 
                                                    value={pago.metodo}
                                                    onChange={e => {
                                                        const newP = [...pagosIn];
                                                        newP[index].metodo = e.target.value as any;
                                                        setPagosIn(newP);
                                                    }}
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:border-indigo-500 outline-none h-[36px]"
                                                >
                                                    <option value="EFECTIVO">EFECTIVO</option>
                                                    <option value="QR">QR / PAGOS NET</option>
                                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                                    <option value="TARJETA">TARJETA POS</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Monto (Bs.)</label>
                                                <input 
                                                    type="number" step="0.1" min="0" placeholder="0.00"
                                                    value={pago.monto}
                                                    onChange={e => {
                                                        const newP = [...pagosIn];
                                                        newP[index].monto = e.target.value;
                                                        setPagosIn(newP);
                                                    }}
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono focus:border-indigo-500 outline-none h-[36px]"
                                                />
                                            </div>
                                        </div>
                                        {(pago.metodo === 'QR' || pago.metodo === 'TRANSFERENCIA') && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Referencia Bancaria</label>
                                                <input 
                                                    type="text" placeholder="Ej: BCP 123456..."
                                                    value={pago.qrRef || ''}
                                                    onChange={e => {
                                                        const newP = [...pagosIn];
                                                        newP[index].qrRef = e.target.value;
                                                        setPagosIn(newP);
                                                    }}
                                                    className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button 
                                    onClick={() => setPagosIn([...pagosIn, { metodo: 'QR', monto: '' }])}
                                    className="w-full py-2.5 border-2 border-dashed border-indigo-100 rounded-xl text-indigo-500 text-xs font-bold hover:bg-indigo-50/70 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <PlusCircle size={14} /> Añadir Pago Combinado
                                </button>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-3 text-xs">
                                    <div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Abono</span>
                                        <span className={`text-base font-black font-mono ${getTotalAbono() > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                                            Bs. {getTotalAbono().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase block">Saldo Restante</span>
                                        <span className="text-xs font-bold text-rose-500 font-mono">
                                            Bs. {Math.max(0, abonoDrawer.cuenta.saldo_total - getTotalAbono()).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setAbonoDrawer({ isOpen: false, cuenta: null })} className="flex-1 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                                        Descartar
                                    </button>
                                    <button 
                                        onClick={handleAbonoSubmit}
                                        disabled={abonoMut.isPending || getTotalAbono() <= 0 || getTotalAbono() > (abonoDrawer.cuenta?.saldo_total + 1)}
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        {abonoMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Confirmar Pago
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
