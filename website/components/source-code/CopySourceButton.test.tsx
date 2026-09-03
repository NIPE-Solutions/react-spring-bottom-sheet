import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CopySourceButton } from './CopySourceButton'

const source = 'const copied = true\n'

function deferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<void>((finish, fail) => {
    resolve = finish
    reject = fail
  })

  return { promise, reject, resolve }
}

function mockClipboard(...attempts: Array<Promise<void>>) {
  const writeText = vi.fn()
  for (const attempt of attempts) {
    writeText.mockImplementationOnce(() => attempt)
  }
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })

  return writeText
}

describe('CopySourceButton status lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockClipboard(Promise.resolve())
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('keeps its label aligned and mutates the live region for repeated copies', async () => {
    const writeText = mockClipboard(Promise.resolve(), Promise.resolve())
    render(<CopySourceButton source={source} />)
    const button = screen.getByRole('button', { name: 'Copy source' })
    const status = screen.getByRole('status')

    await act(async () => fireEvent.click(button))
    expect(button).toHaveTextContent(/^Copy source$/)
    expect(status).toHaveTextContent('Copied')
    const firstAnnouncement = status.firstElementChild
    expect(firstAnnouncement).not.toBeNull()
    expect(vi.getTimerCount()).toBe(1)

    const mutationRecords: MutationRecord[] = []
    const observer = new MutationObserver((records) => {
      mutationRecords.push(...records)
    })
    observer.observe(status, { childList: true, subtree: true })

    await act(async () => fireEvent.click(button))
    await act(async () => undefined)

    expect(button).toHaveTextContent(/^Copy source$/)
    expect(status).toHaveTextContent('Copied')
    expect(status.firstElementChild).not.toBe(firstAnnouncement)
    expect(mutationRecords.some((record) => record.type === 'childList')).toBe(
      true,
    )
    expect(writeText).toHaveBeenNthCalledWith(1, source)
    expect(writeText).toHaveBeenNthCalledWith(2, source)
    expect(vi.getTimerCount()).toBe(1)

    act(() => vi.advanceTimersByTime(10_000))
    expect(button).toHaveTextContent(/^Copy source$/)
    expect(status).toBeEmptyDOMElement()
    expect(vi.getTimerCount()).toBe(0)

    observer.disconnect()
  })

  test('ignores a stale rejection after a newer copy succeeds', async () => {
    const firstCopy = deferred()
    const secondCopy = deferred()
    mockClipboard(firstCopy.promise, secondCopy.promise)
    const selectionFallback = vi.mocked(document.execCommand)
    render(<CopySourceButton source={source} />)
    const button = screen.getByRole('button', { name: 'Copy source' })

    fireEvent.click(button)
    fireEvent.click(button)
    await act(async () => secondCopy.resolve())
    expect(screen.getByRole('status')).toHaveTextContent('Copied')

    await act(async () => firstCopy.reject(new Error('stale failure')))

    expect(selectionFallback).not.toHaveBeenCalled()
    expect(document.querySelector('textarea')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
    expect(vi.getTimerCount()).toBe(1)
  })

  test('ignores a stale success after a newer copy uses the fallback', async () => {
    const firstCopy = deferred()
    const secondCopy = deferred()
    mockClipboard(firstCopy.promise, secondCopy.promise)
    const selectionFallback = vi.mocked(document.execCommand)
    render(<CopySourceButton source={source} />)
    const button = screen.getByRole('button', { name: 'Copy source' })

    fireEvent.click(button)
    fireEvent.click(button)
    await act(async () => secondCopy.reject(new Error('current failure')))
    expect(selectionFallback).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Select source to copy',
    )

    await act(async () => firstCopy.resolve())

    expect(screen.getByRole('status')).toHaveTextContent(
      'Select source to copy',
    )

    act(() => vi.advanceTimersByTime(10_000))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  test('does not run a fallback or schedule status after an unmounted rejection', async () => {
    const pendingCopy = deferred()
    mockClipboard(pendingCopy.promise)
    const selectionFallback = vi.mocked(document.execCommand)
    const { unmount } = render(<CopySourceButton source={source} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy source' }))
    unmount()
    await act(async () => pendingCopy.reject(new Error('late failure')))

    expect(selectionFallback).not.toHaveBeenCalled()
    expect(document.querySelector('textarea')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('clears a pending status reset when it unmounts', async () => {
    const { unmount } = render(<CopySourceButton source={source} />)

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Copy source' })),
    )
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  test('keeps existing feedback bounded while a newer copy is pending', async () => {
    const pendingCopy = deferred()
    mockClipboard(Promise.resolve(), pendingCopy.promise)
    render(<CopySourceButton source={source} />)
    const button = screen.getByRole('button', { name: 'Copy source' })

    await act(async () => fireEvent.click(button))
    expect(screen.getByRole('status')).toHaveTextContent('Copied')

    fireEvent.click(button)
    act(() => vi.advanceTimersByTime(10_000))

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(vi.getTimerCount()).toBe(0)
  })
})
