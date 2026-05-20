import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function generateExecutivePDF(kpis: any, matrizBcg: any, orchestration: any) {
    const doc = new jsPDF('portrait', 'pt', 'a4');
    
    // Configuración de colores
    const config = {
        primary: [79, 70, 229] as [number, number, number], // Indigo 600
        dark: [17, 24, 39] as [number, number, number],      // Gray 900
        light: [243, 244, 246] as [number, number, number],  // Gray 100
    };

    // Header Membrete
    doc.setFillColor(...config.dark);
    doc.rect(0, 0, 595.28, 90, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Taboada Inteligencia BI", 40, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Reporte Oficial de Analítica Ejecutiva`, 40, 70);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 420, 70);

    let currentY = 130;

    // 1. Resumen de Orchestration (Métricas Generales)
    doc.setTextColor(...config.dark);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("1. Resumen Directivo", 40, currentY);
    currentY += 25;

    // Kpis Generales Mapeados
    const kpiData = [
        ["Total Ingresos Brutos", `Bs. ${orchestration?.overview?.total_revenue?.toFixed(2) || 0}`],
        ["Margen Neto (Estimado)", `Bs. ${kpis?.margen_bruto?.toFixed(2) || 0}`],
        ["Ticket Promedio", `Bs. ${orchestration?.overview?.average_ticket?.toFixed(2) || 0}`],
        ["Transacciones Triunfantes", `${orchestration?.overview?.total_orders || 0} ventas`],
    ];

    (doc as any).autoTable({
        startY: currentY,
        body: kpiData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 8 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: [100, 100, 100] },
            1: { fontStyle: 'bold', textColor: config.dark, halign: 'right' }
        },
        margin: { left: 40, right: 40 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 40;

    // 2. Alertas de Estrellas y Perros (BCG Matrix)
    if (matrizBcg) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("2. Rentabilidad del Catálogo (Matriz BCG)", 40, currentY);
        currentY += 20;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Productos ESTRELLA (Requieren más marketing, altísima penetración):", 40, currentY);
        currentY += 15;

        // Tabla Estrellas
        const estrellasRows = (matrizBcg.estrellas || []).slice(0, 5).map((p: any) => [
            p.nombre,
            `Bs. ${p.ingresos_actuales.toFixed(2)}`,
            `${(p.crecimiento * 100).toFixed(1)}%`
        ]);

        if (estrellasRows.length > 0) {
            (doc as any).autoTable({
                startY: currentY,
                head: [['Producto Líder', 'Ingresos del Periodo', 'Crecimiento']],
                body: estrellasRows,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129], textColor: 255 }, // Emerald
                margin: { left: 40, right: 40 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 25;
        } else {
            doc.text("No hay estrellas dominantes.", 40, currentY);
            currentY += 25;
        }

        doc.text("Alerta: Productos PERRO (Considerar retirar del catálogo):", 40, currentY);
        currentY += 15;

        const perrosRows = (matrizBcg.perros || []).slice(0, 5).map((p: any) => [
            p.nombre,
            `Bs. ${p.ingresos_actuales.toFixed(2)}`,
            `${(p.crecimiento * 100).toFixed(1)}%`
        ]);

        if (perrosRows.length > 0) {
            (doc as any).autoTable({
                startY: currentY,
                head: [['Producto Perdedor', 'Ingresos del Periodo', 'Contracción']],
                body: perrosRows,
                theme: 'grid',
                headStyles: { fillColor: [239, 68, 68], textColor: 255 }, // Red
                margin: { left: 40, right: 40 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 30;
        } else {
            doc.text("No hay perros actualmente.", 40, currentY);
            currentY += 30;
        }
    }

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Documento Oficial de Taboada. Confidencial. Pág ${i} de ${pageCount}`,
            40,
            doc.internal.pageSize.getHeight() - 20
        );
    }
    
    // Guardar Documento
    const ts = new Date().toISOString().replace(/[:T-]/g, '').slice(0, 14);
    doc.save(`Reporte_Inteligencia_${ts}.pdf`);
}
