'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { DeviceControls } from './DeviceControls'
import { DeviceFrame } from './DeviceFrame'
import {
  DEFAULT_DEVICE_SELECTION,
  getDevicePreset,
  parseDeviceSelection,
} from './device-config'
import type { DeviceSelection } from './device-config'
import { RecipeEmbed } from './RecipeEmbed'

export type DeviceLabProps = Readonly<{
  slug: string
  title: string
}>

function isValidSelection(searchParams: URLSearchParams) {
  const device = searchParams.get('device')
  const orientation = searchParams.get('orientation')

  return (
    (device === 'phone' || device === 'tablet') &&
    (orientation === 'portrait' || orientation === 'landscape')
  )
}

function withSelection(
  searchParams: URLSearchParams,
  selection: DeviceSelection,
) {
  const nextParams = new URLSearchParams(searchParams)
  nextParams.set('device', selection.device)
  nextParams.set('orientation', selection.orientation)
  return nextParams
}

export function DeviceLab({ slug, title }: DeviceLabProps) {
  const pathname = usePathname()
  const router = useRouter()
  const readonlySearchParams = useSearchParams()
  const searchParams = new URLSearchParams(readonlySearchParams.toString())
  const selection = parseDeviceSelection(searchParams)
  const preset = getDevicePreset(selection)
  const embedHref = `/examples/${slug}/embed/`
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  )

  useEffect(() => {
    if (isValidSelection(searchParams)) return

    const normalized = withSelection(searchParams, DEFAULT_DEVICE_SELECTION)
    router.replace(`${pathname}?${normalized.toString()}`)
  }, [pathname, router, readonlySearchParams])

  useEffect(() => setStatus('loading'), [slug])

  const handleReady = useCallback(() => setStatus('ready'), [])
  const handleFailure = useCallback(() => setStatus('failed'), [])
  const handleChange = (nextSelection: DeviceSelection) => {
    if (
      nextSelection.device === selection.device &&
      nextSelection.orientation === selection.orientation
    )
      return

    const nextParams = withSelection(searchParams, nextSelection)
    router.push(`${pathname}?${nextParams.toString()}`)
  }

  return (
    <div className="docs-device-lab">
      <DeviceControls selection={selection} onChange={handleChange} />
      <DeviceFrame
        device={selection.device}
        embedHref={embedHref}
        orientation={selection.orientation}
        preset={preset}
        status={status}
      >
        <RecipeEmbed
          slug={slug}
          title={title}
          onReady={handleReady}
          onFailure={handleFailure}
        />
      </DeviceFrame>
    </div>
  )
}

export function DeviceLabFallback({ slug, title }: DeviceLabProps) {
  const preset = getDevicePreset(DEFAULT_DEVICE_SELECTION)
  const embedHref = `/examples/${slug}/embed/`

  return (
    <div className="docs-device-lab">
      <DeviceFrame
        device={DEFAULT_DEVICE_SELECTION.device}
        embedHref={embedHref}
        orientation={DEFAULT_DEVICE_SELECTION.orientation}
        preset={preset}
        status="loading"
      >
        <iframe
          className="docs-recipe-frame"
          src={embedHref}
          title={`${title} interactive preview`}
        />
      </DeviceFrame>
    </div>
  )
}
