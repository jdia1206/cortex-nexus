import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_COLORS, PDF_FONTS, ACCENT_BAR_HEIGHT } from './pdfStyles';

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logoUrl?: string;
}

export function generateInvoicePDF(
  type: 'sale' | 'purchase' | 'return',
  data: {
    invoiceNumber: string;
    date: string;
    customer?: { name: string; email?: string; phone?: string; address?: string };
    supplier?: { name: string; email?: string; phone?: string; address?: string };
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      subtotal: number;
    }>;
    subtotal: number;
    taxAmount: number;
    discount?: number;
    total: number;
    notes?: string;
  },
  company: CompanyInfo,
  currency: string,
  logoDataUrl?: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // === TOP ACCENT BAR ===
  doc.setFillColor(...PDF_COLORS.accentBlue);
  doc.rect(0, 0, pageWidth, ACCENT_BAR_HEIGHT, 'F');

  // === COMPANY INFO (top-left) ===
  let yPos = ACCENT_BAR_HEIGHT + 14;

  // Add logo if available
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', marginLeft, yPos - 4, 24, 24);
      // Company name beside the logo
      doc.setFontSize(PDF_FONTS.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_COLORS.black);
      doc.text(company.name, marginLeft + 28, yPos + 4);
      yPos += 10;
    } catch {
      // Fallback to text-only if image fails
      doc.setFontSize(PDF_FONTS.titleSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_COLORS.black);
      doc.text(company.name, marginLeft, yPos);
    }
  } else {
    doc.setFontSize(PDF_FONTS.titleSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(company.name, marginLeft, yPos);
  }

  doc.setFontSize(PDF_FONTS.normalSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);
  if (company.address) {
    yPos += 5;
    doc.text(company.address, marginLeft, yPos);
  }
  if (company.phone) {
    yPos += 4;
    doc.text(company.phone, marginLeft, yPos);
  }
  if (company.email) {
    yPos += 4;
    doc.text(company.email, marginLeft, yPos);
  }
  if (company.taxId) {
    yPos += 4;
    doc.text(`Tax ID: ${company.taxId}`, marginLeft, yPos);
  }

  // === BILL TO / SUPPLIER + DOCUMENT INFO SECTION ===
  yPos = ACCENT_BAR_HEIGHT + 40;

  // Divider line
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  const party = type === 'purchase' ? data.supplier : data.customer;
  const partyLabel = type === 'purchase' ? 'SUPPLIER' : 'BILL TO';

  // Bill To (left column)
  if (party) {
    doc.setFontSize(PDF_FONTS.smallSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.mediumGray);
    doc.text(partyLabel, marginLeft, yPos);

    doc.setFontSize(PDF_FONTS.normalSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.darkGray);
    let partyY = yPos + 5;
    doc.text(party.name, marginLeft, partyY);
    if (party.address) {
      partyY += 4;
      doc.text(party.address, marginLeft, partyY);
    }
    if (party.phone) {
      partyY += 4;
      doc.text(party.phone, marginLeft, partyY);
    }
    if (party.email) {
      partyY += 4;
      doc.text(party.email, marginLeft, partyY);
    }
  }

  // Document info (right column)
  const typeLabels = {
    sale: 'RECEIPT',
    purchase: 'PURCHASE ORDER',
    return: 'RETURN SLIP',
  };
  const numberLabels = {
    sale: 'RECEIPT #',
    purchase: 'P.O. #',
    return: 'RETURN #',
  };

  const infoX = pageWidth / 2 + 10;
  const valueX = pageWidth - marginRight;

  doc.setFontSize(PDF_FONTS.smallSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.mediumGray);

  const infoRows = [
    { label: numberLabels[type], value: data.invoiceNumber },
    { label: `${typeLabels[type]} DATE`, value: data.date },
  ];

  let infoY = yPos;
  infoRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.mediumGray);
    doc.text(row.label, infoX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.darkGray);
    doc.text(row.value, valueX, infoY, { align: 'right' });
    infoY += 5;
  });

  // Divider line
  yPos = Math.max(yPos + 24, infoY + 8);
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  // === RECEIPT TOTAL (prominent) ===
  doc.setFontSize(PDF_FONTS.headingSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text(`${typeLabels[type]} Total`, marginLeft, yPos + 6);

  doc.setFontSize(PDF_FONTS.totalSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accentBlue);
  doc.text(`${currency}${data.total.toFixed(2)}`, pageWidth - marginRight, yPos + 6, { align: 'right' });

  yPos += 18;
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 8;

  // === ITEMS TABLE ===
  autoTable(doc, {
    startY: yPos,
    head: [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'AMOUNT']],
    body: data.items.map(item => [
      item.quantity.toString(),
      item.name,
      `${currency}${item.unitPrice.toFixed(2)}`,
      `${currency}${item.subtotal.toFixed(2)}`,
    ]),
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
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: marginLeft, right: marginRight },
    didDrawPage: () => {
      // Draw top bar on every page
      doc.setFillColor(...PDF_COLORS.accentBlue);
      doc.rect(0, 0, pageWidth, ACCENT_BAR_HEIGHT, 'F');
    },
  });

  // === TOTALS ===
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let totalsY = finalY + 8;

  // Divider above totals
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.line(pageWidth / 2, totalsY, pageWidth - marginRight, totalsY);
  totalsY += 8;

  const totalsLabelX = pageWidth - marginRight - 45;
  const totalsValueX = pageWidth - marginRight;

  doc.setFontSize(PDF_FONTS.normalSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.darkGray);

  // Subtotal
  doc.text('Subtotal', totalsLabelX, totalsY, { align: 'right' });
  doc.text(`${currency}${data.subtotal.toFixed(2)}`, totalsValueX, totalsY, { align: 'right' });

  // Tax
  totalsY += 6;
  doc.text('Tax', totalsLabelX, totalsY, { align: 'right' });
  doc.text(`${currency}${data.taxAmount.toFixed(2)}`, totalsValueX, totalsY, { align: 'right' });

  // Discount
  if (data.discount && data.discount > 0) {
    totalsY += 6;
    doc.text('Discount', totalsLabelX, totalsY, { align: 'right' });
    doc.text(`-${currency}${data.discount.toFixed(2)}`, totalsValueX, totalsY, { align: 'right' });
  }

  // Total (bold)
  totalsY += 8;
  doc.setDrawColor(...PDF_COLORS.lightGray);
  doc.line(pageWidth / 2, totalsY - 2, pageWidth - marginRight, totalsY - 2);
  totalsY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total', totalsLabelX, totalsY, { align: 'right' });
  doc.text(`${currency}${data.total.toFixed(2)}`, totalsValueX, totalsY, { align: 'right' });

  // === TERMS & CONDITIONS / NOTES ===
  if (data.notes) {
    // Position near bottom, but ensure it doesn't overlap with totals
    const termsY = Math.max(totalsY + 30, pageHeight - 60);
    doc.setDrawColor(...PDF_COLORS.lightGray);
    doc.line(marginLeft, termsY, pageWidth - marginRight, termsY);

    doc.setFontSize(PDF_FONTS.normalSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('TERMS & CONDITIONS', marginLeft, termsY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.darkGray);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth);
    doc.text(noteLines, marginLeft, termsY + 14);
  }

  // === BOTTOM ACCENT BAR (every page) ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.accentBlue);
    doc.rect(0, pageHeight - ACCENT_BAR_HEIGHT, pageWidth, ACCENT_BAR_HEIGHT, 'F');
  }

  return doc;
}
