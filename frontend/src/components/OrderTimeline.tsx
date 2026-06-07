import { CheckCircle2, Clock, Truck, Ban, CheckSquare } from 'lucide-react';
import { formatFullDate } from '../utils/dateUtils';
import type { PedidoInterno } from '../api/types';

export default function OrderTimeline({ pedido }: { pedido: PedidoInterno }) {
    const isCancelled = pedido.estado === 'CANCELADO';
    
    // Nodes mapping
    const steps = [
        { 
            key: 'CREADO', 
            label: 'Creado y Pendiente', 
            icon: Clock, 
            date: pedido.created_at,
            activeColor: 'bg-amber-100 text-amber-700 ring-amber-400',
            lineColor: 'bg-amber-400'
        },
        { 
            key: 'ACEPTADO', 
            label: 'Pedido Aceptado', 
            icon: CheckSquare, 
            date: pedido.aceptado_at,
            activeColor: 'bg-indigo-100 text-indigo-700 ring-indigo-400',
            lineColor: 'bg-indigo-400'
        },
        { 
            key: 'DESPACHADO', 
            label: 'En Camino (Despachado)', 
            icon: Truck, 
            date: pedido.despachado_at,
            activeColor: 'bg-blue-100 text-blue-700 ring-blue-400',
            lineColor: 'bg-blue-400'
        },
        { 
            key: 'RECIBIDO', 
            label: 'Entregado y Recibido', 
            icon: CheckCircle2, 
            date: pedido.recibido_at,
            activeColor: 'bg-green-100 text-green-700 ring-green-400',
            lineColor: 'bg-green-400'
        }
    ];

    if (isCancelled) {
        steps.push({
            key: 'CANCELADO',
            label: 'Pedido Cancelado',
            icon: Ban,
            date: pedido.cancelado_at || new Date().toISOString(),
            activeColor: 'bg-red-100 text-red-700 ring-red-400',
            lineColor: 'bg-red-400'
        });
    }

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mt-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Línea de Tiempo del Pedido</h4>
            <div className="relative pl-3 space-y-5">
                {steps.map((step, index) => {
                    const isCompleted = !!step.date;
                    // Dont show future uncompleted steps if cancelled
                    if (isCancelled && !isCompleted && step.key !== 'CANCELADO') return null;
                    
                    const showLine = index < steps.length - 1 && !(isCancelled && step.key === 'CANCELADO');
                    
                    return (
                        <div key={step.key} className="relative">
                            {/* Vertical line connecting nodes */}
                            {showLine && (
                                <div className={`absolute left-[15px] top-8 bottom-[-20px] w-0.5 ${isCompleted && steps[index+1]?.date ? step.lineColor : 'bg-gray-100'}`} />
                            )}
                            
                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white z-10 ${
                                    isCompleted ? step.activeColor : 'bg-gray-50 text-gray-300'
                                }`}>
                                    <step.icon size={14} />
                                </div>
                                <div className="pt-1.5 pb-2">
                                    <p className={`text-sm font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                    {isCompleted ? (
                                        <p className="text-[11px] text-gray-500 font-bold mt-0.5 tracking-wide">{formatFullDate(step.date!)}</p>
                                    ) : (
                                        <p className="text-[11px] text-gray-300 font-medium italic mt-0.5">Esperando confirmación...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
