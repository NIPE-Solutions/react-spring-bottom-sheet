'use client'

import { useState } from 'react'

export function CopySourceButton({ source }: { source: string }) {
  const [copyStatus, setCopyStatus] = useState('Copy source')

  function copyWithSelection() {
    const input = document.createElement('textarea')
    input.value = source
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.append(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    return copied
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus(copyWithSelection() ? 'Copied' : 'Select source to copy')
    }
  }

  return (
    <button type="button" onClick={copySource} aria-live="polite">
      {copyStatus}
    </button>
  )
}
