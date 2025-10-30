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
  organicLines?: boolean
  shortestPathPersonIds?: string[]
  isShortestPathActive?: boolean
}

export function CanvasEdges({ 
  persons, 
  connections, 
  transform, 
  selectedConnections,
  selectionRect,
  onConnectionClick,
  onConnectionContextMenu,
  organicLines = false,
  shortestPathPersonIds = [],
  isShortestPathActive = false,
}: CanvasEdgesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hitCanvasRef = useRef<HTMLCanvasElement>(null)
  const connectionColorMap = useRef<Map<string, string>>(new Map())
  const animationFrameRef = useRef<number | null>(null)
  const particlesRef = useRef<Array<{
    connectionIndex: number
    progress: number
    speed: number
  }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    const hitCanvas = hitCanvasRef.current
    if (!canvas || !hitCanvas) return

    const ctx = canvas.getContext('2d')
    const hitCtx = hitCanvas.getContext('2d')
    if (!ctx || !hitCtx) return

    const shortestPathConnectionIds = new Set<string>()
    const shortestPathConnections: Array<{ from: Person, to: Person, conn: Connection }> = []
    
    if (isShortestPathActive && shortestPathPersonIds.length >= 2) {
      for (let i = 0; i < shortestPathPersonIds.length - 1; i++) {
        const fromId = shortestPathPersonIds[i]
        const toId = shortestPathPersonIds[i + 1]
        const conn = connections.find(
          c => (c.fromPersonId === fromId && c.toPersonId === toId) ||
               (c.fromPersonId === toId && c.toPersonId === fromId)
        )
        if (conn) {
          shortestPathConnectionIds.add(conn.id)
          const personMap = new Map(persons.map(p => [p.id, p]))
          const from = personMap.get(fromId)
          const to = personMap.get(toId)
          if (from && to) {
            shortestPathConnections.push({ from, to, conn })
          }
        }
      }
      
      if (particlesRef.current.length === 0 || particlesRef.current.length !== shortestPathConnections.length * 3) {
        particlesRef.current = []
        for (let i = 0; i < shortestPathConnections.length; i++) {
          for (let j = 0; j < 3; j++) {
            particlesRef.current.push({
              connectionIndex: i,
              progress: j * 0.33,
              speed: 0.008 + Math.random() * 0.004,
            })
          }
        }
      }
    } else {
      particlesRef.current = []
    }

    const drawFrame = (time: number) => {
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

      const accentColor = 'oklch(0.88 0.18 185)'
      const edgeColor = 'oklch(0.88 0.18 185 / 0.4)'

      const pulsePhase = (time * 0.002) % (Math.PI * 2)
      const pulseIntensity = (Math.sin(pulsePhase) + 1) * 0.5

      connections.forEach(conn => {
        const from = personMap.get(conn.fromPersonId)
        const to = personMap.get(conn.toPersonId)

        if (!from || !to) return

        const fromX = from.x + NODE_WIDTH / 2
        const fromY = from.y + NODE_HEIGHT / 2
        const toX = to.x + NODE_WIDTH / 2
        const toY = to.y + NODE_HEIGHT / 2

        const isSelected = selectedConnections.includes(conn.id)
        const isShortestPath = shortestPathConnectionIds.has(conn.id)

        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        
        let pathPoints: { x: number, y: number }[] = []
        
        if (organicLines) {
          const dx = toX - fromX
          const dy = toY - fromY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const curvature = Math.min(distance * 0.25, 150)
          
          const perpX = -dy / distance
          const perpY = dx / distance
          
          const offsetX = perpX * curvature * 0.3
          const offsetY = perpY * curvature * 0.3
          
          const cp1X = fromX + dx * 0.25 + offsetX
          const cp1Y = fromY + dy * 0.25 + offsetY
          const cp2X = fromX + dx * 0.75 + offsetX
          const cp2Y = fromY + dy * 0.75 + offsetY
          
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, toX, toY)
          
          for (let t = 0; t <= 1; t += 0.01) {
            const mt = 1 - t
            const mt2 = mt * mt
            const mt3 = mt2 * mt
            const t2 = t * t
            const t3 = t2 * t
            
            const x = mt3 * fromX + 3 * mt2 * t * cp1X + 3 * mt * t2 * cp2X + t3 * toX
            const y = mt3 * fromY + 3 * mt2 * t * cp1Y + 3 * mt * t2 * cp2Y + t3 * toY
            pathPoints.push({ x, y })
          }
        } else {
          ctx.lineTo(toX, toY)
          
          for (let t = 0; t <= 1; t += 0.01) {
            const x = fromX + (toX - fromX) * t
            const y = fromY + (toY - fromY) * t
            pathPoints.push({ x, y })
          }
        }
        
        if (isShortestPath) {
          const glowIntensity = 0.6 + pulseIntensity * 0.4
          ctx.strokeStyle = accentColor
          ctx.lineWidth = 4 + pulseIntensity * 2
          ctx.shadowColor = accentColor
          ctx.shadowBlur = 15 + pulseIntensity * 10
          ctx.globalAlpha = glowIntensity
          ctx.stroke()
          
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        } else {
          ctx.strokeStyle = isSelected ? accentColor : edgeColor
          ctx.lineWidth = isSelected ? 3 : 2
          ctx.globalAlpha = isSelected ? 1 : 1
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        const arrowSize = isShortestPath ? 10 : 8
        const dx = toX - fromX
        const dy = toY - fromY
        let angle: number
        
        if (organicLines) {
          const distance = Math.sqrt(dx * dx + dy * dy)
          const curvature = Math.min(distance * 0.25, 150)
          const perpX = -dy / distance
          const perpY = dx / distance
          const offsetX = perpX * curvature * 0.3
          const offsetY = perpY * curvature * 0.3
          
          const cp2X = fromX + dx * 0.75 + offsetX
          const cp2Y = fromY + dy * 0.75 + offsetY
          
          const tdx = toX - cp2X
          const tdy = toY - cp2Y
          angle = Math.atan2(tdy, tdx)
        } else {
          angle = Math.atan2(dy, dx)
        }

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
        
        if (isShortestPath) {
          ctx.fillStyle = accentColor
          ctx.shadowColor = accentColor
          ctx.shadowBlur = 15 + pulseIntensity * 10
          ctx.globalAlpha = 0.6 + pulseIntensity * 0.4
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        } else {
          ctx.fillStyle = ctx.strokeStyle
          ctx.fill()
        }

        const hitColor = `rgb(${(conn.id.charCodeAt(0) * 7) % 256}, ${(conn.id.charCodeAt(1) * 13) % 256}, ${(conn.id.charCodeAt(2) * 17) % 256})`
        connectionColorMap.current.set(hitColor, conn.id)
        
        hitCtx.beginPath()
        hitCtx.moveTo(fromX, fromY)
        
        if (organicLines) {
          const dx = toX - fromX
          const dy = toY - fromY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const curvature = Math.min(distance * 0.25, 150)
          
          const perpX = -dy / distance
          const perpY = dx / distance
          
          const offsetX = perpX * curvature * 0.3
          const offsetY = perpY * curvature * 0.3
          
          const cp1X = fromX + dx * 0.25 + offsetX
          const cp1Y = fromY + dy * 0.25 + offsetY
          const cp2X = fromX + dx * 0.75 + offsetX
          const cp2Y = fromY + dy * 0.75 + offsetY
          
          hitCtx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, toX, toY)
        } else {
          hitCtx.lineTo(toX, toY)
        }
        
        hitCtx.strokeStyle = hitColor
        hitCtx.lineWidth = 10
        hitCtx.stroke()
      })

      if (isShortestPathActive && shortestPathConnections.length > 0) {
        particlesRef.current.forEach(particle => {
          const connData = shortestPathConnections[particle.connectionIndex]
          if (!connData) return
          
          const { from, to } = connData
          const fromX = from.x + NODE_WIDTH / 2
          const fromY = from.y + NODE_HEIGHT / 2
          const toX = to.x + NODE_WIDTH / 2
          const toY = to.y + NODE_HEIGHT / 2
          
          let px: number, py: number
          
          if (organicLines) {
            const dx = toX - fromX
            const dy = toY - fromY
            const distance = Math.sqrt(dx * dx + dy * dy)
            const curvature = Math.min(distance * 0.25, 150)
            
            const perpX = -dy / distance
            const perpY = dx / distance
            
            const offsetX = perpX * curvature * 0.3
            const offsetY = perpY * curvature * 0.3
            
            const cp1X = fromX + dx * 0.25 + offsetX
            const cp1Y = fromY + dy * 0.25 + offsetY
            const cp2X = fromX + dx * 0.75 + offsetX
            const cp2Y = fromY + dy * 0.75 + offsetY
            
            const t = particle.progress
            const mt = 1 - t
            const mt2 = mt * mt
            const mt3 = mt2 * mt
            const t2 = t * t
            const t3 = t2 * t
            
            px = mt3 * fromX + 3 * mt2 * t * cp1X + 3 * mt * t2 * cp2X + t3 * toX
            py = mt3 * fromY + 3 * mt2 * t * cp1Y + 3 * mt * t2 * cp2Y + t3 * toY
          } else {
            px = fromX + (toX - fromX) * particle.progress
            py = fromY + (toY - fromY) * particle.progress
          }
          
          const particleSize = 6 + pulseIntensity * 2
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize)
          gradient.addColorStop(0, 'oklch(1 0.3 185)')
          gradient.addColorStop(0.5, accentColor)
          gradient.addColorStop(1, 'oklch(0.88 0.18 185 / 0)')
          
          ctx.beginPath()
          ctx.arc(px, py, particleSize, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.shadowColor = accentColor
          ctx.shadowBlur = 10
          ctx.fill()
          ctx.shadowBlur = 0
          
          particle.progress += particle.speed
          if (particle.progress > 1) {
            particle.progress = 0
          }
        })
      }

      ctx.restore()
      hitCtx.restore()

      if (isShortestPathActive && shortestPathConnectionIds.size > 0) {
        animationFrameRef.current = requestAnimationFrame(drawFrame)
      }
    }

    if (isShortestPathActive && shortestPathConnectionIds.size > 0) {
      const animate = (time: number) => {
        drawFrame(time)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      drawFrame(0)
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [persons, connections, transform, selectedConnections, organicLines, isShortestPathActive, shortestPathPersonIds])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeObserver = new ResizeObserver(() => {
      const event = new Event('canvasResize')
      canvas.dispatchEvent(event)
    })

    resizeObserver.observe(canvas)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

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
