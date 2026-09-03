import { act, fireEvent, render, screen } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { DeviceLab } from './DeviceLab'
import { useScaledFrame } from './use-scaled-frame'

const navigation = vi.hoisted(() => ({
  pathname: '/examples/basic/',
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams('device=phone&orientation=portrait'),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
  }),
  useSearchParams: vi.fn(() => navigation.searchParams),
}))

type TestResizeCallback = (
  entries: ResizeObserverEntry[],
  observer: ResizeObserver,
) => void

let resizeCallback: TestResizeCallback

class TestResizeObserver implements ResizeObserver {
  constructor(callback: TestResizeCallback) {
    resizeCallback = callback
  }

  disconnect() {}
  observe() {}
  unobserve() {}
}

function ScaleHarness({
  outerWidth,
  outerHeight,
}: {
  outerWidth: number
  outerHeight: number
}) {
  const { scale, scaledHeight, stageRef } = useScaledFrame({
    outerWidth,
    outerHeight,
  })

  return (
    <div
      ref={stageRef}
      data-testid="scale-harness"
      data-scale={scale}
      data-height={scaledHeight}
    />
  )
}

function resizeTo(width: number) {
  const target = screen.getByTestId('scale-harness')
  act(() => {
    resizeCallback(
      [
        {
          target,
          contentRect: { width },
        } as unknown as ResizeObserverEntry,
      ],
      {} as ResizeObserver,
    )
  })
}

function currentSearchParams() {
  return navigation.searchParams as unknown as ReturnType<
    typeof useSearchParams
  >
}

beforeEach(() => {
  navigation.pathname = '/examples/basic/'
  navigation.searchParams = new URLSearchParams(
    'device=phone&orientation=portrait',
  )
  navigation.push.mockReset()
  navigation.replace.mockReset()
  vi.mocked(useSearchParams).mockImplementation(currentSearchParams)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useScaledFrame', () => {
  test('scales a frame down to the available width and reports its flow height', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    render(<ScaleHarness outerWidth={600} outerHeight={900} />)

    resizeTo(300)

    expect(screen.getByTestId('scale-harness')).toHaveAttribute(
      'data-scale',
      '0.5',
    )
    expect(screen.getByTestId('scale-harness')).toHaveAttribute(
      'data-height',
      '450',
    )
  })

  test('never scales a frame above its logical size', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    render(<ScaleHarness outerWidth={390} outerHeight={780} />)

    resizeTo(800)

    expect(screen.getByTestId('scale-harness')).toHaveAttribute(
      'data-scale',
      '1',
    )
    expect(screen.getByTestId('scale-harness')).toHaveAttribute(
      'data-height',
      '780',
    )
  })
})

describe('DeviceLab iframe identity', () => {
  test('keeps one iframe and a stable embed URL across every control combination', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    navigation.push.mockImplementation((url: string) => {
      navigation.searchParams = new URL(url, 'https://example.com').searchParams
    })
    const { rerender } = render(<DeviceLab slug="basic" title="Basic" />)
    const iframe = screen.getByTitle('Basic interactive preview')

    for (const [control, expectedQuery, width, height] of [
      ['Landscape', 'device=phone&orientation=landscape', 780, 390],
      ['Tablet', 'device=tablet&orientation=landscape', 1024, 768],
      ['Portrait', 'device=tablet&orientation=portrait', 768, 1024],
      ['Phone', 'device=phone&orientation=portrait', 390, 780],
    ] as const) {
      fireEvent.click(screen.getByRole('button', { name: control }))
      expect(navigation.push).toHaveBeenLastCalledWith(
        `/examples/basic/?${expectedQuery}`,
      )
      vi.mocked(useSearchParams).mockReturnValue(currentSearchParams())
      rerender(<DeviceLab slug="basic" title="Basic" />)
      expect(screen.getByTitle('Basic interactive preview')).toBe(iframe)
      expect(iframe).toHaveAttribute('src', '/examples/basic/embed/')
      expect(iframe.parentElement).toHaveStyle({
        height: `${height}px`,
        width: `${width}px`,
      })
    }
  })
})

describe('DeviceLab navigation', () => {
  test('preserves unrelated parameters and uses push for a user choice', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    navigation.searchParams = new URLSearchParams(
      'campaign=spring&device=phone&orientation=portrait',
    )
    render(<DeviceLab slug="basic" title="Basic" />)

    fireEvent.click(screen.getByRole('button', { name: 'Tablet' }))

    expect(navigation.push).toHaveBeenCalledWith(
      '/examples/basic/?campaign=spring&device=tablet&orientation=portrait',
    )
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  test('does not navigate when the requested state is already active', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    render(<DeviceLab slug="basic" title="Basic" />)

    fireEvent.click(screen.getByRole('button', { name: 'Phone' }))

    expect(navigation.push).not.toHaveBeenCalled()
    expect(navigation.replace).not.toHaveBeenCalled()
  })

  test('exposes labelled button groups and the active selections', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    render(<DeviceLab slug="basic" title="Basic" />)

    expect(screen.getByRole('group', { name: 'Device' })).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Orientation' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phone' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Portrait' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('normalizes invalid device state with replace and preserves other parameters', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    navigation.searchParams = new URLSearchParams(
      'campaign=spring&device=watch&orientation=wide',
    )

    render(<DeviceLab slug="basic" title="Basic" />)

    expect(navigation.replace).toHaveBeenCalledWith(
      '/examples/basic/?campaign=spring&device=phone&orientation=portrait',
    )
    expect(navigation.push).not.toHaveBeenCalled()
  })
})

describe('DeviceLab readiness', () => {
  test('keeps the iframe mounted and offers its direct link after a bounded timeout', () => {
    vi.useFakeTimers()
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    render(<DeviceLab slug="basic" title="Basic" />)
    const iframe = screen.getByTitle('Basic interactive preview')

    act(() => vi.advanceTimersByTime(10_000))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The preview is taking longer than expected.',
    )
    expect(
      screen.getByRole('link', { name: 'Open the preview directly' }),
    ).toHaveAttribute('href', '/examples/basic/embed/')
    expect(screen.getByTitle('Basic interactive preview')).toBe(iframe)
    expect(iframe).toHaveAttribute('src', '/examples/basic/embed/')
  })

  test('clears the loading state and timeout when the iframe loads', () => {
    vi.useFakeTimers()
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    render(<DeviceLab slug="basic" title="Basic" />)
    const iframe = screen.getByTitle('Basic interactive preview')

    fireEvent.load(iframe)
    expect(vi.getTimerCount()).toBe(0)
    act(() => vi.advanceTimersByTime(10_000))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTitle('Basic interactive preview')).toBe(iframe)
  })
})
