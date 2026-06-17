import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  CreateQuoteDto,
  CreateInvoiceDto,
  CreateCalendarLinkDto,
  CreateProductCardDto,
} from './dto/create-artifact.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ArtifactsService {
  private readonly logger = new Logger(ArtifactsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ============================================
  // QUOTES
  // ============================================

  async createQuote(orgId: string, dto: CreateQuoteDto) {
    // Calculate totals
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const total = subtotal; // Add tax calculation if needed

    // Get org settings for company details
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    // Get contact if provided
    let contact = null;
    if (dto.contactId) {
      contact = await this.prisma.contact.findUnique({
        where: { id: dto.contactId },
      });
    }

    const payload = {
      title: dto.title,
      quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
      items: dto.items,
      subtotal,
      total,
      notes: dto.notes,
      validUntil: dto.validUntil,
      contact: contact ? {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      } : null,
      company: {
        name: org?.name || 'Company',
        // TODO: Add more company details from OrgSettings
      },
      createdAt: new Date().toISOString(),
    };

    const artifact = await this.prisma.artifact.create({
      data: {
        orgId,
        type: 'QUOTE',
        payload,
      },
    });

    this.logger.log(`Created quote ${artifact.id} for org ${orgId}`);
    return artifact;
  }

  // ============================================
  // INVOICES
  // ============================================

  async createInvoice(orgId: string, dto: CreateInvoiceDto) {
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const total = subtotal;

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    let contact = null;
    if (dto.contactId) {
      contact = await this.prisma.contact.findUnique({
        where: { id: dto.contactId },
      });
    }

    const payload = {
      title: dto.title,
      invoiceNumber: dto.invoiceNumber,
      items: dto.items,
      subtotal,
      total,
      notes: dto.notes,
      dueDate: dto.dueDate,
      contact: contact ? {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      } : null,
      company: {
        name: org?.name || 'Company',
        // TODO: Add bank details from OrgSettings
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const artifact = await this.prisma.artifact.create({
      data: {
        orgId,
        type: 'INVOICE',
        payload,
      },
    });

    this.logger.log(`Created invoice ${artifact.id} for org ${orgId}`);
    return artifact;
  }

  // ============================================
  // CALENDAR LINKS (Bookings)
  // ============================================

  async createCalendarLink(orgId: string, dto: CreateCalendarLinkDto) {
    const backendUrl = this.config.get('BACKEND_URL') || 'http://localhost:3001';
    const publicId = `cal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      title: dto.title,
      description: dto.description,
      duration: dto.duration || 30,
      availableSlots: dto.availableSlots || [],
      publicId,
      publicUrl: `${backendUrl}/book/${publicId}`,
      contactId: dto.contactId,
      createdAt: new Date().toISOString(),
    };

    const artifact = await this.prisma.artifact.create({
      data: {
        orgId,
        type: 'CALENDAR_LINK',
        payload,
      },
    });

    this.logger.log(`Created calendar link ${artifact.id} for org ${orgId}`);
    return artifact;
  }

  // ============================================
  // PRODUCT CARDS
  // ============================================

  async createProductCard(orgId: string, dto: CreateProductCardDto) {
    const payload = {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      currency: dto.currency || 'RUB',
      images: dto.images || [],
      features: dto.features || [],
      link: dto.link,
      createdAt: new Date().toISOString(),
    };

    const artifact = await this.prisma.artifact.create({
      data: {
        orgId,
        type: 'PRODUCT_CARD',
        payload,
      },
    });

    this.logger.log(`Created product card ${artifact.id} for org ${orgId}`);
    return artifact;
  }

  // ============================================
  // COMMON METHODS
  // ============================================

  async findAll(orgId: string, type?: string) {
    const where: any = { orgId };
    if (type) {
      where.type = type;
    }

    return this.prisma.artifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id },
    });

    if (!artifact || artifact.orgId !== orgId) {
      throw new NotFoundException('Artifact not found');
    }

    return artifact;
  }

  async delete(orgId: string, id: string) {
    const artifact = await this.findOne(orgId, id);
    
    await this.prisma.artifact.delete({
      where: { id: artifact.id },
    });

    return { success: true };
  }

  // ============================================
  // GENERATE TEXT FOR MESSAGING
  // ============================================

  formatForMessage(artifact: any): string {
    const payload = artifact.payload as any;

    switch (artifact.type) {
      case 'QUOTE':
        return this.formatQuote(payload);
      case 'INVOICE':
        return this.formatInvoice(payload);
      case 'CALENDAR_LINK':
        return this.formatCalendarLink(payload);
      case 'PRODUCT_CARD':
        return this.formatProductCard(payload);
      default:
        return 'Document';
    }
  }

  private formatQuote(payload: any): string {
    let text = `📄 *${payload.title}*\n`;
    text += `No. ${payload.quoteNumber}\n\n`;

    if (payload.items?.length) {
      text += '📋 *Line items:*\n';
      payload.items.forEach((item: any, i: number) => {
        text += `${i + 1}. ${item.name}`;
        if (item.quantity > 1) {
          text += ` × ${item.quantity}`;
        }
        text += ` — ${item.price.toLocaleString('ru-RU')} ₽\n`;
      });
      text += '\n';
    }

    text += `💰 *Total: ${payload.total.toLocaleString('ru-RU')} ₽*\n`;

    if (payload.validUntil) {
      text += `\n⏳ Valid until: ${new Date(payload.validUntil).toLocaleDateString('ru-RU')}`;
    }

    if (payload.notes) {
      text += `\n\n📝 ${payload.notes}`;
    }

    return text;
  }

  private formatInvoice(payload: any): string {
    let text = `🧾 *Invoice ${payload.invoiceNumber}*\n`;
    text += `${payload.title}\n\n`;

    if (payload.items?.length) {
      payload.items.forEach((item: any, i: number) => {
        text += `${i + 1}. ${item.name}`;
        if (item.quantity > 1) {
          text += ` × ${item.quantity}`;
        }
        text += ` — ${item.price.toLocaleString('ru-RU')} ₽\n`;
      });
      text += '\n';
    }

    text += `💰 *Total due: ${payload.total.toLocaleString('ru-RU')} ₽*`;

    if (payload.dueDate) {
      text += `\n📅 Pay by: ${new Date(payload.dueDate).toLocaleDateString('ru-RU')}`;
    }

    return text;
  }

  private formatCalendarLink(payload: any): string {
    let text = `📅 *${payload.title}*\n\n`;

    if (payload.description) {
      text += `${payload.description}\n\n`;
    }

    text += `⏱ Duration: ${payload.duration} min.\n\n`;
    text += `🔗 Book now: ${payload.publicUrl}`;

    return text;
  }

  private formatProductCard(payload: any): string {
    let text = `🛍 *${payload.name}*\n\n`;

    if (payload.description) {
      text += `${payload.description}\n\n`;
    }

    if (payload.features?.length) {
      text += '✨ *Features:*\n';
      payload.features.forEach((f: string) => {
        text += `• ${f}\n`;
      });
      text += '\n';
    }

    text += `💰 *Price: ${payload.price.toLocaleString('ru-RU')} ${payload.currency}*`;

    if (payload.link) {
      text += `\n\n🔗 ${payload.link}`;
    }

    return text;
  }
}
