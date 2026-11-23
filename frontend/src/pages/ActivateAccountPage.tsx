import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Lock, 
    Eye, 
    EyeOff, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight,
    AlertTriangle
} from 'lucide-react';
import { verifyActivationToken, completeAccountActivation, getMe } from '../api/api';
import { useAuthStore } from '../store/authStore';

export default function ActivateAccountPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const token = searchParams.get('token') || '';

    // Estado de verificación del token
    const [isCheckingToken, setIsCheckingToken] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [tokenData, setTokenData] = useState<{
        email: string;
        full_name: string;
        business_name: string;
    } | null>(null);

    // Campos del formulario
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // Estado del envío
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // 1. Validar token al cargar
    useEffect(() => {
        if (!token.trim()) {
            setIsCheckingToken(false);
            setTokenError('No se proporcionó ningún token de activación en el enlace.');
            return;
        }

        const verify = async () => {
            try {
                const res = await verifyActivationToken(token);
                if (res.valid) {
                    setTokenData({
                        email: res.email,
                        full_name: res.full_name,
                        business_name: res.business_name,
                    });
                } else {
                    setTokenError('El enlace de activación no es válido o ya fue utilizado.');
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Error al validar el enlace.';
                setTokenError(msg);
            } finally {
                setIsCheckingToken(false);
            }
        };

        verify();
    }, [token]);

    // 2. Evaluaciones de complejidad de contraseña en tiempo real
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#]/.test(password);
    const passwordsMatch = password.length > 0 && password === passwordConfirm;
    const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

    // 3. Enviar contraseña definitiva
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid || isSubmitting) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const res = await completeAccountActivation({
                token,
                password,
                password_confirm: passwordConfirm,
            });

            // Guardar token temporalmente en cliente y obtener perfil completo
            localStorage.setItem('token', res.access_token);
            try {
                const userProfile = await getMe();
                login(res.access_token, userProfile);
            } catch {
                // Fallback con datos devueltos
                login(res.access_token, {
                    _id: 'temp',
                    username: res.username,
                    email: res.email,
                    role: res.role as any,
                    is_active: true,
                });
            }

            setIsSuccess(true);
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1800);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al activar tu cuenta.';
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
            {/* Luces y degradados cósmicos de fondo */}
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
                        Activa tu Cuenta
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Crea tu contraseña segura para comenzar a operar.
                    </p>
                </div>

                {/* Tarjeta Principal */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
                    {/* Caso A: Verificando token */}
                    {isCheckingToken && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Loader2 size={38} className="text-indigo-500 animate-spin mb-4" />
                            <p className="text-sm font-medium text-slate-300">
                                Verificando enlace de activación...
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Comprobando validez y seguridad criptográfica
                            </p>
                        </div>
                    )}

                    {/* Caso B: Token Inválido o Expirado */}
                    {!isCheckingToken && tokenError && (
                        <div className="py-6 text-center">
                            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                                <AlertTriangle size={28} />
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2">
                                Enlace No Válido o Expirado
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                {tokenError}
                            </p>
                            <div className="space-y-3">
                                <Link
                                    to="/login"
                                    className="block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-semibold transition-colors border border-slate-700"
                                >
                                    Ir a Iniciar Sesión
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Caso C: Éxito Definitivo */}
                    {isSuccess && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="py-8 text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
                                <CheckCircle2 size={36} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">
                                ¡Cuenta Activada Exitosamente!
                            </h2>
                            <p className="text-sm text-slate-400 mb-6">
                                Tu contraseña ha sido guardada. Iniciando tu sesión y redirigiendo al panel de control...
                            </p>
                            <div className="flex justify-center">
                                <Loader2 size={24} className="text-emerald-400 animate-spin" />
                            </div>
                        </motion.div>
                    )}

                    {/* Caso D: Formulario Activo para Definir Contraseña */}
                    {!isCheckingToken && !tokenError && !isSuccess && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Saludo con nombre del usuario y negocio */}
                            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                                    {tokenData?.full_name ? tokenData.full_name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-200 truncate">
                                        {tokenData?.full_name || 'Nuevo Administrador'}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                        {tokenData?.email}
                                    </p>
                                    {tokenData?.business_name && (
                                        <p className="text-[11px] text-indigo-400 font-medium truncate mt-0.5">
                                            🏢 {tokenData.business_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Alerta de Error si falló el envío */}
                            {submitError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <XCircle size={16} className="shrink-0 text-rose-400" />
                                    <span>{submitError}</span>
                                </div>
                            )}

                            {/* Campo: Nueva Contraseña */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Nueva Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Campo: Confirmar Contraseña */}
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        required
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                    >
                                        {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Checklist de Requisitos en Vivo */}
                            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                                <p className="font-semibold text-slate-400 mb-1">
                                    Requisitos de Seguridad:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={13} className={hasMinLength ? 'text-emerald-400' : 'text-slate-600'} />
                                        <span>Mínimo 8 caracteres</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={13} className={hasUpper ? 'text-emerald-400' : 'text-slate-600'} />
                                        <span>1 Letra mayúscula</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={13} className={hasLower ? 'text-emerald-400' : 'text-slate-600'} />
                                        <span>1 Letra minúscula</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={13} className={hasNumber ? 'text-emerald-400' : 'text-slate-600'} />
                                        <span>1 Número</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={13} className={hasSpecial ? 'text-emerald-400' : 'text-slate-600'} />
                                        <span>1 Símbolo (@$!%*?&#)</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={13} className={passwordsMatch ? 'text-emerald-400' : 'text-slate-600'} />
                                        <span>Coinciden entre sí</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Envío */}
                            <button
                                type="submit"
                                disabled={!isFormValid || isSubmitting}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Activando cuenta...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={18} />
                                        <span>Activar Cuenta y Entrar</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Pie de página */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    © Pegasus SalesSystem. Plataforma de Gestión Multi-Sucursal Segura.
                </p>
            </div>
        </div>
    );
}
