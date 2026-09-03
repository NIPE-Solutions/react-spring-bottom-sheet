import { expect, test } from '@playwright/test'

test(
  'isolates background content and contains modal focus',
  { tag: '@release:modal-focus-isolation' },
  async ({ page }) => {
    await page.goto('')
    const background = page.locator('#root')
    const firstAction = page.getByRole('button', { name: 'Dismiss sheet' })
    const lastAction = page.getByRole('button', { name: 'Scrollable action' })

    await expect(firstAction).toBeFocused()
    await expect(background).toHaveAttribute('aria-hidden', 'true')
    await expect(background).toHaveJSProperty('inert', true)

    await lastAction.focus()
    await page.keyboard.press('Tab')
    await expect(firstAction).toBeFocused()
  },
)

test('fades the backdrop, restores focus, and reopens', async ({ page }) => {
  await page.goto('')
  const dialog = page.locator('[data-rsbs-content]')
  const backdrop = page.locator('[data-rsbs-backdrop]')
  const trigger = page.getByRole('button', { name: 'Open sheet' })

  await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
  const fadeObserved = backdrop.evaluate(
    (element) =>
      new Promise<boolean>((resolve) => {
        const initialOpacity = Number.parseFloat(
          getComputedStyle(element).opacity,
        )
        const sample = () => {
          if (!element.isConnected) {
            resolve(false)
            return
          }
          const opacity = Number.parseFloat(getComputedStyle(element).opacity)
          if (opacity > 0 && opacity < initialOpacity) {
            resolve(true)
            return
          }
          requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      }),
  )
  await page.getByRole('button', { name: 'Dismiss sheet' }).click()
  await expect(dialog).toHaveAttribute('data-rsbs-state', 'closing')
  expect(await fadeObserved).toBe(true)
  await expect(dialog).toHaveCount(0)

  await trigger.click()
  await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
  await page.getByRole('button', { name: 'Dismiss sheet' }).click()
  await expect(dialog).toHaveAttribute('data-rsbs-state', 'closing')
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('dismisses with Escape', async ({ page }) => {
  await page.goto('')
  const dialog = page.locator('[data-rsbs-content]')

  await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveAttribute('data-rsbs-state', 'closing')
  await expect(dialog).toHaveCount(0)
})

test('keeps backdrop opacity continuous when motion reverses', async ({
  page,
}) => {
  await page.goto('')
  const backdrop = page.locator('[data-rsbs-backdrop]')
  const dialog = page.locator('[data-rsbs-content]')
  await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
  const initialOpacity = await backdrop.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).opacity),
  )

  await page.getByRole('button', { name: 'Dismiss sheet' }).click()
  await expect
    .poll(
      () =>
        backdrop.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).opacity),
        ),
      { intervals: [16] },
    )
    .toBeLessThan(initialOpacity * 0.5)

  const reopeningSamples = await page.evaluate(async () => {
    const backdrop = document.querySelector<HTMLElement>(
      '[data-rsbs-backdrop]',
    )!
    const trigger = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Open sheet',
    )!
    const samples = [Number.parseFloat(getComputedStyle(backdrop).opacity)]
    const observer = new MutationObserver(() => {
      samples.push(Number.parseFloat(getComputedStyle(backdrop).opacity))
    })
    observer.observe(backdrop, { attributes: true, attributeFilter: ['style'] })
    trigger.click()
    while (
      document
        .querySelector('[data-rsbs-content]')
        ?.getAttribute('data-rsbs-state') !== 'open'
    )
      await new Promise(requestAnimationFrame)
    observer.disconnect()
    return samples
  })

  expect(reopeningSamples.length).toBeGreaterThan(1)
  expect(Math.abs(reopeningSamples[1]! - reopeningSamples[0]!)).toBeLessThan(
    initialOpacity * 0.15,
  )
  expect(reopeningSamples.at(-1)).toBeCloseTo(initialOpacity, 2)

  await page.getByRole('button', { name: 'Dismiss sheet' }).click()
  await expect(dialog).toHaveCount(0)
  const reclosingSamples = await page.evaluate(async () => {
    const trigger = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent === 'Open sheet',
    )!
    const samples = await new Promise<number[]>((resolve) => {
      let reversalStarted = false
      const openingObserver = new MutationObserver(() => {
        if (reversalStarted) return
        const backdrop = document.querySelector<HTMLElement>(
          '[data-rsbs-backdrop]',
        )
        if (!backdrop) return
        const progress = Number.parseFloat(
          backdrop.style.getPropertyValue('--rsbs-backdrop-progress'),
        )
        if (!(progress > 0 && progress < 1)) return
        reversalStarted = true
        openingObserver.disconnect()
        const values = [progress]
        const closingObserver = new MutationObserver(() => {
          values.push(
            Number.parseFloat(
              backdrop.style.getPropertyValue('--rsbs-backdrop-progress'),
            ),
          )
        })
        closingObserver.observe(backdrop, {
          attributes: true,
          attributeFilter: ['style'],
        })
        const close = Array.from(document.querySelectorAll('button')).find(
          (button) => button.textContent === 'Dismiss sheet',
        )!
        close.click()
        const waitForRemoval = () => {
          if (backdrop.isConnected) {
            requestAnimationFrame(waitForRemoval)
            return
          }
          closingObserver.disconnect()
          resolve(values)
        }
        requestAnimationFrame(waitForRemoval)
      })
      openingObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['style'],
        childList: true,
        subtree: true,
      })
      trigger.click()
    })
    return samples
  })

  expect(reclosingSamples.length).toBeGreaterThan(1)
  expect(Math.abs(reclosingSamples[1]! - reclosingSamples[0]!)).toBeLessThan(
    0.15,
  )
  expect(reclosingSamples.at(-1)).toBeCloseTo(0, 1)
})
