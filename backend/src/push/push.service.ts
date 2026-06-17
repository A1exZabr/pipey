import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    if (publicKey && privateKey) {
      webpush.setVapidDetails(`mailto:admin@${new URL(subject).hostname}`, publicKey, privateKey);
      this.enabled = true;
      this.logger.log('Web Push initialized');
    } else {
      this.logger.warn('VAPID keys not set — push notifications disabled');
    }
  }

  getVapidPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY', '');
  }

  async subscribe(userId: string, orgId: string, subscription: { endpoint: string; p256dh: string; auth: string }) {
    return this.prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
      create: { userId, orgId, ...subscription },
      update: { p256dh: subscription.p256dh, auth: subscription.auth },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { success: true };
  }

  async sendToOrg(orgId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { orgId },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        ).catch(async (err) => {
          // Remove expired subscriptions (410 Gone)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          throw err;
        }),
      ),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.debug(`Push sent ${sent}/${subscriptions.length} to org ${orgId}`);
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        ),
      ),
    );
  }
}
