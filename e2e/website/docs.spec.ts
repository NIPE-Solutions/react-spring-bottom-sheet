import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('home page exposes navigation and a working sheet', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A bottom sheet with boundaries you can trust.',
  )
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Open the live sheet' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Built from the real package' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('every documentation link resolves', async ({ page }) => {
  await page.goto('/docs/introduction/')
  const links = page.locator('.docs-sidebar a')
  const count = await links.count()
  expect(count).toBe(12)

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute('href')
    const response = await page.request.get(href ?? '')
    expect(response.ok(), href ?? 'missing href').toBe(true)
  }
})

test('example sheet renders inside its custom portal target', async ({
  page,
}) => {
  await page.goto('/examples/')
  await page.getByRole('button', { name: 'Open example' }).click()

  await expect(
    page.locator('.docs-portal-target [role="dialog"]'),
  ).toBeVisible()
})

test('home page does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      return rect ? { left: rect.left, right: rect.right } : null
    }

    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      heading: bounds('h1'),
      demo: bounds('.docs-demo-stage'),
    }
  })
  expect(dimensions.document).toBe(dimensions.viewport)
  expect(dimensions.heading?.left).toBeGreaterThanOrEqual(0)
  expect(dimensions.heading?.right).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.demo?.left).toBeGreaterThanOrEqual(0)
  expect(dimensions.demo?.right).toBeLessThanOrEqual(dimensions.viewport)
})

test('skip link moves keyboard focus to the main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')

  await expect(page.locator('main#content')).toBeFocused()
})

for (const route of ['/', '/docs/accessibility/', '/examples/']) {
  test(`${route} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}
