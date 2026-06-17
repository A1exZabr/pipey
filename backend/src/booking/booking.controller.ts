import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

interface BookingDto {
  name: string;
  phone?: string;
  email?: string;
  date: string; // ISO date
  time: string; // "14:00"
  comment?: string;
}

@Controller('book')
export class BookingController {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  // Public endpoint - no auth required
  @Get(':publicId')
  async getBookingPage(@Param('publicId') publicId: string) {
    // Find calendar link artifact by publicId
    const artifact = await this.prisma.artifact.findFirst({
      where: {
        type: 'CALENDAR_LINK',
        payload: {
          path: ['publicId'],
          equals: publicId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!artifact) {
      throw new NotFoundException('Booking link not found');
    }

    const payload = artifact.payload as any;
    const orgSettings = await this.settings.getSettings(artifact.orgId);
    const calendarSettings = orgSettings.calendar as any;

    // Generate available slots for next 14 days
    const slots = this.generateAvailableSlots(calendarSettings, 14);

    return {
      title: payload.title,
      description: payload.description,
      duration: payload.duration,
      organizationName: artifact.organization.name,
      slots,
    };
  }

  @Post(':publicId')
  async createBooking(
    @Param('publicId') publicId: string,
    @Body() dto: BookingDto,
  ) {
    // Find calendar link
    const artifact = await this.prisma.artifact.findFirst({
      where: {
        type: 'CALENDAR_LINK',
        payload: {
          path: ['publicId'],
          equals: publicId,
        },
      },
    });

    if (!artifact) {
      throw new NotFoundException('Booking link not found');
    }

    if (!dto.name || !dto.date || !dto.time) {
      throw new BadRequestException('Please fill in the required fields');
    }

    const payload = artifact.payload as any;

    // Create or find contact
    let contact = await this.prisma.contact.findFirst({
      where: {
        orgId: artifact.orgId,
        OR: [
          dto.email ? { email: dto.email } : {},
          dto.phone ? { phone: dto.phone } : {},
        ].filter(c => Object.keys(c).length > 0),
      },
    });

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          orgId: artifact.orgId,
          name: dto.name,
          phone: dto.phone,
          email: dto.email,
          tags: ['booking'],
          notes: `Booked via form: ${payload.title}`,
        },
      });
    }

    // Create deal for the booking
    const defaultPipeline = await this.prisma.pipeline.findFirst({
      where: { orgId: artifact.orgId, isDefault: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    if (defaultPipeline && defaultPipeline.stages.length > 0) {
      await this.prisma.deal.create({
        data: {
          orgId: artifact.orgId,
          pipelineId: defaultPipeline.id,
          stageId: defaultPipeline.stages[0].id,
          contactId: contact.id,
          title: `Booking: ${payload.title} - ${dto.date} ${dto.time}`,
          notes: dto.comment ? `Comment: ${dto.comment}` : undefined,
        },
      });
    }

    return {
      success: true,
      message: 'Booking created! We will contact you to confirm.',
      booking: {
        service: payload.title,
        date: dto.date,
        time: dto.time,
        duration: payload.duration,
      },
    };
  }

  private generateAvailableSlots(
    settings: any,
    days: number,
  ): Array<{ date: string; times: string[] }> {
    const result: Array<{ date: string; times: string[] }> = [];
    const workDays = settings?.workDays || [1, 2, 3, 4, 5];
    const startHour = parseInt(settings?.workHoursStart?.split(':')[0] || '9');
    const endHour = parseInt(settings?.workHoursEnd?.split(':')[0] || '18');
    const slotDuration = settings?.slotDuration || 30;

    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dayOfWeek = date.getDay();
      if (!workDays.includes(dayOfWeek)) {
        continue;
      }

      const times: string[] = [];
      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
          if (hour === endHour - 1 && min + slotDuration > 60) break;
          times.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        }
      }

      result.push({
        date: date.toISOString().split('T')[0],
        times,
      });
    }

    return result;
  }
}
