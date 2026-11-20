import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Compass, Layers, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../api/client';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Cargar usuario recordado si existe
    useEffect(() => {
        const savedUser = localStorage.getItem('pegasus_remembered_username');
        if (savedUser) {
            setUsername(savedUser);
            setRememberMe(true);
        }
    }, []);

    // Detección en tiempo real de Bloq Mayús (Caps Lock)
    const handleKeyModifierCheck = (e: React.KeyboardEvent) => {
        if (typeof e.getModifierState === 'function') {
            setCapsLockActive(e.getModifierState('CapsLock'));
        }
    };

    const handleClearRememberedUser = () => {
        localStorage.removeItem('pegasus_remembered_username');
        setUsername('');
        setRememberMe(false);
    };

    // Envío de credenciales con Timeout de 10s
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            if (rememberMe && username.trim()) {
                localStorage.setItem('pegasus_remembered_username', username.trim());
            } else {
                localStorage.removeItem('pegasus_remembered_username');
            }

            const formData = new URLSearchParams();
            formData.append('username', username.trim());
            formData.append('password', password);

            const response = await fetch(`${BASE_URL}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
                signal: controller.signal,
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 400) {
                    throw new Error('Credenciales incorrectas. Verifica tu usuario y contraseña.');
                }
                throw new Error(`Error en el servidor de autenticación (${response.status}).`);
            }

            const data = await response.json();
            const token = data.access_token;

            const userResponse = await fetch(`${BASE_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal,
            });

            if (!userResponse.ok) {
                throw new Error('Sesión iniciada, pero no se pudo cargar el perfil.');
            }

            const userData = await userResponse.json();

            login(token, userData);
            if (userData.role === 'SUPERADMIN' || userData.role === 'SUPERADMIN_STAFF') {
                navigate('/admin');
            } else if (userData.role === 'CATALOGO_MERCHANT') {
                navigate('/catalogo/admin');
            } else {
                navigate('/');
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                setError('Tiempo de espera agotado. Verifica tu conexión e intenta de nuevo.');
            } else {
                const message = err instanceof Error ? err.message : 'Error inesperado al iniciar sesión.';
                setError(message);
            }
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060810] text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">
            {/* ── FONDO CARTOGRÁFICO ASTRONÓMICO PEGASUS NEXUS (SVG artesanal < 4KB) ── */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <defs>
                        <radialGradient id="nexusStarlight" cx="22%" cy="40%" r="60%">
                            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.14" />
                            <stop offset="50%" stopColor="#1E293B" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#060810" stopOpacity="0" />
                        </radialGradient>
                        <pattern id="celestialGridPattern" width="90" height="90" patternUnits="userSpaceOnUse">
                            <circle cx="45" cy="45" r="0.75" fill="#94A3B8" opacity="0.35" />
                            <path d="M 90 0 L 0 0 0 90" fill="none" stroke="#1E293B" strokeWidth="0.5" opacity="0.4" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#nexusStarlight)" />
                    <rect width="100%" height="100%" fill="url(#celestialGridPattern)" />
                    {/* Líneas meridianas astronómicas decorativas */}
                    <circle cx="25%" cy="50%" r="320" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
                    <circle cx="25%" cy="50%" r="480" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 8" opacity="0.2" />
                    <line x1="0" y1="50%" x2="50%" y2="50%" stroke="#38BDF8" strokeWidth="0.5" strokeDasharray="4 8" opacity="0.2" />
                </svg>
            </div>

            {/* ── PANEL IZQUIERDO: La Esencia de Pegasus Nexus (Desktop) ── */}
            <div className="hidden lg:flex lg:w-7/12 relative z-10 flex-col justify-between p-12 xl:p-16 border-r border-slate-800/80 bg-gradient-to-b from-[#080C18]/95 via-[#060810]/95 to-[#05070D]/95">
                {/* Cabecera / Emblema Celestial */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F1B33] to-[#080F1E] border border-sky-400/30 flex items-center justify-center shadow-lg shadow-sky-950/50 relative group">
                        {/* Constelación Pegaso Artesanal */}
                        <svg className="w-7 h-7 text-sky-400 group-hover:text-amber-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="5" cy="6" r="1.5" fill="currentColor" />
                            <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                            <circle cx="19" cy="8" r="1.5" fill="currentColor" />
                            <circle cx="15" cy="17" r="1.5" fill="currentColor" />
                            <circle cx="8" cy="18" r="1.5" fill="currentColor" />
                            <circle cx="2" cy="12" r="1.2" fill="#F59E0B" />
                            <path d="M5 6 L12 4 L19 8 L15 17 L8 18 Z" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2" />
                            <path d="M12 4 L15 17" strokeWidth="0.8" opacity="0.5" />
                            <path d="M5 6 L8 18" strokeWidth="0.8" opacity="0.5" />
                            <path d="M5 6 L2 12" strokeWidth="0.7" opacity="0.4" strokeDasharray="1 2" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-wider text-slate-50 font-serif">
                                PEGASUS <span className="text-sky-400 font-sans font-black">NEXUS</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-sky-900/60 bg-sky-950/40 text-sky-300">
                                v2.5
                            </span>
                        </div>
                        <span className="block text-[11px] text-slate-400 font-medium tracking-widest uppercase">
                            Commercial Operating System
                        </span>
                    </div>
                </div>

                {/* Mensaje Central Cósmico y Elegante */}
                <div className="max-w-xl my-auto py-10 space-y-7">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-700/80 bg-slate-900/90 text-xs text-slate-300 shadow-inner">
                        <span className="text-amber-400">✦</span>
                        <span className="font-mono text-[11px] text-slate-400">PEGASUS · RA 21h 44m · DEC +15° 18'</span>
                        <span className="text-slate-600">|</span>
                        <span className="font-semibold text-sky-300">Núcleo Central</span>
                    </div>

                    <h1 className="text-3xl xl:text-5xl font-black text-slate-50 tracking-tight leading-[1.18] font-serif">
                        El nexo donde convergen tus <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-200 to-amber-200">
                            sucursales, ventas y personas
                        </span>.
                    </h1>

                    <p className="text-slate-300 text-sm xl:text-base leading-relaxed max-w-lg">
                        Diseñado con rigor y cariño artesanal. Una plataforma atemporal creada para transformar la complejidad de tu comercio en un flujo armónico, fluido y exacto.
                    </p>

                    {/* Fichas de Pilares del Sistema (Diseño sólido, sobrio y sin clichés) */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-800 hover:border-slate-700 transition-colors">
                            <Compass className="w-5 h-5 text-sky-400 mb-2" />
                            <h4 className="text-xs font-bold text-slate-200 mb-1">Terminal POS</h4>
                            <p className="text-[11px] text-slate-400 leading-snug">
                                Cobro instantáneo, multidivisa y cuadratura precisa.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-800 hover:border-slate-700 transition-colors">
                            <Layers className="w-5 h-5 text-amber-400 mb-2" />
                            <h4 className="text-xs font-bold text-slate-200 mb-1">Kárdex Inteligente</h4>
                            <p className="text-[11px] text-slate-400 leading-snug">
                                Trazabilidad por lote y sincronización multi-almacén.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#0D1424] border border-slate-800 hover:border-slate-700 transition-colors">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                            <h4 className="text-xs font-bold text-slate-200 mb-1">Auditoría ACID</h4>
                            <p className="text-[11px] text-slate-400 leading-snug">
                                Consistencia blindada e integridad financiera.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pie del Panel Izquierdo */}
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono text-[11px] text-slate-400">✦ Conexión al Núcleo Estable</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">
                        PEGASUS NEXUS · 2026
                    </span>
                </div>
            </div>

            {/* ── PANEL DERECHO: Tarjeta de Acceso Humana & Accesible ── */}
            <div className="w-full lg:w-5/12 flex items-center justify-center p-4 sm:p-8 relative z-10 my-auto min-h-screen overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full max-w-sm sm:max-w-md bg-[#0C1220] border border-slate-700/90 p-7 sm:p-9 rounded-3xl shadow-2xl shadow-black/80 space-y-6"
                >
                    {/* Header Mobile */}
                    <div className="lg:hidden flex items-center gap-3 pb-4 border-b border-slate-800">
                        <div className="w-9 h-9 rounded-xl bg-[#0F1B33] border border-sky-400/30 flex items-center justify-center">
                            <span className="text-sky-400 font-bold text-sm">✦</span>
                        </div>
                        <div>
                            <span className="text-lg font-black text-slate-100 font-serif">
                                PEGASUS <span className="text-sky-400">NEXUS</span>
                            </span>
                            <span className="block text-[9px] text-slate-400 tracking-wider uppercase font-semibold">
                                Commercial OS
                            </span>
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-300">
                                Acceso al Sistema
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-100 tracking-tight font-serif">
                            Iniciar Sesión
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Ingresa tus credenciales autorizadas para comenzar tu jornada.
                        </p>
                    </div>

                    {/* Alerta de Error Sobria */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-medium flex items-start gap-2.5"
                            >
                                <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                                <span className="flex-1 leading-snug">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campo Usuario */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-200 tracking-wide block">
                                    Usuario o Correo
                                </label>
                                {rememberMe && username && (
                                    <button
                                        type="button"
                                        onClick={handleClearRememberedUser}
                                        className="text-[10px] text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                                        title="Olvidar usuario en este equipo"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <UserIcon
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors pointer-events-none"
                                />
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ej. cajero1 o usuario@empresa.com"
                                    className="w-full bg-[#131C30] border border-slate-600/90 rounded-xl py-2.5 pl-10 pr-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 transition-all text-xs sm:text-sm font-medium hover:border-slate-500"
                                />
                            </div>
                        </div>

                        {/* Campo Contraseña con detección de Bloq Mayús */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-200 tracking-wide block">
                                    Contraseña
                                </label>
                                <span className={`text-[10px] font-bold text-amber-300 flex items-center gap-1 transition-opacity ${capsLockActive ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}>
                                    <span>✦</span> Bloq Mayús activo
                                </span>
                            </div>
                            <div className="relative group">
                                <Lock
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors pointer-events-none"
                                />
                                <input
                                    ref={passwordInputRef}
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyModifierCheck}
                                    onKeyUp={handleKeyModifierCheck}
                                    placeholder="••••••••••••"
                                    className={`w-full bg-[#131C30] border rounded-xl py-2.5 pl-10 pr-10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 transition-all text-xs sm:text-sm font-medium hover:border-slate-500 ${
                                        capsLockActive ? 'border-amber-400/80 ring-1 ring-amber-400/30' : 'border-slate-600/90'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Recordar Usuario */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 bg-[#131C30] text-sky-500 focus:ring-sky-400/40 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-xs text-slate-300 group-hover:text-slate-100 transition-colors">
                                    Recordar mi usuario
                                </span>
                            </label>
                            <span className="text-[10px] text-slate-500">
                                En este equipo
                            </span>
                        </div>

                        {/* Botón de Ingreso Celestial */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm disabled:opacity-60 cursor-pointer shadow-lg shadow-sky-950/60"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Validando credenciales...</span>
                                </>
                            ) : (
                                <>
                                    <span>Ingresar al Sistema</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Soporte y Versión */}
                    <div className="pt-4 border-t border-slate-800 text-center space-y-2">
                        <p className="text-xs text-slate-400">
                            ¿Necesitas asistencia técnica?{' '}
                            <a
                                href="https://wa.me/59170000000"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                            >
                                Contactar soporte
                            </a>
                        </p>
                        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-500">
                            <span>PEGASUS NEXUS</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">✦ Red Comercial Segura</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
