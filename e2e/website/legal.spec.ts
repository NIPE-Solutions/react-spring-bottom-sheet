import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const routes = [
  { path: '/impressum/', heading: 'Impressum' },
  { path: '/privacy/', heading: 'Privacy' },
  { path: '/de/impressum/', heading: 'Impressum' },
  { path: '/de/datenschutz/', heading: 'Datenschutz' },
  { path: '/accessibility/', heading: 'Accessibility' },
] as const

for (const route of routes) {
  test(`${route.path} publishes accessible legal information`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto(route.path)

    await expect(
      page.getByRole('heading', { level: 1, name: route.heading }),
    ).toBeVisible()
    await expect(
      page
        .getByLabel('Operator contact')
        .getByRole('link', { name: 'office@nipesolutions.com' }),
    ).toHaveAttribute('href', 'mailto:office@nipesolutions.com')

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }))
    expect(dimensions.document).toBe(dimensions.viewport)

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}
