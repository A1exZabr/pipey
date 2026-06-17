import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        ...dto,
        tags: dto.tags || [],
        orgId,
      },
    });
  }

  async findAll(orgId: string, options?: { search?: string; tags?: string[] }) {
    const where: any = { orgId };

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search } },
      ];
    }

    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
        _count: {
          select: { conversationLinks: true },
        },
      },
    });
  }

  async findOne(orgId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        deals: {
          include: {
            stage: true,
            pipeline: true,
          },
        },
        conversationLinks: {
          include: {
            conversation: {
              include: {
                channel: true,
                messages: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return contact;
  }

  async update(orgId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.contact.update({
      where: { id },
      data: dto,
    });
  }

  async getConversations(orgId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');

    const links = await this.prisma.conversationContact.findMany({
      where: { contactId: id },
      include: {
        conversation: {
          include: {
            channel: true,
            messages: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map((l) => l.conversation);
  }

  async getDeals(orgId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');

    return this.prisma.deal.findMany({
      where: { contactId: id, orgId },
      include: { stage: true, pipeline: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtifacts(orgId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');

    return this.prisma.artifact.findMany({
      where: { contactId: id, orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTimeline(orgId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');

    const [deals, artifacts, convLinks] = await Promise.all([
      this.prisma.deal.findMany({
        where: { contactId: id, orgId },
        include: { stage: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.artifact.findMany({
        where: { contactId: id, orgId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.conversationContact.findMany({
        where: { contactId: id },
        include: { conversation: { include: { channel: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const events = [
      ...deals.map((d) => ({ type: 'deal' as const, date: d.createdAt, data: d })),
      ...artifacts.map((a) => ({ type: 'artifact' as const, date: a.createdAt, data: a })),
      ...convLinks.map((l) => ({ type: 'conversation' as const, date: l.createdAt, data: l.conversation })),
    ];

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async remove(orgId: string, id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.orgId !== orgId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.contact.delete({ where: { id } });
    return { success: true };
  }
}
