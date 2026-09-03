'use client'

import { useEffect, useRef, useState } from 'react'

const COPY_STATUS_DURATION_MS = 2_000

type CopyAnnouncement = {
  id: number
  message: string
}

export function CopySourceButton({ source }: { source: string }) {
  const [announcement, setAnnouncement] = useState<CopyAnnouncement | null>(
    null,
  )
  const mounted = useRef(true)
  const latestOperation = useRef(0)
  const statusResetTimer = useRef<number | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      latestOperation.current += 1
      if (statusResetTimer.current !== null) {
        window.clearTimeout(statusResetTimer.current)
        statusResetTimer.current = null
      }
    }
  }, [])

  function isCurrentOperation(operationId: number) {
    return mounted.current && latestOperation.current === operationId
  }

  function publishCopyStatus(operationId: number, message: string) {
    if (!isCurrentOperation(operationId)) return

    if (statusResetTimer.current !== null) {
      window.clearTimeout(statusResetTimer.current)
    }

    setAnnouncement({ id: operationId, message })
    const resetTimer = window.setTimeout(() => {
      setAnnouncement((current) =>
        current?.id === operationId ? null : current,
      )
      if (statusResetTimer.current === resetTimer) {
        statusResetTimer.current = null
      }
    }, COPY_STATUS_DURATION_MS)
    statusResetTimer.current = resetTimer
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
    const operationId = latestOperation.current + 1
    latestOperation.current = operationId

    try {
      await navigator.clipboard.writeText(source)
      publishCopyStatus(operationId, 'Copied')
    } catch {
      if (!isCurrentOperation(operationId)) return

      publishCopyStatus(
        operationId,
        copyWithSelection() ? 'Copied' : 'Select source to copy',
      )
    }
  }

  return (
    <div className="docs-recipe-source-copy">
      <button type="button" onClick={copySource}>
        Copy source
      </button>
      <span
        className="docs-recipe-source-copy-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement ? (
          <span key={announcement.id}>{announcement.message}</span>
        ) : null}
      </span>
    </div>
  )
}
