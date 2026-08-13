import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseReceptions, getProveedores } from '../api/api';
import { useAuthStore } from '../store/authStore';
import { 
    PackageCheck, PackageOpen, Loader2, Printer
} from 'lucide-react';
import ComprobanteCompraModal from '../components/inventario/ComprobanteCompraModal';

export default function RecepcionesCompraPage() {
    const { user } = useAuthStore();
    const sucursalId = user?.sucursal_id || 'CENTRAL';

    // Filters for table
    const [providerFilter, setProviderFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    
    // Printable Voucher Modal
    const [selectedReception, setSelectedReception] = useState<any>(null);

    const { data: receptions = [], isLoading } = useQuery({
        queryKey: ['purchase_receptions', sucursalId],
        queryFn: () => getPurchaseReceptions(sucursalId),
        enabled: !!sucursalId
    });

    const { data: proveedores = [] } = useQuery({
        queryKey: ['proveedores'],
        queryFn: () => getProveedores()
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAGADO': return 'bg-emerald-100 text-emerald-700';
            case 'PENDIENTE': return 'bg-orange-100 text-orange-700';
            case 'VENCIDO': return 'bg-red-100 text-red-700';
            case 'PARCIAL': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <PackageCheck className="w-8 h-8 text-black" />
                        Historial de Ingresos
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Revisa las recepciones de mercadería pasadas</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <select
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                >
                    <option value="">Todos los Proveedores</option>
                    {proveedores.map((p: any) => (
                        <option key={p._id || p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                </select>

                <select
                    className="p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black font-medium text-gray-900"
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                >
                    <option value="">Todos los Métodos de Pago</option>
                    <option value="CONTADO_EFECTIVO">Al Contado (Efectivo/Caja)</option>
                    <option value="CONTADO_QR">Al Contado (QR)</option>
                    <option value="CONTADO_BANCO">Al Contado (Banco)</option>
                    <option value="CREDITO">A Crédito (Cuenta por Pagar)</option>
                    <option value="CONSIGNACION">En Consignación</option>
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Fecha / Nro Doc</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Proveedor</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Método de Pago</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Total Real</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Estado de Pago</th>
                                    <th className="p-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {receptions
                                    .filter((r: any) => (providerFilter ? r.proveedor_nombre === providerFilter : true))
                                    .filter((r: any) => (methodFilter ? r.metodo_pago === methodFilter : true))
                                    .sort((a: any, b: any) => new Date(b.created_at || b.fecha_emision || 0).getTime() - new Date(a.created_at || a.fecha_emision || 0).getTime())
                                    .map((r: any) => (
                                    <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5">
                                            <p className="font-bold text-gray-900">{r.numero_documento}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(r.created_at || r.fecha_emision).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="p-5 font-medium text-gray-700">{r.proveedor_nombre}</td>
                                        <td className="p-5 font-medium text-gray-700">
                                            {r.metodo_pago?.replace('_', ' ')}
                                        </td>
                                        <td className="p-5 font-black text-gray-900">Bs. {r.total_real}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(r.estado_pago || 'PAGADO')}`}>
                                                {r.estado_pago || (['CREDITO', 'CONSIGNACION'].includes(r.metodo_pago) ? 'PENDIENTE' : 'PAGADO')}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => setSelectedReception(r)}
                                                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl transition-colors"
                                                title="Ver Comprobante"
                                            >
                                                <Printer size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {receptions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-500">
                                            <PackageOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="font-medium text-gray-900">No se encontraron ingresos registrados.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Comprobante */}
            {selectedReception && (
                <ComprobanteCompraModal 
                    reception={selectedReception} 
                    onClose={() => setSelectedReception(null)} 
                />
            )}
        </div>
    );
}
