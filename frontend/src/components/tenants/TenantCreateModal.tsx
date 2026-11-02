import React from 'react';
import { X, Check, Users, Loader2 } from 'lucide-react';
import type { TenantCreate, Plan } from '../../api/types';
import PasswordField from '../PasswordField';

interface TenantCreateModalProps {
    formData: TenantCreate;
    confirmPassword: string;
    plansList: Plan[];
    isPending: boolean;
    onChangeFormData: (data: TenantCreate) => void;
    onChangeConfirmPassword: (val: string) => void;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const TenantCreateModal: React.FC<TenantCreateModalProps> = ({
    formData,
    confirmPassword,
    plansList,
    isPending,
    onChangeFormData,
    onChangeConfirmPassword,
    onClose,
    onSubmit,
}) => {
    const isSubmitDisabled = isPending || formData.admin_password !== confirmPassword || formData.admin_password.length < 8;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-black text-gray-900 tracking-tight">Nueva Empresa</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-500 transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre Comercial</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="ej. Chocolates Para Ti" 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold text-xs" 
                                value={formData.name} 
                                onChange={e => onChangeFormData({ ...formData, name: e.target.value })} 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Suscripción Inicial</label>
                            <select 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold text-xs cursor-pointer" 
                                value={formData.plan} 
                                onChange={e => onChangeFormData({ ...formData, plan: e.target.value })}
                            >
                                {plansList.filter(p => p.is_public).map(p => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-3">
                        <div className="flex items-center gap-2">
                            <Users size={15} className="text-gray-700" />
                            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Admin Principal</p>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email de Acceso</label>
                                <input 
                                    type="email" 
                                    required 
                                    placeholder="admin@empresa.com" 
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-hidden focus:ring-2 focus:ring-black/10 text-gray-900 font-bold text-xs" 
                                    value={formData.admin_username} 
                                    onChange={e => onChangeFormData({ ...formData, admin_username: e.target.value })} 
                                />
                            </div>
                            <PasswordField 
                                value={formData.admin_password} 
                                onChange={(v: string) => onChangeFormData({ ...formData, admin_password: v })} 
                                confirmValue={confirmPassword} 
                                onConfirmChange={onChangeConfirmPassword} 
                                label="Contraseña" 
                                inputClassName="bg-white border-gray-200 text-gray-900" 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitDisabled} 
                        className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-30 cursor-pointer"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={15} /> : <>Crear Empresa <Check size={15} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};
