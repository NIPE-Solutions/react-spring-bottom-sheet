import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('recipe index links to every core pattern', async ({ page }) => {
  await page.goto('/examples/')

  await expect(page.locator('.docs-recipe-grid article')).toHaveCount(12)
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

test('content-height recipe sizes to changing content', async ({ page }) => {
  await page.goto('/examples/content-height/')
  await page.getByRole('button', { name: 'Open content-height sheet' }).click()
  await page.getByRole('button', { name: 'Show another detail' }).click()
  await expect(page.getByText('Detail 2')).toBeVisible()
})

test('scrolling recipe keeps long content operable', async ({ page }) => {
  await page.goto('/examples/scrolling/')
  await page.getByRole('button', { name: 'Open scrolling sheet' }).click()
  const region = page.getByRole('region', { name: 'Scrollable results' })
  await region.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(
    page.getByRole('button', { name: 'Load more results' }),
  ).toBeVisible()
})

test('form recipe preserves entered values and submits explicitly', async ({
  page,
}) => {
  await page.goto('/examples/form/')
  await page.getByRole('button', { name: 'Open profile form' }).click()
  await page.getByLabel('Display name').fill('Ada')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Saved for Ada')).toBeVisible()
})

test('custom portal recipe renders within its owned container', async ({
  page,
}) => {
  await page.goto('/examples/custom-portal/')
  await page.getByRole('button', { name: 'Open contained sheet' }).click()
  await expect(
    page.locator('.docs-custom-portal-target [role="dialog"]'),
  ).toBeVisible()
  const bounds = await page.evaluate(() => {
    const targetElement = document.querySelector('.docs-custom-portal-target')
    const target = targetElement?.getBoundingClientRect()
    const viewport = targetElement
      ?.querySelector('[data-rsbs-viewport]')
      ?.getBoundingClientRect()
    const dialog = document
      .querySelector('.docs-custom-portal-target [role="dialog"]')
      ?.getBoundingClientRect()
    return target && viewport && dialog && targetElement
      ? {
          target: { top: target.top, bottom: target.bottom },
          viewport: { top: viewport.top, bottom: viewport.bottom },
          dialog: { top: dialog.top, bottom: dialog.bottom },
          overflow: getComputedStyle(targetElement).overflow,
        }
      : null
  })
  expect(bounds).not.toBeNull()
  expect(bounds!.viewport.top).toBeGreaterThanOrEqual(bounds!.target.top)
  expect(bounds!.viewport.bottom).toBeLessThanOrEqual(bounds!.target.bottom)
  expect(bounds!.dialog.top).toBeGreaterThanOrEqual(bounds!.target.top)
  expect(bounds!.dialog.top).toBeLessThan(bounds!.target.bottom)
  expect(bounds!.overflow).toBe('hidden')
})

test('non-modal recipe leaves the page controls interactive', async ({
  page,
}) => {
  await page.goto('/examples/non-modal/')
  await page.getByRole('button', { name: 'Open non-modal sheet' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Persistent filters' }),
  ).not.toHaveAttribute('aria-modal')
  await page.getByRole('button', { name: 'Update page counter' }).click()
  await expect(page.getByText('Page updates: 1')).toBeVisible()
})

test('reduced-motion recipe remains functional with reduced motion requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/examples/reduced-motion/')
  await page.getByRole('button', { name: 'Open reduced-motion sheet' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Motion preference' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('confirmation recipe cannot dismiss without an explicit choice', async ({
  page,
}) => {
  await page.goto('/examples/confirmation/')
  await page.getByRole('button', { name: 'Delete workspace' }).click()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('dialog', { name: 'Delete this workspace?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Keep workspace' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('custom theme replaces the default sheet visuals', async ({ page }) => {
  await page.goto('/examples/custom-theme/')
  await page.getByRole('button', { name: 'Open field-note sheet' }).click()
  const dialog = page.getByRole('dialog', { name: 'Field notes' })

  await expect(dialog).toHaveCSS('background-color', 'rgb(248, 250, 255)')
  await expect(dialog).toHaveCSS('border-radius', '0px')
})

test('dark theme is explicit instead of depending on system mode', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/examples/dark-theme/')
  await page
    .getByRole('button', { name: 'Open night-instrument sheet' })
    .click()
  const dialog = page.getByRole('dialog', { name: 'Night instrument' })

  await expect(dialog).toHaveCSS('background-color', 'rgb(14, 23, 38)')
  await expect(dialog).toHaveCSS('color', 'rgb(232, 241, 247)')
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
  '/examples/form/',
  '/examples/non-modal/',
  '/examples/confirmation/',
  '/examples/custom-theme/',
  '/examples/dark-theme/',
]) {
  test(`${route} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}
