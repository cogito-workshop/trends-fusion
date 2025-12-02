import { BaseNotificationProvider, NotificationPayload } from './interfaces.js';
import { logger } from '../utils/logger.js';

export class BarkNotificationProvider extends BaseNotificationProvider {
  name = 'bark';

  constructor(config: { deviceKey: string; server?: string; enabled?: boolean }) {
    super({
      enabled: config.enabled !== false && !!config.deviceKey,
    });

    this.deviceKey = config.deviceKey;
    this.server = config.server || 'https://api.day.app';
  }

  private deviceKey: string;
  private server: string;

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.validateConfig()) {
      logger.warn({
        msg: 'Bark notification skipped - not configured',
      });
      return;
    }

    try {
      const title = payload.title || 'AI Trend Publish';
      const body = payload.message;

      const response = await fetch(`${this.server}/${this.deviceKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          level: payload.level,
          icon: 'https://raw.githubusercontent.com/Finb/bark/master/assets/img/logo.png',
          sound: 'default',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({
          msg: 'Bark notification failed',
          status: response.status,
          error,
        });
        throw new Error(`Bark API error: ${response.status}`);
      }

      logger.info({
        msg: 'Bark notification sent',
        level: payload.level,
        title,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send Bark notification',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const barkProvider = new BarkNotificationProvider({
  deviceKey: process.env.BARK_DEVICE_KEY || '',
  server: process.env.BARK_SERVER || 'https://api.day.app',
  enabled: !!process.env.BARK_DEVICE_KEY,
});
