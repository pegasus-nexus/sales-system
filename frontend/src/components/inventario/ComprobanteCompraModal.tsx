import { Printer, X, Download, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
    reception: any;
    onClose: () => void;
}

export default function ComprobanteCompraModal({ reception, onClose }: Props) {
    if (!reception) return null;

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const fechaStr = reception.created_at
            ? format(new Date(reception.created_at), "dd/MM/yyyy HH:mm", { locale: es })
            : format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });

        const vencStr = reception.fecha_vencimiento_credito
            ? format(new Date(reception.fecha_vencimiento_credito), "dd/MM/yyyy", { locale: es })
            : '';

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comprobante de Ingreso #${reception.numero_documento || ''}</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                        color: #111827;
                        background: #ffffff;
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    * { box-sizing: border-box; }
                    .header-erp { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px; }
                    .meta-grid { display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 24px; }
                    .meta-item { display: flex; flex-direction: column; }
                    .meta-label { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
                    .meta-val { font-size: 13px; font-weight: bold; color: #111827; }
                    .prov-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-bottom: 24px; }
                    .prov-title { font-size: 10px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
                    .prov-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
                    th { background: #f3f4f6; color: #374151; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 10px 12px; border-bottom: 1px solid #d1d5db; }
                    td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; color: #111827; }
                    .totals-box { display: flex; justify-content: flex-end; margin-bottom: 30px; }
                    .totals-inner { background: #111827; color: #ffffff; padding: 14px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; min-width: 260px; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; padding: 0 32px; }
                    .sig-line { border-bottom: 1px solid #9ca3af; margin-bottom: 6px; }
                    .sig-text { font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase; text-align: center; }
                    .sig-sub { font-size: 10px; color: #9ca3af; text-align: center; margin-top: 2px; }
                    .footer-note { text-align: center; margin-top: 36px; font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; }
                </style>
            </head>
            <body>
                <div class="header-erp">
                    <div>
                        <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #111827; letter-spacing: -0.02em;">PEGASUS <span style="color: #4f46e5;">ERP</span></h1>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #6b7280; font-weight: 500;">División de Cadena de Suministro</p>
                        <p style="margin: 1px 0 0; font-size: 11px; color: #6b7280;">Módulo de Compras e Inventarios</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0 0 4px; font-size: 24px; font-weight: 900; letter-spacing: 0.1em;">INGRESO</h2>
                        <div style="background: #f3f4f6; border: 1px solid #e5e7eb; padding: 4px 12px; border-radius: 6px; display: inline-block;">
                            <div style="font-size: 9px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Nro. Documento</div>
                            <div style="font-size: 16px; font-family: monospace; font-weight: bold; color: #111827;">${reception.numero_documento || ''}</div>
                        </div>
                    </div>
                </div>

                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">Fecha de Emisión</span>
                        <span class="meta-val">${fechaStr}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Estado Financiero</span>
                        <span class="meta-val" style="color: #059669;">${reception.estado_pago || 'PAGADO'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">ID Sistema</span>
                        <span class="meta-val" style="font-family: monospace; font-size: 11px;">${reception._id || reception.id || ''}</span>
                    </div>
                </div>

                <div class="prov-card">
                    <div class="prov-title">Datos del Proveedor</div>
                    <div class="prov-grid">
                        <div>
                            <div class="meta-label">Razón Social / Nombre</div>
                            <div style="font-size: 15px; font-weight: bold; color: #111827; margin-top: 2px;">${reception.proveedor_nombre || '-'}</div>
                        </div>
                        <div>
                            <div class="meta-label">Método de Pago</div>
                            <div style="font-size: 13px; font-weight: 500; color: #111827; margin-top: 2px; text-transform: capitalize;">${(reception.metodo_pago || '').replace('_', ' ')}</div>
                        </div>
                        ${vencStr ? `
                        <div>
                            <div class="meta-label">Vencimiento Crédito</div>
                            <div style="font-size: 13px; font-weight: bold; color: #e11d48; margin-top: 2px;">${vencStr}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">Ítem</th>
                            <th style="text-align: left;">Descripción del Producto</th>
                            <th style="width: 70px; text-align: center;">Cant.</th>
                            <th style="width: 90px; text-align: right;">C.U. (Bs)</th>
                            <th style="width: 100px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(reception.detalles || []).map((item: any, idx: number) => `
                            <tr>
                                <td style="text-align: center; color: #6b7280;">${idx + 1}</td>
                                <td>
                                    <div style="font-weight: bold; color: #111827;">${item.nombre_producto || '-'}</div>
                                    <div style="font-size: 10px; color: #6b7280; font-family: monospace;">CÓD: ${item.codigo_producto || '-'}</div>
                                </td>
                                <td style="text-align: center; font-weight: bold;">${item.cantidad_recibida}</td>
                                <td style="text-align: right; color: #4b5563;">${Number(item.costo_unitario_real).toFixed(2)}</td>
                                <td style="text-align: right; font-weight: bold; color: #111827;">${Number(item.subtotal).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals-box">
                    <div class="totals-inner">
                        <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Total Importe</span>
                        <span style="font-size: 20px; font-weight: 900;">Bs. ${Number(reception.total_real).toFixed(2)}</span>
                    </div>
                </div>

                ${reception.notas ? `
                <div style="margin-bottom: 24px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
                    <div style="font-size: 10px; font-weight: bold; color: #92400e; text-transform: uppercase;">Observaciones</div>
                    <div style="font-size: 12px; color: #78350f; margin-top: 2px;">${reception.notas}</div>
                </div>
                ` : ''}

                <div class="signatures">
                    <div>
                        <div class="sig-line"></div>
                        <div class="sig-text">Entregado Por (Proveedor)</div>
                        <div class="sig-sub">Firma y Aclaración</div>
                    </div>
                    <div>
                        <div class="sig-line"></div>
                        <div class="sig-text">Recibido Por (Almacén)</div>
                        <div class="sig-sub">Firma y Sello</div>
                    </div>
                </div>

                <div class="footer-note">Documento generado por Pegasus ERP • www.pegasus-nexus.com</div>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 250);
    };

    const handleDownloadPDF = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pw = doc.internal.pageSize.getWidth();

            // Header Banner
            doc.setFillColor(17, 24, 39);
            doc.rect(0, 0, pw, 32, 'F');
            doc.setFillColor(79, 70, 229);
            doc.rect(0, 0, 5, 32, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text('PEGASUS ERP', 14, 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(156, 163, 175);
            doc.text('División de Cadena de Suministro • Módulo de Compras e Inventarios', 14, 22);

            // Document Number on Right
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text('INGRESO', pw - 14, 13, { align: 'right' });
            doc.setFontSize(9);
            doc.setTextColor(209, 213, 219);
            doc.text(`Nro: ${reception.numero_documento || 'S/N'}`, pw - 14, 21, { align: 'right' });

            // Metadata Row
            let y = 40;
            const fechaEmision = reception.created_at 
                ? format(new Date(reception.created_at), "dd/MM/yyyy HH:mm", { locale: es })
                : format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });

            const metaCards = [
                { label: 'FECHA DE EMISIÓN', value: fechaEmision },
                { label: 'ESTADO FINANCIERO', value: (reception.estado_pago || 'PAGADO').toUpperCase() },
                { label: 'MÉTODO DE PAGO', value: (reception.metodo_pago || 'CONTADO').replace('_', ' ') },
            ];

            const cardW = (pw - 28 - (metaCards.length - 1) * 4) / metaCards.length;
            metaCards.forEach((c, idx) => {
                const cx = 14 + idx * (cardW + 4);
                doc.setFillColor(243, 244, 246);
                doc.roundedRect(cx, y, cardW, 16, 2, 2, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(107, 114, 128);
                doc.text(c.label, cx + 4, y + 5.5);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(17, 24, 39);
                doc.text(c.value, cx + 4, y + 12);
            });

            y += 22;

            // Supplier Card
            doc.setFillColor(249, 250, 251);
            doc.setDrawColor(229, 231, 235);
            doc.roundedRect(14, y, pw - 28, 18, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(107, 114, 128);
            doc.text('PROVEEDOR / RAZÓN SOCIAL:', 18, y + 6);
            doc.setFontSize(10);
            doc.setTextColor(17, 24, 39);
            doc.text(reception.proveedor_nombre || 'No especificado', 18, y + 13);

            if (reception.fecha_vencimiento_credito) {
                const venc = format(new Date(reception.fecha_vencimiento_credito), "dd/MM/yyyy", { locale: es });
                doc.setFontSize(7.5);
                doc.setTextColor(107, 114, 128);
                doc.text('VENCIMIENTO CRÉDITO:', pw - 18, y + 6, { align: 'right' });
                doc.setFontSize(9);
                doc.setTextColor(225, 29, 72);
                doc.text(venc, pw - 18, y + 13, { align: 'right' });
            }

            y += 24;

            // Products Table
            const tableBody = (reception.detalles || []).map((item: any, idx: number) => [
                idx + 1,
                `${item.nombre_producto || ''}\nCód: ${item.codigo_producto || '-'}`,
                item.cantidad_recibida,
                `Bs. ${Number(item.costo_unitario_real).toFixed(2)}`,
                `Bs. ${Number(item.subtotal).toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: y,
                margin: { left: 14, right: 14 },
                head: [['#', 'Descripción del Producto', 'Cant.', 'C.U.', 'Subtotal']],
                body: tableBody,
                theme: 'grid',
                headStyles: {
                    fillColor: [31, 41, 55],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    textColor: [17, 24, 39]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'left' },
                    2: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
                    3: { halign: 'right', cellWidth: 30 },
                    4: { halign: 'right', cellWidth: 32, fontStyle: 'bold' }
                }
            });

            // Total Box below table
            const finalY = (doc as any).lastAutoTable.finalY + 8;
            const totalWidth = 65;
            doc.setFillColor(17, 24, 39);
            doc.roundedRect(pw - 14 - totalWidth, finalY, totalWidth, 16, 2, 2, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(209, 213, 219);
            doc.text('TOTAL IMPORTE', pw - 14 - totalWidth + 5, finalY + 6);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text(`Bs. ${Number(reception.total_real).toFixed(2)}`, pw - 14 - totalWidth + 5, finalY + 12);

            // Notes if any
            let sigY = finalY + 28;
            if (reception.notas) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(107, 114, 128);
                doc.text('OBSERVACIONES:', 14, finalY + 5);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(55, 65, 81);
                doc.text(reception.notas, 14, finalY + 11, { maxWidth: pw - 28 - totalWidth - 8 });
            }

            // Signatures
            if (sigY + 25 > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                sigY = 40;
            }

            const sigW = 60;
            const sig1X = 25;
            const sig2X = pw - 25 - sigW;
            doc.setDrawColor(156, 163, 175);
            doc.line(sig1X, sigY, sig1X + sigW, sigY);
            doc.line(sig2X, sigY, sig2X + sigW, sigY);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(107, 114, 128);
            doc.text('ENTREGADO POR (PROVEEDOR)', sig1X + sigW / 2, sigY + 5, { align: 'center' });
            doc.text('RECIBIDO POR (ALMACÉN)', sig2X + sigW / 2, sigY + 5, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(156, 163, 175);
            doc.text('Firma y Aclaración', sig1X + sigW / 2, sigY + 9, { align: 'center' });
            doc.text('Firma y Sello', sig2X + sigW / 2, sigY + 9, { align: 'center' });

            // Footer
            doc.setFontSize(6.5);
            doc.text('Documento generado por Pegasus ERP • www.pegasus-nexus.com', pw / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

            doc.save(`Comprobante_Ingreso_${reception.numero_documento || 'S_N'}.pdf`);
            toast.success('PDF descargado exitosamente');
        } catch (error) {
            console.error('Error generating PDF', error);
            toast.error('Error al generar el PDF');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:static print:p-0 print:bg-transparent print:flex-none print:items-start">
            <div className="bg-white rounded-[24px] w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-full print:h-auto print:max-h-none print:rounded-none print:overflow-visible">
                
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
                        margin: 1cm;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #comprobante-impresion, #comprobante-impresion * {
                        visibility: visible !important;
                    }
                    #comprobante-impresion {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        z-index: 999999 !important;
                    }
                }
            `}} />
        </div>
    );
}

