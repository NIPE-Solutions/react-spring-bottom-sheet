'use client'

import type { CSSProperties, ReactNode } from 'react'
import type { Device, DevicePreset, Orientation } from './device-config'
import { useScaledFrame } from './use-scaled-frame'

const FRAME_INSET = 1

type DeviceFrameProps = Readonly<{
  children: ReactNode
  device: Device
  embedHref: string
  orientation: Orientation
  preset: DevicePreset
  status: 'loading' | 'ready' | 'failed'
}>

export function DeviceFrame({
  children,
  device,
  embedHref,
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
  const frameStyle = {
    '--device-height': `${preset.height}px`,
    '--device-radius': device === 'phone' ? '1.75rem' : '1.15rem',
    '--device-scale': scale,
    '--device-width': `${preset.width}px`,
    height: outerHeight,
    transform: `scale(${scale})`,
    width: outerWidth,
  } as CSSProperties

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
          style={{
            height: scaledHeight,
            width: outerWidth * scale,
          }}
        >
          <div
            className="docs-device-frame"
            data-device={device}
            data-orientation={orientation}
            data-preview-ready={status === 'ready'}
            style={frameStyle}
          >
            <div
              className="docs-device-screen"
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
