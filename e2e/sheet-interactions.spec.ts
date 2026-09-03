import { expect, test } from '@playwright/test'

async function sheetPosition(page: import('@playwright/test').Page) {
  return page
    .getByRole('dialog')
    .evaluate((element) =>
      Number.parseFloat(
        getComputedStyle(element).getPropertyValue('--rsbs-position'),
      ),
    )
}

test(
  'uses flick velocity to move to the next snap point',
  {
    tag: [
      '@release:mouse-drag',
      '@release:flick-settling',
      '@release:handle-only-drag',
    ],
  },
  async ({ page }) => {
    await page.goto('')
    const handle = page.getByText('Drag sheet')
    await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '400px')
    const box = await handle.boundingBox()
    if (!box) throw new Error('Expected the handle to be visible')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 50)
    expect(await sheetPosition(page)).toBeLessThan(400)
    await page.mouse.up()

    await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '160px')
  },
)

test(
  'handles touch pointer dragging',
  {
    tag: ['@release:touch-drag', '@release:pointer-cancellation'],
  },
  async ({ page }) => {
    await page.goto('')
    const dialog = page.getByRole('dialog')
    const handle = page.getByText('Drag sheet')
    await expect(dialog).toHaveCSS('--rsbs-position', '400px')

    await handle.dispatchEvent('pointerdown', {
      bubbles: true,
      pointerId: 12,
      pointerType: 'touch',
      clientY: 400,
    })
    await dialog.dispatchEvent('pointermove', {
      bubbles: true,
      pointerId: 12,
      pointerType: 'touch',
      clientY: 470,
    })
    expect(await sheetPosition(page)).toBeGreaterThan(400)
    await dialog.dispatchEvent('pointercancel', {
      bubbles: true,
      pointerId: 12,
      pointerType: 'touch',
      clientY: 470,
    })
    await expect(dialog).toHaveCSS('--rsbs-position', '400px')
  },
)

test(
  'interrupts settling motion with a new handle drag',
  { tag: '@release:motion-interruption' },
  async ({ page }) => {
    const clockStart = new Date('2026-01-01T00:00:00Z')
    await page.clock.install({ time: clockStart })
    await page.goto('')
    const dialog = page.getByRole('dialog')
    const handle = page.getByText('Drag sheet')
    await expect(dialog).toHaveCSS('--rsbs-position', '400px')
    await page.clock.pauseAt(clockStart.getTime() + 60_000)

    await handle.dispatchEvent('pointerdown', {
      bubbles: true,
      pointerId: 21,
      pointerType: 'mouse',
      clientY: 400,
    })
    await dialog.dispatchEvent('pointermove', {
      bubbles: true,
      pointerId: 21,
      pointerType: 'mouse',
      clientY: 330,
    })
    await dialog.dispatchEvent('pointerup', {
      bubbles: true,
      pointerId: 21,
      pointerType: 'mouse',
      clientY: 330,
    })
    await expect(dialog).toHaveAttribute('data-rsbs-state', 'settling')

    await handle.dispatchEvent('pointerdown', {
      bubbles: true,
      pointerId: 22,
      pointerType: 'mouse',
      clientY: 1_000,
    })
    await expect(dialog).toHaveAttribute('data-rsbs-dragging', 'true')

    await dialog.dispatchEvent('pointermove', {
      bubbles: true,
      pointerId: 22,
      pointerType: 'mouse',
      clientY: 1_120,
    })
    await expect(dialog).toHaveCSS('--rsbs-position', '450px')
    await dialog.dispatchEvent('pointercancel', {
      bubbles: true,
      pointerId: 22,
      pointerType: 'mouse',
      clientY: 1_120,
    })
    await expect(dialog).toHaveAttribute('data-rsbs-state', 'settling')
    await page.clock.runFor(2_000)
    await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
    await expect(dialog).toHaveCSS('--rsbs-position', '400px')
  },
)

test(
  'leaves a drag with nested scrollable content',
  { tag: '@release:nested-scroll' },
  async ({ page }) => {
    await page.goto('')
    await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '400px')
    const region = page.getByTestId('scroll-region')
    await region.evaluate((element) => {
      element.scrollTop = 100
    })
    const action = page.getByRole('button', { name: 'Scrollable action' })
    const box = await action.boundingBox()
    if (!box) throw new Error('Expected the scroll action to be visible')
    const before = await sheetPosition(page)

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 60)

    expect(await sheetPosition(page)).toBe(before)
    await page.mouse.up()
  },
)

test(
  'reconciles position after a viewport resize',
  { tag: '@release:viewport-resize' },
  async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await page.goto('')
    await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '400px')

    await page.setViewportSize({ width: 390, height: 700 })
    await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '350px')
  },
)

test('reconciles position when the visual viewport contracts', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const viewport = new EventTarget() as EventTarget & { height: number }
    viewport.height = 800
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    })
  })
  await page.goto('')
  await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '400px')

  await page.evaluate(() => {
    const viewport = window.visualViewport as VisualViewport & {
      height: number
    }
    viewport.height = 600
    viewport.dispatchEvent(new Event('resize'))
  })

  await expect(page.getByRole('dialog')).toHaveCSS('--rsbs-position', '300px')
})
