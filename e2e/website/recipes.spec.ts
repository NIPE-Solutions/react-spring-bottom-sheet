import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const RECIPE_SOURCES = [
  ['basic', 'BasicSheet.tsx'],
  ['controlled', 'ControlledSheet.tsx'],
  ['snap-points', 'SnapPointSheet.tsx'],
  ['content-height', 'ContentHeightSheet.tsx'],
  ['scrolling', 'ScrollingSheet.tsx'],
  ['form', 'FormSheet.tsx'],
  ['custom-portal', 'CustomPortalSheet.tsx'],
  ['non-modal', 'NonModalSheet.tsx'],
  ['reduced-motion', 'ReducedMotionSheet.tsx'],
  ['custom-theme', 'CustomThemeSheet.tsx'],
  ['dark-theme', 'DarkThemeSheet.tsx'],
  ['confirmation', 'ConfirmationSheet.tsx'],
] as const

const CANONICAL_RECIPE_SOURCES = RECIPE_SOURCES.map(([slug, filename]) => ({
  filename,
  slug,
  source: readFileSync(
    new URL(`../../website/recipes/${slug}/${filename}`, import.meta.url),
    'utf8',
  ),
}))

const BASIC_RECIPE_SOURCE = CANONICAL_RECIPE_SOURCES[0]!.source

function recipeFrame(page: Page) {
  return page.frameLocator('[title$="interactive preview"]')
}

const DEVICE_STATES = [
  {
    device: 'phone',
    orientation: 'portrait',
    width: 390,
    height: 780,
  },
  {
    device: 'phone',
    orientation: 'landscape',
    width: 780,
    height: 390,
  },
  {
    device: 'tablet',
    orientation: 'portrait',
    width: 820,
    height: 1080,
  },
  {
    device: 'tablet',
    orientation: 'landscape',
    width: 1080,
    height: 820,
  },
] as const

// WebKit can quantize independently animated layout and transform boxes by
// almost four CSS pixels at a forced mid-animation sample. Five pixels covers
// that variance; separate containment and interactability checks stay strict.
const ANIMATED_GEOMETRY_TOLERANCE_PX = 5

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

test('device lab restores all viewport states with exact dimensions', async ({
  page,
}) => {
  for (const { device, orientation, width, height } of DEVICE_STATES) {
    await page.goto(
      `/examples/basic/?device=${device}&orientation=${orientation}`,
    )

    const frame = page.locator('.docs-device-frame')
    const iframe = page.locator('[title$="interactive preview"]')
    await expect(frame).toHaveAttribute('data-device', device)
    await expect(frame).toHaveAttribute('data-orientation', orientation)
    await expect(frame).toHaveAttribute('data-preview-ready', 'true')
    await expect(
      page.getByRole('button', {
        name: device === 'phone' ? 'Phone' : 'Tablet',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByRole('button', {
        name: orientation === 'portrait' ? 'Portrait' : 'Landscape',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.docs-device-readout')).toHaveText(
      `${device === 'phone' ? 'Phone' : 'Tablet'} viewport: ${width} × ${height}`,
    )

    expect(
      await iframe.evaluate((element) => {
        if (!(element instanceof HTMLIFrameElement)) {
          throw new Error('Expected the recipe preview to be an iframe')
        }
        return {
          height: element.contentWindow?.innerHeight,
          width: element.contentWindow?.innerWidth,
        }
      }),
    ).toEqual({ height, width })
    await expect(frame).toHaveCSS('--device-width', `${width}px`)
    await expect(frame).toHaveCSS('--device-height', `${height}px`)
  }
})

test('device lab defaults to phone portrait with visible pressed controls', async ({
  page,
}) => {
  await page.goto('/examples/basic/')

  await expect(page).toHaveURL(
    /\/examples\/basic\/\?device=phone&orientation=portrait$/,
  )
  await expect(page.getByRole('button', { name: 'Phone' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Portrait' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Tablet' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByRole('button', { name: 'Landscape' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  const pressedColors = await page
    .getByRole('button', { name: 'Phone' })
    .evaluate((element) => {
      const pressed = getComputedStyle(element)
      const unpressed = getComputedStyle(
        element.parentElement?.querySelector('button:last-child') ?? element,
      )
      return {
        pressedBackground: pressed.backgroundColor,
        pressedText: pressed.color,
        unpressedBackground: unpressed.backgroundColor,
        unpressedText: unpressed.color,
      }
    })
  expect(pressedColors.pressedBackground).not.toBe(
    pressedColors.unpressedBackground,
  )
  expect(pressedColors.pressedText).not.toBe(pressedColors.unpressedText)
  await expect(page.locator('.docs-device-frame')).toHaveCSS(
    'transition-property',
    'none',
  )
  expect(
    await page
      .locator('.docs-device-lab')
      .evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState !== 'finished').length,
      ),
  ).toBe(0)

  await page.setViewportSize({ width: 720, height: 900 })
  expect(
    await page
      .locator('.docs-device-lab')
      .evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState !== 'finished').length,
      ),
  ).toBe(0)
})

test('device lab keeps intermediate user morph geometry aligned and interactive', async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto('/examples/basic/?device=phone&orientation=portrait')
  const frame = page.locator('.docs-device-frame')
  await expect(frame).toHaveAttribute('data-preview-ready', 'true')

  const initialWidth = (await frame.boundingBox())?.width
  expect(initialWidth).toBeDefined()
  await page.getByRole('button', { name: 'Landscape' }).click()
  await expect(frame).toHaveAttribute('data-morphing', 'true')
  await page.locator('.docs-device-lab').evaluate(async (element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.currentTime = 140
      animation.pause()
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })

  const geometry = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect()
      if (!rect) throw new Error(`Missing ${selector}`)
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      }
    }
    return {
      frame: bounds('.docs-device-frame'),
      screen: bounds('.docs-device-screen'),
      sizer: bounds('.docs-device-frame-sizer'),
      stage: bounds('.docs-recipe-stage'),
    }
  })
  expect(geometry.frame.width).toBeGreaterThan(initialWidth!)
  expect(geometry.frame.right).toBeLessThanOrEqual(geometry.stage.right + 1)
  expect(geometry.frame.left).toBeGreaterThanOrEqual(geometry.stage.left - 1)
  expect(Math.abs(geometry.frame.width - geometry.sizer.width)).toBeLessThan(
    ANIMATED_GEOMETRY_TOLERANCE_PX,
  )
  expect(Math.abs(geometry.frame.height - geometry.stage.height)).toBeLessThan(
    ANIMATED_GEOMETRY_TOLERANCE_PX,
  )
  expect(geometry.screen.left).toBeGreaterThanOrEqual(geometry.frame.left)
  expect(geometry.screen.right).toBeLessThanOrEqual(geometry.frame.right)
  expect(geometry.screen.bottom).toBeLessThanOrEqual(geometry.frame.bottom)

  await recipeFrame(page)
    .getByRole('button', { name: 'Open basic sheet' })
    .click()
  await expect(
    recipeFrame(page).getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()
})

test('device lab interrupts a morph from its live geometry without replacing the iframe', async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto('/examples/basic/?device=phone&orientation=portrait')
  const frame = page.locator('.docs-device-frame')
  const iframe = page.locator('[title$="interactive preview"]')
  await expect(frame).toHaveAttribute('data-preview-ready', 'true')
  const iframeElement = await iframe.elementHandle()
  expect(iframeElement).not.toBeNull()
  await recipeFrame(page)
    .locator('#content')
    .evaluate((element) => {
      element.dataset.interruptionMarker = 'same-document'
    })

  const setAnimationsAt = (time: number, paused: boolean) =>
    page.locator('.docs-device-lab').evaluate(
      async (element, state) => {
        const animations = element.getAnimations({ subtree: true })
        if (state.paused) {
          for (const animation of animations) animation.pause()
          await Promise.all(animations.map((animation) => animation.ready))
          for (const animation of animations) animation.currentTime = state.time
        } else {
          for (const animation of animations) {
            animation.currentTime = state.time
            animation.play()
          }
          await Promise.all(animations.map((animation) => animation.ready))
        }
      },
      { paused, time },
    )
  const readGeometry = () =>
    page.evaluate(() => {
      const bounds = (selector: string) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect()
        if (!rect) throw new Error(`Missing ${selector}`)
        return {
          height: rect.height,
          left: rect.left,
          top: rect.top,
          width: rect.width,
        }
      }
      return {
        frame: bounds('.docs-device-frame'),
        sizer: bounds('.docs-device-frame-sizer'),
        stage: bounds('.docs-recipe-stage'),
      }
    })
  await page.getByRole('button', { name: 'Landscape' }).click()
  await expect(frame).toHaveAttribute('data-morphing', 'true')
  await setAnimationsAt(90, false)

  let releaseNavigation = () => {}
  let markNavigationBlocked = () => {}
  let blockNextNavigation = true
  const navigationBlocked = new Promise<void>((resolve) => {
    markNavigationBlocked = resolve
  })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (
      request.resourceType() === 'fetch' &&
      url.pathname.includes('/examples/basic') &&
      !url.pathname.includes('/embed') &&
      blockNextNavigation
    ) {
      blockNextNavigation = false
      markNavigationBlocked()
      await new Promise<void>((resolve) => {
        releaseNavigation = resolve
      })
    }
    await route.continue()
  })
  await page.evaluate(() => {
    type Geometry = {
      frame: { height: number; left: number; top: number; width: number }
      sizer: { height: number; left: number; top: number; width: number }
      stage: { height: number; left: number; top: number; width: number }
    }
    const testWindow = window as typeof window & {
      deviceLabInterruption?: {
        after: Geometry | null
        before: Geometry | null
      }
    }
    const read = () => {
      const bounds = (selector: string) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect()
        if (!rect) throw new Error(`Missing ${selector}`)
        return {
          height: rect.height,
          left: rect.left,
          top: rect.top,
          width: rect.width,
        }
      }
      return {
        frame: bounds('.docs-device-frame'),
        sizer: bounds('.docs-device-frame-sizer'),
        stage: bounds('.docs-recipe-stage'),
      }
    }
    const interruption: NonNullable<typeof testWindow.deviceLabInterruption> = {
      after: null,
      before: null,
    }
    testWindow.deviceLabInterruption = interruption
    window.addEventListener(
      'click',
      (event) => {
        const target = event.target
        if (
          target instanceof HTMLButtonElement &&
          target.textContent === 'Tablet'
        ) {
          interruption.before = read()
        }
      },
      { capture: true, once: true },
    )
    window.addEventListener(
      'click',
      (event) => {
        const target = event.target
        if (
          target instanceof HTMLButtonElement &&
          target.textContent === 'Tablet'
        ) {
          interruption.after = read()
        }
      },
      { once: true },
    )
  })

  await page.getByRole('button', { name: 'Tablet' }).dispatchEvent('click')
  await navigationBlocked
  await page.waitForTimeout(80)
  const heldPresentation = await readGeometry()
  const blockedPresentation = await page.evaluate(() => {
    type Geometry = {
      frame: { height: number; left: number; top: number; width: number }
      sizer: { height: number; left: number; top: number; width: number }
      stage: { height: number; left: number; top: number; width: number }
    }
    const testWindow = window as typeof window & {
      deviceLabInterruption?: {
        after: Geometry | null
        before: Geometry | null
      }
    }
    return testWindow.deviceLabInterruption
  })
  if (!blockedPresentation?.before || !blockedPresentation.after) {
    throw new Error('Missing handler-boundary geometry')
  }
  releaseNavigation()
  await expect(page).toHaveURL(/device=tablet&orientation=landscape$/)
  await expect(frame).toHaveAttribute('data-morphing', 'true')
  await setAnimationsAt(0, true)
  const replacementStart = await readGeometry()

  const beforeHandler = blockedPresentation.before
  const afterHandler = blockedPresentation.after
  for (const element of ['frame', 'sizer', 'stage'] as const) {
    for (const dimension of ['height', 'left', 'top', 'width'] as const) {
      expect(
        Math.abs(
          beforeHandler[element][dimension] - afterHandler[element][dimension],
        ),
        `${element}.${dimension} should remain continuous across the React click handler`,
      ).toBeLessThan(1)
    }
  }

  for (const element of ['frame', 'sizer', 'stage'] as const) {
    for (const dimension of ['height', 'left', 'top', 'width'] as const) {
      expect(
        Math.abs(
          afterHandler[element][dimension] -
            heldPresentation[element][dimension],
        ),
        `${element}.${dimension} should stay frozen through URL reconciliation`,
      ).toBeLessThan(1)
    }
  }

  for (const element of ['frame', 'sizer', 'stage'] as const) {
    for (const dimension of ['height', 'left', 'top', 'width'] as const) {
      expect(
        Math.abs(
          afterHandler[element][dimension] -
            replacementStart[element][dimension],
        ),
        `${element}.${dimension} should remain continuous (${afterHandler[element][dimension]} -> ${replacementStart[element][dimension]})`,
      ).toBeLessThan(1)
    }
  }
  expect(
    await iframe.evaluate(
      (element, original) => element === original,
      iframeElement,
    ),
  ).toBe(true)
  await expect(recipeFrame(page).locator('#content')).toHaveAttribute(
    'data-interruption-marker',
    'same-document',
  )

  await page.locator('.docs-device-lab').evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.play()
    }
  })
  await expect(frame).toHaveAttribute('data-morphing', 'false')
  expect(
    await page
      .locator('.docs-device-lab')
      .evaluate((element) => element.getAnimations({ subtree: true }).length),
  ).toBe(0)
  expect(
    await iframe.evaluate((element) => {
      if (!(element instanceof HTMLIFrameElement)) {
        throw new Error('Expected the recipe preview to be an iframe')
      }
      return {
        height: element.contentWindow?.innerHeight,
        width: element.contentWindow?.innerWidth,
      }
    }),
  ).toEqual({ height: 820, width: 1080 })
  await recipeFrame(page)
    .getByRole('button', { name: 'Open basic sheet' })
    .click()
  await expect(
    recipeFrame(page).getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()
})

test('device lab rolls a stalled morph back to the committed URL selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto('/examples/basic/?device=phone&orientation=portrait')
  const frame = page.locator('.docs-device-frame')
  const iframe = page.locator('[title$="interactive preview"]')
  await expect(frame).toHaveAttribute('data-preview-ready', 'true')
  const iframeElement = await iframe.elementHandle()
  expect(iframeElement).not.toBeNull()
  await recipeFrame(page)
    .locator('#content')
    .evaluate((element) => {
      element.dataset.rollbackMarker = 'same-document'
    })

  await page.getByRole('button', { name: 'Landscape' }).click()
  await expect(page).toHaveURL(/device=phone&orientation=landscape$/)
  await expect(frame).toHaveAttribute('data-morphing', 'true')
  await page.locator('.docs-device-lab').evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true })
    for (const animation of animations) {
      animation.currentTime = 90
      animation.play()
    }
    await Promise.all(animations.map((animation) => animation.ready))
  })

  let releaseRoute = () => {}
  let markNavigationBlocked = () => {}
  let markRouteFinished = () => {}
  let abortRoute = false
  let blockNextNavigation = true
  const navigationBlocked = new Promise<void>((resolve) => {
    markNavigationBlocked = resolve
  })
  const routeFinished = new Promise<void>((resolve) => {
    markRouteFinished = resolve
  })
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (
      request.resourceType() === 'fetch' &&
      url.pathname.includes('/examples/basic') &&
      !url.pathname.includes('/embed') &&
      blockNextNavigation
    ) {
      blockNextNavigation = false
      markNavigationBlocked()
      await new Promise<void>((resolve) => {
        releaseRoute = resolve
      })
      if (abortRoute) await route.abort('failed')
      else await route.continue()
      markRouteFinished()
      return
    }
    await route.continue()
  })

  await page.getByRole('button', { name: 'Tablet' }).dispatchEvent('click')
  await navigationBlocked

  try {
    expect(
      await page
        .locator('.docs-device-lab')
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    ).toBeGreaterThan(0)
    await expect
      .poll(
        () =>
          page
            .locator('.docs-device-lab')
            .evaluate(
              (element) => element.getAnimations({ subtree: true }).length,
            ),
        { timeout: 5_000 },
      )
      .toBe(0)

    await expect(page).toHaveURL(/device=phone&orientation=landscape$/)
    await expect(frame).toHaveAttribute('data-device', 'phone')
    await expect(frame).toHaveAttribute('data-orientation', 'landscape')
    await expect(frame).toHaveAttribute('data-morphing', 'false')
    await expect(
      page.getByRole('button', { name: 'Landscape' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.docs-device-readout')).toHaveText(
      'Phone viewport: 780 × 390',
    )

    const settledGeometry = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect()
        if (!rect) throw new Error(`Missing ${selector}`)
        return { height: rect.height, width: rect.width }
      }
      return {
        frame: bounds('.docs-device-frame'),
        sizer: bounds('.docs-device-frame-sizer'),
        stage: bounds('.docs-recipe-stage'),
      }
    })
    expect(
      Math.abs(settledGeometry.frame.width - settledGeometry.sizer.width),
    ).toBeLessThan(1)
    expect(
      Math.abs(settledGeometry.frame.height - settledGeometry.sizer.height),
    ).toBeLessThan(1)
    expect(
      Math.abs(settledGeometry.frame.height - settledGeometry.stage.height),
    ).toBeLessThan(1)
    expect(
      await iframe.evaluate((element) => {
        if (!(element instanceof HTMLIFrameElement)) {
          throw new Error('Expected the recipe preview to be an iframe')
        }
        return {
          height: element.contentWindow?.innerHeight,
          width: element.contentWindow?.innerWidth,
        }
      }),
    ).toEqual({ height: 390, width: 780 })
    expect(
      await iframe.evaluate(
        (element, original) => element === original,
        iframeElement,
      ),
    ).toBe(true)
    await expect(recipeFrame(page).locator('#content')).toHaveAttribute(
      'data-rollback-marker',
      'same-document',
    )
  } finally {
    abortRoute = true
    releaseRoute()
    await routeFinished
    await page.unroute('**/*')
  }
})

test('device lab preserves its iframe and open sheet through browser history', async ({
  page,
}) => {
  await page.goto(
    '/examples/basic/?campaign=spring&device=tablet&orientation=landscape',
  )
  const iframe = page.locator('[title$="interactive preview"]')
  await expect(page.locator('.docs-device-frame')).toHaveAttribute(
    'data-preview-ready',
    'true',
  )
  const iframeElement = await iframe.elementHandle()
  expect(iframeElement).not.toBeNull()
  const marker = 'device-lab-persistent-document'
  await recipeFrame(page)
    .locator('#content')
    .evaluate((element, value) => {
      element.dataset.persistenceMarker = value
    }, marker)

  await recipeFrame(page)
    .getByRole('button', { name: 'Open basic sheet' })
    .click()
  await expect(
    recipeFrame(page).getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Portrait' }).click()
  await expect(page).toHaveURL(
    /campaign=spring&device=tablet&orientation=portrait$/,
  )
  expect(
    await iframe.evaluate(
      (element, original) => element === original,
      iframeElement,
    ),
  ).toBe(true)
  await expect(recipeFrame(page).locator('#content')).toHaveAttribute(
    'data-persistence-marker',
    marker,
  )
  await expect(
    recipeFrame(page).getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(
    /campaign=spring&device=tablet&orientation=landscape$/,
  )
  await expect(page.locator('.docs-device-frame')).toHaveAttribute(
    'data-orientation',
    'landscape',
  )
  await expect(page.locator('.docs-device-frame')).toHaveAttribute(
    'data-morphing',
    'false',
  )
  await page.goForward()
  await expect(page).toHaveURL(
    /campaign=spring&device=tablet&orientation=portrait$/,
  )
  await expect(page.locator('.docs-device-frame')).toHaveAttribute(
    'data-morphing',
    'false',
  )
  await expect(recipeFrame(page).locator('#content')).toHaveAttribute(
    'data-persistence-marker',
    marker,
  )
  await expect(
    recipeFrame(page).getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()
})

test('device lab removes frame interpolation for reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/examples/basic/?device=phone&orientation=portrait')

  const frame = page.locator('.docs-device-frame')
  const stage = page.locator('.docs-recipe-stage')
  await expect(frame).toHaveAttribute('data-preview-ready', 'true')
  await expect(frame).toHaveCSS('transition-duration', '0s')
  await expect(frame).toHaveCSS('transition-property', 'none')
  await expect(stage).toHaveCSS('transition-duration', '0s')

  await page.getByRole('button', { name: 'Landscape' }).click()
  await expect(frame).toHaveAttribute('data-orientation', 'landscape')
  await expect(frame).toHaveAttribute('data-morphing', 'false')
  await expect(frame).toHaveCSS('--device-width', '780px')
  await expect(frame).toHaveCSS('--device-height', '390px')
  expect(
    await page.locator('[title$="interactive preview"]').evaluate((element) => {
      if (!(element instanceof HTMLIFrameElement)) {
        throw new Error('Expected the recipe preview to be an iframe')
      }
      return {
        height: element.contentWindow?.innerHeight,
        width: element.contentWindow?.innerWidth,
      }
    }),
  ).toEqual({ height: 390, width: 780 })
})

test('device lab recovers scaling when initially hidden and fits three responsive widths', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.id = 'initially-hidden-device-lab'
    style.textContent = '.docs-recipe-stage { display: none !important; }'
    const observer = new MutationObserver(() => {
      if (!document.head || style.isConnected) return
      document.head.append(style)
      observer.disconnect()
    })
    observer.observe(document, { childList: true, subtree: true })
  })
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/examples/basic/?device=tablet&orientation=landscape')
  const stage = page.locator('.docs-recipe-stage')
  const frame = page.locator('.docs-device-frame')
  await expect(frame).toHaveAttribute('data-preview-ready', 'true')
  await expect(stage).toBeHidden()

  await page.evaluate(() => {
    document.querySelector('#initially-hidden-device-lab')?.remove()
  })
  await expect(stage).toBeVisible()
  await expect
    .poll(() =>
      frame.evaluate((element) => {
        const transform = getComputedStyle(element).transform
        return transform !== 'none' && !transform.includes('NaN')
      }),
    )
    .toBe(true)
  expect(
    await page
      .locator('.docs-device-lab')
      .evaluate(
        (element) =>
          element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState !== 'finished').length,
      ),
  ).toBe(0)

  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        })),
      )
      .toEqual({ document: width, viewport: width })
  }
})

test(
  'recipe pages fit a 320-pixel viewport',
  { tag: '@release:narrow-layout' },
  async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })

    for (const route of ['/examples/', '/examples/basic/']) {
      await page.goto(route)
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
      }))
      expect(dimensions.document).toBe(dimensions.viewport)
    }
  },
)

test('basic recipe opens, closes, and restores focus', async ({ page }) => {
  await page.goto('/examples/basic/')
  const frame = recipeFrame(page)
  const trigger = frame.getByRole('button', { name: 'Open basic sheet' })

  await trigger.click()
  await expect(
    frame.getByRole('dialog', { name: 'Basic bottom sheet' }),
  ).toBeVisible()
  await frame.getByRole('button', { name: 'Close sheet' }).click()
  await expect(frame.getByRole('dialog')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('controlled recipe reflects Escape in application state', async ({
  page,
}) => {
  await page.goto('/examples/controlled/')
  const frame = recipeFrame(page)
  await expect(frame.getByText('State: closed')).toBeVisible()

  await frame.getByRole('button', { name: 'Open controlled sheet' }).click()
  await expect(frame.getByText('State: open')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(frame.getByText('State: closed')).toBeVisible()
})

test('snap-point recipe exposes and changes its named destination', async ({
  page,
}) => {
  await page.goto('/examples/snap-points/')
  const frame = recipeFrame(page)
  await frame.getByRole('button', { name: 'Open snap-point sheet' }).click()

  await expect(
    frame.getByRole('dialog', { name: 'Named snap points' }),
  ).toHaveAttribute('data-rsbs-state', 'open')
  await expect(frame.getByText('Active snap point: compact')).toBeVisible()
  const expanded = frame.getByRole('button', { name: 'Expanded' })
  const bounds = await expanded.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportHeight)

  await expanded.click()
  await expect(frame.getByText('Active snap point: expanded')).toBeVisible()
  await expect(expanded).toHaveAttribute('aria-pressed', 'true')
})

test(
  'content-height recipe sizes to changing content',
  { tag: '@release:content-resize' },
  async ({ page }) => {
    await page.goto('/examples/content-height/')
    const frame = recipeFrame(page)
    await frame
      .getByRole('button', { name: 'Open content-height sheet' })
      .click()
    const dialog = frame.getByRole('dialog', {
      name: 'Content-sized details',
    })
    await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
    const initialPosition = await dialog.evaluate((element) =>
      Number.parseFloat(
        getComputedStyle(element).getPropertyValue('--rsbs-position'),
      ),
    )

    await dialog.evaluate((element) => {
      const addedContent = document.createElement('p')
      addedContent.textContent = 'Resize observer probe'
      addedContent.style.height = '48px'
      addedContent.style.margin = '0'
      element.append(addedContent)
    })
    await expect(dialog).toHaveAttribute('data-rsbs-state', 'settling')
    await expect(dialog).toHaveAttribute('data-rsbs-state', 'open')
    expect(
      await dialog.evaluate((element) =>
        Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--rsbs-position'),
        ),
      ),
    ).toBeLessThan(initialPosition)
  },
)

test('scrolling recipe keeps long content operable', async ({ page }) => {
  await page.goto('/examples/scrolling/')
  const frame = recipeFrame(page)
  await frame.getByRole('button', { name: 'Open scrolling sheet' }).click()
  const region = frame.getByRole('region', { name: 'Scrollable results' })
  await region.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(
    frame.getByRole('button', { name: 'Load more results' }),
  ).toBeVisible()
})

test('form recipe preserves entered values and submits explicitly', async ({
  page,
}) => {
  await page.goto('/examples/form/')
  const frame = recipeFrame(page)
  await frame.getByRole('button', { name: 'Open profile form' }).click()
  await expect(
    frame.getByRole('dialog', { name: 'Edit profile' }),
  ).toHaveAttribute('data-rsbs-state', 'open')
  await frame.getByLabel('Display name').fill('Ada')
  await frame.getByRole('button', { name: 'Save profile' }).click()
  await expect(frame.getByText('Saved for Ada')).toBeVisible()
})

test(
  'custom portal recipe renders within its owned container',
  {
    tag: '@release:custom-portal',
  },
  async ({ page }) => {
    await page.goto('/examples/custom-portal/')
    const frame = recipeFrame(page)
    await frame.getByRole('button', { name: 'Open contained sheet' }).click()
    await expect(
      frame.locator('.docs-custom-portal-target [role="dialog"]'),
    ).toBeVisible()
    const bounds = await frame
      .locator('.docs-custom-portal-target')
      .evaluate((targetElement) => {
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
  },
)

test(
  'non-modal recipe leaves the page controls interactive',
  {
    tag: '@release:non-modal-interaction',
  },
  async ({ page }) => {
    await page.goto('/examples/non-modal/')
    const frame = recipeFrame(page)
    await frame.getByRole('button', { name: 'Open non-modal sheet' }).click()
    await expect(
      frame.getByRole('dialog', { name: 'Persistent filters' }),
    ).not.toHaveAttribute('aria-modal')
    await frame.getByRole('button', { name: 'Update page counter' }).click()
    await expect(frame.getByText('Page updates: 1')).toBeVisible()
  },
)

test(
  'reduced-motion recipe settles by the next animation frame',
  {
    tag: '@release:reduced-motion',
  },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/examples/reduced-motion/')
    const frame = recipeFrame(page)
    const trigger = frame.getByRole('button', {
      name: 'Open reduced-motion sheet',
    })
    await expect(trigger).toBeVisible()
    const openState = await trigger.evaluate(async (element) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error('Expected the sheet trigger to be an HTML element')
      }
      element.click()
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      return document
        .querySelector('[data-rsbs-content]')
        ?.getAttribute('data-rsbs-state')
    })
    expect(openState).toBe('open')

    const closeState = await frame
      .getByRole('button', { name: 'Close sheet' })
      .evaluate(async (element) => {
        if (!(element instanceof HTMLElement)) {
          throw new Error('Expected the sheet close control to be HTML')
        }
        element.click()
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        )
        return document
          .querySelector('[data-rsbs-content]')
          ?.getAttribute('data-rsbs-state')
      })
    expect(closeState).toBeUndefined()
  },
)

test('confirmation recipe cannot dismiss without an explicit choice', async ({
  page,
}) => {
  await page.goto('/examples/confirmation/')
  const frame = recipeFrame(page)
  await frame.getByRole('button', { name: 'Delete workspace' }).click()
  await page.keyboard.press('Escape')
  await expect(
    frame.getByRole('dialog', { name: 'Delete this workspace?' }),
  ).toBeVisible()
  await frame.getByRole('button', { name: 'Keep workspace' }).click()
  await expect(frame.getByRole('dialog')).toHaveCount(0)
})

test('custom theme replaces the default sheet visuals', async ({ page }) => {
  await page.goto('/examples/custom-theme/')
  const frame = recipeFrame(page)
  await frame.getByRole('button', { name: 'Open field-note sheet' }).click()
  const dialog = frame.getByRole('dialog', { name: 'Field notes' })

  await expect(dialog).toHaveCSS('background-color', 'rgb(248, 250, 255)')
  await expect(dialog).toHaveCSS('border-radius', '0px')
})

test('dark theme is explicit instead of depending on system mode', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/examples/dark-theme/')
  const frame = recipeFrame(page)
  await frame
    .getByRole('button', { name: 'Open night-instrument sheet' })
    .click()
  const dialog = frame.getByRole('dialog', { name: 'Night instrument' })

  await expect(dialog).toHaveCSS('background-color', 'rgb(14, 23, 38)')
  await expect(dialog).toHaveCSS('color', 'rgb(232, 241, 247)')
})

test('highlighted source is a keyboard-readable disclosure with exact copy output', async ({
  browserName,
  context,
  page,
}) => {
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  }
  await page.goto('/examples/basic/')

  const disclosure = page.locator('.docs-recipe-source details')
  const disclosureControl = page.locator('.docs-recipe-source summary')
  await expect(disclosureControl).toHaveText('View BasicSheet.tsx')
  await expect(disclosure).not.toHaveAttribute('open', '')
  await disclosureControl.focus()
  await expect(disclosureControl).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(disclosure).toHaveAttribute('open', '')

  const scroller = page.locator(
    'pre[aria-label="Source code for BasicSheet.tsx"]',
  )
  await expect(scroller).toHaveAttribute('tabindex', '0')
  await page.keyboard.press('Tab')
  await expect(scroller).toBeFocused()
  await expect(scroller).toHaveCSS('overflow-x', 'auto')
  await expect(scroller).toHaveCSS('outline-style', 'solid')

  const tokenColors = await page
    .locator('.docs-recipe-source [data-code-token]')
    .evaluateAll((tokens) => [
      ...new Set(tokens.map((token) => getComputedStyle(token).color)),
    ])
  expect(tokenColors.length).toBeGreaterThanOrEqual(4)
  const semanticTokenColors = await page
    .locator('.docs-recipe-source [data-code-token]')
    .evaluateAll((tokens) => {
      const colorFor = (content: string) =>
        tokens.find((token) => token.textContent === content)
          ? getComputedStyle(
              tokens.find((token) => token.textContent === content)!,
            ).color
          : undefined
      return {
        keyword: colorFor('import'),
        string: colorFor("'@library'"),
      }
    })
  expect(semanticTokenColors.keyword).toBeDefined()
  expect(semanticTokenColors.string).toBeDefined()
  expect(semanticTokenColors.keyword).not.toBe(semanticTokenColors.string)

  const sourceLines = page.locator('.docs-recipe-source [data-line]')
  const expectedLines = BASIC_RECIPE_SOURCE.split('\n')
  await expect(sourceLines).toHaveCount(expectedLines.length)
  expect(
    await sourceLines.evaluateAll((lines) =>
      lines.map((line) => line.getAttribute('data-line')),
    ),
  ).toEqual(expectedLines.map((_, index) => String(index + 1)))
  const lineNumbers = sourceLines.locator(':scope > span[aria-hidden="true"]')
  await expect(lineNumbers).toHaveCount(expectedLines.length)
  expect(
    await lineNumbers.evaluateAll((numbers) =>
      numbers.map((number) => {
        const style = getComputedStyle(number)
        return {
          text: number.textContent,
          userSelect:
            style.userSelect ?? style.getPropertyValue('-webkit-user-select'),
        }
      }),
    ),
  ).toEqual(
    expectedLines.map((_, index) => ({
      text: String(index + 1),
      userSelect: 'none',
    })),
  )
  await page.evaluate((useNativeClipboard) => {
    const originalClipboard = navigator.clipboard
    const nativeWriteText = useNativeClipboard
      ? originalClipboard.writeText.bind(originalClipboard)
      : null
    const nativeReadText = useNativeClipboard
      ? originalClipboard.readText.bind(originalClipboard)
      : null
    const state = window as Window & {
      clipboardWriteCount?: number
      copiedSource?: string
    }
    state.clipboardWriteCount = 0

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        ...(nativeReadText ? { readText: nativeReadText } : {}),
        async writeText(value: string) {
          state.clipboardWriteCount = (state.clipboardWriteCount ?? 0) + 1
          if (nativeWriteText) await nativeWriteText(value)
          state.copiedSource = value
        },
      },
    })
  }, browserName === 'chromium')

  const sourceRegion = page.getByRole('region', { name: 'Source' })
  const copyButton = sourceRegion.getByRole('button', {
    name: 'Copy source',
  })
  const copyStatus = sourceRegion.getByRole('status')
  await expect(copyStatus).toHaveAttribute('aria-live', 'polite')
  await expect(copyStatus).toHaveAttribute('aria-atomic', 'true')
  await copyButton.click()
  await expect(copyButton).toHaveText('Copy source')
  await expect(copyStatus).toHaveText('Copied')
  const copiedSource =
    browserName === 'chromium'
      ? await page.evaluate(() => navigator.clipboard.readText())
      : await page.evaluate(
          () => (window as Window & { copiedSource?: string }).copiedSource,
        )
  expect(copiedSource).toBe(BASIC_RECIPE_SOURCE)

  const firstAnnouncement = await copyStatus
    .locator(':scope > span')
    .elementHandle()
  expect(firstAnnouncement).not.toBeNull()
  await copyStatus.evaluate((status) => {
    const state = window as Window & {
      copyStatusReplacementObserved?: boolean
      copyStatusObserver?: MutationObserver
    }
    const firstAnnouncement = status.firstElementChild
    if (!firstAnnouncement) throw new Error('Missing first copy announcement')

    state.copyStatusReplacementObserved = false
    state.copyStatusObserver?.disconnect()
    state.copyStatusObserver = new MutationObserver(() => {
      const replacement = status.firstElementChild
      if (
        !firstAnnouncement.isConnected &&
        replacement &&
        replacement !== firstAnnouncement &&
        replacement.textContent === 'Copied'
      ) {
        state.copyStatusReplacementObserved = true
      }
    })
    state.copyStatusObserver.observe(status, {
      childList: true,
    })
  })
  await copyButton.click()
  await expect(copyButton).toHaveText('Copy source')
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { clipboardWriteCount?: number })
            .clipboardWriteCount ?? 0,
      ),
    )
    .toBe(2)
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { copyStatusReplacementObserved?: boolean })
            .copyStatusReplacementObserved ?? false,
      ),
    )
    .toBe(true)

  expect(await firstAnnouncement!.evaluate((node) => node.isConnected)).toBe(
    false,
  )
  const replacementAnnouncement = copyStatus.locator(':scope > span')
  await expect(replacementAnnouncement).toHaveText('Copied')
  expect(
    await replacementAnnouncement.evaluate(
      (node, first) => node !== first,
      firstAnnouncement,
    ),
  ).toBe(true)
  const secondCopiedSource =
    browserName === 'chromium'
      ? await page.evaluate(() => navigator.clipboard.readText())
      : await page.evaluate(
          () => (window as Window & { copiedSource?: string }).copiedSource,
        )
  expect(secondCopiedSource).toBe(BASIC_RECIPE_SOURCE)
})

test('every highlighted recipe preserves its native DOM selection byte-for-byte', async ({
  browserName,
  page,
}) => {
  test.slow()
  const copyShortcut = process.platform === 'darwin' ? 'Meta+C' : 'Control+C'

  for (const { filename, slug, source } of CANONICAL_RECIPE_SOURCES) {
    await page.goto(`/examples/${slug}/`)
    await page.locator('.docs-recipe-source summary').click()
    const scroller = page.locator(
      `pre[aria-label="Source code for ${filename}"]`,
    )
    const code = scroller.locator(':scope > code')
    await expect(code.locator('[data-line]')).toHaveCount(
      source.split('\n').length,
    )
    await scroller.focus()
    await expect(scroller).toBeFocused()

    await code.evaluate((element, observeTrustedCopy) => {
      const selection = window.getSelection()
      if (!selection) throw new Error('Selection API unavailable')
      const range = document.createRange()
      range.selectNodeContents(element)
      selection.removeAllRanges()
      selection.addRange(range)

      if (!observeTrustedCopy) return

      const state = window as Window & {
        nativeSourceCopy?: { isTrusted: boolean; text: string }
      }
      state.nativeSourceCopy = undefined
      document.addEventListener(
        'copy',
        (event) => {
          state.nativeSourceCopy = {
            isTrusted: event.isTrusted,
            text: window.getSelection()?.toString() ?? '',
          }
        },
        { once: true },
      )
    }, browserName !== 'webkit')

    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
      source,
    )

    // Playwright's Linux WebKit backend does not surface copy events from its
    // simulated keyboard shortcut, so only engines that expose it prove this.
    if (browserName === 'webkit') continue

    await page.keyboard.press(copyShortcut)
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                nativeSourceCopy?: { isTrusted: boolean; text: string }
              }
            ).nativeSourceCopy,
        ),
      )
      .toEqual({ isTrusted: true, text: source })
  }
})

test('highlighted source copies exact bytes through the selection fallback', async ({
  page,
}) => {
  await page.goto('/examples/basic/')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error('Clipboard unavailable')),
      },
    })
    document.execCommand = (command) => {
      if (command !== 'copy') return false
      ;(window as Window & { fallbackSource?: string }).fallbackSource =
        document.activeElement instanceof HTMLTextAreaElement
          ? document.activeElement.value
          : undefined
      return true
    }
  })

  const sourceRegion = page.getByRole('region', { name: 'Source' })
  const copyButton = sourceRegion.getByRole('button', {
    name: 'Copy source',
  })
  await copyButton.focus()
  await page.keyboard.press('Enter')
  await expect(copyButton).toHaveText('Copy source')
  await expect(copyButton).toBeFocused()
  await expect(sourceRegion.getByRole('status')).toHaveText('Copied')
  expect(
    await page.evaluate(
      () => (window as Window & { fallbackSource?: string }).fallbackSource,
    ),
  ).toBe(BASIC_RECIPE_SOURCE)
  await expect(page.locator('textarea')).toHaveCount(0)
})

test('highlighted source cleans up and reports unavailable selection fallbacks', async ({
  page,
}) => {
  for (const fallback of ['missing', 'throwing'] as const) {
    await page.goto('/examples/basic/')
    await page.evaluate((mode) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error('Clipboard unavailable')),
        },
      })
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value:
          mode === 'missing'
            ? undefined
            : () => {
                throw new Error('Selection copy unavailable')
              },
      })
    }, fallback)

    const sourceRegion = page.getByRole('region', { name: 'Source' })
    const copyButton = sourceRegion.getByRole('button', {
      name: 'Copy source',
    })
    await copyButton.focus()
    await page.keyboard.press('Enter')
    await expect(copyButton).toHaveText('Copy source')
    await expect(copyButton).toBeFocused()
    await expect(sourceRegion.getByRole('status')).toHaveText(
      'Select source to copy',
    )
    await expect(page.locator('textarea')).toHaveCount(0)
  }
})

test('highlighted source reports a false selection fallback result', async ({
  page,
}) => {
  await page.goto('/examples/basic/')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error('Clipboard unavailable')),
      },
    })
    document.execCommand = () => false
  })

  const sourceRegion = page.getByRole('region', { name: 'Source' })
  const copyButton = sourceRegion.getByRole('button', {
    name: 'Copy source',
  })
  await copyButton.focus()
  await page.keyboard.press('Enter')
  await expect(copyButton).toHaveText('Copy source')
  await expect(copyButton).toBeFocused()
  await expect(sourceRegion.getByRole('status')).toHaveText(
    'Select source to copy',
  )
  await expect(page.locator('textarea')).toHaveCount(0)
})

test('recipe lab and source split only when both columns remain readable', async ({
  page,
}) => {
  for (const width of [320, 720, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/examples/basic/?device=phone&orientation=portrait')
    const disclosure = page.locator('.docs-recipe-source details')
    await page.locator('.docs-recipe-source summary').click()
    await expect(disclosure).toHaveAttribute('open', '')

    const layout = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const element = document.querySelector(selector)
        const rect = element?.getBoundingClientRect()
        if (!(element instanceof HTMLElement) || !rect) {
          throw new Error(`Missing ${selector}`)
        }
        return {
          bottom: rect.bottom,
          clientWidth: element.clientWidth,
          left: rect.left,
          right: rect.right,
          scrollWidth: element.scrollWidth,
          top: rect.top,
          width: rect.width,
        }
      }
      return {
        controlsWrap: getComputedStyle(
          document.querySelector('.docs-device-controls')!,
        ).flexWrap,
        details: bounds('.docs-recipe-source details'),
        documentWidth: document.documentElement.scrollWidth,
        guidance: bounds('.docs-recipe-guidance'),
        preview: bounds('.docs-recipe-preview'),
        scroller: bounds('.docs-recipe-source pre'),
        source: bounds('.docs-recipe-source'),
        viewportWidth: window.innerWidth,
      }
    })

    expect(layout.documentWidth).toBe(width)
    expect(layout.viewportWidth).toBe(width)
    expect(layout.source.scrollWidth).toBe(layout.source.clientWidth)
    expect(layout.details.scrollWidth).toBe(layout.details.clientWidth)
    expect(layout.scroller.width).toBeLessThanOrEqual(layout.source.width)
    expect(layout.scroller.scrollWidth).toBeGreaterThan(
      layout.scroller.clientWidth,
    )

    if (width === 1440) {
      expect(layout.source.left).toBeGreaterThanOrEqual(layout.preview.right)
      expect(layout.preview.width).toBeGreaterThanOrEqual(400)
      expect(layout.source.width).toBeGreaterThanOrEqual(440)
    } else {
      expect(layout.controlsWrap).toBe('wrap')
      expect(layout.preview.top).toBeLessThan(layout.guidance.top)
      expect(layout.guidance.top).toBeLessThan(layout.source.top)
    }
  }
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
  test(
    `${route} has no detectable accessibility violations`,
    { tag: '@release:website-accessibility' },
    async ({ page }) => {
      await page.goto(route)
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations).toEqual([])
    },
  )
}
