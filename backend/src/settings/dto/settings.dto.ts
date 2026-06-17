import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateOrgSettingsDto {
  // Operating scenario
  @IsOptional()
  @IsString()
  scenario?: 'b2b' | 'services' | 'products';

  // Company details (B2B)
  @IsOptional()
  @IsObject()
  company?: {
    name?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    actualAddress?: string;
    director?: string;
    accountant?: string;
  };

  // Bank details
  @IsOptional()
  @IsObject()
  bank?: {
    name?: string;
    bik?: string;
    account?: string;
    corrAccount?: string;
  };

  // Booking settings (Services)
  @IsOptional()
  @IsObject()
  calendar?: {
    workDays?: number[]; // 0-6, 0 = Sunday
    workHoursStart?: string; // "09:00"
    workHoursEnd?: string; // "18:00"
    slotDuration?: number; // minutes
    breakBetweenSlots?: number; // minutes
  };

  // AI settings
  @IsOptional()
  @IsObject()
  ai?: {
    enabled?: boolean;
    autoSuggest?: boolean;
    model?: string;
  };
}

export class OrgSettingsResponse {
  id: string;
  orgId: string;
  scenario: string | null;
  company: any;
  bank: any;
  calendar: any;
  ai: any;
  createdAt: Date;
  updatedAt: Date;
}
