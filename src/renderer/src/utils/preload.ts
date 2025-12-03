// ============================================================================
// Preload Utility - Prefetch components for better UX
// ============================================================================

// Preload function for components
export function preloadComponent(importFunc: () => Promise<any>): void {
  // Create a promise but don't await it
  importFunc()
}

// Preload on hover utility
export function createOnHoverPreloader(importFunc: () => Promise<any>) {
  let timeoutId: NodeJS.Timeout | null = null

  return {
    onMouseEnter: () => {
      // Preload after a short delay to avoid prefetching on accidental hovers
      timeoutId = setTimeout(() => {
        preloadComponent(importFunc)
      }, 100)
    },
    onMouseLeave: () => {
      // Cancel preload if mouse leaves before timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
  }
}

// Preload map for all route components
export const routePreloaders = {
  login: () => import('../components/auth/LoginForm'),
  register: () => import('../components/auth/RegisterForm'),
  dashboard: () => import('../components/dashboard/Dashboard'),
  collection: () => import('../components/collection/CollectionDashboard'),
  summary: () => import('../components/summary/SummaryDashboard'),
  publish: () => import('../components/publish/PublishDashboard'),
  notifications: () => import('../components/notifications/Notifications'),
  automation: () => import('../components/automation/Automation'),
  analytics: () => import('../components/analytics/AnalyticsDashboard'),
  settings: () => import('../components/settings/Settings')
}

// Preload frequently accessed routes on app start
export function preloadCommonRoutes(): void {
  // Preload Dashboard (default route) after a short delay
  setTimeout(() => {
    preloadComponent(routePreloaders.dashboard)
  }, 2000)

  // Preload Collection (frequently used feature)
  setTimeout(() => {
    preloadComponent(routePreloaders.collection)
  }, 3000)
}
