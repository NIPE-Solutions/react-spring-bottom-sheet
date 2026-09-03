'use client'

import { useEffect, useRef, useState } from 'react'

type ScaledFrameOptions = Readonly<{
  outerWidth: number
  outerHeight: number
}>

export function useScaledFrame({
  outerWidth,
  outerHeight,
}: ScaledFrameOptions) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState<number | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateWidth = (width: number) => {
      if (width > 0) setAvailableWidth(width)
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) updateWidth(entry.contentRect.width)
    })

    updateWidth(stage.clientWidth)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  const scale = Math.min(1, (availableWidth ?? outerWidth) / outerWidth)

  return {
    scale,
    scaledHeight: outerHeight * scale,
    stageRef,
  }
}
