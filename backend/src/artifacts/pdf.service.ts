import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: puppeteer.Browser | null = null;

  constructor(private config: ConfigService) {}

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async generateQuotePdf(payload: any, companyDetails: any): Promise<Buffer> {
    const html = this.buildQuoteHtml(payload, companyDetails);
    return this.htmlToPdf(html);
  }

  async generateInvoicePdf(payload: any, companyDetails: any): Promise<Buffer> {
    const html = this.buildInvoiceHtml(payload, companyDetails);
    return this.htmlToPdf(html);
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  private buildQuoteHtml(payload: any, company: any): string {
    const items = payload.items || [];
    const itemsHtml = items.map((item: any, i: number) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${i + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit || 'pcs.'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${this.formatMoney(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${this.formatMoney(item.quantity * item.price)}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: 700; color: #2563eb; }
    .doc-info { text-align: right; }
    .doc-number { font-size: 20px; font-weight: 600; color: #1e40af; }
    .doc-date { color: #666; margin-top: 4px; }
    .title { font-size: 28px; font-weight: 700; margin-bottom: 30px; color: #1e3a5f; }
    .parties { display: flex; gap: 40px; margin-bottom: 30px; }
    .party { flex: 1; }
    .party-label { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 1px; }
    .party-name { font-weight: 600; font-size: 16px; }
    .party-details { color: #666; font-size: 13px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; }
    .total-label { color: #666; }
    .total-value { font-weight: 600; min-width: 120px; }
    .grand-total { font-size: 20px; color: #16a34a; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
    .notes { margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; }
    .notes-title { font-weight: 600; margin-bottom: 8px; }
    .validity { margin-top: 30px; padding: 16px; background: #fef3c7; border-radius: 8px; color: #92400e; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${company.company?.name || 'Company'}</div>
      <div class="doc-info">
        <div class="doc-number">${payload.quoteNumber || 'Quote'}</div>
        <div class="doc-date">dated ${new Date(payload.createdAt).toLocaleDateString('ru-RU')}</div>
      </div>
    </div>

    <h1 class="title">${payload.title || 'Quote'}</h1>

    <div class="parties">
      <div class="party">
        <div class="party-label">Supplier</div>
        <div class="party-name">${company.company?.name || '—'}</div>
        <div class="party-details">
          ${company.company?.inn ? `INN: ${company.company.inn}` : ''}
          ${company.company?.legalAddress ? `<br>${company.company.legalAddress}` : ''}
        </div>
      </div>
      <div class="party">
        <div class="party-label">Customer</div>
        <div class="party-name">${payload.contact?.name || '—'}</div>
        <div class="party-details">
          ${payload.contact?.email || ''}
          ${payload.contact?.phone ? `<br>${payload.contact.phone}` : ''}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">No.</th>
          <th>Description</th>
          <th style="width: 100px; text-align: center;">Qty</th>
          <th style="width: 120px; text-align: right;">Price</th>
          <th style="width: 120px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row grand-total">
        <span class="total-label">Total:</span>
        <span class="total-value">${this.formatMoney(payload.total)}</span>
      </div>
    </div>

    ${payload.notes ? `
    <div class="notes">
      <div class="notes-title">Note</div>
      <div>${payload.notes}</div>
    </div>
    ` : ''}

    ${payload.validUntil ? `
    <div class="validity">
      ⏳ Quote valid until ${new Date(payload.validUntil).toLocaleDateString('ru-RU')}
    </div>
    ` : ''}

    <div class="footer">
      Document generated automatically by Pipey
    </div>
  </div>
</body>
</html>
    `;
  }

  private buildInvoiceHtml(payload: any, company: any): string {
    const items = payload.items || [];
    const itemsHtml = items.map((item: any, i: number) => `
      <tr>
        <td style="padding: 12px; border: 1px solid #e2e8f0;">${i + 1}</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.name}</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: center;">${item.unit || 'pcs.'}</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${this.formatMoney(item.price)}</td>
        <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">${this.formatMoney(item.quantity * item.price)}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.4; }
    .container { max-width: 800px; margin: 0 auto; padding: 30px; }
    .bank-details { border: 1px solid #000; margin-bottom: 20px; }
    .bank-row { display: flex; border-bottom: 1px solid #000; }
    .bank-row:last-child { border-bottom: none; }
    .bank-cell { padding: 8px; border-right: 1px solid #000; }
    .bank-cell:last-child { border-right: none; }
    .bank-label { font-size: 10px; color: #666; }
    .header { text-align: center; margin: 30px 0; }
    .invoice-title { font-size: 20px; font-weight: 700; }
    .invoice-number { font-size: 16px; margin-top: 4px; }
    .parties { display: flex; gap: 20px; margin: 20px 0; font-size: 12px; }
    .party { flex: 1; }
    .party-label { font-weight: 600; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #e2e8f0; font-size: 12px; }
    .total-section { margin-top: 20px; }
    .total-row { display: flex; justify-content: flex-end; font-size: 14px; margin: 4px 0; }
    .total-label { margin-right: 20px; }
    .total-value { font-weight: 600; min-width: 150px; text-align: right; }
    .total-words { margin: 20px 0; font-style: italic; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature { text-align: center; }
    .signature-line { border-bottom: 1px solid #000; width: 200px; margin-bottom: 4px; height: 40px; }
    .signature-label { font-size: 11px; color: #666; }
    .stamp-area { width: 100px; height: 100px; border: 1px dashed #ccc; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="bank-details">
      <div class="bank-row">
        <div class="bank-cell" style="flex: 2;">
          <div class="bank-label">Beneficiary bank</div>
          <div>${company.bank?.name || '—'}</div>
        </div>
        <div class="bank-cell" style="flex: 1;">
          <div class="bank-label">BIK</div>
          <div>${company.bank?.bik || '—'}</div>
        </div>
        <div class="bank-cell" style="flex: 1;">
          <div class="bank-label">Account No.</div>
          <div>${company.bank?.corrAccount || '—'}</div>
        </div>
      </div>
      <div class="bank-row">
        <div class="bank-cell" style="flex: 2;">
          <div class="bank-label">Beneficiary</div>
          <div>${company.company?.name || '—'}</div>
          <div style="font-size: 11px; color: #666;">INN ${company.company?.inn || '—'} KPP ${company.company?.kpp || '—'}</div>
        </div>
        <div class="bank-cell" style="flex: 1;">
          <div class="bank-label">Account No.</div>
          <div>${company.bank?.account || '—'}</div>
        </div>
      </div>
    </div>

    <div class="header">
      <div class="invoice-title">INVOICE FOR PAYMENT</div>
      <div class="invoice-number">${payload.invoiceNumber} dated ${new Date(payload.createdAt).toLocaleDateString('ru-RU')}</div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Supplier:</div>
        <div>${company.company?.name || '—'}${company.company?.inn ? `, INN ${company.company.inn}` : ''}${company.company?.legalAddress ? `, ${company.company.legalAddress}` : ''}</div>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-label">Buyer:</div>
        <div>${payload.contact?.name || '—'}${payload.contact?.email ? `, ${payload.contact.email}` : ''}${payload.contact?.phone ? `, ${payload.contact.phone}` : ''}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">No.</th>
          <th>Product/service description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 60px; text-align: center;">Unit</th>
          <th style="width: 100px; text-align: right;">Price</th>
          <th style="width: 100px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span class="total-label">Total:</span>
        <span class="total-value">${this.formatMoney(payload.total)}</span>
      </div>
      <div class="total-row">
        <span class="total-label">Without VAT</span>
        <span class="total-value">—</span>
      </div>
      <div class="total-row" style="font-size: 16px; margin-top: 10px;">
        <span class="total-label"><strong>Total due:</strong></span>
        <span class="total-value"><strong>${this.formatMoney(payload.total)}</strong></span>
      </div>
    </div>

    <div class="total-words">
      Total line items: ${items.length}, for the amount of ${this.formatMoney(payload.total)}
    </div>

    ${payload.dueDate ? `
    <div style="margin: 20px 0; padding: 10px; background: #fef3c7; border-radius: 4px;">
      ⚠️ Pay by: ${new Date(payload.dueDate).toLocaleDateString('ru-RU')}
    </div>
    ` : ''}

    <div class="signatures">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-label">Director ${company.company?.director ? `(${company.company.director})` : ''}</div>
      </div>
      <div class="stamp-area">Stamp</div>
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-label">Accountant</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
