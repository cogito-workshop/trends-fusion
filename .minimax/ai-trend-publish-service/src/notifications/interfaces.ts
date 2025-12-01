export interface NotificationConfig {
  enabled: boolean
}

export interface NotificationPayload {
  title: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
  metadata?: Record<string, unknown>
}

export interface NotificationProvider {
  name: string
  send(payload: NotificationPayload): Promise<void>
  validateConfig(): boolean
}

export abstract class BaseNotificationProvider implements NotificationProvider {
  abstract name: string
  protected config: NotificationConfig

  constructor(config: NotificationConfig) {
    this.config = config
  }

  abstract send(payload: NotificationPayload): Promise<void>

  validateConfig(): boolean {
    return this.config.enabled
  }
}
