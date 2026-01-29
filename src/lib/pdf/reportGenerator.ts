import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

interface ReportOptions {
  title: string;
  subtitle?: string;
  company: CompanyInfo;
  dateRange?: { from: string; to: string };
  currency: string;
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

export function generateReport(options: ReportOptions, tableData: TableData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.company.name, pageWidth / 2, 20, { align: 'center' });
  
  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 28;
  if (options.company.address) {
    doc.text(options.company.address, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }
  if (options.company.phone || options.company.email) {
    const contactInfo = [options.company.phone, options.company.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }
  if (options.company.taxId) {
    doc.text(`Tax ID: ${options.company.taxId}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
  }
  
  // Title
  yPos += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, yPos, { align: 'center' });
  
  if (options.subtitle) {
    yPos += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, pageWidth / 2, yPos, { align: 'center' });
  }
  
  if (options.dateRange) {
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Period: ${options.dateRange.from} to ${options.dateRange.to}`, pageWidth / 2, yPos, { align: 'center' });
  }
  
  // Generated date
  yPos += 7;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0);
  
  // Table
  yPos += 10;
  
  const columns = tableData.columns.map(col => ({
    header: col.header,
    dataKey: col.dataKey,
  }));
  
  autoTable(doc, {
    startY: yPos,
    head: [columns.map(c => c.header)],
    body: tableData.rows.map(row => columns.map(c => row[c.dataKey]?.toString() || '')),
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });
  
  // Totals
  if (tableData.totals) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    let totalsY = finalY;
    Object.entries(tableData.totals).forEach(([label, value]) => {
      doc.text(`${label}: ${options.currency}${value.toFixed(2)}`, pageWidth - 20, totalsY, { align: 'right' });
      totalsY += 6;
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
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
  currency: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 20, 20);
  
  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let yPos = 28;
  if (company.address) {
    doc.text(company.address, 20, yPos);
    yPos += 4;
  }
  if (company.phone) {
    doc.text(`Phone: ${company.phone}`, 20, yPos);
    yPos += 4;
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, 20, yPos);
    yPos += 4;
  }
  if (company.taxId) {
    doc.text(`Tax ID: ${company.taxId}`, 20, yPos);
  }
  
  // Document type & number
  const typeLabels = {
    sale: 'SALES RECEIPT',
    purchase: 'PURCHASE ORDER',
    return: 'RETURN SLIP',
  };
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(typeLabels[type], pageWidth - 20, 20, { align: 'right' });
  
  doc.setFontSize(11);
  doc.text(`#${data.invoiceNumber}`, pageWidth - 20, 30, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${data.date}`, pageWidth - 20, 38, { align: 'right' });
  
  // Customer/Supplier info
  yPos = 55;
  const party = type === 'purchase' ? data.supplier : data.customer;
  const partyLabel = type === 'purchase' ? 'Supplier' : (type === 'return' ? 'Customer' : 'Bill To');
  
  if (party) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(partyLabel, 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
    doc.text(party.name, 20, yPos);
    if (party.address) {
      yPos += 4;
      doc.text(party.address, 20, yPos);
    }
    if (party.email) {
      yPos += 4;
      doc.text(party.email, 20, yPos);
    }
    if (party.phone) {
      yPos += 4;
      doc.text(party.phone, 20, yPos);
    }
  }
  
  // Items table
  yPos = Math.max(yPos + 15, 80);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Qty', 'Unit Price', 'Tax %', 'Subtotal']],
    body: data.items.map(item => [
      item.name,
      item.quantity.toString(),
      `${currency}${item.unitPrice.toFixed(2)}`,
      `${item.taxRate}%`,
      `${currency}${item.subtotal.toFixed(2)}`,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 30 },
    },
  });
  
  // Totals
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  const totalsX = pageWidth - 20;
  let totalsY = finalY;
  
  doc.text(`Subtotal:`, totalsX - 40, totalsY);
  doc.text(`${currency}${data.subtotal.toFixed(2)}`, totalsX, totalsY, { align: 'right' });
  
  totalsY += 6;
  doc.text(`Tax:`, totalsX - 40, totalsY);
  doc.text(`${currency}${data.taxAmount.toFixed(2)}`, totalsX, totalsY, { align: 'right' });
  
  if (data.discount && data.discount > 0) {
    totalsY += 6;
    doc.text(`Discount:`, totalsX - 40, totalsY);
    doc.text(`-${currency}${data.discount.toFixed(2)}`, totalsX, totalsY, { align: 'right' });
  }
  
  totalsY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total:`, totalsX - 40, totalsY);
  doc.text(`${currency}${data.total.toFixed(2)}`, totalsX, totalsY, { align: 'right' });
  
  // Notes
  if (data.notes) {
    totalsY += 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, totalsY);
    doc.setFont('helvetica', 'normal');
    doc.text(data.notes, 20, totalsY + 5);
  }
  
  return doc;
}
