'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { DeviceControls } from './DeviceControls'
import { DeviceFrame } from './DeviceFrame'
import type { DeviceFrameHandle } from './DeviceFrame'
import {
  DEFAULT_DEVICE_SELECTION,
  getDevicePreset,
  parseDeviceSelection,
} from './device-config'
import type { DeviceSelection } from './device-config'
import { RecipeEmbed } from './RecipeEmbed'

const MORPH_NAVIGATION_TIMEOUT_MS = 1_500

export type DeviceLabProps = Readonly<{
  slug: string
  title: string
}>

type MorphRequest = DeviceSelection &
  Readonly<{
    key: number
    source: DeviceSelection
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
  const nextMorphKey = useRef(0)
  const deviceFrameRef = useRef<DeviceFrameHandle>(null)
  const morphRequestRef = useRef<MorphRequest | null>(null)
  const morphTimeoutRef = useRef<number | null>(null)
  const [morphRequest, setMorphRequest] = useState<MorphRequest | null>(null)

  const clearMorphTimeout = useCallback(() => {
    if (morphTimeoutRef.current === null) return
    window.clearTimeout(morphTimeoutRef.current)
    morphTimeoutRef.current = null
  }, [])
  const rollbackMorphRequest = useCallback(
    (key: number) => {
      if (morphRequestRef.current?.key !== key) return
      clearMorphTimeout()
      morphRequestRef.current = null
      deviceFrameRef.current?.rollbackPresentation()
      setMorphRequest((current) => (current?.key === key ? null : current))
    },
    [clearMorphTimeout],
  )

  useEffect(() => {
    if (isValidSelection(searchParams)) return

    const normalized = withSelection(searchParams, DEFAULT_DEVICE_SELECTION)
    router.replace(`${pathname}?${normalized.toString()}`)
  }, [pathname, router, readonlySearchParams])

  useEffect(() => setStatus('loading'), [slug])

  useLayoutEffect(() => {
    if (!morphRequest) return
    const reachedTarget =
      morphRequest.device === selection.device &&
      morphRequest.orientation === selection.orientation
    if (reachedTarget) {
      clearMorphTimeout()
      if (morphRequestRef.current?.key === morphRequest.key) {
        morphRequestRef.current = null
      }
      setMorphRequest((current) =>
        current?.key === morphRequest.key ? null : current,
      )
      return
    }

    const remainsAtSource =
      morphRequest.source.device === selection.device &&
      morphRequest.source.orientation === selection.orientation
    if (!remainsAtSource) rollbackMorphRequest(morphRequest.key)
  }, [
    clearMorphTimeout,
    morphRequest,
    rollbackMorphRequest,
    selection.device,
    selection.orientation,
  ])

  useEffect(
    () => () => {
      clearMorphTimeout()
      morphRequestRef.current = null
    },
    [clearMorphTimeout],
  )

  const handleReady = useCallback(() => setStatus('ready'), [])
  const handleFailure = useCallback(() => setStatus('failed'), [])
  const handleChange = (nextSelection: DeviceSelection) => {
    const isCurrentSelection =
      nextSelection.device === selection.device &&
      nextSelection.orientation === selection.orientation
    if (isCurrentSelection) {
      const pendingRequest = morphRequestRef.current
      if (pendingRequest) rollbackMorphRequest(pendingRequest.key)
      return
    }

    deviceFrameRef.current?.freezePresentation()
    clearMorphTimeout()
    nextMorphKey.current += 1
    const request = {
      ...nextSelection,
      key: nextMorphKey.current,
      source: selection,
    }
    morphRequestRef.current = request
    setMorphRequest(request)
    morphTimeoutRef.current = window.setTimeout(
      () => rollbackMorphRequest(request.key),
      MORPH_NAVIGATION_TIMEOUT_MS,
    )
    const nextParams = withSelection(searchParams, nextSelection)
    try {
      router.push(`${pathname}?${nextParams.toString()}`)
    } catch {
      rollbackMorphRequest(request.key)
    }
  }
  return (
    <div className="docs-device-lab">
      <DeviceControls selection={selection} onChange={handleChange} />
      <DeviceFrame
        device={selection.device}
        embedHref={embedHref}
        morphRequest={morphRequest}
        orientation={selection.orientation}
        preset={preset}
        ref={deviceFrameRef}
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
        morphRequest={null}
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
