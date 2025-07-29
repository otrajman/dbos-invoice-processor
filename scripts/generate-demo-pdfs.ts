import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  vendorName: string;
  vendorAddress: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  fileName: string;
}

const invoices: InvoiceData[] = [
  {
    invoiceNumber: 'INV-2024-001',
    vendorName: 'TechSupply Corp',
    vendorAddress: '123 Business Ave, Tech City, TC 12345',
    invoiceDate: '2024-01-15',
    dueDate: '2024-02-14',
    subtotal: 1000.00,
    taxAmount: 80.00,
    totalAmount: 1080.00,
    lineItems: [
      {
        description: 'Laptop Computer - Dell XPS 13',
        quantity: 2,
        unitPrice: 500.00,
        lineTotal: 1000.00
      }
    ],
    fileName: 'inv-2024-001.pdf'
  },
  {
    invoiceNumber: 'OS-2024-0045',
    vendorName: 'Office Solutions LLC',
    vendorAddress: '456 Commerce St, Business Town, BT 67890',
    invoiceDate: '2024-01-20',
    dueDate: '2024-02-04',
    subtotal: 750.00,
    taxAmount: 60.00,
    totalAmount: 810.00,
    lineItems: [
      {
        description: 'Office Chairs - Ergonomic',
        quantity: 5,
        unitPrice: 150.00,
        lineTotal: 750.00
      }
    ],
    fileName: 'inv-2024-002.pdf'
  },
  {
    invoiceNumber: 'GS-2024-0123',
    vendorName: 'Global Services Inc',
    vendorAddress: '789 Enterprise Blvd, Corporate City, CC 11111',
    invoiceDate: '2024-01-18',
    dueDate: '2024-03-04',
    subtotal: 2500.00,
    taxAmount: 200.00,
    totalAmount: 2700.00,
    lineItems: [
      {
        description: 'Consulting Services - Q1 2024',
        quantity: 1,
        unitPrice: 2500.00,
        lineTotal: 2500.00
      }
    ],
    fileName: 'inv-2024-003.pdf'
  },
  {
    invoiceNumber: 'INV-2024-004',
    vendorName: 'TechSupply Corp',
    vendorAddress: '123 Business Ave, Tech City, TC 12345',
    invoiceDate: '2024-01-25',
    dueDate: '2024-02-24',
    subtotal: 1500.00,
    taxAmount: 120.00,
    totalAmount: 1620.00,
    lineItems: [
      {
        description: 'Software License - Annual',
        quantity: 3,
        unitPrice: 500.00,
        lineTotal: 1500.00
      }
    ],
    fileName: 'inv-2024-004.pdf'
  },
  {
    invoiceNumber: 'OS-2024-0032',
    vendorName: 'Office Solutions LLC',
    vendorAddress: '456 Commerce St, Business Town, BT 67890',
    invoiceDate: '2024-01-10',
    dueDate: '2024-01-25',
    subtotal: 500.00,
    taxAmount: 40.00,
    totalAmount: 540.00,
    lineItems: [
      {
        description: 'Office Supplies Bundle',
        quantity: 1,
        unitPrice: 500.00,
        lineTotal: 500.00
      }
    ],
    fileName: 'inv-2024-005.pdf'
  }
];

function generateInvoicePDF(invoice: InvoiceData, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 50, 80);
    doc.text(`Date: ${invoice.invoiceDate}`, 50, 100);
    doc.text(`Due Date: ${invoice.dueDate}`, 50, 120);

    // Vendor Information
    doc.fontSize(14).text('From:', 50, 160);
    doc.fontSize(12).text(invoice.vendorName, 50, 180);
    doc.text(invoice.vendorAddress, 50, 200);

    // Bill To
    doc.fontSize(14).text('Bill To:', 50, 240);
    doc.fontSize(12).text('Your Company Name', 50, 260);
    doc.text('123 Your Address', 50, 280);
    doc.text('Your City, State 12345', 50, 300);

    // Line Items Header
    doc.fontSize(12).text('Description', 50, 350);
    doc.text('Qty', 300, 350);
    doc.text('Unit Price', 350, 350);
    doc.text('Total', 450, 350);
    
    // Draw line under header
    doc.moveTo(50, 370).lineTo(500, 370).stroke();

    // Line Items
    let yPosition = 390;
    invoice.lineItems.forEach((item) => {
      doc.text(item.description, 50, yPosition);
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 350, yPosition);
      doc.text(`$${item.lineTotal.toFixed(2)}`, 450, yPosition);
      yPosition += 20;
    });

    // Totals
    yPosition += 20;
    doc.moveTo(300, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;
    
    doc.text('Subtotal:', 350, yPosition);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 450, yPosition);
    yPosition += 20;
    
    doc.text('Tax:', 350, yPosition);
    doc.text(`$${invoice.taxAmount.toFixed(2)}`, 450, yPosition);
    yPosition += 20;
    
    doc.fontSize(14).text('Total:', 350, yPosition);
    doc.text(`$${invoice.totalAmount.toFixed(2)}`, 450, yPosition);

    // Footer
    doc.fontSize(10).text('Thank you for your business!', 50, yPosition + 60);

    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function generateAllPDFs() {
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'invoices');
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const invoice of invoices) {
    const outputPath = path.join(uploadsDir, invoice.fileName);
    console.log(`Generating ${invoice.fileName}...`);
    await generateInvoicePDF(invoice, outputPath);
    console.log(`Generated ${invoice.fileName}`);
  }
  
  console.log('All demo PDFs generated successfully!');
}

// Run the script
generateAllPDFs().catch(console.error);
