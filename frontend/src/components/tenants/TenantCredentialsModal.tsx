import React from 'react';
import { KeyRound, AlertTriangle, Check, Copy } from 'lucide-react';

interface TenantCredentialsModalProps {
    credentials: { username: string; password: string; name: string };
    copied: boolean;
    onCopy: () => void;
    onClose: () => void;
}

export const TenantCredentialsModal: React.FC<TenantCredentialsModalProps> = ({
    credentials,
    copied,
    onCopy,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                        <KeyRound size={24} className="text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-gray-900 leading-tight">Empresa Creada</h2>
                        <p className="text-xs text-gray-500">{credentials.name}</p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-start gap-2 text-amber-800 text-xs mb-3 font-semibold uppercase tracking-wider">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Guarda estas credenciales. No se mostrarán de nuevo.</span>
                    </div>
                    <div className="space-y-2">
                        {[{ label: 'USUARIO', val: credentials.username }, { label: 'CONTRASEÑA', val: credentials.password }].map(({ label, val }) => (
                            <div key={label} className="bg-white rounded-xl px-3.5 py-2.5 border border-amber-200">
                                <p className="text-[10px] font-bold text-gray-400 mb-0.5">{label}</p>
                                <p className="font-mono font-bold text-gray-900 text-xs break-all">{val}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onCopy} className="flex items-center gap-1.5 flex-1 justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
                        {copied ? <><Check size={14} className="text-green-600" /> Copiado</> : <><Copy size={14} /> Copiar</>}
                    </button>
                    <button onClick={onClose} className="flex-1 bg-black hover:bg-gray-800 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
