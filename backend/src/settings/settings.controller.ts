import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateOrgSettingsDto } from './dto/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  async getSettings(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.getSettings(orgId);
  }

  @Patch()
  async updateSettings(@Request() req, @Body() dto: UpdateOrgSettingsDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.updateSettings(orgId, dto);
  }

  @Get('company')
  async getCompanyDetails(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.getCompanyDetails(orgId);
  }

  @Get('calendar')
  async getCalendarSettings(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.getCalendarSettings(orgId);
  }

  @Get('ai')
  async getAiSettings(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.getAiSettings(orgId);
  }

  @Patch('onboarding-complete')
  async completeOnboarding(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.completeOnboarding(orgId);
  }

  @Get('onboarding-status')
  async getOnboardingStatus(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.settings.getOnboardingStatus(orgId);
  }
}
