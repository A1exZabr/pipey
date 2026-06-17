import { IsEnum, IsOptional, IsObject, IsString } from 'class-validator';

export enum ArtifactType {
  QUOTE = 'QUOTE',
  INVOICE = 'INVOICE',
  CONTRACT = 'CONTRACT',
  CALENDAR_LINK = 'CALENDAR_LINK',
  PRODUCT_CARD = 'PRODUCT_CARD',
}

export class CreateQuoteDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsObject()
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    price: number;
    unit?: string;
  }>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  validUntil?: Date;
}

export class CreateInvoiceDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;

  @IsString()
  invoiceNumber: string;

  @IsObject()
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    price: number;
    unit?: string;
  }>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  dueDate?: Date;
}

export class CreateCalendarLinkDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  duration?: number; // in minutes

  @IsOptional()
  availableSlots?: Array<{
    date: string; // ISO date
    times: string[]; // ['09:00', '10:00', '14:00']
  }>;
}

export class CreateProductCardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  images?: string[];

  @IsOptional()
  features?: string[];

  @IsOptional()
  @IsString()
  link?: string;
}

export class SendArtifactDto {
  @IsString()
  artifactId: string;

  @IsString()
  conversationId: string;

  @IsOptional()
  @IsString()
  message?: string;
}
