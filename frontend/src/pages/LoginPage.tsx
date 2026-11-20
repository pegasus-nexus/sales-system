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
    Store,
    Package,
    Receipt,
    Globe,
    Shield,
    Sparkles,
    ExternalLink
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

    // Modales de asistencia
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
                    throw new Error('Credenciales incorrectas. Verifique su usuario y contraseña.');
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
                setError('Tiempo de espera agotado. Verifique su conexión e intente de nuevo.');
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
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between selection:bg-indigo-500/20 selection:text-indigo-900 relative">
            
            {/* ═════════════════════════════════════════════════════════════════════
                ZONA CENTRAL: TARJETA DE ACCESO ESTILO "ENTERPRISE CARD MINIMALIST"
            ═════════════════════════════════════════════════════════════════════ */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-10 sm:py-14">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="w-full max-w-[430px] bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/70 p-7 sm:p-9 relative z-10"
                >
                    {/* 1. LOGO E IDENTIDAD PROPIA PEGASUS NEXUS */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="flex items-center gap-3">
                            {/* Isotipo Alado Pegasus en Azul Real / Zafiro */}
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white shrink-0">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L15 9L22 9L16.5 13.5L18.5 20.5L12 16L5.5 20.5L7.5 13.5L2 9L9 9Z" fill="currentColor" fillOpacity="0.18" />
                                    <circle cx="12" cy="12" r="2.2" fill="currentColor" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                                    PEGASUS <span className="text-indigo-600 font-extrabold">NEXUS</span>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                    Commercial Operating System
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. BANNER INFORMATIVO SUAVE CON IDENTIDAD PEGASUS */}
                    <div className="mb-6 rounded-xl p-3.5 text-center text-xs sm:text-[13px] leading-relaxed bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1]">
                        Acceda y gestione sus ventas, facturación e inventario desde <strong className="font-bold text-[#0284C7]">pegasus-nexus.com</strong>.
                    </div>

                    {/* 3. ALERTA DE ERROR VISIBLE */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                                <div className="flex-1 font-medium">{error}</div>
                                <button
                                    type="button"
                                    onClick={() => setError('')}
                                    className="text-red-400 hover:text-red-700"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 4. FORMULARIO ERGONÓMICO */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Campo: Correo electrónico o Usuario */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-700">
                                    Correo electrónico o usuario
                                </label>
                                {rememberMe && username && (
                                    <button
                                        type="button"
                                        onClick={handleClearRememberedUser}
                                        className="text-[11px] text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        Limpiar guardado
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                required
                                autoFocus={!username}
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="cajero@pegasus-nexus.com o admin"
                                className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium border border-slate-300/80 bg-[#EFF6FF]/70 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                            />
                        </div>

                        {/* Campo: Contraseña */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-700">
                                    Contraseña
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowResetModal(true)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                >
                                    Restablecer contraseña
                                </button>
                            </div>
                            <div className="relative">
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
                                    className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-medium border border-slate-300/80 bg-[#EFF6FF]/70 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all ${
                                        capsLockActive ? 'border-amber-400 ring-2 ring-amber-400/30' : ''
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                                    tabIndex={-1}
                                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Alerta CapsLock */}
                            {capsLockActive && (
                                <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                                    <span className="text-amber-500">✦</span> Bloqueo de mayúsculas activado
                                </div>
                            )}
                        </div>

                        {/* Recordar usuario */}
                        <div className="flex items-center justify-between pt-0.5">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-xs text-slate-600">
                                    Recordar mi usuario
                                </span>
                            </label>
                            <span className="text-[11px] text-slate-400">
                                En este equipo
                            </span>
                        </div>

                        {/* Botón Principal: Colores Propios de Pegasus Nexus (Indigo Real) */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm tracking-wider uppercase disabled:opacity-60 cursor-pointer shadow-md shadow-indigo-600/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    <span>Verificando credenciales...</span>
                                </>
                            ) : (
                                <span>Iniciar sesión</span>
                            )}
                        </button>
                    </form>

                    {/* 5. ENLACE INFERIOR: ¿No tiene una cuenta? */}
                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setShowNoAccountModal(true)}
                            className="text-xs text-slate-600 hover:text-slate-900 transition-colors hover:underline"
                        >
                            ¿No tiene una cuenta?
                        </button>
                    </div>

                    {/* 6. DIVISOR Y BOTÓN SECUNDARIO: Clave de acceso / QR POS */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80">
                        <button
                            type="button"
                            onClick={() => setShowPasskeyModal(true)}
                            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2.5 text-xs font-semibold transition-all shadow-sm"
                        >
                            <QrCode className="w-4 h-4 text-indigo-600" />
                            <span>Usar una clave de acceso</span>
                        </button>
                    </div>
                </motion.div>
            </main>

            {/* ═════════════════════════════════════════════════════════════════════
                PIE CORPORATIVO (DARK ENTERPRISE FOOTER DE PEGASUS NEXUS)
            ═════════════════════════════════════════════════════════════════════ */}
            <footer className="w-full bg-[#0B0F19] border-t border-slate-800 text-slate-400 text-xs py-10 px-6 sm:px-12 lg:px-16 select-none">
                <div className="max-w-6xl mx-auto">
                    {/* Logotipo en el pie y resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Columna 1: Marca & Misión */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-black text-white tracking-tight">
                                    PEGASUS <span className="text-indigo-400">NEXUS</span>
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Plataforma de gestión comercial, ventas ágiles en caja, inventario en tiempo real y facturación integrada para empresas y franquicias.
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Sistema Operativo en Línea</span>
                            </div>
                        </div>

                        {/* Columna 2: Módulos Principales */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                                Ecosistema Modular
                            </h4>
                            <ul className="space-y-2 text-slate-400">
                                <li className="flex items-center gap-2 hover:text-slate-200 cursor-pointer transition-colors">
                                    <Store className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Punto de Venta Táctil (POS)</span>
                                </li>
                                <li className="flex items-center gap-2 hover:text-slate-200 cursor-pointer transition-colors">
                                    <Package className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Control de Stock y Kardex</span>
                                </li>
                                <li className="flex items-center gap-2 hover:text-slate-200 cursor-pointer transition-colors">
                                    <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Caja, Arqueos y Facturación</span>
                                </li>
                                <li className="flex items-center gap-2 hover:text-slate-200 cursor-pointer transition-colors">
                                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Catálogo Digital en la Web</span>
                                </li>
                            </ul>
                        </div>

                        {/* Columna 3: Arquitectura & Seguridad */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                                Seguridad y Confianza
                            </h4>
                            <ul className="space-y-2 text-slate-400">
                                <li className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Aislamiento Estricto Multi-Tenant</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>Cifrado TLS 1.3 de Extremo a Extremo</span>
                                </li>
                                <li className="hover:text-slate-200 cursor-pointer transition-colors">
                                    <span>Respaldos Automáticos Diarios</span>
                                </li>
                                <li className="hover:text-slate-200 cursor-pointer transition-colors">
                                    <span>Trazabilidad Auditora Completa</span>
                                </li>
                            </ul>
                        </div>

                        {/* Columna 4: Asistencia & Contacto */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                                Asistencia Corporativa
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                ¿Desea implementar Pegasus Nexus en su comercio o necesita soporte de su cuenta?
                            </p>
                            <a
                                href="https://wa.me/59170000000?text=Hola,%20deseo%20asistencia%20sobre%20Pegasus%20Nexus."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs font-medium"
                            >
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                <span>Centro de Ayuda WhatsApp</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                        </div>
                    </div>

                    {/* Fila Inferior de Copyright */}
                    <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
                        <div>
                            © 2026 Pegasus Nexus Commercial OS • Todos los derechos reservados.
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="hover:text-slate-400 cursor-pointer">Privacidad de Datos</span>
                            <span>•</span>
                            <span className="hover:text-slate-400 cursor-pointer">Términos de Servicio</span>
                            <span>•</span>
                            <span className="text-indigo-400 font-medium">v2.5 Release</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ═════════════════════════════════════════════════════════════════════
                BURBUJA FLOTANTE DE SOPORTE (AZUL / ÍNDIGO PEGASUS NEXUS)
            ═════════════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-5 right-5 z-40">
                <a
                    href="https://wa.me/59170000000?text=Hola,%20necesito%20asistencia%20técnica%20para%20ingresar%20a%20Pegasus%20Nexus."
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Soporte Técnico Oficial de Pegasus Nexus"
                    className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    <MessageCircle className="w-6 h-6" />
                </a>
            </div>

            {/* ═════════════════════════════════════════════════════════════════════
                MODALES INTERACTIVOS DE ASISTENCIA
            ═════════════════════════════════════════════════════════════════════ */}

            {/* Modal: Restablecer Contraseña */}
            <AnimatePresence>
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm rounded-2xl p-6 bg-white border border-slate-200 text-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                    Restablecer contraseña
                                </h3>
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                Por seguridad de su empresa y trazabilidad auditora, el restablecimiento de contraseñas se realiza a través del Administrador de su comercio o del equipo oficial de soporte Pegasus.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href={`https://wa.me/59170000000?text=Hola,%20olvidé%20mi%20contraseña%20en%20Pegasus%20Nexus%20para%20el%20usuario:%20${encodeURIComponent(username || 'mi_usuario')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Contactar soporte por WhatsApp
                                </a>
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Volver al inicio de sesión
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: ¿No tiene una cuenta? */}
            <AnimatePresence>
                {showNoAccountModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm rounded-2xl p-6 bg-white border border-slate-200 text-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Acceso a Pegasus Nexus
                                </h3>
                                <button
                                    onClick={() => setShowNoAccountModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                <strong>Pegasus Nexus</strong> es una plataforma comercial empresarial privada. Si su empresa ya es cliente, solicite a su administrador de sucursal que cree su usuario cajero o encargado.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="https://wa.me/59170000000?text=Hola,%20deseo%20información%20para%20adquirir%20Pegasus%20Nexus%20para%20mi%20empresa."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Solicitar una cuenta comercial
                                </a>
                                <button
                                    onClick={() => setShowNoAccountModal(false)}
                                    className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Clave de Acceso / Passkey / Lector QR */}
            <AnimatePresence>
                {showPasskeyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm rounded-2xl p-6 bg-white border border-slate-200 text-slate-900 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                    <QrCode className="w-4 h-4 text-indigo-600" />
                                    Clave de Acceso y Credenciales POS
                                </h3>
                                <button
                                    onClick={() => setShowPasskeyModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">
                                En terminales táctiles de punto de venta configurados, puede aproximar su credencial física NFC o escanear su código QR de cajero para iniciar turno instantáneamente.
                            </p>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center mb-4">
                                <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                                    ✦ Lector de credenciales POS activo
                                </span>
                            </div>
                            <button
                                onClick={() => setShowPasskeyModal(false)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl text-xs font-semibold transition-colors shadow-sm"
                            >
                                Entendido
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
