'use client'

import { useEffect, useRef, useState } from 'react'

const COPY_STATUS_DURATION_MS = 2_000

export function CopySourceButton({ source }: { source: string }) {
  const [copyStatus, setCopyStatus] = useState('Copy source')
  const mounted = useRef(true)
  const statusResetTimer = useRef<number | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (statusResetTimer.current !== null) {
        window.clearTimeout(statusResetTimer.current)
      }
    }
  }, [])

  function publishCopyStatus(status: string) {
    if (!mounted.current) return

    if (statusResetTimer.current !== null) {
      window.clearTimeout(statusResetTimer.current)
    }

    setCopyStatus(status)
    statusResetTimer.current = window.setTimeout(() => {
      setCopyStatus('Copy source')
      statusResetTimer.current = null
    }, COPY_STATUS_DURATION_MS)
  }

  function copyWithSelection() {
    const input = document.createElement('textarea')
    input.value = source
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)

    try {
      input.select()
      return (
        typeof document.execCommand === 'function' &&
        document.execCommand('copy')
      )
    } catch {
      return false
    } finally {
      input.remove()
    }
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source)
      publishCopyStatus('Copied')
    } catch {
      publishCopyStatus(
        copyWithSelection() ? 'Copied' : 'Select source to copy',
      )
    }
  }

  return (
    <div className="docs-recipe-source-copy">
      <button type="button" onClick={copySource} aria-label="Copy source">
        {copyStatus}
      </button>
      <span
        className="docs-recipe-source-copy-status"
        role="status"
        aria-live="polite"
      >
        {copyStatus === 'Copy source' ? '' : copyStatus}
      </span>
    </div>
  )
}
