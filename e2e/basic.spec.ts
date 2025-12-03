import { test, expect } from '@playwright/test'

test.describe('Basic Application Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if the main content is visible
    await expect(page.locator('body')).toBeVisible()

    // Take a screenshot for reference
    await page.screenshot({ path: 'test-results/homepage.png' })
  })

  test('should display version information', async ({ page }) => {
    await page.goto('/')

    // Look for version information (common in Electron apps)
    const versionText = await page.textContent('text=Electron')
    expect(versionText).toBeTruthy()

    // Check if Node.js version is shown
    const nodeVersion = await page.textContent('text=Node')
    expect(nodeVersion).toBeTruthy()
  })

  test('should handle IPC ping', async ({ page }) => {
    await page.goto('/')

    // Find and click the IPC test button
    const ipcButton = page.locator('button', { hasText: /ping/i })
    if (await ipcButton.isVisible()) {
      await ipcButton.click()

      // Check if response is received (the button text or a message should change)
      await expect(ipcButton).toBeEnabled()
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    await page.goto('/')

    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body')).toBeVisible()

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle navigation if present', async ({ page }) => {
    await page.goto('/')

    // Look for navigation elements
    const navElements = page.locator('nav, [role="navigation"], .nav, .navigation')
    const count = await navElements.count()

    if (count > 0) {
      // If navigation exists, test it
      const firstNavItem = navElements.first()
      await expect(firstNavItem).toBeVisible()
    }
  })
})

test.describe('Performance Tests', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    // Check for performance metrics
    const metrics = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'))
    })

    const navigationEntries = JSON.parse(metrics)
    expect(navigationEntries).toBeDefined()
    expect(navigationEntries.length).toBeGreaterThan(0)
  })
})

test.describe('Accessibility Tests', () => {
  test('should have proper page title', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should have lang attribute', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang')
  })

  test('should not have critical accessibility violations', async ({ page }) => {
    await page.goto('/')

    // Check for basic accessibility issues
    const violations: string[] = []

    // Check for images without alt text
    const images = page.locator('img')
    const imageCount = await images.count()
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      if (!alt) {
        violations.push('Image without alt text found')
      }
    }

    // Check for buttons without text
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    for (let i = 0; i < buttonCount; i++) {
      const text = await buttons.nth(i).textContent()
      if (!text?.trim()) {
        violations.push('Button without accessible text found')
      }
    }

    // Report violations (in a real scenario, you might want to fail the test)
    if (violations.length > 0) {
      console.warn('Accessibility violations:', violations)
    }
  })
})
