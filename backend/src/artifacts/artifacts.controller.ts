import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Response,
  BadRequestException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ArtifactsService } from './artifacts.service';
import { PdfService } from './pdf.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateQuoteDto,
  CreateInvoiceDto,
  CreateCalendarLinkDto,
  CreateProductCardDto,
  SendArtifactDto,
} from './dto/create-artifact.dto';

@Controller('artifacts')
@UseGuards(JwtAuthGuard)
export class ArtifactsController {
  constructor(
    private artifacts: ArtifactsService,
    private pdf: PdfService,
    private conversations: ConversationsService,
    private settings: SettingsService,
  ) {}

  // ============================================
  // LIST & GET
  // ============================================

  @Get()
  async findAll(@Request() req, @Query('type') type?: string) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.findAll(orgId, type);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.findOne(orgId, id);
  }

  // ============================================
  // CREATE ARTIFACTS
  // ============================================

  @Post('quotes')
  async createQuote(@Request() req, @Body() dto: CreateQuoteDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.createQuote(orgId, dto);
  }

  @Post('invoices')
  async createInvoice(@Request() req, @Body() dto: CreateInvoiceDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.createInvoice(orgId, dto);
  }

  @Post('calendar-links')
  async createCalendarLink(@Request() req, @Body() dto: CreateCalendarLinkDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.createCalendarLink(orgId, dto);
  }

  @Post('product-cards')
  async createProductCard(@Request() req, @Body() dto: CreateProductCardDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.createProductCard(orgId, dto);
  }

  // ============================================
  // SEND TO CONVERSATION
  // ============================================

  @Post('send')
  async sendToConversation(@Request() req, @Body() dto: SendArtifactDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }

    // Get artifact
    const artifact = await this.artifacts.findOne(orgId, dto.artifactId);

    // Format artifact as text message
    let text = this.artifacts.formatForMessage(artifact);
    
    // Prepend custom message if provided
    if (dto.message) {
      text = `${dto.message}\n\n${text}`;
    }

    // Send to conversation
    const message = await this.conversations.sendMessage(orgId, dto.conversationId, {
      text,
    });

    return {
      success: true,
      message,
      artifact,
    };
  }

  // ============================================
  // DELETE
  // ============================================

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.artifacts.delete(orgId, id);
  }

  // ============================================
  // PDF GENERATION
  // ============================================

  @Get(':id/pdf')
  async downloadPdf(
    @Request() req,
    @Param('id') id: string,
    @Response() res: ExpressResponse,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }

    const artifact = await this.artifacts.findOne(orgId, id);
    const companyDetails = await this.settings.getCompanyDetails(orgId);

    let pdfBuffer: Buffer;
    let filename: string;

    if (artifact.type === 'QUOTE') {
      pdfBuffer = await this.pdf.generateQuotePdf(artifact.payload, companyDetails);
      filename = `Quote_${(artifact.payload as any).quoteNumber || id}.pdf`;
    } else if (artifact.type === 'INVOICE') {
      pdfBuffer = await this.pdf.generateInvoicePdf(artifact.payload, companyDetails);
      filename = `Invoice_${(artifact.payload as any).invoiceNumber || id}.pdf`;
    } else {
      throw new BadRequestException('PDF generation is only available for quotes and invoices');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  }
}
