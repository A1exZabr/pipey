import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePipelineDto, CreateStageDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto, UpdateStageDto } from './dto/update-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreatePipelineDto) {
    const { stages, ...pipelineData } = dto;

    // If this is the first pipeline, make it default
    const existingPipelines = await this.prisma.pipeline.count({ where: { orgId } });
    const isDefault = dto.isDefault ?? existingPipelines === 0;

    // If marking as default, unset other defaults
    if (isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { orgId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.create({
      data: {
        ...pipelineData,
        isDefault,
        orgId,
        stages: stages?.length
          ? {
              create: stages.map((s, i) => ({
                name: s.name,
                order: s.order ?? i,
                color: s.color,
              })),
            }
          : {
              create: [
                { name: 'New', order: 0, color: '#6B7280' },
                { name: 'In Progress', order: 1, color: '#3B82F6' },
                { name: 'Won', order: 2, color: '#10B981' },
                { name: 'Lost', order: 3, color: '#EF4444' },
              ],
            },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.pipeline.findMany({
      where: { orgId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { deals: true } },
      },
    });
  }

  async findOne(orgId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { deals: true } },
          },
        },
        deals: {
          include: {
            stage: true,
            contact: true,
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (pipeline.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return pipeline;
  }

  async update(orgId: string, id: string, dto: UpdatePipelineDto) {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id } });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (pipeline.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { orgId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const { stages, ...pipelineData } = dto;

    return this.prisma.pipeline.update({
      where: { id },
      data: pipelineData,
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id } });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (pipeline.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.pipeline.delete({ where: { id } });
    return { success: true };
  }

  // Stage management
  async addStage(orgId: string, pipelineId: string, dto: CreateStageDto) {
    const pipeline = await this.prisma.pipeline.findUnique({ where: { id: pipelineId } });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    if (pipeline.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.stage.create({
      data: {
        ...dto,
        pipelineId,
      },
    });
  }

  async updateStage(orgId: string, stageId: string, dto: UpdateStageDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: { pipeline: true },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    if (stage.pipeline.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.stage.update({
      where: { id: stageId },
      data: dto,
    });
  }

  async removeStage(orgId: string, stageId: string) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
      include: { pipeline: true },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    if (stage.pipeline.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.stage.delete({ where: { id: stageId } });
    return { success: true };
  }
}
