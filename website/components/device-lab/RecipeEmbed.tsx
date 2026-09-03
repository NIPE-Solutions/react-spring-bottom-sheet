'use client'

import { useEffect, useRef } from 'react'

const READY_TIMEOUT_MS = 10_000

export type RecipeEmbedProps = Readonly<{
  slug: string
  title: string
  onReady(): void
  onFailure(): void
}>

export function RecipeEmbed({
  slug,
  title,
  onReady,
  onFailure,
}: RecipeEmbedProps) {
  const readyRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  const clearReadyTimeout = () => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  useEffect(() => {
    readyRef.current = false
    timeoutRef.current = window.setTimeout(() => {
      if (!readyRef.current) onFailure()
    }, READY_TIMEOUT_MS)

    return clearReadyTimeout
  }, [onFailure, slug])

  return (
    <iframe
      className="docs-recipe-frame"
      src={`/examples/${slug}/embed/`}
      title={`${title} interactive preview`}
      onError={() => {
        clearReadyTimeout()
        onFailure()
      }}
      onLoad={() => {
        readyRef.current = true
        clearReadyTimeout()
        onReady()
      }}
    />
  )
}
