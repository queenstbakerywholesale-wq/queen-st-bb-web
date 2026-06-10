/**
 * Invoice PDF Generation — Generates branded PDF invoices using PDFKit
 */
import PDFDocument from "pdfkit";
import { storagePut } from "./storage";

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: InvoiceItem[];
  subtotal: string;
  tax: string;
  total: string;
  dueDate?: string | null;
  notes?: string | null;
  createdAt: Date;
  branchName?: string;
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<{ url: string; key: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const key = `invoices/${invoice.invoiceNumber}.pdf`;
        const result = await storagePut(key, pdfBuffer, "application/pdf");
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
    doc.on("error", reject);

    // ─── Header ─────────────────────────────────────────────
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#5A3A2E")
      .text("Queen St BB", 50, 50);
    doc.fontSize(9).font("Helvetica").fillColor("#888888")
      .text("A Dessert Atelier — Melbourne", 50, 78);

    // Invoice title
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#5A3A2E")
      .text("INVOICE", 400, 50, { align: "right" });
    doc.fontSize(10).font("Helvetica").fillColor("#333333")
      .text(invoice.invoiceNumber, 400, 72, { align: "right" });

    // ─── Customer Info ──────────────────────────────────────
    const infoY = 120;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#5A3A2E")
      .text("Bill To:", 50, infoY);
    doc.fontSize(10).font("Helvetica").fillColor("#333333")
      .text(invoice.customerName, 50, infoY + 16);
    if (invoice.customerEmail) {
      doc.text(invoice.customerEmail, 50, infoY + 30);
    }
    if (invoice.customerPhone) {
      doc.text(invoice.customerPhone, 50, infoY + 44);
    }

    // Date info
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#5A3A2E")
      .text("Date:", 400, infoY, { align: "right" });
    doc.fontSize(10).font("Helvetica").fillColor("#333333")
      .text(invoice.createdAt.toLocaleDateString("en-AU"), 400, infoY + 16, { align: "right" });
    if (invoice.dueDate) {
      doc.font("Helvetica-Bold").fillColor("#5A3A2E")
        .text("Due:", 400, infoY + 34, { align: "right" });
      doc.font("Helvetica").fillColor("#333333")
        .text(invoice.dueDate, 400, infoY + 50, { align: "right" });
    }
    if (invoice.branchName) {
      doc.font("Helvetica").fillColor("#888888")
        .text(invoice.branchName, 400, infoY + 68, { align: "right" });
    }

    // ─── Items Table ────────────────────────────────────────
    const tableTop = 210;
    const colX = { item: 50, qty: 320, price: 400, total: 480 };

    // Table header
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#5A3A2E");
    doc.text("ITEM", colX.item, tableTop);
    doc.text("QTY", colX.qty, tableTop);
    doc.text("PRICE", colX.price, tableTop);
    doc.text("TOTAL", colX.total, tableTop);

    // Header line
    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14)
      .strokeColor("#5A3A2E").lineWidth(1).stroke();

    // Table rows
    let rowY = tableTop + 24;
    doc.fontSize(9).font("Helvetica").fillColor("#333333");
    for (const item of invoice.items) {
      doc.text(item.name, colX.item, rowY, { width: 260 });
      doc.text(item.quantity.toString(), colX.qty, rowY);
      doc.text(`$${item.unitPrice.toFixed(2)}`, colX.price, rowY);
      doc.text(`$${item.totalPrice.toFixed(2)}`, colX.total, rowY);
      rowY += 18;
    }

    // Total line
    rowY += 8;
    doc.moveTo(320, rowY).lineTo(545, rowY)
      .strokeColor("#5A3A2E").lineWidth(1).stroke();
    rowY += 10;

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#5A3A2E");
    doc.text("Subtotal:", colX.price, rowY);
    doc.text(`$${invoice.subtotal}`, colX.total, rowY);
    rowY += 16;

    if (parseFloat(invoice.tax) > 0) {
      doc.text("Tax:", colX.price, rowY);
      doc.text(`$${invoice.tax}`, colX.total, rowY);
      rowY += 16;
    }

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#5A3A2E");
    doc.text("TOTAL:", colX.price, rowY);
    doc.text(`$${invoice.total}`, colX.total, rowY);

    // ─── Notes ──────────────────────────────────────────────
    if (invoice.notes) {
      rowY += 40;
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#5A3A2E")
        .text("Notes:", 50, rowY);
      doc.fontSize(9).font("Helvetica").fillColor("#666666")
        .text(invoice.notes, 50, rowY + 14, { width: 495 });
    }

    // ─── Footer ─────────────────────────────────────────────
    doc.fontSize(8).font("Helvetica").fillColor("#AAAAAA")
      .text("Queen St BB — Hawthorn | Windsor | CBD — Melbourne, VIC", 50, 760, { align: "center" });
    doc.text("Thank you for your business", 50, 772, { align: "center" });

    doc.end();
  });
}
