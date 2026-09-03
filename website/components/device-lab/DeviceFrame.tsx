'use client'

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type {
  Device,
  DevicePreset,
  DeviceSelection,
  Orientation,
} from './device-config'
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

type InterruptedPresentation = Readonly<{
  frameHeight: number
  frameRadius: string
  frameWidth: number
  screenRadius: string
  sizerHeight: number
  sizerWidth: number
  stageHeight: number
}>

type FrozenKeyframe = Readonly<{
  borderRadius?: string
  height?: string
  transform?: string
  width?: string
}>

type DeviceFrameProps = Readonly<{
  children: ReactNode
  device: Device
  embedHref: string
  morphRequest: (DeviceSelection & { key: number }) | null
  orientation: Orientation
  preset: DevicePreset
  status: 'loading' | 'ready' | 'failed'
}>

export type DeviceFrameHandle = Readonly<{
  freezePresentation(): void
}>

export const DeviceFrame = forwardRef<DeviceFrameHandle, DeviceFrameProps>(
  function DeviceFrame(
    { children, device, embedHref, morphRequest, orientation, preset, status },
    ref,
  ) {
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
    const interruptedPresentation = useRef<InterruptedPresentation | null>(null)
    const frozenAnimations = useRef<Animation[]>([])
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

    const capturePresentation = useCallback(() => {
      const frame = frameRef.current
      const screen = screenRef.current
      const sizer = sizerRef.current
      const stage = stageRef.current
      if (!frame || !screen || !sizer || !stage) return null

      const frameBounds = frame.getBoundingClientRect()
      const sizerBounds = sizer.getBoundingClientRect()
      const presentation = {
        frameHeight: frameBounds.height,
        frameRadius: getComputedStyle(frame).borderTopLeftRadius,
        frameWidth: frameBounds.width,
        screenRadius: getComputedStyle(screen).borderTopLeftRadius,
        sizerHeight: sizerBounds.height,
        sizerWidth: sizerBounds.width,
        stageHeight: stage.getBoundingClientRect().height,
      }
      interruptedPresentation.current = presentation
      return presentation
    }, [stageRef])
    const freezePresentation = useCallback(() => {
      const frame = frameRef.current
      const screen = screenRef.current
      const sizer = sizerRef.current
      const stage = stageRef.current
      if (!frame || !screen || !sizer || !stage) return

      const elements = [stage, sizer, frame, screen]
      const activeAnimations = elements.flatMap((element) =>
        Array.from(element.getAnimations?.() ?? []),
      )
      const presentation = capturePresentation()
      if (!presentation || activeAnimations.length === 0) return
      for (const animation of activeAnimations) animation.cancel()
      const options = { duration: MORPH_DURATION_MS, fill: 'both' as const }
      const hold = (element: Element, keyframe: FrozenKeyframe) =>
        element.animate([keyframe, keyframe], options)
      frozenAnimations.current = [
        hold(stage, {
          height: `${presentation.stageHeight}px`,
        }),
        hold(sizer, {
          height: `${presentation.sizerHeight}px`,
          width: `${presentation.sizerWidth}px`,
        }),
        hold(frame, {
          borderRadius: presentation.frameRadius,
          transform: `scale(${presentation.frameWidth / outerWidth}, ${presentation.frameHeight / outerHeight})`,
        }),
        hold(screen, {
          borderRadius: presentation.screenRadius,
        }),
      ]
    }, [capturePresentation, outerHeight, outerWidth, stageRef])
    useImperativeHandle(ref, () => ({ freezePresentation }), [
      freezePresentation,
    ])

    const acceptedMorphKey =
      morphRequest?.device === device &&
      morphRequest.orientation === orientation
        ? morphRequest.key
        : consumedMorphKey.current

    useLayoutEffect(() => {
      const frame = frameRef.current
      const screen = screenRef.current
      const sizer = sizerRef.current
      const stage = stageRef.current
      if (!frame || !screen || !sizer || !stage) return

      const currentPresentation = { outerHeight, outerWidth, radius, scale }
      const previous = previousPresentation.current
      const interrupted = interruptedPresentation.current
      previousPresentation.current = currentPresentation
      interruptedPresentation.current = null
      const shouldMorph =
        acceptedMorphKey !== undefined &&
        acceptedMorphKey !== consumedMorphKey.current

      for (const element of [stage, sizer, frame, screen]) {
        for (const animation of element.getAnimations?.() ?? []) {
          animation.cancel()
        }
      }
      frozenAnimations.current = []
      frame.dataset.morphing = 'false'

      if (!shouldMorph || !previous) return
      consumedMorphKey.current = acceptedMorphKey
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
      const previousWidth =
        interrupted?.frameWidth ?? previous.outerWidth * previous.scale
      const previousHeight =
        interrupted?.frameHeight ?? previous.outerHeight * previous.scale
      const previousSizerWidth = interrupted?.sizerWidth ?? previousWidth
      const previousSizerHeight = interrupted?.sizerHeight ?? previousHeight
      const previousStageHeight = interrupted?.stageHeight ?? previousHeight
      const nextWidth = outerWidth * scale
      const nextHeight = outerHeight * scale
      const animations = [
        stage.animate(
          [
            { height: `${previousStageHeight}px` },
            { height: `${nextHeight}px` },
          ],
          options,
        ),
        sizer.animate(
          [
            {
              height: `${previousSizerHeight}px`,
              width: `${previousSizerWidth}px`,
            },
            { height: `${nextHeight}px`, width: `${nextWidth}px` },
          ],
          options,
        ),
        frame.animate(
          [
            {
              borderRadius: interrupted?.frameRadius ?? previous.radius,
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
            {
              borderRadius:
                interrupted?.screenRadius ??
                `max(0px, calc(${previous.radius} - 1px))`,
            },
            { borderRadius: `max(0px, calc(${radius} - 1px))` },
          ],
          options,
        ),
      ]
      frame.dataset.morphing = 'true'
      let active = true
      let unfinished = true
      void Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        unfinished = false
        if (active) frame.dataset.morphing = 'false'
      })

      return () => {
        active = false
        if (unfinished && interruptedPresentation.current === null)
          capturePresentation()
        unfinished = false
        for (const animation of animations) animation.cancel()
        for (const animation of frozenAnimations.current) animation.cancel()
        frozenAnimations.current = []
        frame.dataset.morphing = 'false'
      }
    }, [
      capturePresentation,
      acceptedMorphKey,
      outerHeight,
      outerWidth,
      radius,
      scale,
      stageRef,
    ])

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
  },
)
