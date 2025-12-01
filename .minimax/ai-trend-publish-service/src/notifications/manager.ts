import { NotificationProvider, NotificationPayload } from './interfaces.js'
import { barkProvider } from './bark.provider.js'
import { dingtalkProvider } from './dingtalk.provider.js'
import { feishuProvider } from './feishu.provider.js'
import { logger } from '../utils/logger.js'

export class NotificationManager {
  private static instance: NotificationManager
  private providers: Map<string, NotificationProvider> = new Map()

  private constructor() {
    this.initializeProviders()
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  private initializeProviders(): void {
    const providers = [barkProvider, dingtalkProvider, feishuProvider]

    providers.forEach(provider => {
      if (provider.validateConfig()) {
        this.providers.set(provider.name, provider)
        logger.info(`✓ Notification provider loaded: ${provider.name}`)
      } else {
        logger.info(`- Notification provider skipped: ${provider.name}`)
      }
    })

    logger.info(`Notification manager initialized with ${this.providers.size} providers`)
  }

  async send(payload: NotificationPayload): Promise<void> {
    if (this.providers.size === 0) {
      logger.debug('No notification providers configured, skipping')
      return
    }

    const promises = Array.from(this.providers.values()).map(provider => {
      try {
        return provider.send(payload)
      } catch (error) {
        logger.error({
          msg: `Failed to send notification via ${provider.name}`,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    })

    await Promise.allSettled(promises)

    logger.info({
      msg: 'Notification sent',
      level: payload.level,
      title: payload.title,
      providerCount: this.providers.size,
    })
  }

  async sendSuccess(title: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.send({
      title,
      message,
      level: 'success',
      metadata,
    })
  }

  async sendError(title: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.send({
      title,
      message,
      level: 'error',
      metadata,
    })
  }

  async sendWarning(title: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.send({
      title,
      message,
      level: 'warning',
      metadata,
    })
  }

  async sendInfo(title: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.send({
      title,
      message,
      level: 'info',
      metadata,
    })
  }

  getProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  getProvider(name: string): NotificationProvider | undefined {
    return this.providers.get(name)
  }
}

export const notificationManager = NotificationManager.getInstance()
