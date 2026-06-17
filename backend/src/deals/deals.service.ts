import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto, MoveDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateDealDto) {
    // Verify pipeline belongs to org
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: dto.pipelineId },
    });

    if (!pipeline || pipeline.orgId !== orgId) {
      throw new BadRequestException('Invalid pipeline');
    }

    // Verify stage belongs to pipeline
    const stage = await this.prisma.stage.findUnique({
      where: { id: dto.stageId },
    });

    if (!stage || stage.pipelineId !== dto.pipelineId) {
      throw new BadRequestException('Invalid stage');
    }

    // Verify contact if provided
    if (dto.contactId) {
      const contact = await this.prisma.contact.findUnique({
        where: { id: dto.contactId },
      });

      if (!contact || contact.orgId !== orgId) {
        throw new BadRequestException('Invalid contact');
      }
    }

    return this.prisma.deal.create({
      data: {
        title: dto.title,
        value: dto.value,
        notes: dto.notes,
        orgId,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        contactId: dto.contactId,
      },
      include: {
        stage: true,
        pipeline: true,
        contact: true,
      },
    });
  }

  async findAll(orgId: string, options?: { pipelineId?: string; stageId?: string; contactId?: string }) {
    const where: any = { orgId };

    if (options?.pipelineId) {
      where.pipelineId = options.pipelineId;
    }

    if (options?.stageId) {
      where.stageId = options.stageId;
    }

    if (options?.contactId) {
      where.contactId = options.contactId;
    }

    return this.prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        stage: true,
        pipeline: true,
        contact: true,
      },
    });
  }

  async findByPipeline(orgId: string, pipelineId: string) {
    // Verify pipeline belongs to org
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    if (!pipeline || pipeline.orgId !== orgId) {
      throw new NotFoundException('Pipeline not found');
    }

    const deals = await this.prisma.deal.findMany({
      where: { pipelineId, orgId },
      include: {
        stage: true,
        contact: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group deals by stage
    const grouped = pipeline.stages.map((stage) => ({
      ...stage,
      deals: deals.filter((d) => d.stageId === stage.id),
    }));

    return {
      pipeline,
      stages: grouped,
    };
  }

  async findOne(orgId: string, id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        pipeline: {
          include: {
            stages: { orderBy: { order: 'asc' } },
          },
        },
        contact: {
          include: {
            conversationLinks: {
              include: {
                conversation: {
                  include: {
                    channel: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return deal;
  }

  async update(orgId: string, id: string, dto: UpdateDealDto) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    // Validate stage if changing
    if (dto.stageId && dto.stageId !== deal.stageId) {
      const stage = await this.prisma.stage.findUnique({
        where: { id: dto.stageId },
      });

      if (!stage || stage.pipelineId !== deal.pipelineId) {
        throw new BadRequestException('Invalid stage');
      }
    }

    return this.prisma.deal.update({
      where: { id },
      data: dto,
      include: {
        stage: true,
        pipeline: true,
        contact: true,
      },
    });
  }

  async move(orgId: string, id: string, dto: MoveDealDto) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    const stage = await this.prisma.stage.findUnique({
      where: { id: dto.stageId },
    });

    if (!stage || stage.pipelineId !== deal.pipelineId) {
      throw new BadRequestException('Invalid stage for this pipeline');
    }

    // Check if moving to "Won" or "Lost" stage to set closedAt
    const closedAt = stage.name.toLowerCase().includes('won') || stage.name.toLowerCase().includes('lost')
      ? new Date()
      : null;

    return this.prisma.deal.update({
      where: { id },
      data: {
        stageId: dto.stageId,
        closedAt,
      },
      include: {
        stage: true,
        pipeline: true,
        contact: true,
      },
    });
  }

  async remove(orgId: string, id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      throw new NotFoundException('Deal not found');
    }

    if (deal.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.deal.delete({ where: { id } });
    return { success: true };
  }
}
