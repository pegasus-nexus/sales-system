import { useState } from 'react';
import { ShieldAlert, Activity, Cpu, Wifi, CheckCircle2, AlertTriangle, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const mockLogs = [
    { id: 1, time: 'Hace 2 min', type: 'error', tenant: 'Supermercado A', message: 'Error 500 en GET /api/v1/sales' },
    { id: 2, time: 'Hace 5 min', type: 'info', tenant: 'La Bella Pizza', message: 'Cierre de caja exitoso (Bs. 5,420.50)' },
    { id: 3, time: 'Hace 12 min', type: 'warning', tenant: 'Ferretería El Tornillo', message: 'Rate limit excedido (429 Too Many Requests)' },
    { id: 4, time: 'Hace 28 min', type: 'info', tenant: 'Farmacia Salud', message: 'Nuevo usuario registrado (Cajero_02)' },
    { id: 5, time: 'Hace 1 hora', type: 'info', tenant: 'Sistema Matriz', message: 'Backup automático completado (1.2 GB)' },
];

export default function SystemHealthPage() {
    const { user } = useAuthStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    if (user?.role !== 'SUPERADMIN') return <div className="p-8 text-center text-red-500">Acceso Restringido</div>;

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-emerald-500" />
                        Salud del Sistema
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Monitoreo en tiempo real de infraestructura y actividad global.</p>
                </div>
                <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                    <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    Refrescar Datos
                </button>
            </div>

            {/* Server Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado de API</p>
                        <p className="text-xl font-black text-gray-900 flex items-center gap-2">
                            Online <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Cpu size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Uso de CPU (Backend)</p>
                        <p className="text-xl font-black text-gray-900">18.4%</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Wifi size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tráfico Promedio</p>
                        <p className="text-xl font-black text-gray-900">324 req/s</p>
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-black text-gray-900">Actividad Global Reciente</h3>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {mockLogs.map(log => (
                                <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors flex items-start gap-4">
                                    <div className="mt-1">
                                        {log.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                                        {log.type === 'warning' && <AlertTriangle className="text-amber-500" size={20} />}
                                        {log.type === 'info' && <CheckCircle2 className="text-blue-500" size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-gray-900">{log.tenant}</p>
                                            <span className="text-xs font-medium text-gray-400">{log.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 font-medium">{log.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rate Limits & Storage Warnings */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900">Alertas de Límites</h3>
                    
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-gray-700">Ferretería El Tornillo</span>
                                <span className="text-xs font-black text-amber-600">89% API Rate Limit</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">8,900 / 10,000 req por hora</p>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-gray-700">Supermercado A</span>
                                <span className="text-xs font-black text-red-600">95% Storage (MongoDB)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">4.75 GB / 5.00 GB permitidos</p>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-gray-700">Restaurante XYZ</span>
                                <span className="text-xs font-black text-emerald-600">12% Storage</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">0.6 GB / 5.00 GB permitidos</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
