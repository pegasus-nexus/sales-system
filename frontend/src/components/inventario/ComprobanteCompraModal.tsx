import { Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
    reception: any;
    onClose: () => void;
}

export default function ComprobanteCompraModal({ reception, onClose }: Props) {
    if (!reception) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:bg-white print:p-0 print:block">
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:max-w-full print:h-auto print:max-h-none print:rounded-none">
                
                {/* Header NO-PRINT */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
                    <h2 className="text-xl font-bold text-gray-900">Comprobante de Ingreso</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Contenido Imprimible */}
                <div className="p-10 overflow-y-auto print:p-4 print:overflow-visible" id="comprobante-impresion">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-gray-900">COMPROBANTE DE INGRESO</h1>
                        <p className="text-gray-500 font-medium mt-1">Recepción de Mercadería</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl print:bg-white print:border print:border-gray-200">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Proveedor</p>
                            <p className="font-bold text-gray-900">{reception.proveedor_nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nro. Documento</p>
                            <p className="font-bold text-gray-900">{reception.numero_documento}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha</p>
                            <p className="font-bold text-gray-900">
                                {format(new Date(reception.created_at || new Date()), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Forma de Pago</p>
                            <p className="font-bold text-gray-900">{reception.metodo_pago?.replace('_', ' ')}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                            <p className="font-bold text-gray-900">{reception.estado_pago}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ID Recepción</p>
                            <p className="font-mono text-sm text-gray-900">{reception._id || reception.id}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="py-3 text-sm font-bold text-gray-900 uppercase">Producto</th>
                                    <th className="py-3 text-sm font-bold text-gray-900 uppercase text-center">Cant.</th>
                                    <th className="py-3 text-sm font-bold text-gray-900 uppercase text-right">Costo Unit.</th>
                                    <th className="py-3 text-sm font-bold text-gray-900 uppercase text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reception.detalles?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-4">
                                            <p className="font-bold text-gray-900">{item.nombre_producto}</p>
                                            <p className="text-xs text-gray-500">{item.codigo_producto}</p>
                                        </td>
                                        <td className="py-4 text-center font-medium text-gray-900">{item.cantidad_recibida}</td>
                                        <td className="py-4 text-right font-medium text-gray-900">Bs. {item.costo_unitario_real}</td>
                                        <td className="py-4 text-right font-bold text-gray-900">Bs. {item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t-2 border-black pt-4 flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-900 uppercase tracking-widest">Total</p>
                        <p className="text-3xl font-black text-gray-900">Bs. {reception.total_real}</p>
                    </div>
                    
                    {reception.notas && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notas</p>
                            <p className="text-sm text-gray-700">{reception.notas}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* CSS to hide everything else when printing */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body > *:not(.fixed) { display: none !important; }
                }
            `}} />
        </div>
    );
}
