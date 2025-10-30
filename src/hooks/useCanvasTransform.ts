import { useState, useCallback, useRef } from 'react'
import type { ViewTransform } from '@/lib/types'
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '@/lib/constants'

export function useCanvasTransform() {
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)

  const pan = useCallback((dx: number, dy: number) => {
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }))
  }, [])

  const zoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setTransform(prev => {
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.scale + delta))

      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / prev.scale
        return {
          x: centerX - (centerX - prev.x) * scaleRatio,
          y: centerY - (centerY - prev.y) * scaleRatio,
          scale: newScale,
        }
      }

      return { ...prev, scale: newScale }
    })
  }, [])

  const zoomIn = useCallback(() => {
    zoom(ZOOM_STEP)
  }, [zoom])

  const zoomOut = useCallback(() => {
    zoom(-ZOOM_STEP)
  }, [zoom])

  const setZoom = useCallback((scale: number) => {
    setTransform(prev => ({ ...prev, scale: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale)) }))
  }, [])

  const resetTransform = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const setTransformTo = useCallback((newTransform: ViewTransform) => {
    setTransform(newTransform)
  }, [])

  const startPanning = useCallback(() => {
    isPanning.current = true
  }, [])

  const stopPanning = useCallback(() => {
    isPanning.current = false
  }, [])

  const zoomToArea = useCallback((centerX: number, centerY: number, width: number, height: number) => {
    const canvasWidth = window.innerWidth
    const canvasHeight = window.innerHeight
    
    const scaleX = canvasWidth / width
    const scaleY = canvasHeight / height
    const targetScale = Math.min(scaleX, scaleY, MAX_ZOOM) * 0.8
    
    const finalScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetScale))
    
    const x = canvasWidth / 2 - centerX * finalScale
    const y = canvasHeight / 2 - centerY * finalScale
    
    setTransform({ x, y, scale: finalScale })
  }, [])

  return {
    transform,
    pan,
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
    resetTransform,
    setTransform: setTransformTo,
    isPanning: isPanning.current,
    startPanning,
    stopPanning,
    zoomToArea,
  }
}
