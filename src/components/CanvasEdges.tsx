import { useRef, useEffect } from 'react'
import type { Person, Connection } from '@/lib/types'
import { NODE_WIDTH, NODE_HEIGHT } from '@/lib/constants'

function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): boolean {
  const rectRight = rectX + rectWidth
  const rectBottom = rectY + rectHeight

  const lineIntersectsLine = (
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ): boolean => {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1))
    if (denominator === 0) return false

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
  }

  if ((x1 >= rectX && x1 <= rectRight && y1 >= rectY && y1 <= rectBottom) ||
      (x2 >= rectX && x2 <= rectRight && y2 >= rectY && y2 <= rectBottom)) {
    return true
  }

  return (
    lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectRight, rectY) ||
    lineIntersectsLine(x1, y1, x2, y2, rectRight, rectY, rectRight, rectBottom) ||
    lineIntersectsLine(x1, y1, x2, y2, rectRight, rectBottom, rectX, rectBottom) ||
    lineIntersectsLine(x1, y1, x2, y2, rectX, rectBottom, rectX, rectY)
  )
}

export function getConnectionsInRect(
  persons: Person[],
  connections: Connection[],
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number
): string[] {
  const personMap = new Map(persons.map(p => [p.id, p]))
  const selectedConnectionIds: string[] = []

  connections.forEach(conn => {
    const from = personMap.get(conn.fromPersonId)
    const to = personMap.get(conn.toPersonId)

    if (!from || !to) return

    const fromX = from.x + NODE_WIDTH / 2
    const fromY = from.y + NODE_HEIGHT / 2
    const toX = to.x + NODE_WIDTH / 2
    const toY = to.y + NODE_HEIGHT / 2

    if (lineIntersectsRect(fromX, fromY, toX, toY, rectX, rectY, rectWidth, rectHeight)) {
      selectedConnectionIds.push(conn.id)
    }
  })

  return selectedConnectionIds
}

interface CanvasEdgesProps {
  persons: Person[]
  connections: Connection[]
  transform: { x: number; y: number; scale: number }
  selectedConnections: string[]
  selectionRect?: { x: number; y: number; width: number; height: number } | null
  onConnectionClick?: (connectionId: string, e: React.MouseEvent) => void
  onConnectionContextMenu?: (connectionId: string, e: React.MouseEvent) => void
}

export function CanvasEdges({ 
  persons, 
  connections, 
  transform, 
  selectedConnections,
  selectionRect,
  onConnectionClick,
  onConnectionContextMenu,
}: CanvasEdgesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitCanvasRef = useRef<HTMLCanvasElement>(null)
  const connectionColorMap = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    const hitCanvas = hitCanvasRef.current
    if (!canvas || !hitCanvas) return

    const ctx = canvas.getContext('2d')
    const hitCtx = hitCanvas.getContext('2d')
    if (!ctx || !hitCtx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    hitCanvas.width = rect.width * dpr
    hitCanvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)
    hitCtx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)
    hitCtx.clearRect(0, 0, rect.width, rect.height)

    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)

    hitCtx.save()
    hitCtx.translate(transform.x, transform.y)
    hitCtx.scale(transform.scale, transform.scale)

    const personMap = new Map(persons.map(p => [p.id, p]))
    connectionColorMap.current.clear()

    const primaryColor = '#45A29E'
    const accentColor = '#66FCF1'

    connections.forEach(conn => {
      const from = personMap.get(conn.fromPersonId)
      const to = personMap.get(conn.toPersonId)

      if (!from || !to) return

      const fromX = from.x + NODE_WIDTH / 2
      const fromY = from.y + NODE_HEIGHT / 2
      const toX = to.x + NODE_WIDTH / 2
      const toY = to.y + NODE_HEIGHT / 2

      const isSelected = selectedConnections.includes(conn.id)

      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.lineTo(toX, toY)
      ctx.strokeStyle = isSelected ? accentColor : 'rgba(102, 252, 241, 0.4)'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.globalAlpha = isSelected ? 1 : 1
      ctx.stroke()
      ctx.globalAlpha = 1

      const arrowSize = 8
      const dx = toX - fromX
      const dy = toY - fromY
      const angle = Math.atan2(dy, dx)

      ctx.beginPath()
      ctx.moveTo(toX, toY)
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()

      const hitColor = `rgb(${(conn.id.charCodeAt(0) * 7) % 256}, ${(conn.id.charCodeAt(1) * 13) % 256}, ${(conn.id.charCodeAt(2) * 17) % 256})`
      connectionColorMap.current.set(hitColor, conn.id)
      
      hitCtx.beginPath()
      hitCtx.moveTo(fromX, fromY)
      hitCtx.lineTo(toX, toY)
      hitCtx.strokeStyle = hitColor
      hitCtx.lineWidth = 10
      hitCtx.stroke()
    })

    ctx.restore()
    hitCtx.restore()
  }, [persons, connections, transform, selectedConnections])

  const getConnectionIdAtPosition = (clientX: number, clientY: number): string | null => {
    if (!hitCanvasRef.current) return null
    
    const hitCtx = hitCanvasRef.current.getContext('2d')
    if (!hitCtx) return null

    const rect = hitCanvasRef.current.getBoundingClientRect()
    const x = (clientX - rect.left) * (hitCanvasRef.current.width / rect.width)
    const y = (clientY - rect.top) * (hitCanvasRef.current.height / rect.height)

    const pixel = hitCtx.getImageData(x, y, 1, 1).data
    const hitColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
    
    return connectionColorMap.current.get(hitColor) || null
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!onConnectionClick) return
    
    const connectionId = getConnectionIdAtPosition(e.clientX, e.clientY)
    if (connectionId) {
      e.stopPropagation()
      onConnectionClick(connectionId, e)
    }
  }

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    if (!onConnectionContextMenu) return
    
    const connectionId = getConnectionIdAtPosition(e.clientX, e.clientY)
    if (connectionId) {
      e.preventDefault()
      e.stopPropagation()
      onConnectionContextMenu(connectionId, e)
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const connectionId = getConnectionIdAtPosition(e.clientX, e.clientY)
    if (connectionId) {
      e.stopPropagation()
    }
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={hitCanvasRef}
        className="absolute inset-0 opacity-0"
        style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
        onMouseDown={handleCanvasMouseDown}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasContextMenu}
      />
    </>
  )
}
