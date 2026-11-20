import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
    Eye,
    EyeOff,
    Loader2,
    AlertCircle,
    QrCode,
    MessageCircle,
    X,
    ShieldCheck,
    CheckCircle2,
    Sparkles,
    ChevronDown
} from 'lucide-react';
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

    // Modales de ayuda
    const [showResetModal, setShowResetModal] = useState(false);
    const [showNoAccountModal, setShowNoAccountModal] = useState(false);
    const [showPasskeyModal, setShowPasskeyModal] = useState(false);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Cargar usuario guardado de localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('pegasus_remembered_username');
        if (savedUser) {
            setUsername(savedUser);
            setRememberMe(true);
        }
    }, []);

    // Detección de Bloq Mayús en tiempo real
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

    // Envío del formulario
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
        <div className="min-h-screen bg-[#F0F4F9] text-slate-800 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 relative overflow-hidden">
            
            {/* ── ELEMENTOS DE FONDO ASTRONÓMICOS SUTILES (ÓRBITAS Y ASTROS ESTILO GOOGLE) ── */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Gradiente celestial suave */}
                        <radialGradient id="celestialAmbient" cx="80%" cy="15%" r="55%">
                            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                            <stop offset="60%" stopColor="#818CF8" stopOpacity="0.04" />
                            <stop offset="100%" stopColor="#F0F4F9" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#celestialAmbient)" />
                    {/* Anillos orbitales sutiles inspirados en mecánica celeste */}
                    <circle cx="85%" cy="20%" r="280" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 8" />
                    <circle cx="85%" cy="20%" r="420" fill="none" stroke="#CBD5E1" strokeWidth="0.8" opacity="0.6" />
                    <circle cx="15%" cy="85%" r="340" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />
                    {/* Estrellas estáticas sutiles */}
                    <circle cx="78%" cy="18%" r="3" fill="#38BDF8" />
                    <circle cx="82%" cy="30%" r="2" fill="#818CF8" />
                    <circle cx="92%" cy="14%" r="2.5" fill="#F59E0B" />
                    <circle cx="18%" cy="75%" r="2" fill="#6366F1" />
                </svg>
            </div>

            {/* ESPACIADOR SUPERIOR */}
            <div className="hidden sm:block" />

            {/* ═════════════════════════════════════════════════════════════════════
                TARJETA GOOGLE SIGN-IN REDISEÑADA CON LA ESENCIA PEGASUS NEXUS
            ═════════════════════════════════════════════════════════════════════ */}
            <main className="w-full flex items-center justify-center relative z-10 my-auto">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full max-w-[1040px] bg-white rounded-[28px] border border-[#C4C7C5]/70 shadow-sm p-8 sm:p-10 lg:p-14 transition-shadow hover:shadow-md"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
                        
                        {/* ── COLUMNA IZQUIERDA: Marca, Astro-Constelación y Propuesta (Estilo Google Workspace) ── */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                            <div>
                                {/* Emblema Celestial Pegasus Nexus de 4 Tonos (Estilo Google) */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center p-2 shadow-xs relative group">
                                        <svg viewBox="0 0 32 32" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            {/* Alas de Pegaso / Rayos Celestes en Colores Google-Pegasus */}
                                            <path d="M6 24L16 6L26 24L16 19L6 24Z" fill="#4F46E5" fillOpacity="0.15" />
                                            {/* Arco orbital */}
                                            <path d="M4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                                            {/* Estrella Alfa de Pegaso (Markab) */}
                                            <circle cx="16" cy="6" r="3" fill="#4F46E5" />
                                            {/* Estrella Beta (Scheat) */}
                                            <circle cx="26" cy="14" r="2.5" fill="#38BDF8" />
                                            {/* Estrella Gamma (Algenib) */}
                                            <circle cx="24" cy="24" r="2.5" fill="#F59E0B" />
                                            {/* Nodo Núcleo */}
                                            <circle cx="16" cy="18" r="2" fill="#10B981" />
                                            {/* Conexión de constelación */}
                                            <path d="M16 6L26 14L24 24L16 18L8 24L16 6Z" stroke="#6366F1" strokeWidth="1.2" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="leading-none">
                                        <div className="text-xl font-bold tracking-tight text-slate-900">
                                            Pegasus <span className="text-indigo-600 font-extrabold">Nexus</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                                            Sistema Comercial y Operativo
                                        </span>
                                    </div>
                                </div>

                                {/* Encabezado Estilo Google ("Acceder / Iniciar sesión") */}
                                <h1 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight leading-tight">
                                    Iniciar sesión
                                </h1>
                                <p className="text-sm sm:text-base text-slate-600 mt-2 font-normal leading-relaxed">
                                    para continuar a <span className="font-semibold text-slate-900">Pegasus Nexus</span>
                                </p>
                            </div>

                            {/* Insignia Astronómica Pegasus: Fusión de Precisión y Ciencia */}
                            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Constelación de Pegaso • Red Conectada</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Punto de Venta, facturación electrónica y sincronización multi-sucursal en tiempo real.
                                </p>
                                <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>Servidores Operativos • RA 21h · DEC +15°</span>
                                </div>
                            </div>
                        </div>

                        {/* ── COLUMNA DERECHA: Formulario Google Material You ── */}
                        <div className="lg:col-span-7 flex flex-col justify-between w-full lg:pl-4">
                            {/* Alerta de Error Visible */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
                                    >
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                                        <div className="flex-1 font-medium">{error}</div>
                                        <button
                                            type="button"
                                            onClick={() => setError('')}
                                            className="text-red-400 hover:text-red-700 p-0.5"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Campo 1: Correo electrónico o Usuario (Google Outlined Text Field) */}
                                <div>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            required
                                            autoFocus={!username}
                                            autoComplete="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Correo electrónico o usuario"
                                            className="w-full bg-white text-slate-900 border border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3.5 text-sm font-normal outline-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1.5 px-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowResetModal(true)}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                        >
                                            ¿Olvidaste tu usuario?
                                        </button>
                                        {rememberMe && username && (
                                            <button
                                                type="button"
                                                onClick={handleClearRememberedUser}
                                                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                Limpiar guardado
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Campo 2: Contraseña (Google Outlined Text Field) */}
                                <div>
                                    <div className="relative group">
                                        <input
                                            ref={passwordInputRef}
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyDown={handleKeyModifierCheck}
                                            onKeyUp={handleKeyModifierCheck}
                                            placeholder="Ingresa tu contraseña"
                                            className={`w-full bg-white text-slate-900 border border-slate-300 hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl pl-4 pr-11 py-3.5 text-sm font-normal outline-none transition-all placeholder:text-slate-400 ${
                                                capsLockActive ? 'border-amber-400 ring-2 ring-amber-400/30' : ''
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                                            tabIndex={-1}
                                            title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Indicador Bloq Mayús */}
                                    {capsLockActive && (
                                        <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-1.5">
                                            <span className="text-amber-500 font-bold">✦</span> Bloqueo de mayúsculas activado
                                        </div>
                                    )}

                                    <div className="mt-1.5 px-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowResetModal(true)}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                </div>

                                {/* Checkbox "Recordar usuario" */}
                                <div className="flex items-center gap-2.5 pt-1 px-1">
                                    <input
                                        type="checkbox"
                                        id="rememberCheck"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <label htmlFor="rememberCheck" className="text-xs text-slate-600 cursor-pointer select-none">
                                        Recordar mi usuario en este equipo
                                    </label>
                                </div>

                                {/* Texto explicativo estilo Google */}
                                <p className="text-xs text-slate-500 leading-relaxed px-1">
                                    ¿No es tu computadora? Usa el modo incógnito o de invitado para iniciar sesión de forma privada.
                                </p>

                                {/* ── BOTONES DE ACCIÓN INFERIOR (Estilo Google Sign-in: Crear cuenta / Siguiente) ── */}
                                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowNoAccountModal(true)}
                                        className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 px-3 py-2 rounded-full transition-colors"
                                    >
                                        Crear o activar cuenta
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium px-8 py-2.5 rounded-full text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                <span>Verificando...</span>
                                            </>
                                        ) : (
                                            <span>Siguiente</span>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Acceso Alternativo: Clave de Acceso / Passkey / QR */}
                            <div className="mt-8 pt-6 border-t border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setShowPasskeyModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                                >
                                    <QrCode className="w-4 h-4 text-indigo-600" />
                                    <span>Usar una clave de acceso o credencial POS</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </main>

            {/* ═════════════════════════════════════════════════════════════════════
                PIE DE PÁGINA MINIMALISTA ESTILO GOOGLE (Language & Links)
            ═════════════════════════════════════════════════════════════════════ */}
            <footer className="w-full max-w-[1040px] mx-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 relative z-10 select-none">
                {/* Selector de idioma Google */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer transition-colors text-slate-600 font-medium">
                    <span>Español (Latinoamérica)</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Enlaces legales y de soporte */}
                <div className="flex items-center gap-6">
                    <a
                        href="https://wa.me/59170000000?text=Hola,%20necesito%20ayuda%20para%20ingresar%20a%20Pegasus%20Nexus."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-slate-800 transition-colors"
                    >
                        Ayuda
                    </a>
                    <span className="hover:text-slate-800 cursor-pointer transition-colors" onClick={() => setShowNoAccountModal(true)}>
                        Privacidad
                    </span>
                    <span className="hover:text-slate-800 cursor-pointer transition-colors" onClick={() => setShowNoAccountModal(true)}>
                        Condiciones
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                        v2.5 Celestial
                    </span>
                </div>
            </footer>

            {/* ── BURBUJA FLOTANTE DE SOPORTE DIRECTO WHATSAPP ── */}
            <div className="fixed bottom-5 right-5 z-40">
                <a
                    href="https://wa.me/59170000000?text=Hola,%20necesito%20asistencia%20técnica%20para%20ingresar%20a%20Pegasus%20Nexus."
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Centro de Ayuda y Asistencia Técnica"
                    className="w-11 h-11 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                </a>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════
                MODALES INTERACTIVOS ESTILO GOOGLE DIALOG
            ═════════════════════════════════════════════════════════════════════ */}

            {/* Modal: Restablecer Contraseña */}
            <AnimatePresence>
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-[28px] p-7 bg-white border border-slate-200 text-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                    Restablecer contraseña
                                </h3>
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                                Para proteger la privacidad de las ventas y registros de tu empresa, el restablecimiento de contraseñas se canaliza a través del Administrador de tu sucursal o directamente con nuestro equipo de soporte Pegasus.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <a
                                    href={`https://wa.me/59170000000?text=Hola,%20olvidé%20mi%20contraseña%20en%20Pegasus%20Nexus%20para%20el%20usuario:%20${encodeURIComponent(username || 'mi_usuario')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Contactar por WhatsApp
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Crear o Activar Cuenta */}
            <AnimatePresence>
                {showNoAccountModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-[28px] p-7 bg-white border border-slate-200 text-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                    Cuenta Pegasus Nexus
                                </h3>
                                <button
                                    onClick={() => setShowNoAccountModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                                <strong>Pegasus Nexus</strong> es una plataforma de software privado para empresas y comercios. Si tu negocio desea contratar el sistema o abrir nuevas sucursales, puedes comunicarte con nuestro equipo comercial.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowNoAccountModal(false)}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
                                >
                                    Cerrar
                                </button>
                                <a
                                    href="https://wa.me/59170000000?text=Hola,%20deseo%20información%20para%20adquirir%20Pegasus%20Nexus%20para%20mi%20empresa."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Hablar con Ventas
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Clave de Acceso / Credencial POS */}
            <AnimatePresence>
                {showPasskeyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-[28px] p-7 bg-white border border-slate-200 text-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-indigo-600" />
                                    Clave de acceso y terminal POS
                                </h3>
                                <button
                                    onClick={() => setShowPasskeyModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4 font-normal">
                                En puntos de venta físicos táctiles, los cajeros pueden escanear su credencial con código de barras o QR para ingresar a su turno al instante.
                            </p>
                            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200 text-center mb-6">
                                <span className="text-xs font-mono text-indigo-600 font-semibold flex items-center justify-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    Lector de credenciales POS en escucha
                                </span>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowPasskeyModal(false)}
                                    className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
                                >
                                    Entendido
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
