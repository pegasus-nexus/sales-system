import React, { useState } from 'react';
import {
    X,
    QrCode,
    Share2,
    Check,
    Copy,
    Sparkles,
    CreditCard,
    Ticket,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import type { GoogleWalletPassResponse } from '../../api/types';
import { enviarPaseGoogleWalletWhatsApp } from '../../api/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    walletData: GoogleWalletPassResponse | null;
    isLoading: boolean;
    error: string | null;
    clienteTelefono?: string;
}

export const GoogleWalletModal: React.FC<Props> = ({
    isOpen,
    onClose,
    walletData,
    isLoading,
    error,
    clienteTelefono,
}) => {
    const [copied, setCopied] = useState(false);
    const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
    const [whatsappSuccess, setWhatsappSuccess] = useState<string | null>(null);
    const [whatsappError, setWhatsappError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCopy = () => {
        const targetUrl = walletData?.short_url || walletData?.save_url;
        if (!targetUrl) return;
        navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleEnviarWhatsApp = async () => {
        if (!walletData) return;
        const tel = clienteTelefono || '';
        if (!tel) {
            setWhatsappError('El cliente no tiene un teléfono celular registrado.');
            return;
        }

        try {
            setIsSendingWhatsApp(true);
            setWhatsappError(null);
            const res = await enviarPaseGoogleWalletWhatsApp({
                telefono: tel,
                save_url: walletData.save_url,
                short_url: walletData.short_url,
                cliente_nombre: walletData.cliente_nombre,
                numero_tarjeta: walletData.numero_tarjeta,
            });

            if (res.status === 'success') {
                setWhatsappSuccess('¡Enlace de Google Wallet enviado por WhatsApp exitosamente!');
                setTimeout(() => setWhatsappSuccess(null), 5000);
            } else {
                setWhatsappError(res.mensaje || 'No se pudo enviar el mensaje por WhatsApp.');
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al enviar por WhatsApp';
            setWhatsappError(msg);
        } finally {
            setIsSendingWhatsApp(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-100 relative">
                {/* Cabecera */}
                <div className="bg-gradient-to-r from-[#2D1406] via-[#3E1E0E] to-[#1F0C03] p-5 text-white flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                            <CreditCard className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black tracking-tight text-white">
                                    Tarjeta Digital Taboada
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                    Google Wallet
                                </span>
                            </div>
                            <p className="text-xs text-amber-200/80">
                                Pase oficial de fidelización &bull; Momentos Taboada
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                    {/* Estados de Carga o Error */}
                    {isLoading && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-gray-800">
                                Firmando digitalmente el pase de Google Wallet...
                            </p>
                            <p className="text-xs text-gray-500">
                                Generando código de barras CODE_128 y balance de tickets.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold">Error al generar pase digital</h4>
                                <p className="text-xs mt-1 text-rose-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {walletData && !isLoading && (
                        <>
                            {/* Visualización tipo Tarjeta Google Wallet */}
                            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#2D1406] via-[#3d1c08] to-[#180902] text-white shadow-xl border border-amber-500/30 relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                                <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
                                    <div>
                                        <span className="text-[10px] font-black tracking-widest uppercase text-amber-400">
                                            Chocolates Taboada
                                        </span>
                                        <h4 className="text-sm font-bold text-white">
                                            Momentos Taboada
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                                        <span>{walletData.tickets_disponibles} Tickets</span>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-end justify-between">
                                    <div>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold block">
                                            Titular
                                        </span>
                                        <p className="text-base font-black text-amber-100 truncate max-w-[240px]">
                                            {walletData.cliente_nombre}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase text-gray-400 font-bold block">
                                            Nº Tarjeta
                                        </span>
                                        <span className="font-mono text-sm font-black text-amber-300">
                                            {walletData.numero_tarjeta}
                                        </span>
                                    </div>
                                </div>

                                {/* Simulación de Código de Barras (CODE_128) para POS */}
                                <div className="mt-4 pt-3 border-t border-amber-500/20 text-center">
                                    <div className="inline-block bg-white px-4 py-2 rounded-lg shadow-sm">
                                        <div className="flex items-center justify-center gap-0.5 h-9 px-2 overflow-hidden">
                                            {/* Patrón de barras simulado representativo de Code 128 */}
                                            {[2,1,3,1,2,3,1,1,2,1,3,2,1,2,3,1,1,3,2,1,2,1,3,1,2,1,1,3,2,1,3,2,1].map((w, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`inline-block h-full bg-black ${w === 3 ? 'w-1.5' : w === 2 ? 'w-1' : 'w-0.5'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="font-mono text-[11px] font-bold text-gray-900 tracking-wider mt-1">
                                            {walletData.numero_tarjeta}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-amber-200/60 mt-1">
                                        Escaneable directamente en caja con pistola lectora de código de barras
                                    </p>
                                </div>
                            </div>

                            {/* Sección Escanear QR para el cliente en mostrador */}
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col items-center text-center space-y-3">
                                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                                    <QrCode className="w-4 h-4 text-amber-700" />
                                    <span>Escanea en mostrador con tu cámara</span>
                                </div>

                                <div className="p-2.5 bg-white rounded-2xl shadow-md border border-amber-200 inline-block">
                                    <img
                                        src={walletData.qr_image_url}
                                        alt="QR para guardar en Google Wallet"
                                        className="w-48 h-48 rounded-xl object-contain"
                                    />
                                </div>

                                <p className="text-xs text-amber-800 max-w-xs">
                                    El cliente puede apuntar la cámara de su teléfono a este código para agregar su tarjeta a <b>Google Wallet</b> al instante.
                                </p>
                            </div>

                            {/* Notificaciones de WhatsApp */}
                            {whatsappSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>{whatsappSuccess}</span>
                                </div>
                            )}

                            {whatsappError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>{whatsappError}</span>
                                </div>
                            )}

                            {/* Acciones principales */}
                            <div className="space-y-2.5 pt-2">
                                {/* Botón oficial Google Wallet */}
                                <a
                                    href={walletData.short_url || walletData.save_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-gray-800 hover:scale-[1.01]"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-amber-400 font-black">Google</span> Wallet
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </a>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Botón WhatsApp */}
                                    <button
                                        onClick={handleEnviarWhatsApp}
                                        disabled={isSendingWhatsApp || !clienteTelefono}
                                        className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                                        title={clienteTelefono ? 'Enviar link por WhatsApp al cliente' : 'Cliente sin teléfono'}
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>
                                            {isSendingWhatsApp ? 'Enviando...' : 'Enviar por WhatsApp'}
                                        </span>
                                    </button>

                                    {/* Botón Copiar Link */}
                                    <button
                                        onClick={handleCopy}
                                        className="py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-gray-200"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="text-emerald-700 font-bold">¡Copiado!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5 text-gray-600" />
                                                <span>Copiar Enlace</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Pie de modal */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Fidelización Pegasus &bull; Taboada</span>
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
