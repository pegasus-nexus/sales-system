import React, { useState } from 'react';
import { HeartHandshake, Calendar, Loader2, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Cliente } from '../../api/clientes';
import type { ClientMealPlan, MealSchedule } from '../../api/types';
import { 
    getClientMealPlans, 
    assignPlanToClient, 
    getMealPlanTemplates, 
    getMealSchedules, 
    createMealSchedule, 
    getRecipes 
} from '../../api/api';

interface Props {
    cliente: Cliente;
}

export const ClienteMealPlansSection: React.FC<Props> = ({ cliente }) => {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTemplateId, setAssignTemplateId] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedulePlanId, setSchedulePlanId] = useState('');
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleRecipes, setScheduleRecipes] = useState<string[]>([]);

    const { data: clientPlans, refetch: refetchPlans } = useQuery({
        queryKey: ['client-plans-crm', cliente._id],
        queryFn: () => getClientMealPlans(cliente._id),
    });

    const { data: clientSchedules, refetch: refetchSchedules } = useQuery({
        queryKey: ['client-schedules-crm', cliente._id],
        queryFn: () => getMealSchedules({ cliente_id: cliente._id }),
    });

    const { data: recipes } = useQuery({
        queryKey: ['recipes-for-crm'],
        queryFn: getRecipes,
        enabled: showScheduleModal,
    });

    const { data: planTemplates } = useQuery({
        queryKey: ['plan-templates-for-crm'],
        queryFn: getMealPlanTemplates,
        enabled: showAssignModal,
    });

    const assignPlanMutation = useMutation({
        mutationFn: (data: { templateId: string }) =>
            assignPlanToClient(cliente._id, data.templateId),
        onSuccess: () => {
            refetchPlans();
            setShowAssignModal(false);
            setAssignTemplateId('');
            toast.success('Plan asignado correctamente.');
        },
    });

    const createScheduleMutation = useMutation({
        mutationFn: (data: { planId: string; date: string; recipes: string[] }) =>
            createMealSchedule({
                cliente_id: cliente._id,
                client_meal_plan_id: data.planId,
                fecha_programada: data.date,
                recetas_ids: data.recipes,
            }),
        onSuccess: () => {
            refetchSchedules();
            setShowScheduleModal(false);
            setSchedulePlanId('');
            setScheduleRecipes([]);
            toast.success('Entrega programada con éxito.');
        },
    });

    const handleAssignPlanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignTemplateId) return;
        assignPlanMutation.mutate({ templateId: assignTemplateId });
    };

    const handleScheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedulePlanId || scheduleRecipes.length === 0) {
            toast.warning('Por favor selecciona un plan y al menos una receta.');
            return;
        }
        createScheduleMutation.mutate({
            planId: schedulePlanId,
            date: scheduleDate,
            recipes: scheduleRecipes,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs">
                <h3 className="text-sm font-bold text-gray-800">Planes contratados</h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                    >
                        <HeartHandshake size={14} /> Asignar Plan
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (!clientPlans || clientPlans.length === 0) {
                                toast.warning('El cliente debe tener al menos un plan activo para programarle entregas.');
                                return;
                            }
                            setSchedulePlanId(clientPlans[0]._id);
                            setShowScheduleModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-xs"
                    >
                        <Calendar size={14} /> Programar Entrega
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {clientPlans?.map((plan: ClientMealPlan) => (
                    <div
                        key={plan._id}
                        className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs flex justify-between items-center"
                    >
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">{plan.template_name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {plan.comidas_consumidas} / {plan.comidas_totales} comidas consumidas
                            </p>
                        </div>
                        <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                                plan.estado === 'ACTIVO'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {plan.estado}
                        </span>
                    </div>
                ))}
                {(!clientPlans || clientPlans.length === 0) && (
                    <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs italic">
                        Este cliente no tiene ningún plan de comidas activo.
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800">Calendario de Entregas</h3>
                <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xs divide-y divide-gray-100">
                    {clientSchedules?.map((sch: MealSchedule) => (
                        <div key={sch._id} className="p-3.5 flex justify-between items-center text-xs">
                            <div>
                                <div className="font-bold text-gray-900">{sch.fecha_programada}</div>
                                <div className="text-[10px] text-gray-400">
                                    Recetas: {sch.recipe_names?.join(', ') || 'Sin recetas'}
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[9px] bg-indigo-100 text-indigo-700">
                                {sch.estado}
                            </span>
                        </div>
                    ))}
                    {(!clientSchedules || clientSchedules.length === 0) && (
                        <div className="p-4 text-center text-gray-400 italic text-xs">
                            No hay comidas programadas en el calendario.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Asignar Plan */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Asignar Plan de Comida</h2>
                            <button
                                type="button"
                                onClick={() => setShowAssignModal(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAssignPlanSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Plantilla de Plan
                                </label>
                                <select
                                    required
                                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    value={assignTemplateId}
                                    onChange={(e) => setAssignTemplateId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar Plantilla --</option>
                                    {planTemplates?.map((tpl) => (
                                        <option key={tpl._id} value={tpl._id}>
                                            {tpl.nombre} ({tpl.cantidad_comidas} comidas, ${tpl.precio_sugerido})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={assignPlanMutation.isPending}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                {assignPlanMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Asignar Plan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Programar Entrega */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Programar Bowl / Entrega</h2>
                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Plan Activo
                                </label>
                                <select
                                    required
                                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    value={schedulePlanId}
                                    onChange={(e) => setSchedulePlanId(e.target.value)}
                                >
                                    {clientPlans?.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.template_name} ({p.comidas_consumidas}/{p.comidas_totales})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Fecha de Entrega
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Receta / Menú
                                </label>
                                <select
                                    multiple
                                    required
                                    className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 h-28"
                                    value={scheduleRecipes}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions, (option) => option.value);
                                        setScheduleRecipes(values);
                                    }}
                                >
                                    {recipes?.map((r) => (
                                        <option key={r._id} value={r._id}>
                                            {r.nombre} ({r.tipo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={createScheduleMutation.isPending}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                {createScheduleMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Programar Entrega'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
