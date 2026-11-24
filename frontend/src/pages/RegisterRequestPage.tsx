import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Mail, 
    User as UserIcon, 
    Building2, 
    ArrowRight, 
    Loader2, 
    Sparkles, 
    XCircle,
    ArrowLeft
} from 'lucide-react';
import { requestAccountActivation } from '../api/api';

export default function RegisterRequestPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !fullName.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            await requestAccountActivation({
                email: email.trim().toLowerCase(),
                full_name: fullName.trim(),
                business_name: businessName.trim() || undefined,
            });
            setIsSubmitted(true);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al solicitar activación de cuenta.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
            {/* Luces cósmicas de fondo */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo y Encabezado */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Sparkles size={13} className="text-indigo-400 animate-pulse" />
                        <span>Pegasus Nexus</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Crea tu Cuenta
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Regístrate sin contraseñas iniciales: verifica tu correo y activa tu espacio.
                    </p>
                </div>

                {/* Tarjeta Principal */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                    {isSubmitted ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="py-6 text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4">
                                <Mail size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                ¡Revisa tu Correo!
                            </h2>
                            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                Hemos enviado un enlace de activación a:
                            </p>
                            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-indigo-300 font-semibold text-sm mb-6 break-all">
                                {email}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                Haz clic en el enlace dentro del correo para confirmar tu identidad y definir tu contraseña personal. El enlace expira en 24 horas.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-colors border border-slate-700 cursor-pointer"
                            >
                                <ArrowLeft size={16} />
                                <span>Volver a Iniciar Sesión</span>
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <XCircle size={16} className="shrink-0 text-rose-400" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Nombre Completo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Tu Nombre Completo
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <UserIcon size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Nombre del Negocio / Empresa */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Nombre de tu Empresa / Negocio
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Building2 size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        placeholder="Ej. Comercial Pegasus SRL"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Correo Electrónico */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="juan@tuempresa.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Te enviaremos un correo con el botón de confirmación para activar tu cuenta.
                                </p>
                            </div>

                            {/* Botón de Envío */}
                            <button
                                type="submit"
                                disabled={isLoading || !email.trim() || !fullName.trim()}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Enviando enlace...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Solicitar Enlace de Activación</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            {/* Enlace de Retorno */}
                            <div className="text-center pt-3 border-t border-slate-800">
                                <span className="text-xs text-slate-400">
                                    ¿Ya tienes una cuenta activa?{' '}
                                </span>
                                <Link
                                    to="/login"
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    Inicia Sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-slate-500 mt-6">
                    © Pegasus SalesSystem. Plataforma de Gestión Multi-Sucursal Segura.
                </p>
            </div>
        </div>
    );
}
