import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_COLORS, PDF_FONTS, ACCENT_BAR_HEIGHT } from './pdfStyles';

// Re-export for backward compatibility
export { generateInvoicePDF } from './invoiceGenerator';

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logoUrl?: string;
}

interface ReportOptions {
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  dateRange?: { from: string; to: string };
  currency: string;
  logoDataUrl?: string;
}

interface TableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

interface TableData {
  columns: TableColumn[];
  rows: Record<string, string | number>[];
  totals?: Record<string, number>;
}

export function generateReport(options: ReportOptions, tableData: TableData, logoDataUrl?: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;

  // === TOP ACCENT BAR ===
  doc.setFillColor(...PDF_COLORS.accentBlue);
  doc.rect(0, 0, pageWidth, ACCENT_BAR_HEIGHT, 'F');

  // === COMPANY INFO (top-left) ===
  let yPos = ACCENT_BAR_HEIGHT + 14;

  // Add logo if available
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', marginLeft, yPos - 4, 24, 24);
      doc.setFontSize(PDF_FONTS.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_COLORS.black);
      doc.text(options.company.name, marginLeft + 28, yPos + 4);
      yPos += 10;
    } catch {
      doc.setFontSize(PDF_FONTS.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_COLORS.black);
      doc.text(options.company.name, marginLeft, yPos);
    }
  } else {
    doc.setFontSize(PDF_FONTS.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(options.company.name, marginLeft, yPos);
  }

  doc.setFontSize(PDF_FONTS.normalSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);
  if (options.company.address) {
    yPos += 5;
    doc.text(options.company.address, marginLeft, yPos);
  }
  if (options.company.phone || options.company.email) {
    yPos += 4;
    const contactInfo = [options.company.phone, options.company.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, marginLeft, yPos);
  }
  if (options.company.taxId) {
    yPos += 4;
    doc.text(`Tax ID: ${options.company.taxId}`, marginLeft, yPos);
  }

  // === REPORT INFO (top-right) ===
  const infoX = pageWidth / 2 + 10;
  const valueX = pageWidth - marginRight;
  let infoY = ACCENT_BAR_HEIGHT + 14;

  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.mediumGray);
  doc.text('REPORT', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text(options.title, valueX, infoY, { align: 'right' });

  if (options.dateRange) {
    infoY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.mediumGray);
    doc.text('PERIOD', infoX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.darkGray);
    doc.text(`${options.dateRange.from} — ${options.dateRange.to}`, valueX, infoY, { align: 'right' });
  }

  infoY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.mediumGray);
  doc.text('GENERATED', infoX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text(new Date().toLocaleDateString(), valueX, infoY, { align: 'right' });

  // === DIVIDER ===
  yPos = Math.max(yPos + 10, infoY + 10);
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  // === REPORT TITLE (prominent) ===
  doc.setFontSize(PDF_FONTS.headingSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text(options.title, marginLeft, yPos + 6);

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.mediumGray);
    doc.text(options.subtitle, marginLeft, yPos + 14);
    yPos += 8;
  }

  yPos += 16;
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  // === DATA TABLE ===
  const columns = tableData.columns.map(col => ({
    header: col.header.toUpperCase(),
    dataKey: col.dataKey,
  }));

  autoTable(doc, {
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: tableData.rows.map(row => columns.map(c => row[c.dataKey]?.toString() || '')),
    theme: 'plain',
    headStyles: {
      fillColor: false as unknown as [number, number, number],
      textColor: PDF_COLORS.mediumGray,
      fontStyle: 'bold',
      fontSize: PDF_FONTS.smallSize,
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
    },
    bodyStyles: {
      textColor: PDF_COLORS.darkGray,
      fontSize: PDF_FONTS.normalSize,
      cellPadding: { top: 5, bottom: 5, left: 2, right: 2 },
    },
    margin: { left: marginLeft, right: marginRight },
    didDrawPage: () => {
      doc.setFillColor(...PDF_COLORS.accentBlue);
      doc.rect(0, 0, pageWidth, ACCENT_BAR_HEIGHT, 'F');
    },
  });

  // === TOTALS ===
  if (tableData.totals) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    let totalsY = finalY + 8;

    doc.setDrawColor(...PDF_COLORS.lightGray);
    doc.line(pageWidth / 2, totalsY, pageWidth - marginRight, totalsY);
    totalsY += 8;

    const totalsLabelX = pageWidth - marginRight - 45;
    const totalsValueX = pageWidth - marginRight;

    doc.setFontSize(PDF_FONTS.normalSize);
    doc.setTextColor(...PDF_COLORS.darkGray);

    Object.entries(tableData.totals).forEach(([label, value], index, arr) => {
      const isLast = index === arr.length - 1;
      if (isLast) {
        doc.setDrawColor(...PDF_COLORS.lightGray);
        doc.line(pageWidth / 2, totalsY - 2, pageWidth - marginRight, totalsY - 2);
        totalsY += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(label, totalsLabelX, totalsY, { align: 'right' });
      doc.text(`${options.currency}${value.toFixed(2)}`, totalsValueX, totalsY, { align: 'right' });
      totalsY += 6;
    });
  }

  // === BOTTOM ACCENT BAR (every page) ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.accentBlue);
    doc.rect(0, pageHeight - ACCENT_BAR_HEIGHT, pageWidth, ACCENT_BAR_HEIGHT, 'F');

    // Page number
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.mediumGray);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - ACCENT_BAR_HEIGHT - 4,
      { align: 'center' }
    );
  }

  return doc;
}
