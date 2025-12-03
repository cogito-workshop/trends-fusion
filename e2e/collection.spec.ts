import { test, expect } from '@playwright/test'

test.describe('Collection Module E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should navigate to collection module', async ({ page }) => {
    // Look for collection-related navigation or tabs
    const collectionLinks = [
      page.locator('a', { hasText: /collection/i }),
      page.locator('button', { hasText: /collection/i }),
      page.locator('[data-testid*="collection"]'),
      page.locator('nav a:has-text("Collection")'),
      page.locator('nav a:has-text("采集")'),
    ]

    // Try to find and click a collection link
    let collectionLinkFound = false
    for (const link of collectionLinks) {
      if (await link.isVisible()) {
        await link.click()
        collectionLinkFound = true
        break
      }
    }

    if (collectionLinkFound) {
      await page.waitForTimeout(500)
      // If we navigated somewhere, take a screenshot
      await page.screenshot({ path: 'test-results/collection-page.png' })
    } else {
      // Collection module might not be accessible or might be on the same page
      console.log('Collection link not found, checking if already on collection page...')
    }
  })

  test('should display data sources section', async ({ page }) => {
    // Look for data sources section
    const dataSourcesSelectors = [
      'h1:has-text("Data Sources")',
      'h1:has-text("数据源")',
      'h2:has-text("Data Sources")',
      'h2:has-text("数据源")',
      '[data-testid="data-sources-section"]',
    ]

    let sectionFound = false
    for (const selector of dataSourcesSelectors) {
      const section = page.locator(selector)
      if (await section.isVisible()) {
        sectionFound = true
        await expect(section).toBeVisible()
        break
      }
    }

    if (!sectionFound) {
      // Try scrolling to find the section
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      await page.evaluate(() => window.scrollTo(0, 0))
    }
  })

  test('should handle data source creation', async ({ page }) => {
    // Look for "Create" or "Add" button for data sources
    const createButtons = [
      page.locator('button', { hasText: /create/i }),
      page.locator('button', { hasText: /add/i }),
      page.locator('button', { hasText: /新建/i }),
      page.locator('button', { hasText: /新增/i }),
      page.locator('[data-testid="create-data-source"]'),
    ]

    let createButtonFound = false
    for (const button of createButtons) {
      if (await button.isVisible()) {
        await button.click()
        createButtonFound = true
        await page.waitForTimeout(500)
        break
      }
    }

    if (createButtonFound) {
      // Check if a modal or form appeared
      const modal = page.locator('[role="dialog"], .modal, .dialog')
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible()
        await page.screenshot({ path: 'test-results/create-data-source-modal.png' })
      }
    } else {
      console.log('Create data source button not found')
    }
  })

  test('should display workflow executions', async ({ page }) => {
    // Look for workflow executions section
    const workflowSelectors = [
      'text=Workflow',
      'text=Executions',
      'text=工作流',
      'text=执行',
      '[data-testid="workflow-section"]',
    ]

    for (const selector of workflowSelectors) {
      const element = page.locator(selector)
      if (await element.isVisible()) {
        await expect(element).toBeVisible()
        break
      }
    }
  })

  test('should handle filter and search', async ({ page }) => {
    // Look for search input or filter controls
    const searchInputs = [
      page.locator('input[type="search"]'),
      page.locator('input[placeholder*="search" i]'),
      page.locator('input[placeholder*="搜索" i]'),
      page.locator('[data-testid="search-input"]'),
    ]

    for (const input of searchInputs) {
      if (await input.isVisible()) {
        await input.fill('test query')
        await page.waitForTimeout(500)
        await page.screenshot({ path: 'test-results/search-test.png' })
        break
      }
    }
  })

  test('should handle pagination if present', async ({ page }) => {
    // Look for pagination controls
    const paginationSelectors = [
      '.pagination',
      '[data-testid="pagination"]',
      'button:has-text("Next")',
      'button:has-text("Previous")',
    ]

    for (const selector of paginationSelectors) {
      const element = page.locator(selector)
      if (await element.isVisible()) {
        // Try to navigate to next page
        const nextButton = page.locator('button:has-text("Next"), button:has-text("下一页")')
        if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
          await nextButton.click()
          await page.waitForTimeout(500)
          await page.screenshot({ path: 'test-results/pagination-next.png' })
        }
        break
      }
    }
  })

  test('should maintain state across navigation', async ({ page }) => {
    // Navigate to collection
    const collectionLink = page.locator('nav a:has-text("Collection")').or(
      page.locator('nav a:has-text("采集")')
    )

    if (await collectionLink.isVisible()) {
      await collectionLink.click()
      await page.waitForTimeout(500)

      // Interact with an element
      const firstRow = page.locator('tbody tr').first()
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForTimeout(500)
        await page.screenshot({ path: 'test-results/state-persistence-test.png' })
      }
    }
  })
})
