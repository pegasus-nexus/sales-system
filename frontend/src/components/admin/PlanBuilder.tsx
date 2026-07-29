import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../api/api';
import { toast } from 'sonner';
import { Plus, Check, Loader2, Trash2, Calculator, Layers, Edit2, Save } from 'lucide-react';

const FEATURE_PRICES: Record<string, { label: string; price: number; type: 'core' | 'pro' | 'enterprise' }> = {
    'VENTAS': { label: 'Ventas y POS', price: 15, type: 'core' },
    'INVENTARIO': { label: 'Inventario Completo', price: 15, type: 'core' },
    'CAJA': { label: 'Caja Básica', price: 10, type: 'core' },
    'CLIENTES': { label: 'CRM Clientes', price: 10, type: 'core' },
    'CREDITOS': { label: 'Módulo Créditos', price: 15, type: 'core' },
    
    'CAJA_AVANZADA': { label: 'Caja Avanzada (Arqueos)', price: 15, type: 'pro' },
    'DESCUENTOS_AVANZADOS': { label: 'Descuentos Dinámicos', price: 15, type: 'pro' },
    'LISTAS_PRECIOS': { label: 'Listas de Precios', price: 10, type: 'pro' },
    'REPORTES_AVANZADOS': { label: 'Reportes y BI', price: 20, type: 'pro' },
    'AUDITORIA': { label: 'Auditoría / Log', price: 10, type: 'pro' },
    
    'MULTI_SUCURSAL': { label: 'Gestión Multi-Sucursal', price: 40, type: 'enterprise' },
    'PEDIDOS_INTERNOS': { label: 'Logística / Pedidos', price: 30, type: 'enterprise' },
    'CONTROL_QR': { label: 'Control Validación QR', price: 15, type: 'enterprise' },
    'API_ACCESO': { label: 'Acceso a API externa', price: 50, type: 'enterprise' },
    'PRICE_REQUESTS': { label: 'Solicitudes de Precio', price: 10, type: 'enterprise' }
};

interface PlanBuilderProps {
    existingPlans: any[];
}

export default function PlanBuilder({ existingPlans }: PlanBuilderProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [manualPrice, setManualPrice] = useState<string>('');
    const [maxSucursales, setMaxSucursales] = useState<string>('1');
    const [maxUsuariosPorSucursal, setMaxUsuariosPorSucursal] = useState<string>('5');
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'catalog' | 'builder'>('catalog');

    const resetForm = () => {
        setEditingPlanId(null);
        setName('');
        setSelectedFeatures([]);
        setManualPrice('');
        setMaxSucursales('1');
        setMaxUsuariosPorSucursal('5');
        setActiveTab('catalog');
    };

    // Calculadora Automática
    const recommendedPrice = useMemo(() => {
        return selectedFeatures.reduce((acc, feat) => acc + (FEATURE_PRICES[feat]?.price || 0), 0);
    }, [selectedFeatures]);

    const finalPrice = manualPrice !== '' ? parseFloat(manualPrice) : recommendedPrice;

    const toggleFeature = (feat: string) => {
        if (selectedFeatures.includes(feat)) {
            setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
        } else {
            setSelectedFeatures([...selectedFeatures, feat]);
        }
    };

    const selectAll = () => setSelectedFeatures(Object.keys(FEATURE_PRICES));
    const clearAll = () => setSelectedFeatures([]);

    const createPlanMutation = useMutation({
        mutationFn: async () => {
            if (!name.trim()) throw new Error('El plan necesita un nombre');
            if (selectedFeatures.length === 0) throw new Error('Debes seleccionar al menos 1 módulo');
            
            return client('/tenants/admin/plans', {
                method: 'POST',
                body: {
                    name: name.trim(),
                    max_sucursales: parseInt(maxSucursales, 10),
                    max_usuarios_por_sucursal: parseInt(maxUsuariosPorSucursal, 10),
                    features: selectedFeatures,
                    precio_mensual: finalPrice
                }
            });
        },
        onSuccess: () => {
            toast.success("Plan Atómico creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.message || "Error al crear el plan");
        }
    });

    const updatePlanMutation = useMutation({
        mutationFn: async () => {
            if (!name.trim()) throw new Error('El plan necesita un nombre');
            if (selectedFeatures.length === 0) throw new Error('Debes seleccionar al menos 1 módulo');
            if (!editingPlanId) throw new Error('No hay plan en edición');
            
            return client(`/tenants/admin/plans/${editingPlanId}`, {
                method: 'PUT',
                body: {
                    name: name.trim(),
                    max_sucursales: parseInt(maxSucursales, 10),
                    max_usuarios_por_sucursal: parseInt(maxUsuariosPorSucursal, 10),
                    features: selectedFeatures,
                    precio_mensual: finalPrice
                }
            });
        },
        onSuccess: () => {
            toast.success("Plan actualizado exitosamente");
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err.message || "Error al crear el plan");
        }
    });

    const deletePlanMutation = useMutation({
        mutationFn: (planId: string) => client(`/tenants/admin/plans/${planId}`, { method: 'DELETE' }),
        onSuccess: () => {
            toast.success("Plan eliminado");
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
        },
        onError: (err: any) => toast.error(err.message || "Error al eliminar (Puede estar en uso)")
    });



    const handleEdit = (plan: any) => {
        setEditingPlanId(plan.id);
        setName(plan.name);
        setSelectedFeatures(plan.features);
        setManualPrice(plan.precio_mensual?.toString() || '');
        setMaxSucursales(plan.max_sucursales?.toString() || '-1');
        setMaxUsuariosPorSucursal(plan.max_usuarios_por_sucursal?.toString() || '-1');
        setActiveTab('builder');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                        <Layers size={20} />
                    </div>
                    <div>
                        <h3 className="std-title-section text-base">Catálogo de Planes</h3>
                        <p className="std-description text-xs">Administra los planes o diseña una nueva oferta</p>
                    </div>
                </div>

                <div>
                    {activeTab === 'catalog' ? (
                        <button 
                            onClick={() => { setActiveTab('builder'); setEditingPlanId(null); }}
                            className="std-btn-primary"
                        >
                            <Plus size={16} /> Crear Plan
                        </button>
                    ) : (
                        <button 
                            onClick={resetForm}
                            className="std-btn-secondary"
                        >
                            ← Volver al Catálogo
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'builder' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {/* Formulario (2 Columnas) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <label className="std-label text-xs">Nombre del Plan</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Ej. Emprendedor Básico" 
                                className="std-input"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="std-label text-xs">Máx. Sucursales (-1 ilimitado)</label>
                                <input 
                                    type="number" 
                                    value={maxSucursales} 
                                    onChange={e => setMaxSucursales(e.target.value)} 
                                    className="std-input"
                                />
                            </div>
                            <div>
                                <label className="std-label text-xs">Personal por Sucursal (-1 ilim.)</label>
                                <input 
                                    type="number" 
                                    value={maxUsuariosPorSucursal} 
                                    onChange={e => setMaxUsuariosPorSucursal(e.target.value)} 
                                    className="std-input"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="std-label text-xs mb-0">Módulos (Vistas Atómicas)</label>
                                <div className="flex gap-2 text-xs font-medium">
                                    <button onClick={selectAll} className="text-indigo-600 hover:underline">Seleccionar Todos</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={clearAll} className="text-gray-400 hover:text-red-500">Limpiar</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(FEATURE_PRICES).map(([code, meta]) => {
                                    const selected = selectedFeatures.includes(code);
                                    return (
                                        <button 
                                            key={code}
                                            onClick={() => toggleFeature(code)}
                                            className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                                                selected 
                                                    ? 'bg-indigo-50/80 border-indigo-200 shadow-2xs' 
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-50 border-gray-300'}`}>
                                                    {selected && <Check size={10} className="text-white" />}
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-semibold ${selected ? 'text-indigo-900' : 'text-gray-700'}`}>{meta.label}</p>
                                                    <p className="text-[9px] text-gray-400 uppercase">{meta.type}</p>
                                                </div>
                                            </div>
                                            <div className={`text-xs font-bold font-mono ${selected ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                ${meta.price}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Calculadora (1 Columna) */}
                    <div className="bg-gray-900 rounded-xl p-5 text-white shadow-md flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-indigo-300">
                                <Calculator size={18} />
                                <h4 className="font-bold text-xs uppercase tracking-wider">Calculadora SaaS</h4>
                            </div>

                            <div className="bg-white/10 rounded-lg p-3 mb-3">
                                <p className="text-xs text-gray-400 font-medium mb-0.5">Módulos Seleccionados</p>
                                <p className="text-xl font-bold">{selectedFeatures.length}</p>
                            </div>
                            
                            <div className="bg-white/10 rounded-lg p-3 mb-4 border border-indigo-500/30">
                                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">Sugerencia Mensual</p>
                                <p className="text-3xl font-bold text-white font-mono tracking-tight">${recommendedPrice}</p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-gray-300 mb-1">Ajuste Manual / Descuento</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                                    <input 
                                        type="number" 
                                        value={manualPrice}
                                        onChange={e => setManualPrice(e.target.value)}
                                        placeholder={recommendedPrice.toString()}
                                        className="w-full bg-white/10 border border-white/15 pl-7 pr-3 py-2 rounded-lg text-white font-bold font-mono text-sm focus:bg-white/15 focus:border-indigo-400 outline-none transition-all placeholder:text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {editingPlanId ? (
                            <div className="mt-4 flex flex-col gap-2">
                                <button 
                                    onClick={() => updatePlanMutation.mutate()}
                                    disabled={updatePlanMutation.isPending || selectedFeatures.length === 0}
                                    className="std-btn-primary w-full py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {updatePlanMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Guardar Cambios
                                </button>
                                <button 
                                    onClick={resetForm}
                                    className="std-btn-secondary w-full py-2 text-xs font-bold uppercase tracking-wider"
                                >
                                    Cancelar Edición
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => createPlanMutation.mutate()}
                                disabled={createPlanMutation.isPending || selectedFeatures.length === 0}
                                className="mt-4 std-btn-primary w-full py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                            >
                                {createPlanMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Guardar y Crear Plan
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {existingPlans.map(plan => (
                            <div key={plan.id || plan.code} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-bold text-gray-900 text-sm">{plan.name}</h5>
                                        {plan.precio_mensual !== undefined && (
                                            <span className="bg-indigo-50 text-indigo-700 font-bold font-mono text-xs px-2 py-0.5 rounded border border-indigo-100">
                                                ${plan.precio_mensual}/mo
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-3 mb-2 text-xs text-gray-500">
                                        <span>Sucursales: <strong className="text-gray-700">{plan.max_sucursales === -1 ? '∞' : plan.max_sucursales || '∞'}</strong></span>
                                        <span>Personal: <strong className="text-gray-700">{plan.max_usuarios_por_sucursal === -1 ? '∞' : plan.max_usuarios_por_sucursal || '∞'} c/u</strong></span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mb-2 font-medium">{plan.features.length} módulos habilitados.</p>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {plan.features.slice(0, 5).map((f: string) => (
                                            <span key={f} className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200/60">{f}</span>
                                        ))}
                                        {plan.features.length > 5 && <span className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200/60">+{plan.features.length - 5}</span>}
                                    </div>
                                </div>
                                {plan.code !== 'ILIMITADO' && (
                                    <div className="flex items-center gap-1.5 justify-end pt-3 border-t border-gray-100">
                                        <button 
                                            onClick={() => handleEdit(plan)}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                        >
                                            <Edit2 size={13} /> Editar
                                        </button>
                                        {plan.code.startsWith('CUSTOM_') && (
                                            <button 
                                                onClick={() => deletePlanMutation.mutate(plan.id)}
                                                disabled={deletePlanMutation.isPending}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 size={13} /> Eliminar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
