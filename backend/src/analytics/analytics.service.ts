import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getFunnel(orgId: string, from?: string, to?: string) {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { orgId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            deals: {
              where: {
                ...(from || to
                  ? {
                      createdAt: {
                        ...(from ? { gte: new Date(from) } : {}),
                        ...(to ? { lte: new Date(to) } : {}),
                      },
                    }
                  : {}),
              },
            },
          },
        },
      },
    });

    return pipelines.map((pipeline) => ({
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      stages: pipeline.stages.map((stage) => ({
        stageId: stage.id,
        stageName: stage.name,
        order: stage.order,
        isCritical: stage.isCritical,
        dealCount: stage.deals.length,
        totalValue: stage.deals.reduce((sum, d) => sum + Number(d.value || 0), 0),
      })),
    }));
  }

  async getRevenue(
    orgId: string,
    from?: string,
    to?: string,
    groupBy: 'day' | 'week' | 'month' = 'month',
  ) {
    const deals = await this.prisma.deal.findMany({
      where: {
        orgId,
        closedAt: {
          not: null,
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      },
      select: {
        value: true,
        closedAt: true,
      },
      orderBy: { closedAt: 'asc' },
    });

    const buckets = new Map<string, { revenue: number; count: number }>();

    for (const deal of deals) {
      if (!deal.closedAt || deal.value == null) continue;
      const key = this.getBucketKey(deal.closedAt, groupBy);
      const existing = buckets.get(key) || { revenue: 0, count: 0 };
      buckets.set(key, {
        revenue: existing.revenue + Number(deal.value),
        count: existing.count + 1,
      });
    }

    return Array.from(buckets.entries()).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      dealCount: data.count,
    }));
  }

  async getChannelStats(orgId: string, from?: string, to?: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        orgId,
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      select: {
        channel: { select: { type: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    const stats = new Map<string, { conversations: number; messages: number }>();

    for (const conv of conversations) {
      const key = conv.channel.type.toLowerCase();
      const existing = stats.get(key) || { conversations: 0, messages: 0 };
      stats.set(key, {
        conversations: existing.conversations + 1,
        messages: existing.messages + conv._count.messages,
      });
    }

    return Array.from(stats.entries()).map(([channel, data]) => ({
      channel,
      conversations: data.conversations,
      messages: data.messages,
    }));
  }

  async getTeamStats(orgId: string, _from?: string, _to?: string) {
    const members = await this.prisma.membership.findMany({
      where: { orgId },
      include: {
        user: true,
      },
    });

    return members.map((member) => ({
      userId: member.userId,
      userEmail: member.user.email,
      role: member.role,
    }));
  }

  private getBucketKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    const d = new Date(date);
    if (groupBy === 'day') {
      return d.toISOString().slice(0, 10);
    } else if (groupBy === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().slice(0, 10);
    } else {
      return d.toISOString().slice(0, 7);
    }
  }
}
