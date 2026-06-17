import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrgSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async getSettings(orgId: string) {
    let settings = await this.prisma.orgSettings.findUnique({
      where: { orgId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.orgSettings.create({
        data: {
          orgId,
          scenario: null,
          company: {},
          bank: {},
          calendar: {
            workDays: [1, 2, 3, 4, 5], // Mon-Fri
            workHoursStart: '09:00',
            workHoursEnd: '18:00',
            slotDuration: 30,
            breakBetweenSlots: 0,
          },
          ai: {
            enabled: true,
            autoSuggest: false,
          },
        },
      });
    }

    return settings;
  }

  async updateSettings(orgId: string, dto: UpdateOrgSettingsDto) {
    const existing = await this.getSettings(orgId);

    // Merge with existing data
    const updateData: any = {};

    if (dto.scenario !== undefined) {
      updateData.scenario = dto.scenario;
    }

    if (dto.company) {
      updateData.company = { ...(existing.company as object || {}), ...dto.company };
    }

    if (dto.bank) {
      updateData.bank = { ...(existing.bank as object || {}), ...dto.bank };
    }

    if (dto.calendar) {
      updateData.calendar = { ...(existing.calendar as object || {}), ...dto.calendar };
    }

    if (dto.ai) {
      updateData.ai = { ...(existing.ai as object || {}), ...dto.ai };
    }

    return this.prisma.orgSettings.update({
      where: { orgId },
      data: updateData,
    });
  }

  async getCompanyDetails(orgId: string) {
    const settings = await this.getSettings(orgId);
    return {
      company: settings.company,
      bank: settings.bank,
    };
  }

  async getCalendarSettings(orgId: string) {
    const settings = await this.getSettings(orgId);
    return settings.calendar;
  }

  async getAiSettings(orgId: string) {
    const settings = await this.getSettings(orgId);
    return settings.ai;
  }

  async completeOnboarding(orgId: string) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { onboardingCompleted: true },
    });
  }

  async getOnboardingStatus(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { onboardingCompleted: true },
    });
    return { onboardingCompleted: org?.onboardingCompleted ?? false };
  }
}
