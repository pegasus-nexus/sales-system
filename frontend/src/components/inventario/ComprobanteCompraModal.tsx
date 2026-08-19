import { Printer, X, Download, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
    reception: any;
    onClose: () => void;
}

export default function ComprobanteCompraModal({ reception, onClose }: Props) {
    if (!reception) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('comprobante-impresion');
        if (!element) return;

        try {
            // Eliminar temporalmente el límite de altura/overflow para capturar todo el div
            const originalMaxHeight = element.style.maxHeight;
            const originalOverflow = element.style.overflow;
            element.style.maxHeight = 'none';
            element.style.overflow = 'visible';

            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            element.style.maxHeight = originalMaxHeight;
            element.style.overflow = originalOverflow;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Comprobante_Ingreso_${reception.numero_documento}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-transparent">
            <div className="bg-white rounded-[24px] w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-full print:h-auto print:max-h-none print:rounded-none">
                
                {/* Header NO-PRINT */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:hidden">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" size={20} />
                        Visor de Comprobante
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
                        >
                            <Download size={18} />
                            Descargar PDF
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Cerrar">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Contenido Imprimible */}
                <div className="p-8 md:p-12 overflow-y-auto bg-white print:p-0 print:overflow-visible flex-1" id="comprobante-impresion">
                    
                    {/* ENCABEZADO TIPO ERP EMPRESARIAL */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 size={28} className="text-gray-900" />
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">PEGASUS <span className="text-indigo-600">ERP</span></h1>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">División de Cadena de Suministro</p>
                            <p className="text-sm text-gray-500">Módulo de Compras e Inventarios</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-widest mb-1">INGRESO</h2>
                            <div className="inline-block bg-gray-100 rounded-lg px-4 py-2 border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Nro. Documento</p>
                                <p className="text-xl font-mono font-bold text-gray-900">{reception.numero_documento}</p>
                            </div>
                        </div>
                    </div>

                    {/* METADATOS DEL DOCUMENTO */}
                    <div className="flex flex-wrap gap-8 mb-8">
                        <div className="flex items-start gap-3">
                            <Calendar className="text-gray-400 mt-0.5" size={20} />
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
                                <p className="font-bold text-gray-900">{format(new Date(reception.created_at || new Date()), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="text-emerald-500 mt-0.5" size={20} />
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado Financiero</p>
                                <p className="font-bold text-gray-900 uppercase">{reception.estado_pago}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FileText className="text-gray-400 mt-0.5" size={20} />
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID Sistema</p>
                                <p className="font-mono text-sm text-gray-900">{reception._id || reception.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* DATOS DEL PROVEEDOR */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Datos del Proveedor</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Razón Social / Nombre</p>
                                <p className="font-bold text-gray-900 text-lg">{reception.proveedor_nombre}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Método de Pago</p>
                                <p className="font-medium text-gray-900 capitalize">{reception.metodo_pago?.replace('_', ' ')}</p>
                            </div>
                            {reception.fecha_vencimiento_credito && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Vencimiento Crédito</p>
                                    <p className="font-medium text-rose-600 font-bold">
                                        {format(new Date(reception.fecha_vencimiento_credito), "dd/MM/yyyy", { locale: es })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TABLA DE PRODUCTOS */}
                    <div className="mb-8 overflow-hidden rounded-xl border border-gray-200">
                        <table className="w-full text-left border-collapse bg-white">
                            <thead className="bg-gray-100 border-b border-gray-300">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider w-16 text-center">Ítem</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción del Producto</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Cant.</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">C.U. (Bs)</th>
                                    <th className="py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reception.detalles?.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-500 text-center">{idx + 1}</td>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-gray-900 text-sm">{item.nombre_producto}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">CÓD: {item.codigo_producto}</p>
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-900">{item.cantidad_recibida}</td>
                                        <td className="py-3 px-4 text-right text-gray-600 text-sm">{Number(item.costo_unitario_real).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">{Number(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* TOTALES */}
                    <div className="flex justify-end mb-12">
                        <div className="w-full md:w-1/2 lg:w-1/3 border border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                                <p className="text-sm font-bold uppercase tracking-widest">Total Importe</p>
                                <p className="text-2xl font-black">Bs. {Number(reception.total_real).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    {reception.notas && (
                        <div className="mb-12">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observaciones / Notas</p>
                            <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl text-sm text-gray-700">
                                {reception.notas}
                            </div>
                        </div>
                    )}

                    {/* FIRMAS */}
                    <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 px-8">
                        <div className="text-center">
                            <div className="border-b border-gray-400 w-full mb-2"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Entregado Por (Proveedor)</p>
                            <p className="text-xs text-gray-400 mt-1">Firma y Aclaración</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-gray-400 w-full mb-2"></div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recibido Por (Almacén)</p>
                            <p className="text-xs text-gray-400 mt-1">Firma y Sello</p>
                        </div>
                    </div>
                    
                    <div className="mt-12 text-center print:block">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Documento generado por Pegasus ERP • www.pegasus-nexus.com</p>
                    </div>
                </div>
            </div>
            
            {/* ESTILOS DE IMPRESIÓN CORREGIDOS */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1.5cm;
                    }
                    /* Ocultar todo el layout y barras laterales del sistema */
                    body * {
                        visibility: hidden;
                    }
                    /* Extraer solo el contenido del comprobante y hacerlo visible */
                    #comprobante-impresion, #comprobante-impresion * {
                        visibility: visible;
                    }
                    /* Posicionar el comprobante en la esquina superior izquierda de la hoja */
                    #comprobante-impresion {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white;
                    }
                }
            `}} />
        </div>
    );
}

