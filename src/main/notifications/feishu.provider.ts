import { BaseNotificationProvider, NotificationPayload } from './interfaces.js';
import { logger } from '../utils/logger.js';

export class FeishuNotificationProvider extends BaseNotificationProvider {
  name = 'feishu';

  constructor(config: { webhook: string; enabled?: boolean }) {
    super({
      enabled: config.enabled !== false && !!config.webhook,
    });

    this.webhook = config.webhook;
  }

  private webhook: string;

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.validateConfig()) {
      logger.warn({
        msg: 'Feishu notification skipped - not configured',
      });
      return;
    }

    try {
      const message = {
        msg_type: 'interactive',
        card: {
          config: {
            wide_screen_mode: true,
          },
          header: {
            title: {
              content: payload.title || 'AI Trend Publish',
              tag: 'plain_text',
            },
            template: this.getTemplate(payload.level),
          },
          elements: [
            {
              tag: 'div',
              text: {
                content: payload.message,
                tag: 'lark_md',
              },
            },
          ],
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
          msg: 'Feishu notification failed',
          status: response.status,
          error,
        });
        throw new Error(`Feishu API error: ${response.status}`);
      }

      logger.info({
        msg: 'Feishu notification sent',
        level: payload.level,
        title: payload.title,
      });
    } catch (error) {
      logger.error({
        msg: 'Failed to send Feishu notification',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getTemplate(level: string): string {
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

export const feishuProvider = new FeishuNotificationProvider({
  webhook: process.env.FEISHU_WEBHOOK || '',
  enabled: !!process.env.FEISHU_WEBHOOK,
});
