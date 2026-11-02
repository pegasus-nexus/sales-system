import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { setupPasswordPublic } from '../api/systemMonitorApi';
import { toast } from 'sonner';

export default function SetupPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!token) {
            setErrorMsg('El enlace de invitación no contiene un token válido.');
            return;
        }

        if (password.length < 8) {
            setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        try {
            await setupPasswordPublic(token, password);
            setIsSuccess(true);
            toast.success('Contraseña configurada con éxito');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al configurar la contraseña. El enlace puede haber expirado.';
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-150">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                        <Lock size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        Configurar Contraseña
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Acceso seguro de Administrador SaaS Pegasus
                    </p>
                </div>

                {isSuccess ? (
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">¡Contraseña Establecida!</h2>
                        <p className="text-xs text-gray-600">
                            Tu clave de acceso ha sido guardada con cifrado de alta seguridad. Ya puedes ingresar al panel.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
                        >
                            <span>Ir al Inicio de Sesión</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errorMsg && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Nueva Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                required
                                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu nueva contraseña"
                                required
                                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Guardando contraseña...</span>
                                </>
                            ) : (
                                <span>Definir Contraseña Segura</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
