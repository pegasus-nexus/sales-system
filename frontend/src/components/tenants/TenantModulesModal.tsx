import React from 'react';
import { X } from 'lucide-react';
import type { Tenant } from '../../api/types';

interface AvailableModule {
    code: string;
    name: string;
    desc: string;
}

interface TenantModulesModalProps {
    tenant: Tenant;
    localModules: string[];
    onToggleModule: (code: string, checked: boolean) => void;
    onClose: () => void;
    onSave: () => void;
    isSaving: boolean;
    availableModules: AvailableModule[];
}

export const TenantModulesModal: React.FC<TenantModulesModalProps> = ({
    tenant,
    localModules,
    onToggleModule,
    onClose,
    onSave,
    isSaving,
    availableModules,
}) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Control de Módulos</h2>
                        <p className="text-gray-500 font-medium mt-1">Configurando accesos para: <span className="text-indigo-600 font-bold">{tenant.name}</span></p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-2xl text-gray-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {availableModules.map(mod => {
                        const isChecked = localModules.includes(mod.code);
                        return (
                            <div key={mod.code} className="p-5 rounded-3xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-900">{mod.name}</h4>
                                    <p className="text-xs text-gray-500">{mod.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={isChecked}
                                        onChange={(e) => onToggleModule(mod.code, e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={onSave} 
                        disabled={isSaving}
                        className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
};
