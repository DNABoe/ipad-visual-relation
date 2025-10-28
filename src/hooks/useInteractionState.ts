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
  const dragAccumulator = useRef({ x: 0, y: 0 })

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

  const startPersonDrag = useCallback((personId: string, multi: boolean = false) => {
    dragAccumulator.current = { x: 0, y: 0 }
    setDragState({ type: 'person', id: personId })
  }, [])

  const startGroupDrag = useCallback((groupId: string) => {
    dragAccumulator.current = { x: 0, y: 0 }
    setDragState({ type: 'group', id: groupId })
  }, [])

  const startConnectionDrag = useCallback((fromPersonId: string, mouseX: number, mouseY: number) => {
    setDragState({ type: 'connection', id: fromPersonId, mouseX, mouseY })
  }, [])

  const updateConnectionDrag = useCallback((mouseX: number, mouseY: number) => {
    setDragState(prev => prev.type === 'connection' ? { ...prev, mouseX, mouseY } : prev)
  }, [])

  const startSelectionDrag = useCallback((x: number, y: number) => {
    setDragState({ type: 'selection', startX: x, startY: y })
    setSelectionRect({ x, y, width: 0, height: 0 })
  }, [])

  const updateSelectionDrag = useCallback((currentX: number, currentY: number) => {
    if (dragState.type !== 'selection' || dragState.startX === undefined || dragState.startY === undefined) return

    setSelectionRect({
      x: Math.min(dragState.startX, currentX),
      y: Math.min(dragState.startY, currentY),
      width: Math.abs(currentX - dragState.startX),
      height: Math.abs(currentY - dragState.startY),
    })
  }, [dragState])

  const startGroupResize = useCallback((groupId: string, handle: string, startX: number, startY: number, startWidth: number, startHeight: number, startGroupX: number, startGroupY: number) => {
    setResizeState({ groupId, handle, startX, startY, startWidth, startHeight, startGroupX, startGroupY })
  }, [])

  const endDrag = useCallback(() => {
    setDragState({ type: null })
    setSelectionRect(null)
    setAlignmentGuides([])
    dragAccumulator.current = { x: 0, y: 0 }
  }, [])

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
  }, [])

  const updateAlignmentGuides = useCallback((guides: AlignmentGuide[]) => {
    setAlignmentGuides(guides)
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
    startPersonDrag,
    startGroupDrag,
    startConnectionDrag,
    updateConnectionDrag,
    startSelectionDrag,
    updateSelectionDrag,
    startGroupResize,
    endDrag,
    endResize,
    setConnectFromPerson,
    resetInteraction,
    updateAlignmentGuides,
    isDragging: dragState.type !== null,
    isResizing: resizeState !== null,
    isConnecting: mode === 'connect',
  }
}
