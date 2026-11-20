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
    Sun,
    Moon,
    X,
    ShieldCheck,
    CheckCircle2
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

    // Modal states para interactividad limpia estilo Odoo
    const [showResetModal, setShowResetModal] = useState(false);
    const [showNoAccountModal, setShowNoAccountModal] = useState(false);
    const [showPasskeyModal, setShowPasskeyModal] = useState(false);

    // Modo oscuro / claro (por defecto falso: estilo limpio Odoo como en la referencia)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('pegasus_login_theme') === 'dark';
    });

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Cargar usuario recordado y tema
    useEffect(() => {
        const savedUser = localStorage.getItem('pegasus_remembered_username');
        if (savedUser) {
            setUsername(savedUser);
            setRememberMe(true);
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = !isDarkMode;
        setIsDarkMode(nextTheme);
        localStorage.setItem('pegasus_login_theme', nextTheme ? 'dark' : 'light');
    };

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
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200 relative ${
            isDarkMode 
                ? 'bg-[#0B0F19] text-slate-100' 
                : 'bg-[#F8FAFC] text-slate-800'
        }`}>
            {/* ── BOTÓN CAMBIO DE TEMA SUTIL EN LA ESQUINA SUPERIOR DERECHA ── */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    type="button"
                    title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    className={`p-2 rounded-xl transition-all border ${
                        isDarkMode 
                            ? 'bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                    }`}
                >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>

            {/* ── TARJETA PRINCIPAL ESTILO ODOO CON IDENTIDAD PEGASUS NEXUS ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`w-full max-w-[430px] rounded-2xl border p-7 sm:p-9 shadow-xl relative z-10 transition-colors duration-200 ${
                    isDarkMode
                        ? 'bg-[#111827] border-slate-800 shadow-black/40'
                        : 'bg-white border-slate-200/90 shadow-slate-200/60'
                }`}
            >
                {/* 1. LOGO CENTRADO PEGASUS NEXUS */}
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="flex items-center gap-2.5">
                        {/* Emblema Pegasus Vectorial Estelar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15 9L22 9L16.5 13.5L18.5 20.5L12 16L5.5 20.5L7.5 13.5L2 9L9 9Z" fill="currentColor" fillOpacity="0.15" />
                                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className={`text-2xl font-black tracking-tight ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                                pegasus <span className="text-indigo-600 font-extrabold">nexus</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. BANNER INFORMATIVO SUAVE ESTILO ODOO */}
                <div className={`mb-6 rounded-xl p-3.5 text-center text-xs sm:text-[13px] leading-relaxed border transition-colors ${
                    isDarkMode
                        ? 'bg-sky-950/40 border-sky-800/60 text-sky-200'
                        : 'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]'
                }`}>
                    Acceda y gestione sus ventas, facturación e inventario desde <strong>pegasus-nexus.com</strong>.
                </div>

                {/* 3. ALERTA DE ERROR SI FALLA EL LOGIN */}
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

                {/* 4. FORMULARIO PRINCIPAL */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo: Correo electrónico o Usuario */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className={`text-xs font-semibold ${
                                isDarkMode ? 'text-slate-200' : 'text-slate-700'
                            }`}>
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
                            placeholder="admin@pegasus-nexus.com"
                            className={`w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium border transition-all focus:outline-none focus:ring-2 ${
                                isDarkMode
                                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-[#0F172A] focus:border-indigo-400 focus:ring-indigo-500/30'
                                    : 'bg-[#EFF6FF]/70 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-indigo-100'
                            }`}
                        />
                    </div>

                    {/* Campo: Contraseña con enlace a restablecer a la derecha */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className={`text-xs font-semibold ${
                                isDarkMode ? 'text-slate-200' : 'text-slate-700'
                            }`}>
                                Contraseña
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowResetModal(true)}
                                className={`text-xs font-medium transition-colors hover:underline ${
                                    isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'
                                }`}
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
                                className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-medium border transition-all focus:outline-none focus:ring-2 ${
                                    isDarkMode
                                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-[#0F172A] focus:border-indigo-400 focus:ring-indigo-500/30'
                                        : 'bg-[#EFF6FF]/70 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-indigo-100'
                                } ${capsLockActive ? 'border-amber-400 ring-1 ring-amber-400/40' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                                    isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                                }`}
                                tabIndex={-1}
                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Indicador de Bloq Mayús */}
                        {capsLockActive && (
                            <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span> Bloqueo de mayúsculas activado
                            </div>
                        )}
                    </div>

                    {/* Recordar mi usuario */}
                    <div className="flex items-center justify-between pt-0.5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                Recordar mi usuario
                            </span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                            En este equipo
                        </span>
                    </div>

                    {/* Botón Principal: INICIAR SESIÓN */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm tracking-wider uppercase disabled:opacity-60 cursor-pointer shadow-md ${
                            isDarkMode
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50'
                                : 'bg-[#875A7B] hover:bg-[#734B69] text-white shadow-slate-300'
                        }`}
                        style={{
                            backgroundColor: isDarkMode ? undefined : '#875A7B' // Color característico sobrio Odoo o personalizable
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>Verificando...</span>
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
                        className={`text-xs transition-colors hover:underline ${
                            isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        ¿No tiene una cuenta?
                    </button>
                </div>

                {/* 6. DIVISOR Y BOTÓN SECUNDARIO: Usar una clave de acceso (Estilo Odoo QR/Passkey) */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setShowPasskeyModal(true)}
                        className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition-all shadow-sm ${
                            isDarkMode
                                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                        }`}
                    >
                        <QrCode className="w-4 h-4 text-indigo-500" />
                        <span>Usar una clave de acceso</span>
                    </button>
                </div>
            </motion.div>

            {/* ── BOTÓN FLOTANTE INFERIOR DERECHO: SOPORTE ESTILO ODOO (Chat Bubble) ── */}
            <div className="fixed bottom-5 right-5 z-30">
                <a
                    href="https://wa.me/59170000000?text=Hola,%20necesito%20asistencia%20técnica%20para%20ingresar%20a%20Pegasus%20Nexus."
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Asistencia técnica por WhatsApp"
                    className="w-12 h-12 rounded-full bg-[#875A7B] hover:bg-[#734B69] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    <MessageCircle className="w-6 h-6" />
                </a>
            </div>

            {/* ── MODAL: RESTABLECER CONTRASEÑA ── */}
            <AnimatePresence>
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${
                                isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
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
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                Por seguridad de su sucursal, el restablecimiento de claves se realiza a través del administrador de su empresa o del equipo de soporte oficial de Pegasus Nexus.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href={`https://wa.me/59170000000?text=Hola,%20olvidé%20mi%20contraseña%20en%20Pegasus%20Nexus%20para%20el%20usuario:%20${encodeURIComponent(username || 'mi_usuario')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#875A7B] hover:bg-[#734B69] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Contactar soporte por WhatsApp
                                </a>
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Entendido, volver al login
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL: ¿NO TIENE UNA CUENTA? ── */}
            <AnimatePresence>
                {showNoAccountModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${
                                isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Activación de cuenta
                                </h3>
                                <button
                                    onClick={() => setShowNoAccountModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                <strong>Pegasus Nexus</strong> es una plataforma comercial privada para empresas y comercios. Si su empresa ya es cliente, solicite al administrador de su sucursal que le asigne un usuario.
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
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL: USAR CLAVE DE ACCESO / PASSKEY ── */}
            <AnimatePresence>
                {showPasskeyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${
                                isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <QrCode className="w-4 h-4 text-indigo-600" />
                                    Clave de acceso y credenciales
                                </h3>
                                <button
                                    onClick={() => setShowPasskeyModal(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                Para ingresar con credencial física, tarjeta NFC o código QR de cajero en terminales POS habilitados, acerque su credencial al lector del mostrador o ingrese sus credenciales habituales.
                            </p>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center mb-4">
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    ✦ Lector de credenciales POS activo
                                </span>
                            </div>
                            <button
                                onClick={() => setShowPasskeyModal(false)}
                                className="w-full bg-[#875A7B] hover:bg-[#734B69] text-white py-2 px-4 rounded-xl text-xs font-semibold transition-colors"
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
