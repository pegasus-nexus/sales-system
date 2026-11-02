import React from 'react';
import { X, Check, KeyRound, ShieldAlert, Loader2 } from 'lucide-react';
import type { Tenant, Plan } from '../../api/types';

interface TenantEditModalProps {
    tenant: Tenant;
    plansList: Plan[];
    adminCreds: { username: string; password: string };
    onChangeTenant: (t: Tenant) => void;
    onChangeAdminCreds: (c: { username: string; password: string }) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isUpdating: boolean;
}

export const TenantEditModal: React.FC<TenantEditModalProps> = ({
    tenant,
    plansList,
    adminCreds,
    onChangeTenant,
    onChangeAdminCreds,
    onClose,
    onSubmit,
    isUpdating,
}) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Gestionar Empresa</h2>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase ml-1">Nombre Comercial</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold" 
                                value={tenant.name} 
                                onChange={e => onChangeTenant({ ...tenant, name: e.target.value })} 
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase ml-1">Plan Asignado</label>
                            <select 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-hidden text-gray-900 font-bold cursor-pointer" 
                                value={tenant.plan} 
                                onChange={e => onChangeTenant({ ...tenant, plan: e.target.value as any })}
                            >
                                {plansList.map(p => (
                                    <option key={p.code} value={p.code}>{p.name} {!p.is_public ? '(Interno)' : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Fecha de Vencimiento de Pago</label>
                        <input 
                            type="date" 
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold" 
                            value={tenant.plan_expires_at as string || ''} 
                            onChange={e => onChangeTenant({ ...tenant, plan_expires_at: e.target.value as any })} 
                        />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5"><KeyRound size={14}/> Accesos del Administrador</h3>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Correo de Acceso</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="admin@empresa.com" 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold" 
                                value={adminCreds.username} 
                                onChange={e => onChangeAdminCreds({ ...adminCreds, username: e.target.value })} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nueva Contraseña (Dejar en blanco para conservar)</label>
                            <input 
                                type="text" 
                                placeholder="Escribe la nueva contraseña..." 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold placeholder:text-gray-400" 
                                value={adminCreds.password} 
                                onChange={e => onChangeAdminCreds({ ...adminCreds, password: e.target.value })} 
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={tenant.is_active} 
                                    onChange={e => onChangeTenant({ ...tenant, is_active: e.target.checked })} 
                                />
                                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6"></div>
                            </div>
                            <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">Estado de la cuenta ({tenant.is_active ? 'Activa' : 'Desactivada'})</span>
                        </label>
                        {!tenant.is_active && (
                            <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                                <ShieldAlert size={12}/> Acceso bloqueado para los usuarios de esta empresa.
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isUpdating} 
                        className="w-full bg-black text-white py-3.5 rounded-xl font-black text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
                    >
                        {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <>Guardar Cambios <Check size={16} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};
