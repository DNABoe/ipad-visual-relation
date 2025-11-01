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
  hasMoved?: boolean
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
  const [dragState, setDragState] = useState<DragState>({ type: null })
  const [resizeState, setResizeState] = useState<ResizeState | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false)
  const dragAccumulator = useRef({ x: 0, y: 0 })
  const dragIntentState = useRef<{
    type: 'person' | 'group' | 'canvas' | null
    id?: string
    startX: number
    startY: number
    hasMovedEnough: boolean
  }>({ type: null, startX: 0, startY: 0, hasMovedEnough: false })

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

  const setDragIntent = useCallback((type: 'person' | 'group' | 'canvas', id: string | undefined, x: number, y: number) => {
    dragIntentState.current = { type, id, startX: x, startY: y, hasMovedEnough: false }
  }, [])

  const checkDragIntent = useCallback((currentX: number, currentY: number): boolean => {
    if (!dragIntentState.current.type) return false
    
    const dx = Math.abs(currentX - dragIntentState.current.startX)
    const dy = Math.abs(currentY - dragIntentState.current.startY)
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const threshold = 5
    
    if (distance > threshold && !dragIntentState.current.hasMovedEnough) {
      dragIntentState.current.hasMovedEnough = true
      return true
    }
    
    return dragIntentState.current.hasMovedEnough
  }, [])

  const clearDragIntent = useCallback(() => {
    dragIntentState.current = { type: null, startX: 0, startY: 0, hasMovedEnough: false }
  }, [])

  const hasDragIntent = useCallback(() => {
    return dragIntentState.current.type !== null
  }, [])

  const getDragIntent = useCallback(() => {
    return dragIntentState.current
  }, [])

  const startPersonDrag = useCallback((personId: string) => {
    dragAccumulator.current = { x: 0, y: 0 }
    setDragState({ type: 'person', id: personId, hasMoved: false })
  }, [])

  const startGroupDrag = useCallback((groupId: string) => {
    dragAccumulator.current = { x: 0, y: 0 }
    setDragState({ type: 'group', id: groupId, hasMoved: false })
  }, [])

  const startConnectionDrag = useCallback((fromPersonId: string, mouseX: number, mouseY: number) => {
    setDragState({ type: 'connection', id: fromPersonId, mouseX, mouseY, hasMoved: true })
  }, [])

  const updateConnectionDrag = useCallback((mouseX: number, mouseY: number) => {
    setDragState(prev => prev.type === 'connection' ? { ...prev, mouseX, mouseY } : prev)
  }, [])

  const markDragAsMoved = useCallback(() => {
    setDragState(prev => ({ ...prev, hasMoved: true }))
  }, [])

  const startSelectionDrag = useCallback((x: number, y: number) => {
    setDragState({ type: 'selection', startX: x, startY: y, hasMoved: false })
    setSelectionRect({ x, y, width: 0, height: 0 })
  }, [])

  const updateSelectionDrag = useCallback((currentX: number, currentY: number) => {
    if (dragState.type !== 'selection' || dragState.startX === undefined || dragState.startY === undefined) return

    const rectData = {
      x: Math.min(dragState.startX, currentX),
      y: Math.min(dragState.startY, currentY),
      width: Math.abs(currentX - dragState.startX),
      height: Math.abs(currentY - dragState.startY),
    }

    setSelectionRect(rectData)
    
    if (!dragState.hasMoved && (rectData.width > 5 || rectData.height > 5)) {
      setDragState(prev => ({ ...prev, hasMoved: true }))
    }
  }, [dragState])

  const startGroupResize = useCallback((groupId: string, handle: string, startX: number, startY: number, startWidth: number, startHeight: number, startGroupX: number, startGroupY: number) => {
    setResizeState({ groupId, handle, startX, startY, startWidth, startHeight, startGroupX, startGroupY })
  }, [])

  const endDrag = useCallback(() => {
    const wasDragging = dragState.type !== null && dragState.hasMoved
    setDragState({ type: null })
    setSelectionRect(null)
    setAlignmentGuides([])
    dragAccumulator.current = { x: 0, y: 0 }
    clearDragIntent()
    return wasDragging
  }, [dragState, clearDragIntent])

  const endResize = useCallback(() => {
    setResizeState(null)
  }, [])

  const setConnectFromPerson = useCallback((personId: string | null) => {
    setConnectFrom(personId)
  }, [])

  const resetInteraction = useCallback(() => {
    setDragState({ type: null })
    setResizeState(null)
    setConnectFrom(null)
    setSelectionRect(null)
    setAlignmentGuides([])
    dragAccumulator.current = { x: 0, y: 0 }
    clearDragIntent()
  }, [clearDragIntent])

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
    isSpacebarPressed,
    setSpacebarPressed,
    setDragIntent,
    checkDragIntent,
    clearDragIntent,
    hasDragIntent,
    getDragIntent,
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
