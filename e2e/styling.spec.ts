import { expect, test } from '@playwright/test'

test('loads the optional default theme', async ({ page }) => {
  await page.goto('')
  const sheet = page.getByRole('dialog')

  await expect(sheet).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(sheet).toHaveCSS('border-top-left-radius', '20px')

  const surface = await sheet.evaluate((element) => {
    const bottomElement = document.elementFromPoint(
      innerWidth / 2,
      innerHeight - 1,
    )
    return {
      contentHeight: element.getBoundingClientRect().height,
      ownsViewportBottom:
        bottomElement === element || element.contains(bottomElement),
    }
  })
  expect(surface.ownsViewportBottom).toBe(true)
  expect(surface.contentHeight).toBeLessThan(800)
})

test('supports a complete theme replacement with core mechanics only', async ({
  page,
}) => {
  await page.goto('custom.html')
  const sheet = page.getByRole('dialog')

  await expect(sheet).toHaveClass(/catalog-sheet/)
  await expect(sheet).toHaveCSS('background-color', 'rgb(239, 246, 255)')
  await expect(sheet).toHaveCSS('border-top-left-radius', '32px')
  await expect(sheet).toHaveCSS('--rsbs-position', '400px')
})

test('lets ordinary consumer rules override the layered theme', async ({
  page,
}) => {
  await page.goto('')
  await page.addStyleTag({
    content: '.rsbs-content { background: rgb(1 2 3); border-radius: 7px; }',
  })
  const sheet = page.getByRole('dialog')

  await expect(sheet).toHaveCSS('background-color', 'rgb(1, 2, 3)')
  await expect(sheet).toHaveCSS('border-top-left-radius', '7px')
})

test('provides dark-mode theme tokens', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('')
  const sheet = page.getByRole('dialog')

  await expect(sheet).toHaveCSS('background-color', 'rgb(15, 23, 42)')
  await expect(sheet).toHaveCSS('color', 'rgb(241, 245, 249)')
})

test('retains a visible surface in forced-colors mode', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('')
  const sheet = page.getByRole('dialog')

  await expect(sheet).toHaveCSS('border-top-style', 'solid')
  await expect(sheet).toHaveCSS('box-shadow', 'none')
})
