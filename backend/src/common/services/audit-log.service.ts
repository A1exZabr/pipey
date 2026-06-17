import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'credentials',
  'encryptionKey', 'credentialsEncrypted', 'botToken',
  'accessToken', 'refreshToken', 'apiKey',
];

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(
    orgId: string,
    action: string,
    payload: Record<string, any> = {},
    actorUserId?: string,
  ): Promise<void> {
    try {
      const sanitized = this.sanitizePayload(payload);
      await this.prisma.auditLog.create({
        data: {
          orgId,
          action,
          payload: sanitized,
          actorUserId: actorUserId || null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`);
    }
  }

  private sanitizePayload(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        result[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.sanitizePayload(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
