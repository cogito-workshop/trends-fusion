import { BaseNotificationProvider, NotificationPayload } from './interfaces.js';
import { logger } from '../utils/logger.js';

export class DingTalkNotificationProvider extends BaseNotificationProvider {
  name = 'dingtalk';

  constructor(config: { webhook: string; secret?: string; enabled?: boolean }) {
    super({
      enabled: config.enabled !== false && !!config.webhook,
    });

    this.webhook = config.webhook;
    this.secret = config.secret;
  }

  private webhook: string;
  private secret?: string;

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.validateConfig()) {
      logger.warn({
        msg: 'DingTalk notification skipped - not configured',
      });
      return;
    }

    try {
      const level = payload.level;
      const color = this.getColor(level);

      const message = {
        msgtype: 'markdown',
        markdown: {
          title: payload.title || 'AI Trend Publish',
          text: `### ${payload.title}\n\n**Level:** ${level.toUpperCase()}\n\n${payload.message}`,
        },
        at: {
          isAtAll: false,
        },
      };

      const response = await fetch(this.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({
          msg: 'DingTalk notification failed',
          status: response.status,
          error,
        });
        throw new Error(`DingTalk API error: ${response.status}`);
      }

      logger.info({
        msg: 'DingTalk notification sent',
        level: payload.level,
        title: payload.title,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send DingTalk notification',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getColor(level: string): string {
    switch (level) {
      case 'error':
        return 'red';
      case 'warning':
        return 'orange';
      case 'success':
        return 'green';
      default:
        return 'blue';
    }
  }
}

export const dingtalkProvider = new DingTalkNotificationProvider({
  webhook: process.env.DINGTALK_WEBHOOK || '',
  enabled: !!process.env.DINGTALK_WEBHOOK,
});
