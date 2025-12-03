// ============================================================================
// Sentry Configuration
// Error monitoring and performance tracking for React renderer process
// ============================================================================

import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry for the renderer process
 * Call this in main.tsx before rendering the app
 */
export function initSentryRenderer() {
  const dsn = process.env.VITE_SENTRY_DSN

  if (!dsn) {
    console.warn('Sentry DSN not provided (VITE_SENTRY_DSN), skipping renderer initialization')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: `trends-fusion@${process.env.npm_package_version || '1.0.0'}`,

    // Set sampling rate for performance monitoring
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Capture unhandled exceptions
    captureUnhandledRejections: true,

    // Additional configuration
    debug: import.meta.env.DEV,

    // React integration
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
      Sentry.reactRouterV6Integration(import.meta.env.TYPE_CHECK ? undefined : {
        useEffect: React.useEffect,
        withSentryRouting: (route: any) => route,
      }),
    ],

    // Replay configuration
    replaysOnErrorSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE || '0.1'),
    replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE || '0.01'),

    // Before Send Hook - filter sensitive data
    beforeSend(event) {
      // Remove sensitive information before sending
      if (event.request?.headers) {
        delete event.request.headers['Cookie']
        delete event.request.headers['Authorization']
      }

      if (event.user) {
        // Don't send actual user data in development
        if (import.meta.env.DEV) {
          event.user = { id: 'dev-user', email: 'dev@example.com' }
        }
      }

      return event
    },

    // Session timeout
    autoSessionTracking: true,
    sessionTrackingIntervalMillis: 10000,
  })

  console.log('Sentry initialized for renderer process')
}

/**
 * Error Boundary Component
 * Catch and report React errors to Sentry
 */
export const SentryErrorBoundary = Sentry.withErrorBoundary

/**
 * Capture an error in the renderer process
 */
export function captureErrorRenderer(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('renderer_context', context)
    }
    Sentry.captureException(error)
  })
}

/**
 * Capture a message in the renderer process
 */
export function captureMessageRenderer(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Set user context for renderer process
 */
export function setUserContextRenderer(user: { id?: string; email?: string; username?: string }) {
  Sentry.setUser(user)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumbRenderer(message: string, category = 'navigation', level = Sentry.SeverityLevel.Info) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
  })
}

/**
 * Track a performance transaction
 */
export function trackPerformance(name: string, operation: () => void | Promise<void>) {
  const transaction = Sentry.startTransaction({ name, op: 'ui.render' })

  return transaction.finish()
}

/**
 * Wrap async operation with performance tracking
 */
export async function trackAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({ name, op: 'async' })
  const span = transaction.startChild({ op: 'operation' })

  try {
    const result = await operation()
    span.setStatus('ok')
    return result
  } catch (error) {
    span.setStatus('internal_error')
    captureErrorRenderer(error as Error, { operation: name })
    throw error
  } finally {
    span.finish()
    transaction.finish()
  }
}

/**
 * Track user interaction
 */
export function trackUserInteraction(action: string, component?: string) {
  Sentry.addBreadcrumb({
    message: `User interaction: ${action}`,
    category: 'ui.interaction',
    data: { component },
    level: Sentry.SeverityLevel.Info,
  })
}

/**
 * Report performance metrics
 */
export function reportPerformanceMetric(name: string, value: number, unit: string = 'ms') {
  Sentry.addBreadcrumb({
    message: `Performance metric: ${name}`,
    category: 'performance',
    data: { name, value, unit },
    level: Sentry.SeverityLevel.Info,
  })
}
