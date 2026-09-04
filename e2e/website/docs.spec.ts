import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { getReleasePresentation } from '../../website/content/release'

const generatedPublicApi = JSON.parse(
  readFileSync(
    new URL('../../website/generated/public-api.json', import.meta.url),
    'utf8',
  ),
) as readonly { id: string }[]
const packageVersion = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).version as string

test('home page exposes navigation and a working sheet', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A bottom sheet with boundaries you can trust.',
  )
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Open the live sheet' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Try the real package' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('migration route is discoverable and navigates from site navigation', async ({
  page,
}) => {
  await page.goto('/')

  const migrationLink = page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Migration', exact: true })
  await expect(migrationLink).toBeVisible()
  await migrationLink.click()

  await expect(page).toHaveURL('/migration-from-react-spring-bottom-sheet/')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /migrate from react-spring-bottom-sheet/i,
    }),
  ).toBeVisible()
})

test('migration route publishes route-specific social metadata in static HTML', async ({
  page,
}) => {
  const response = await page.goto('/migration-from-react-spring-bottom-sheet/')
  const html = await response?.text()
  const url =
    'https://react-spring-bottom-sheet.nipesolutions.com/migration-from-react-spring-bottom-sheet/'
  const title = 'Migrate react-spring-bottom-sheet to React 19'
  const description =
    'Move from the original react-spring-bottom-sheet to an independently maintained React 19 implementation with an explicit API and styling migration path.'

  expect(html).toContain(`<meta property="og:title" content="${title}"`)
  expect(html).toContain(
    `<meta property="og:description" content="${description}"`,
  )
  expect(html).toContain(`<meta property="og:url" content="${url}"`)
  expect(html).toContain(`<meta name="twitter:title" content="${title}"`)
  expect(html).toContain(
    `<meta name="twitter:description" content="${description}"`,
  )
})

test('migration route is accessible and contained at 320 pixels', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/migration-from-react-spring-bottom-sheet/')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /migrate from react-spring-bottom-sheet/i,
    }),
  ).toBeVisible()

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)
})

test('every documentation link resolves', async ({ page }) => {
  await page.goto('/docs/introduction/')
  const links = page.locator('.docs-sidebar a')
  const count = await links.count()
  expect(count).toBe(17)

  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute('href')
    const response = await page.request.get(href ?? '')
    expect(response.ok(), href ?? 'missing href').toBe(true)
  }
})

test('documentation navigation covers integration and operations', async ({
  page,
}) => {
  await page.goto('/docs/introduction/')

  for (const name of [
    'Events and dismissal',
    'Portals and layering',
    'Testing',
    'Performance',
    'Support and maintenance',
  ]) {
    await expect(page.getByRole('link', { name }).first()).toBeVisible()
  }
})

test('accessibility guidance describes the real close lifecycle', async ({
  page,
}) => {
  await page.goto('/docs/accessibility/')

  await expect(page.getByText('when close state is entered')).toBeVisible()
  await expect(page.getByText('after the closing motion')).toHaveCount(0)
})

test('installation instructions match the package release state', async ({
  page,
}) => {
  await page.goto('/docs/installation/')

  const release = getReleasePresentation(packageVersion)
  await expect(
    page.getByText(release.installCommand, { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Prepared release', { exact: true })).toHaveCount(
    release.published ? 0 : 1,
  )
  await expect(
    page.getByText('is not published yet', { exact: false }),
  ).toHaveCount(release.published ? 0 : 1)
  await expect(
    page.getByText('Prerelease channel', { exact: true }),
  ).toHaveCount(release.prerelease && release.published ? 1 : 0)
})

test(
  'generic and learn documentation share server-highlighted code presentation',
  { tag: '@workbench' },
  async ({ page }) => {
    const samples = [
      { route: '/docs/events/', language: 'tsx', minimumColors: 4 },
      { route: '/docs/styling/', language: 'css', minimumColors: 4 },
      { route: '/docs/support/', language: 'shell', minimumColors: 3 },
    ] as const

    for (const { route, language, minimumColors } of samples) {
      const response = await page.goto(route)
      expect(await response?.text()).toContain('data-code-token')

      const source = page.getByRole('region', { name: `${language} code` })
      await expect(source.locator('[data-code-token]')).not.toHaveCount(0)
      const tokenColors = await source
        .locator('[data-code-token]')
        .evaluateAll(
          (tokens) =>
            new Set(tokens.map((token) => getComputedStyle(token).color)).size,
        )
      expect(tokenColors, route).toBeGreaterThanOrEqual(minimumColors)
      await expect(source).toHaveCSS('overflow-x', 'auto')
      await expect(source).toHaveCSS('white-space', 'pre')
      await source.focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      await expect(source).toBeFocused()
      await expect(source).toHaveCSS('outline-style', 'solid')

      const block = source.locator('..')
      await expect(block).toHaveCSS('border-radius', '0px')
      await expect(block).toHaveCSS('border-top-style', 'solid')
    }

    await page.goto('/docs/styling/')
    const inlineCode = page.locator('.docs-article p code').first()
    await expect(inlineCode).not.toHaveAttribute('data-source-code')
    expect(
      await inlineCode.evaluate((code) =>
        Boolean(code.closest('.docs-code-block')),
      ),
    ).toBe(false)

    await page.setViewportSize({ width: 320, height: 720 })
    const cssSource = page.getByRole('region', { name: 'css code' })
    const containment = await cssSource.evaluate((source) => ({
      clientWidth: source.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollWidth: source.scrollWidth,
      viewportWidth: window.innerWidth,
    }))
    expect(containment.documentWidth).toBe(containment.viewportWidth)
    expect(containment.scrollWidth).toBeGreaterThan(containment.clientWidth)
  },
)

test('documentation shell exposes location and adjacent routes', async ({
  page,
}) => {
  await page.goto('/docs/installation/')

  const current = page
    .locator('.docs-sidebar')
    .getByRole('link', { name: 'Installation', exact: true })
  await expect(current).toHaveAttribute('aria-current', 'page')
  await expect(
    page.getByRole('navigation', { name: 'On this page' }),
  ).toContainText('Package')
  await expect(
    page.getByRole('link', { name: 'Previous: Introduction' }),
  ).toHaveAttribute('href', '/docs/introduction/')
  await expect(
    page.getByRole('link', { name: 'Next: Component anatomy' }),
  ).toHaveAttribute('href', '/docs/anatomy/')
  await expect(page.locator('section#package')).toBeVisible()
})

test('documentation shell keeps its version label lifecycle-neutral', async ({
  page,
}) => {
  await page.goto('/docs/introduction/')

  await expect(page.locator('.docs-version')).toHaveText('Version 5')
})

test('styling guide documents replacement hooks and working themes', async ({
  page,
}) => {
  await page.goto('/docs/styling/')

  await expect(
    page.getByRole('heading', { name: 'Stable class hooks' }),
  ).toBeVisible()
  await expect(page.locator('.docs-reference-table')).toHaveCount(3)
  await expect(
    page.getByRole('link', { name: 'field-note theme' }),
  ).toHaveAttribute('href', '/examples/custom-theme/')
  await expect(
    page.getByRole('link', { name: 'dark instrument theme' }),
  ).toHaveAttribute('href', '/examples/dark-theme/')
})

test('API reference documents the generated surface and maintained guidance', async ({
  page,
}) => {
  await page.goto('/docs/api/')

  await expect(
    page.getByRole('heading', { level: 2, name: 'Composition' }),
  ).toBeVisible()

  const rootProps = page.getByRole('table', { name: 'Sheet.Root props' })
  await expect(rootProps).toBeVisible()
  await expect(
    rootProps.getByRole('columnheader', { name: 'Prop' }),
  ).toBeVisible()
  await expect(rootProps).toContainText('onOpenChange')
  await expect(rootProps).toContainText('Optional')
  await expect(rootProps).toContainText('false')

  await expect(
    page.getByRole('heading', {
      level: 3,
      name: 'BottomSheet',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page
      .locator('#public-types')
      .getByText(
        "'trigger' | 'close' | 'escape' | 'backdrop' | 'drag' | 'imperative'",
        { exact: true },
      ),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'View Sheet.Root source' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/NIPE-Solutions/react-spring-bottom-sheet/blob/v5/src/components/Root.tsx',
  )
  await expect(
    page.getByRole('link', { name: 'Run the controlled-state recipe' }),
  ).toHaveAttribute('href', '/examples/controlled/')
})

test('API reference renders every generated entry exactly once', async ({
  page,
}) => {
  await page.goto('/docs/api/')

  const renderedIds = await page
    .locator('[data-api-id]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-api-id')),
    )
  const generatedIds = generatedPublicApi.map(({ id }) => id)

  expect(renderedIds).toHaveLength(generatedIds.length)
  expect(new Set(renderedIds).size).toBe(generatedIds.length)
  expect(renderedIds.toSorted()).toEqual(generatedIds.toSorted())
})

test('API signatures stay out of keyboard order while links remain reachable', async ({
  page,
}) => {
  await page.goto('/docs/api/')

  const source = page.getByRole('link', { name: 'View Sheet.Root source' })
  const controlledRecipe = page.getByRole('link', {
    name: 'Run the controlled-state recipe',
  })
  await source.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator(':focus')).toHaveAttribute('href')
  await page.keyboard.press('Tab')
  await expect(source).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(controlledRecipe).toBeFocused()
})

test('API reference contains dense signatures at 320 pixels', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/docs/api/')

  await expect(
    page.getByRole('table', { name: 'Sheet.Root props' }),
  ).toBeVisible()

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)
})

test('API reference responds to its available table width', async ({
  page,
}) => {
  const rootProps = page.getByRole('table', { name: 'Sheet.Root props' })
  const firstRowGeometry = () =>
    rootProps
      .locator('tbody tr')
      .first()
      .evaluate((row) => {
        const table = row.closest('table')
        const tableWidth = table?.getBoundingClientRect().width ?? 0
        const captionWidth = table?.caption?.getBoundingClientRect().width ?? 0
        const cells = Array.from(row.children, (cell) => {
          const bounds = cell.getBoundingClientRect()
          return { top: Math.round(bounds.top), width: bounds.width }
        })

        return { captionWidth, cells, tableWidth }
      })

  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/docs/api/')
  await expect(rootProps).toBeVisible()

  const constrained = await firstRowGeometry()
  expect(new Set(constrained.cells.map(({ top }) => top)).size).toBe(5)
  expect(
    constrained.cells.every(
      ({ width }) => width >= constrained.tableWidth * 0.95,
    ),
  ).toBe(true)
  expect(constrained.captionWidth).toBeGreaterThanOrEqual(
    constrained.tableWidth * 0.95,
  )

  let dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)

  await page.setViewportSize({ width: 1440, height: 900 })
  const wide = await firstRowGeometry()
  expect(new Set(wide.cells.map(({ top }) => top)).size).toBe(1)
  expect(wide.cells.some(({ width }) => width < wide.tableWidth * 0.5)).toBe(
    true,
  )

  dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)
})

test('documentation navigation becomes compact on a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/docs/installation/')

  await expect(page.locator('.docs-sidebar')).toBeHidden()
  await expect(page.locator('.docs-mobile-nav')).toBeVisible()
  await expect(
    page.locator('.docs-mobile-nav').getByText('Browse documentation'),
  ).toBeVisible()
  await expect(page.locator('.docs-mobile-toc')).toBeVisible()

  const pageLinks = page.locator('.docs-page-navigation a')
  await expect(pageLinks).toHaveCount(2)
  const linkPositions = await pageLinks.evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().left),
  )
  expect(linkPositions[0]).toBe(linkPositions[1])

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBe(dimensions.viewport)
})

test('home page does not overflow a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')

  const dimensions = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      return rect ? { left: rect.left, right: rect.right } : null
    }

    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      heading: bounds('h1'),
      demo: bounds('.docs-demo-stage'),
    }
  })
  expect(dimensions.document).toBe(dimensions.viewport)
  expect(dimensions.heading?.left).toBeGreaterThanOrEqual(0)
  expect(dimensions.heading?.right).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.demo?.left).toBeGreaterThanOrEqual(0)
  expect(dimensions.demo?.right).toBeLessThanOrEqual(dimensions.viewport)
})

test('skip link moves keyboard focus to the main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await skipLink.press('Enter')

  await expect(page.locator('main#content')).toBeFocused()
})

for (const route of ['/', '/docs/accessibility/', '/docs/api/', '/examples/']) {
  test(`${route} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
}
