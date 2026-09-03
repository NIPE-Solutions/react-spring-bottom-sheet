'use client'

import type { ReactNode } from 'react'
import type { Device, DevicePreset } from './device-config'
import { useScaledFrame } from './use-scaled-frame'

const FRAME_INSET = 12

type DeviceFrameProps = Readonly<{
  children: ReactNode
  device: Device
  embedHref: string
  preset: DevicePreset
  status: 'loading' | 'ready' | 'failed'
}>

export function DeviceFrame({
  children,
  device,
  embedHref,
  preset,
  status,
}: DeviceFrameProps) {
  const outerWidth = preset.width + FRAME_INSET * 2
  const outerHeight = preset.height + FRAME_INSET * 2
  const { scale, scaledHeight, stageRef } = useScaledFrame({
    outerWidth,
    outerHeight,
  })

  return (
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
          style={{
            height: outerHeight,
            transform: `scale(${scale})`,
            width: outerWidth,
          }}
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
  )
}
