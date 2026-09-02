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
  const links = page.locator('.docs-nav a')
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

  await expect(page.locator('.portal-target [role="dialog"]')).toBeVisible()
})

test('home page does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)
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
