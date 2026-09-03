'use client'

import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Device, DevicePreset, Orientation } from './device-config'
import { useScaledFrame } from './use-scaled-frame'

const FRAME_INSET = 1
const MORPH_DURATION_MS = 280
const MORPH_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

type FramePresentation = Readonly<{
  outerHeight: number
  outerWidth: number
  radius: string
  scale: number
}>

type DeviceFrameProps = Readonly<{
  children: ReactNode
  device: Device
  embedHref: string
  morphKey: number | undefined
  orientation: Orientation
  preset: DevicePreset
  status: 'loading' | 'ready' | 'failed'
}>

export function DeviceFrame({
  children,
  device,
  embedHref,
  morphKey,
  orientation,
  preset,
  status,
}: DeviceFrameProps) {
  const outerWidth = preset.width + FRAME_INSET * 2
  const outerHeight = preset.height + FRAME_INSET * 2
  const { scale, scaledHeight, stageRef } = useScaledFrame({
    outerWidth,
    outerHeight,
  })
  const frameRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLDivElement>(null)
  const previousPresentation = useRef<FramePresentation | null>(null)
  const consumedMorphKey = useRef<number | undefined>(undefined)
  const radius = device === 'phone' ? '1.75rem' : '1.15rem'
  const frameStyle = {
    '--device-height': `${preset.height}px`,
    '--device-radius': radius,
    '--device-scale': scale,
    '--device-width': `${preset.width}px`,
    height: outerHeight,
    transform: `scale(${scale})`,
    width: outerWidth,
  } as CSSProperties

  useLayoutEffect(() => {
    const frame = frameRef.current
    const screen = screenRef.current
    const sizer = sizerRef.current
    const stage = stageRef.current
    if (!frame || !screen || !sizer || !stage) return

    const currentPresentation = { outerHeight, outerWidth, radius, scale }
    const previous = previousPresentation.current
    previousPresentation.current = currentPresentation
    const shouldMorph =
      morphKey !== undefined && morphKey !== consumedMorphKey.current

    for (const element of [stage, sizer, frame, screen]) {
      for (const animation of element.getAnimations?.() ?? []) {
        animation.cancel()
      }
    }
    frame.dataset.morphing = 'false'

    if (!shouldMorph || !previous) return
    consumedMorphKey.current = morphKey
    if (
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      !stage.animate ||
      !sizer.animate ||
      !frame.animate ||
      !screen.animate
    )
      return

    const options = {
      duration: MORPH_DURATION_MS,
      easing: MORPH_EASING,
    }
    const previousWidth = previous.outerWidth * previous.scale
    const previousHeight = previous.outerHeight * previous.scale
    const nextWidth = outerWidth * scale
    const nextHeight = outerHeight * scale
    const animations = [
      stage.animate(
        [{ height: `${previousHeight}px` }, { height: `${nextHeight}px` }],
        options,
      ),
      sizer.animate(
        [
          { height: `${previousHeight}px`, width: `${previousWidth}px` },
          { height: `${nextHeight}px`, width: `${nextWidth}px` },
        ],
        options,
      ),
      frame.animate(
        [
          {
            borderRadius: previous.radius,
            transform: `scale(${previousWidth / outerWidth}, ${previousHeight / outerHeight})`,
          },
          {
            borderRadius: radius,
            transform: `scale(${scale})`,
          },
        ],
        options,
      ),
      screen.animate(
        [
          { borderRadius: `max(0px, calc(${previous.radius} - 1px))` },
          { borderRadius: `max(0px, calc(${radius} - 1px))` },
        ],
        options,
      ),
    ]
    frame.dataset.morphing = 'true'
    let active = true
    void Promise.allSettled(
      animations.map((animation) => animation.finished),
    ).then(() => {
      if (active) frame.dataset.morphing = 'false'
    })

    return () => {
      active = false
      for (const animation of animations) animation.cancel()
      frame.dataset.morphing = 'false'
    }
  }, [morphKey, outerHeight, outerWidth, radius, scale, stageRef])

  return (
    <>
      <p className="docs-device-readout" aria-live="polite">
        {device === 'phone' ? 'Phone' : 'Tablet'} viewport: {preset.width} ×{' '}
        {preset.height}
      </p>
      <div
        className="docs-recipe-stage"
        ref={stageRef}
        style={{ height: scaledHeight }}
      >
        <div
          className="docs-device-frame-sizer"
          ref={sizerRef}
          style={{
            height: scaledHeight,
            width: outerWidth * scale,
          }}
        >
          <div
            className="docs-device-frame"
            data-device={device}
            data-morphing="false"
            data-orientation={orientation}
            data-preview-ready={status === 'ready'}
            ref={frameRef}
            style={frameStyle}
          >
            <div
              className="docs-device-screen"
              ref={screenRef}
              style={{ height: preset.height, width: preset.width }}
            >
              {children}
              {status !== 'ready' ? (
                <div
                  className="docs-device-status"
                  role={status === 'failed' ? 'alert' : 'status'}
                >
                  {status === 'loading' ? (
                    <p>Loading preview…</p>
                  ) : (
                    <div>
                      <p>The preview is taking longer than expected.</p>
                      <a href={embedHref}>Open the preview directly</a>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
