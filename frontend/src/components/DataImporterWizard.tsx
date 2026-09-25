import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getBISucursales } from '../api/biApi';
import type { BISucursalOption } from '../api/biApi';

export interface HistoricalUploadResult {
    status: string;
    upserted: number;
    modified: number;
    ignored: number;
    total_procesado: number;
    message?: string;
}

interface ImportadorInteligenteProps {
    onClose?: () => void;
    onSuccess?: () => void;
    isModal?: boolean;
}

export default function ImportadorInteligente({ onClose, onSuccess, isModal = false }: ImportadorInteligenteProps) {
    const [sucursal, setSucursal] = useState<string>('');
    const [sucursales, setSucursales] = useState<BISucursalOption[]>([]);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadResult, setUploadResult] = useState<HistoricalUploadResult | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        let mounted = true;
        const fetchSucursales = async () => {
            try {
                const data = await getBISucursales();
                if (mounted && Array.isArray(data) && data.length > 0) {
                    setSucursales(data);
                    setSucursal(data[0].sucursal_id);
                }
            } catch (err) {
                console.error('Error al cargar sucursales para importador:', err);
            }
        };
        fetchSucursales();
        return () => {
            mounted = false;
        };
    }, []);

    const manejarSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!sucursal || !archivo) {
            setError("Por favor, selecciona una sucursal y adjunta un archivo Excel o CSV.");
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', archivo);
            formData.append('sucursal_id', sucursal);

            const isProductionUrl = window.location.hostname.includes('vercel.app') 
                || window.location.hostname.includes('pegasus-nexus.com');
            const fallbackUrl = isProductionUrl ? '/api/v1' : 'http://127.0.0.1:8001/api/v1';
            const baseUrl = import.meta.env.VITE_API_URL ?? fallbackUrl;
            
            const token = useAuthStore.getState().token;
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const respuesta = await fetch(`${baseUrl}/importar-historico`, {
                method: "POST",
                headers,
                body: formData
            });

            if (!respuesta.ok) {
                const errData = await respuesta.json().catch(() => null);
                throw new Error(errData?.detail || `Error HTTP: ${respuesta.status}`);
            }

            const data: HistoricalUploadResult = await respuesta.json();
            
            setUploadResult(data);
            setArchivo(null);
            const fileInputSuccess = document.getElementById('file-input-historico') as HTMLInputElement | null;
            if (fileInputSuccess) fileInputSuccess.value = "";

            if (onSuccess) {
                onSuccess();
            }

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido al procesar el archivo.";
            setError("Falló la importación: " + errorMessage + ". Verifica que el archivo tenga el formato correcto.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={`bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 flex flex-col items-center justify-center animate-in fade-in transition-all duration-300 relative w-full max-w-xl mx-auto`}>
            {isModal && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                    title="Cerrar modal"
                >
                    <X size={18} />
                </button>
            )}

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs border border-indigo-100">
                    <UploadCloud size={28} />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Importador de Datos Históricos
                    </h2>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                        Carga y consolida ventas en el modelo analítico de MongoDB
                    </p>
                </div>
            </div>
            
            {/* Manejo Visual de Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3.5 rounded-2xl w-full mb-5 flex items-start gap-3 shadow-xs animate-in slide-in-from-top-2">
                    <AlertCircle size={20} className="shrink-0 text-rose-600 mt-0.5" />
                    <div>
                        <h4 className="font-black text-xs text-rose-900">Error de Procesamiento</h4>
                        <p className="text-xs font-medium text-rose-700 mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={manejarSubmit} className="w-full space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                        1. Sucursal Destino
                    </label>
                    <div className="relative">
                        <select
                            disabled={isUploading}
                            value={sucursal}
                            onChange={(e) => setSucursal(e.target.value)}
                            className="w-full h-11 bg-white border border-slate-200 text-slate-900 rounded-2xl px-4 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                            <option value="" className="text-slate-900 bg-white">-- Seleccionar Sucursal --</option>
                            {sucursales.length > 0 ? (
                                sucursales.map((s) => (
                                    <option key={s.sucursal_id} value={s.sucursal_id} className="text-slate-900 bg-white">
                                        {s.nombre} ({s.ciudad})
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="Heroínas" className="text-slate-900 bg-white">Heroínas</option>
                                    <option value="Recoleta" className="text-slate-900 bg-white">Recoleta</option>
                                    <option value="Calacoto" className="text-slate-900 bg-white">Calacoto</option>
                                    <option value="CENTRAL" className="text-slate-900 bg-white">CENTRAL</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                        2. Archivo Excel Consolidado (.xlsx, .csv)
                    </label>
                    <div className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-6
                        ${archivo ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'}`}>
                        <input
                            id="file-input-historico"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setArchivo(e.target.files[0]);
                                    setError('');
                                    setUploadResult(null);
                                }
                            }}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="text-center pointer-events-none flex flex-col items-center">
                            <FileSpreadsheet size={30} className={`mb-2 ${archivo ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <h4 className="text-slate-800 font-bold text-xs mb-1">
                                {archivo ? archivo.name : "Subir archivo (Arrastra o Haz Clic)"}
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-400">
                                {archivo ? `${(archivo.size / 1024 / 1024).toFixed(2)} MB` : "Soporta múltiples hojas (.xlsx, .csv)"}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-full py-3.5 rounded-2xl font-black text-white text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2.5 cursor-pointer ${
                        isUploading 
                            ? 'bg-indigo-400 cursor-not-allowed shadow-none' 
                            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                    }`}
                >
                    {isUploading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Procesando e Ingestando en MongoDB...</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={16} />
                            <span>Iniciar Importación Segura</span>
                        </>
                    )}
                </button>
            </form>

            {/* Tarjeta de Auditoría Visual (Resultados) */}
            {uploadResult && (
                <div className="mt-6 w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs animate-in slide-in-from-bottom-3">
                    <div className="flex items-center gap-2.5 mb-3 border-b border-emerald-100 pb-2">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        <h3 className="text-xs font-black text-emerald-950 uppercase tracking-tight">Importación Completada Exitosamente</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-[10px] font-bold text-slate-500 block uppercase">Insertados</span>
                            <span className="text-sm font-black text-emerald-700">{uploadResult.upserted}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-[10px] font-bold text-slate-500 block uppercase">Actualizados</span>
                            <span className="text-sm font-black text-indigo-700">{uploadResult.modified}</span>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                            <span className="text-[10px] font-bold text-slate-500 block uppercase">Ignorados</span>
                            <span className="text-sm font-black text-slate-600">{uploadResult.ignored}</span>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-2.5 border-t border-emerald-100/80 text-center">
                        <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                            Total Registros Procesados: {uploadResult.total_procesado}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
