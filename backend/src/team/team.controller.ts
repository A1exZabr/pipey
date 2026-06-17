import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { TeamService } from './team.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/team.dto';

@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamController {
  constructor(private team: TeamService) {}

  @Get()
  async getMembers(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.team.getMembers(orgId);
  }

  @Post('invite')
  @Roles('OWNER', 'ADMIN')
  async inviteMember(@Request() req, @Body() dto: InviteMemberDto) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.team.inviteMember(orgId, req.user.id, dto);
  }

  @Patch(':membershipId/role')
  @Roles('OWNER')
  async updateMemberRole(
    @Request() req,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.team.updateMemberRole(orgId, req.user.id, membershipId, dto);
  }

  @Delete(':membershipId')
  @Roles('OWNER', 'ADMIN')
  async removeMember(
    @Request() req,
    @Param('membershipId') membershipId: string,
  ) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.team.removeMember(orgId, req.user.id, membershipId);
  }

  @Post('leave')
  async leaveOrganization(@Request() req) {
    const orgId = req.user.organizations[0]?.id;
    if (!orgId) {
      throw new BadRequestException('No organization');
    }
    return this.team.leaveOrganization(orgId, req.user.id);
  }
}
