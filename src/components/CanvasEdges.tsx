import { useRef, useEffect } from 'react'
import type { Person, Connection } from '@/lib/types'
import { NODE_WIDTH, NODE_HEIGHT } from '@/lib/constants'

interface CanvasEdgesProps {
  persons: Person[]
  connections: Connection[]
  transform: { x: number; y: number; scale: number }
  selectedConnections: string[]
}

export function CanvasEdges({ persons, connections, transform, selectedConnections }: CanvasEdgesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)

    const personMap = new Map(persons.map(p => [p.id, p]))

    connections.forEach(conn => {
      const from = personMap.get(conn.fromPersonId)
      const to = personMap.get(conn.toPersonId)

      if (!from || !to) return

      const fromX = from.x + NODE_WIDTH / 2
      const fromY = from.y + NODE_HEIGHT / 2
      const toX = to.x + NODE_WIDTH / 2
      const toY = to.y + NODE_HEIGHT / 2

      const isSelected = selectedConnections.includes(conn.id)

      const dx = toX - fromX
      const dy = toY - fromY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const controlOffset = distance * 0.2

      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2

      const perpX = -dy / distance
      const perpY = dx / distance

      const controlX = midX + perpX * controlOffset * 0.3
      const controlY = midY + perpY * controlOffset * 0.3

      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      ctx.quadraticCurveTo(controlX, controlY, toX, toY)

      if (isSelected) {
        ctx.strokeStyle = 'oklch(0.65 0.15 200)'
        ctx.lineWidth = 3
      } else {
        ctx.strokeStyle = 'oklch(0.70 0.02 250)'
        ctx.lineWidth = 2
      }

      ctx.stroke()

      const arrowSize = 8
      const angle = Math.atan2(toY - controlY, toX - controlX)

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
    })

    ctx.restore()
  }, [persons, connections, transform, selectedConnections])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
