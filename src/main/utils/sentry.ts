// ============================================================================
// Sentry Configuration
// Error monitoring and performance tracking for Electron main process
// ============================================================================

import * as Sentry from '@sentry/electron'

/**
 * Initialize Sentry for the main process
 * Call this function early in main.ts before creating BrowserWindows
 */
export function initSentryMain() {
  // Only initialize if DSN is provided
  const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN

  if (!dsn) {
    console.warn('Sentry DSN not provided, skipping initialization')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `trends-fusion@${process.env.npm_package_version || '1.0.0'}`,

    // Set sampling rate for performance monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Capture unhandled exceptions
    captureUnhandledRejections: true,

    // Additional configuration
    debug: process.env.NODE_ENV === 'development',

    // Before Send Hook - filter out certain errors
    beforeSend(event) {
      // Filter out development-only errors in production
      if (process.env.NODE_ENV === 'production') {
        // Remove stack traces that contain dev-only messages
        if (event.exception?.values) {
          event.exception.values = event.exception.values.filter((exception) => {
            const message = exception.value?.toLowerCase() || ''
            return !message.includes('dev only') && !message.includes('hot reload')
          })
        }
      }

      return event
    },

    // integrations: Add Electron-specific integrations
    integrations: [
      Sentry.integration.defaultIntegration,
      Sentry.integration.onUnhandledRejectionIntegration(),
      Sentry.integration.moduleMetadataIntegration(),
    ],
  })

  console.log('Sentry initialized for main process')
}

/**
 * Capture an error in the main process
 */
export function captureErrorMain(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('main_context', context)
    }
    Sentry.captureException(error)
  })
}

/**
 * Capture a message in the main process
 */
export function captureMessageMain(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for main process
 */
export function setUserContextMain(user: { id?: string; email?: string; username?: string }) {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumbMain(message: string, category = 'navigation', level = Sentry.SeverityLevel.Info) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
  })
}

/**
 * Flush Sentry queue and close (call on app exit)
 */
export async function closeSentryMain(timeout = 5000): Promise<void> {
  await Sentry.close(timeout)
}

// ============================================================================
// IPC Error Handler Middleware
// Helper to wrap IPC handlers with error capture
// ============================================================================

/**
 * Wrap an IPC handler with error capture
 */
export function withErrorCapture<T extends any[], R>(
  handler: (...args: T) => Promise<R> | R,
  channelName: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      captureErrorMain(error as Error, {
        channel: channelName,
        args: args.map((arg, idx) => ({
          index: idx,
          type: typeof arg,
          hasValue: arg !== null && arg !== undefined,
        })),
      })
      throw error
    }
  }
}

/**
 * Add IPC breadcrumbs for better debugging
 */
export function ipcBreadcrumb(channel: string, action: string, data?: any) {
  addBreadcrumbMain(`IPC ${channel}:${action}`, 'ipc', Sentry.SeverityLevel.Info)
  if (data) {
    console.log(`[IPC] ${channel}:${action}`, data)
  }
}
