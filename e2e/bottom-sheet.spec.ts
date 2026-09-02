import { expect, test } from '@playwright/test'

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
