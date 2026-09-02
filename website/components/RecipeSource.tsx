'use client'

import { useState } from 'react'

export function RecipeSource({ source }: { source: string }) {
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
    <section
      className="docs-recipe-source"
      aria-labelledby="recipe-source-title"
    >
      <div className="docs-recipe-section-heading">
        <div>
          <p>Complete implementation</p>
          <h2 id="recipe-source-title">Source</h2>
        </div>
        <button type="button" onClick={copySource} aria-live="polite">
          {copyStatus}
        </button>
      </div>
      <details>
        <summary>View source</summary>
        <pre tabIndex={0}>
          <code>{source}</code>
        </pre>
      </details>
    </section>
  )
}
