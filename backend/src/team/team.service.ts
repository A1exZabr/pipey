import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto, UpdateMemberRoleDto, MemberRole } from './dto/team.dto';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private prisma: PrismaService) {}

  async getMembers(orgId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async inviteMember(orgId: string, inviterUserId: string, dto: InviteMemberDto) {
    // Check if inviter has permission (must be OWNER or ADMIN)
    const inviterMembership = await this.prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: inviterUserId,
          orgId,
        },
      },
    });

    if (!inviterMembership || inviterMembership.role === 'MEMBER') {
      throw new ForbiddenException('Only owners and admins can invite members');
    }

    // Cannot invite as OWNER
    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot invite as owner');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
        },
      });
      this.logger.log(`Created new user for invitation: ${dto.email}`);
    }

    // Check if already a member
    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: user.id,
          orgId,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this organization');
    }

    // Create membership
    const membership = await this.prisma.membership.create({
      data: {
        userId: user.id,
        orgId,
        role: dto.role || 'MEMBER',
      },
    });

    this.logger.log(`Invited ${dto.email} to org ${orgId} as ${membership.role}`);

    return {
      id: membership.id,
      userId: user.id,
      email: user.email,
      role: membership.role,
      joinedAt: membership.createdAt,
    };
  }

  async updateMemberRole(orgId: string, updaterUserId: string, membershipId: string, dto: UpdateMemberRoleDto) {
    // Check if updater has permission
    const updaterMembership = await this.prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: updaterUserId,
          orgId,
        },
      },
    });

    if (!updaterMembership || updaterMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can change roles');
    }

    // Find target membership
    const targetMembership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!targetMembership || targetMembership.orgId !== orgId) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner's role
    if (targetMembership.role === 'OWNER') {
      throw new BadRequestException('Cannot change owner role');
    }

    // Cannot set role to OWNER
    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot promote to owner');
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: dto.role },
    });
  }

  async removeMember(orgId: string, removerUserId: string, membershipId: string) {
    // Check if remover has permission
    const removerMembership = await this.prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: removerUserId,
          orgId,
        },
      },
    });

    if (!removerMembership || removerMembership.role === 'MEMBER') {
      throw new ForbiddenException('Only owners and admins can remove members');
    }

    // Find target membership
    const targetMembership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!targetMembership || targetMembership.orgId !== orgId) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove owner
    if (targetMembership.role === 'OWNER') {
      throw new BadRequestException('Cannot remove owner');
    }

    // Admin cannot remove another admin
    if (removerMembership.role === 'ADMIN' && targetMembership.role === 'ADMIN') {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.prisma.membership.delete({
      where: { id: membershipId },
    });

    return { success: true };
  }

  async leaveOrganization(orgId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Not a member of this organization');
    }

    // Owner cannot leave
    if (membership.role === 'OWNER') {
      throw new BadRequestException('Owner cannot leave organization. Transfer ownership first.');
    }

    await this.prisma.membership.delete({
      where: { id: membership.id },
    });

    return { success: true };
  }
}
