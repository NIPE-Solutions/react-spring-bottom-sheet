import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { buildEvidence } from '../../website/content/evidence'

const packageVersion = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).version as string

test('homepage presents generated package evidence and useful next steps', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'A bottom sheet with boundaries you can trust.',
    }),
  ).toBeVisible()
  const evidence = page.getByRole('region', {
    name: 'What the current build proves.',
  })
  await expect(evidence).toContainText(packageVersion)
  await expect(evidence.getByText('Build facts', { exact: true })).toBeVisible()
  await expect(
    evidence.getByText('Prepared version', { exact: true }),
  ).toBeVisible()
  await expect(evidence.getByText('Published facts')).toHaveCount(0)
  await expect(evidence.getByText('Current channel')).toHaveCount(0)
  await expect(evidence).toContainText(
    `${(buildEvidence.moduleGzipBytes / 1000).toFixed(1)} kB gzip`,
  )
  await expect(evidence).toContainText('Chromium, Firefox, WebKit')
  await expect(evidence).toContainText('React ^19.0.0')
  await expect(
    page.getByRole('heading', { name: 'Start with the whole system.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Built for the difficult parts.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Your visual system stays yours.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Accessibility is runtime behavior.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'A deliberate path to 5.0.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Read the styling contract' }),
  ).toHaveAttribute('href', '/docs/styling/')
  await expect(
    page.getByRole('link', { name: 'Review accessibility behavior' }),
  ).toHaveAttribute('href', '/docs/accessibility/')
  await expect(
    page.getByRole('link', { name: 'Explore controlled state' }),
  ).toHaveAttribute('href', '/examples/controlled/')
})

test(
  'homepage code is server-highlighted and contained by its layout',
  { tag: '@workbench' },
  async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const response = await page.goto('/')
    expect(await response?.text()).toContain('data-code-token')

    const install = page.locator('.docs-quick-start .docs-install')
    const quickStart = page.locator('.docs-quick-start-code')
    const launch = page.locator('.docs-launch-actions .docs-code-block')
    await expect(install.locator('[data-code-token]')).not.toHaveCount(0)
    await expect(quickStart.locator('[data-code-token]')).not.toHaveCount(0)
    await expect(launch.locator('[data-code-token]')).not.toHaveCount(0)

    const tokenColorCount = (block: typeof quickStart) =>
      block
        .locator('[data-code-token]')
        .evaluateAll(
          (tokens) =>
            new Set(tokens.map((token) => getComputedStyle(token).color)).size,
        )
    expect(await tokenColorCount(quickStart)).toBeGreaterThanOrEqual(4)
    expect(await tokenColorCount(install)).toBeGreaterThanOrEqual(2)

    const quickStartSource = quickStart.getByRole('region', {
      name: 'tsx code',
    })
    await page
      .getByRole('link', { name: 'Follow the installation guide' })
      .focus()
    await page.keyboard.press('Tab')
    await expect(quickStartSource).toBeFocused()
    await expect(quickStartSource).toHaveCSS('outline-style', 'solid')
    await expect(quickStartSource).toHaveCSS('white-space', 'pre')
    await expect(quickStartSource).toHaveCSS('overflow-x', 'auto')
    await expect(quickStartSource).toHaveCSS('max-height', '544px')

    const launchGeometry = await launch.evaluate((block) => {
      const parent = block.parentElement?.getBoundingClientRect()
      const bounds = block.getBoundingClientRect()
      if (!parent) throw new Error('Missing launch actions')
      return {
        blockLeft: bounds.left,
        blockRight: bounds.right,
        blockWidth: bounds.width,
        parentLeft: parent.left,
        parentRight: parent.right,
        parentWidth: parent.width,
      }
    })
    expect(launchGeometry.blockLeft).toBeCloseTo(launchGeometry.parentLeft, 0)
    expect(launchGeometry.blockRight).toBeCloseTo(launchGeometry.parentRight, 0)
    expect(launchGeometry.blockWidth).toBeCloseTo(launchGeometry.parentWidth, 0)

    await page.setViewportSize({ width: 320, height: 720 })
    const containment = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      quickStartClientWidth: document.querySelector(
        '.docs-quick-start-code pre',
      )?.clientWidth,
      quickStartScrollWidth: document.querySelector(
        '.docs-quick-start-code pre',
      )?.scrollWidth,
      viewportWidth: window.innerWidth,
    }))
    expect(containment.documentWidth).toBe(containment.viewportWidth)
    expect(containment.quickStartScrollWidth).toBeGreaterThan(
      containment.quickStartClientWidth ?? Number.POSITIVE_INFINITY,
    )
  },
)

test('live sheet opens, changes destination, and restores focus', async ({
  page,
}) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Open the live sheet' })

  await trigger.click()
  const phone = page.getByLabel('Interactive sheet preview')
  const dialog = page.getByRole('dialog', { name: 'Try the real package' })
  await expect(dialog).toBeVisible()
  await expect(phone.locator('[role="dialog"]')).toHaveCount(1)
  const containment = await page.evaluate(() => {
    const screen = document.querySelector('.docs-phone-screen')
    const phone = screen?.getBoundingClientRect()
    const viewport = screen
      ?.querySelector('[data-rsbs-viewport]')
      ?.getBoundingClientRect()
    const dialog = document
      .querySelector('.docs-phone-screen [role="dialog"]')
      ?.getBoundingClientRect()
    return phone && viewport && dialog && screen
      ? {
          phone: { top: phone.top, bottom: phone.bottom },
          viewport: { top: viewport.top, bottom: viewport.bottom },
          dialog: { top: dialog.top, bottom: dialog.bottom },
          overflow: getComputedStyle(screen).overflow,
        }
      : null
  })
  expect(containment).not.toBeNull()
  expect(containment!.viewport.top).toBeCloseTo(containment!.phone.top, 0)
  expect(containment!.viewport.bottom).toBeCloseTo(containment!.phone.bottom, 0)
  expect(containment!.dialog.top).toBeGreaterThanOrEqual(containment!.phone.top)
  expect(containment!.dialog.top).toBeLessThan(containment!.phone.bottom)
  expect(containment!.overflow).toBe('hidden')
  await expect(page.getByText('Current destination: compact')).toBeVisible()
  await page.getByRole('button', { name: 'Expand sheet' }).click()
  await expect(page.getByText('Current destination: expanded')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('live sheet responds to a direct handle gesture', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open the live sheet' }).click()
  await expect(page.getByRole('dialog')).toHaveAttribute(
    'data-rsbs-state',
    'open',
  )
  const handle = page.locator('[data-rsbs-handle]')
  const box = await handle.boundingBox()
  if (!box) throw new Error('Expected the sheet handle to be visible')

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 80)
  await page.mouse.up()

  await expect(page.getByText('Current destination: expanded')).toBeVisible()
})

test('homepage has no detectable accessibility violations', async ({
  page,
}) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('homepage remains contained at 320 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)

  const stylingColumns = await page
    .locator('.docs-style-layers > div')
    .first()
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns)
  expect(stylingColumns.trim().split(/\s+/)).toHaveLength(1)
})

test('homepage launch grid remains contained just above the compact-layout boundary', async ({
  page,
}) => {
  await page.setViewportSize({ width: 810, height: 900 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)
  const launchColumns = await page
    .locator('.docs-launch-path')
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns)
  expect(launchColumns.trim().split(/\s+/)).toHaveLength(1)
})
