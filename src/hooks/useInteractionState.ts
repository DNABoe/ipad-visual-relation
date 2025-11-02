import { useState, useCallback, useRef } from 'react'
import type { Person } from '@/lib/types'
import type { AlignmentGuide } from '@/lib/alignment'

export type InteractionMode = 'select' | 'connect' | 'pan'

interface DragState {
  type: 'person' | 'group' | 'connection' | 'selection' | null
  id?: string
  ids?: string[]
  startX?: number
  startY?: number
  mouseX?: number
  mouseY?: number
  hasMoved: boolean
}

interface ResizeState {
  groupId: string
  handle: string
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startGroupX: number
  startGroupY: number
}

export function useInteractionState() {
  const [mode, setMode] = useState<InteractionMode>('select')
  const [dragState, setDragState] = useState<DragState>({ type: null, hasMoved: false })
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false)
  const dragAccumulator = useRef({ x: 0, y: 0 })
  const hasCreatedDragUndo = useRef(false)

  const enableSelectMode = useCallback(() => {
    setMode('select')
    setConnectFrom(null)
  }, [])

  const enableConnectMode = useCallback(() => {
    setMode('connect')
  }, [])

  const enablePanMode = useCallback(() => {
    setMode('pan')
  }, [])

  const startPersonDrag = useCallback((personId: string) => {
    dragAccumulator.current = { x: 0, y: 0 }
    hasCreatedDragUndo.current = false
    setDragState({ type: 'person', id: personId, hasMoved: false })
  }, [])

  const startGroupDrag = useCallback((groupId: string) => {
    dragAccumulator.current = { x: 0, y: 0 }
    hasCreatedDragUndo.current = false
    setDragState({ type: 'group', id: groupId, hasMoved: false })
  }, [])

  const startConnectionDrag = useCallback((fromPersonId: string, mouseX: number, mouseY: number) => {
    setDragState({ type: 'connection', id: fromPersonId, mouseX, mouseY, hasMoved: true })
  }, [])

  const updateConnectionDrag = useCallback((mouseX: number, mouseY: number) => {
    setDragState(prev => prev.type === 'connection' ? { ...prev, mouseX, mouseY, hasMoved: true } : prev)
  }, [])

  const markDragAsMoved = useCallback(() => {
    setDragState(prev => ({ ...prev, hasMoved: true }))
  }, [])

  const startSelectionDrag = useCallback((x: number, y: number) => {
    setDragState({ type: 'selection', startX: x, startY: y, hasMoved: false })
    setSelectionRect({ x, y, width: 0, height: 0 })
  }, [])

  const updateSelectionDrag = useCallback((currentX: number, currentY: number) => {
    setDragState(prev => {
      if (prev.type !== 'selection' || prev.startX === undefined || prev.startY === undefined) return prev

      const rectData = {
        x: Math.min(prev.startX, currentX),
        y: Math.min(prev.startY, currentY),
        width: Math.abs(currentX - prev.startX),
        height: Math.abs(currentY - prev.startY),
      }

      setSelectionRect(rectData)
      
      const shouldMarkAsMoved = !prev.hasMoved && (rectData.width > 5 || rectData.height > 5)
      
      return shouldMarkAsMoved ? { ...prev, hasMoved: true } : prev
    })
  }, [])

  const startGroupResize = useCallback((groupId: string, handle: string, startX: number, startY: number, startWidth: number, startHeight: number, startGroupX: number, startGroupY: number) => {
    setResizeState({ groupId, handle, startX, startY, startWidth, startHeight, startGroupX, startGroupY })
  }, [])

  const endDrag = useCallback(() => {
    const wasDragging = dragState.type !== null && dragState.hasMoved
    setDragState({ type: null, hasMoved: false })
    setSelectionRect(null)
    setAlignmentGuides([])
    dragAccumulator.current = { x: 0, y: 0 }
    hasCreatedDragUndo.current = false
    return wasDragging
  }, [dragState])

  const endResize = useCallback(() => {
    setResizeState(null)
  }, [])

  const setConnectFromPerson = useCallback((personId: string | null) => {
    setConnectFrom(personId)
  }, [])

  const resetInteraction = useCallback(() => {
    setDragState({ type: null, hasMoved: false })
    setResizeState(null)
    setConnectFrom(null)
    setSelectionRect(null)
    setAlignmentGuides([])
    dragAccumulator.current = { x: 0, y: 0 }
    hasCreatedDragUndo.current = false
  }, [])

  const updateAlignmentGuides = useCallback((guides: AlignmentGuide[]) => {
    setAlignmentGuides(guides)
  }, [])

  const setSpacebarPressed = useCallback((pressed: boolean) => {
    setIsSpacebarPressed(pressed)
  }, [])

  return {
    mode,
    enableSelectMode,
    enableConnectMode,
    enablePanMode,
    dragState,
    resizeState,
    connectFrom,
    selectionRect,
    alignmentGuides,
    dragAccumulator,
    hasCreatedDragUndo,
    isSpacebarPressed,
    setSpacebarPressed,
    startPersonDrag,
    startGroupDrag,
    startConnectionDrag,
    updateConnectionDrag,
    markDragAsMoved,
    startSelectionDrag,
    updateSelectionDrag,
    startGroupResize,
    endDrag,
    endResize,
    setConnectFromPerson,
    resetInteraction,
    updateAlignmentGuides,
    isDragging: dragState.type !== null && dragState.hasMoved === true,
    isResizing: resizeState !== null,
    isConnecting: mode === 'connect',
  }
}
