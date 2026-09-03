import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CopySourceButton } from './CopySourceButton'

describe('CopySourceButton status lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('restores its action and can announce a repeated copy', async () => {
    render(<CopySourceButton source="const copied = true\n" />)
    const button = screen.getByRole('button', { name: 'Copy source' })
    const status = screen.getByRole('status')

    await act(async () => fireEvent.click(button))
    expect(button).toHaveTextContent('Copied')
    expect(status).toHaveTextContent('Copied')
    expect(vi.getTimerCount()).toBe(1)

    await act(async () => fireEvent.click(button))
    expect(vi.getTimerCount()).toBe(1)

    act(() => vi.advanceTimersByTime(10_000))
    expect(button).toHaveTextContent('Copy source')
    expect(status).toBeEmptyDOMElement()

    await act(async () => fireEvent.click(button))
    expect(button).toHaveTextContent('Copied')
    expect(status).toHaveTextContent('Copied')
    expect(vi.getTimerCount()).toBe(1)
  })

  test('clears a pending status reset when it unmounts', async () => {
    const { unmount } = render(
      <CopySourceButton source="const copied = true\n" />,
    )

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Copy source' })),
    )
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  test('does not schedule a status reset after unmounting during a copy', async () => {
    let finishCopy: () => void = () => undefined
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            finishCopy = resolve
          }),
      },
    })
    const { unmount } = render(
      <CopySourceButton source="const copied = true\n" />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }))
    unmount()
    await act(async () => finishCopy())

    expect(vi.getTimerCount()).toBe(0)
  })
})
