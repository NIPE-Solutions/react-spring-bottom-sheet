import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { SheetContext } from '../context/sheet-context.js'
import { createSheetController } from '../controller/create-controller.js'
import { useReducedMotion } from '../hooks/use-reduced-motion.js'
import { useSheetInteractions } from '../hooks/use-sheet-interactions.js'
import { useSheetLayout } from '../hooks/use-sheet-layout.js'
import { useSheetMotion } from '../hooks/use-sheet-motion.js'
import type { ResolvedLayout } from '../layout/types.js'
import { motionAdapter } from '../motion/motion-adapter.js'
import type {
  OpenChangeDetails,
  OpenChangeReason,
  SnapPoint,
} from '../public-types.js'

export interface SheetRootProps {
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void
  snapPoints?: readonly SnapPoint[]
  activeSnapPoint?: string
  defaultSnapPoint?: string
  onSnapPointChange?: (id: string) => void
  modal?: boolean
  dismissible?: boolean
}

const DEFAULT_SNAP_POINTS: readonly SnapPoint[] = [
  { id: 'content', value: 'content' },
]

export function Root({
  children,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  snapPoints = DEFAULT_SNAP_POINTS,
  activeSnapPoint: controlledSnapPoint,
  defaultSnapPoint,
  onSnapPointChange,
  modal = true,
  dismissible = true,
}: SheetRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const [titleId, setTitleId] = useState<string>()
  const [descriptionId, setDescriptionId] = useState<string>()
  const [viewport, setViewport] = useState<HTMLElement | null>(null)
  const [content, setContent] = useState<HTMLElement | null>(null)
  const [layout, setLayout] = useState<ResolvedLayout | null>(null)
  const [uncontrolledSnapPoint, setUncontrolledSnapPoint] = useState(
    defaultSnapPoint ?? snapPoints[0]?.id,
  )
  const controllerRef = useRef<ReturnType<typeof createSheetController>>(null)
  if (!controllerRef.current) controllerRef.current = createSheetController()
  const controller = controllerRef.current
  const controllerState = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  )
  const layoutRef = useRef(layout)
  const motionPositionRef = useRef(controllerState.position)
  const backdropRef = useRef<HTMLElement | null>(null)
  const backdropProgressRef = useRef(0)
  layoutRef.current = layout
  if (controllerState.phase === 'closed')
    motionPositionRef.current = controllerState.position
  const open = controlledOpen ?? uncontrolledOpen
  const present = open || controllerState.phase !== 'closed'
  const transitionPhase =
    open && controllerState.phase === 'closed' ? 'open' : controllerState.phase
  const controlled = controlledOpen !== undefined
  const activeSnapPoint = controlledSnapPoint ?? uncontrolledSnapPoint
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      controlledOpen !== undefined &&
      defaultOpen !== undefined
    ) {
      console.warn(
        'Sheet.Root cannot use both open and defaultOpen; open takes precedence.',
      )
    }
  }, [controlledOpen, defaultOpen])

  const requestOpenChange = useCallback(
    (nextOpen: boolean, reason: OpenChangeReason) => {
      if (nextOpen === open) return
      if (!controlled) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen, { reason })
    },
    [controlled, onOpenChange, open],
  )

  const registerTitle = useCallback((id: string) => {
    setTitleId(id)
    return () => setTitleId((current) => (current === id ? undefined : current))
  }, [])

  const registerDescription = useCallback((id: string) => {
    setDescriptionId(id)
    return () =>
      setDescriptionId((current) => (current === id ? undefined : current))
  }, [])

  const updatePosition = useCallback(
    (position: number) => {
      motionPositionRef.current = position
      content?.style.setProperty('--rsbs-position', `${position}px`)
    },
    [content],
  )

  const getPosition = useCallback(() => motionPositionRef.current, [])

  const updateBackdropProgress = useCallback(
    (progress: number) => {
      backdropProgressRef.current = progress
      backdropRef.current?.style.setProperty(
        '--rsbs-backdrop-progress',
        String(progress),
      )
      content?.style.setProperty('--rsbs-surface-progress', String(progress))
    },
    [content],
  )

  const getBackdropProgress = useCallback(() => backdropProgressRef.current, [])

  const registerBackdrop = useCallback((element: HTMLElement | null) => {
    backdropRef.current = element
    element?.style.setProperty(
      '--rsbs-backdrop-progress',
      String(backdropProgressRef.current),
    )
  }, [])

  const handleLayout = useCallback(
    (nextLayout: ResolvedLayout) => {
      layoutRef.current = nextLayout
      setLayout(nextLayout)
      controller.dispatch({ type: 'LAYOUT_CHANGED', layout: nextLayout })
    },
    [controller],
  )

  useSheetLayout({ viewport, content, snapPoints, onLayout: handleLayout })

  useEffect(() => {
    const current = controller.getState()
    const currentLayout = layoutRef.current
    if (open && currentLayout) {
      const point =
        currentLayout.snapPoints.find(({ id }) => id === activeSnapPoint) ??
        currentLayout.snapPoints[0]
      if (
        point &&
        (current.phase === 'closed' ||
          current.phase === 'closing' ||
          (current.phase === 'open' && current.activeSnapPoint !== point.id))
      ) {
        controller.dispatch({
          type: 'OPEN_REQUESTED',
          reason: 'imperative',
          snapPoint: point.id,
          targetPosition: point.position,
        })
      }
    } else if (!open && !['closed', 'closing'].includes(current.phase)) {
      controller.dispatch({ type: 'CLOSE_REQUESTED', reason: 'imperative' })
    }
  }, [activeSnapPoint, controller, layout, open])

  useSheetMotion({
    controller,
    state: controllerState,
    closedPosition: layout?.closedPosition ?? controllerState.position,
    reducedMotion,
    adapter: motionAdapter,
    getPosition,
    onUpdate: updatePosition,
    getBackdropProgress,
    onBackdropProgress: updateBackdropProgress,
  })

  const handleSnapPointChange = useCallback(
    (id: string) => {
      if (controlledSnapPoint === undefined) setUncontrolledSnapPoint(id)
      onSnapPointChange?.(id)
    },
    [controlledSnapPoint, onSnapPointChange],
  )

  const handleDragDismiss = useCallback(() => {
    requestOpenChange(false, 'drag')
  }, [requestOpenChange])

  const interactionHandlers = useSheetInteractions({
    content,
    controller,
    state: controllerState,
    layout,
    dismissible,
    onDismiss: handleDragDismiss,
    onSnapPointChange: handleSnapPointChange,
    onPositionChange: updatePosition,
  })

  const value = useMemo(
    () => ({
      open,
      present,
      transitionPhase,
      modal,
      dismissible,
      titleId,
      descriptionId,
      requestOpenChange,
      registerTitle,
      registerDescription,
      registerViewport: setViewport,
      registerContent: setContent,
      registerBackdrop,
      interactionHandlers,
      position: motionPositionRef.current,
      surfaceProgress: backdropProgressRef.current,
      dragging: controllerState.phase === 'dragging',
    }),
    [
      descriptionId,
      dismissible,
      modal,
      open,
      present,
      transitionPhase,
      controllerState.phase,
      controllerState.position,
      interactionHandlers,
      registerDescription,
      registerBackdrop,
      registerTitle,
      requestOpenChange,
      setContent,
      setViewport,
      titleId,
    ],
  )

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>
}
