import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async requestMagicLink(email: string) {
    // Validate email
    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email address');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email },
      });

      // Create default organization for new user
      const org = await this.prisma.organization.create({
        data: {
          name: `${email}'s Organization`,
        },
      });

      // Create membership
      await this.prisma.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: 'OWNER',
        },
      });
    }

    // Generate magic link token
    const token = this.generateMagicLinkToken();
    const expiresIn = this.configService.get('MAGIC_LINK_EXPIRES_IN') || '30d';

    // Store token (in production, use Redis or database)
    // For now, we'll use a simple in-memory store or encode it in JWT
    const magicToken = this.jwtService.sign(
      {
        email,
        type: 'magic-link',
        token,
      },
      {
        expiresIn,
        secret: this.configService.get('MAGIC_LINK_SECRET'),
      },
    );

    const frontendUrl = this.configService.get('FRONTEND_URL');
    const magicLink = `${frontendUrl}/auth/verify?token=${magicToken}`;

    // TODO: Send email with magic link
    // For development, we'll return the link directly
    const isDev = this.configService.get('NODE_ENV') === 'development';

    return {
      message: isDev
        ? 'Magic link generated (dev mode)'
        : 'Magic link sent to your email',
      ...(isDev && { magicLink }), // Only include in dev mode
    };
  }

  async verifyMagicLink(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('MAGIC_LINK_SECRET'),
      });

      if (payload.type !== 'magic-link') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
        include: {
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Update email verified status
      if (!user.emailVerifiedAt) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }

      // Generate JWT access token
      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
        },
        {
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: !!user.emailVerifiedAt,
          organizations: user.memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            role: m.role,
            onboardingCompleted: m.organization.onboardingCompleted,
          })),
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
        onboardingCompleted: m.organization.onboardingCompleted,
      })),
    };
  }

  private generateMagicLinkToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
