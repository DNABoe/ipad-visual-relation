import { useRef, useEffect } from 'react'
import type { Person, Connection } from '@/lib/types'
import { getHubPosition, getBestConnectionSides, createRoutedPath } from '@/lib/connectionRouting'

interface CanvasEdgesProps {
  persons: Person[]
  connections: Connection[]
  transform: { x: number; y: number; scale: number }
  selectedConnections: string[]
  onConnectionClick?: (connectionId: string, e: React.MouseEvent) => void
  onConnectionContextMenu?: (connectionId: string, e: React.MouseEvent) => void
  draggingConnection?: { x: number; y: number; fromPersonId: string; fromSide: string } | null
}

export function CanvasEdges({ 
  persons, 
  connections, 
  transform, 
  selectedConnections,
  onConnectionClick,
  onConnectionContextMenu,
  draggingConnection
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

    connections.forEach(conn => {
      const from = personMap.get(conn.fromPersonId)
      const to = personMap.get(conn.toPersonId)

      if (!from || !to) return

      const sides = conn.fromSide && conn.toSide 
        ? { fromSide: conn.fromSide, toSide: conn.toSide }
        : getBestConnectionSides(from, to)

      const fromPos = getHubPosition(from, sides.fromSide)
      const toPos = getHubPosition(to, sides.toSide)

      const { path } = createRoutedPath(
        fromPos,
        toPos,
        sides.fromSide,
        sides.toSide,
        persons,
        [from, to]
      )

      const isSelected = selectedConnections.includes(conn.id)

      const pathObj = new Path2D(path)
      
      ctx.strokeStyle = isSelected ? 'oklch(0.65 0.15 200)' : 'oklch(0.70 0.02 250)'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke(pathObj)

      const arrowSize = 8
      const dx = toPos.x - fromPos.x
      const dy = toPos.y - fromPos.y
      const angle = Math.atan2(dy, dx)
      
      let arrowAngle = angle
      if (sides.toSide === 'right') arrowAngle = 0
      else if (sides.toSide === 'left') arrowAngle = Math.PI
      else if (sides.toSide === 'bottom') arrowAngle = Math.PI / 2
      else if (sides.toSide === 'top') arrowAngle = -Math.PI / 2

      ctx.beginPath()
      ctx.moveTo(toPos.x, toPos.y)
      ctx.lineTo(
        toPos.x - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        toPos.y - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      )
      ctx.lineTo(
        toPos.x - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        toPos.y - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      )
      ctx.closePath()
      ctx.fillStyle = ctx.strokeStyle
      ctx.fill()

      const hitColor = `rgb(${(conn.id.charCodeAt(0) * 7) % 256}, ${(conn.id.charCodeAt(1) * 13) % 256}, ${(conn.id.charCodeAt(2) * 17) % 256})`
      connectionColorMap.current.set(hitColor, conn.id)
      
      hitCtx.strokeStyle = hitColor
      hitCtx.lineWidth = 10
      hitCtx.stroke(pathObj)
    })

    if (draggingConnection) {
      const from = personMap.get(draggingConnection.fromPersonId)
      if (from) {
        const fromSide = draggingConnection.fromSide as any
        const fromPos = getHubPosition(from, fromSide)
        
        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.lineTo(draggingConnection.x, draggingConnection.y)
        ctx.strokeStyle = 'oklch(0.65 0.15 200)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    ctx.restore()
    hitCtx.restore()
  }, [persons, connections, transform, selectedConnections, draggingConnection])

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
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasContextMenu}
      />
    </>
  )
}
