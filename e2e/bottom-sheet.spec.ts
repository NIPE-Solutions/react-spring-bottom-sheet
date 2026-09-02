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

test('dismisses, restores focus, and reopens', async ({ page }) => {
  await page.goto('')
  const dialog = page.locator('[data-rsbs-content]')
  const trigger = page.getByRole('button', { name: 'Open sheet' })

  await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
  await page.getByRole('button', { name: 'Dismiss sheet' }).click()
  await expect(dialog).toHaveAttribute('data-rsbs-state', 'closing')
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
