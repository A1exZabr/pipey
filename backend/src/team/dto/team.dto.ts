import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(MemberRole)
  @IsOptional()
  role?: MemberRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  role: MemberRole;
}
