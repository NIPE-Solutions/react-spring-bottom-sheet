import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('recipe index links to every core pattern', async ({ page }) => {
  await page.goto('/examples/')

  await expect(page.locator('.docs-recipe-grid article')).toHaveCount(3)
  await expect(
    page.getByRole('link', { name: 'Open basic sheet recipe' }),
  ).toHaveAttribute('href', '/examples/basic/')
  await expect(
    page.getByRole('link', { name: 'Open controlled state recipe' }),
  ).toHaveAttribute('href', '/examples/controlled/')
  await expect(
    page.getByRole('link', { name: 'Open named snap points recipe' }),
  ).toHaveAttribute('href', '/examples/snap-points/')
})

test('recipe pages fit a 320-pixel viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })

  for (const route of ['/examples/', '/examples/basic/']) {
    await page.goto(route)
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }))
    expect(dimensions.document).toBe(dimensions.viewport)
  }
})

test('basic recipe opens, closes, and restores focus', async ({ page }) => {
  await page.goto('/examples/basic/')
  const trigger = page.getByRole('button', { name: 'Open basic sheet' })

  await trigger.click()
  await expect(
    page.getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Close sheet' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('controlled recipe reflects Escape in application state', async ({
  page,
}) => {
  await page.goto('/examples/controlled/')
  await expect(page.getByText('State: closed')).toBeVisible()

  await page.getByRole('button', { name: 'Open controlled sheet' }).click()
  await expect(page.getByText('State: open')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('State: closed')).toBeVisible()
})

test('snap-point recipe exposes and changes its named destination', async ({
  page,
}) => {
  await page.goto('/examples/snap-points/')
  await page.getByRole('button', { name: 'Open snap-point sheet' }).click()

  await expect(page.getByText('Active snap point: compact')).toBeVisible()
  await page.getByRole('button', { name: 'Expanded' }).click()
  await expect(page.getByText('Active snap point: expanded')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Expanded' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('source remains available as native disclosure content', async ({
  page,
}) => {
  await page.goto('/examples/basic/')
  await page.getByText('View source').click()

  await expect(page.locator('.docs-recipe-source code')).toContainText(
    "import { Sheet } from '@library'",
  )
  await page.getByRole('button', { name: 'Copy source' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
})

for (const route of [
  '/examples/basic/',
  '/examples/controlled/',
  '/examples/snap-points/',
]) {
  test(`${route} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}
