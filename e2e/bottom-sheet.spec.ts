import { expect, test } from '@playwright/test'

test('dismisses, restores focus, and reopens', async ({ page }) => {
  await page.goto('/fixtures/simple')

  const dialog = page.getByRole('dialog')
  const openButton = page.getByRole('button', { name: 'Open' })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(dialog).toBeHidden()

  await openButton.click()
  await expect(dialog).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(dialog).toBeHidden()
  await expect(openButton).toBeFocused()
})

test('dismisses with Escape', async ({ page }) => {
  await page.goto('/fixtures/simple')

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(page.getByText('Tap to expand')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('snaps between controls and allows content scrolling', async ({ page }) => {
  await page.goto('/fixtures/scrollable')

  const dialog = page.getByRole('dialog')
  const scrollArea = page.locator('[data-rsbs-scroll]')
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'Bottom' }).click()
  const bottomHeight = await dialog.evaluate((element) =>
    element.getBoundingClientRect().height
  )

  await page.getByRole('button', { name: 'Top', exact: true }).click()
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.getBoundingClientRect().height)
    )
    .toBeGreaterThan(bottomHeight)

  await scrollArea.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  expect(await scrollArea.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0
  )
})
