import { useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import type { Person, Connection, Group, ViewTransform } from '@/lib/types'
import { toast } from 'sonner'
import { Image, Selection, ArrowsOut, CheckCircle, ClipboardText, Export as ExportIcon } from '@phosphor-icons/react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persons: Person[]
  connections: Connection[]
  groups: Group[]
  transform: ViewTransform
  canvasRef: React.RefObject<HTMLDivElement | null>
  selectedPersons: string[]
}

type ExportFormat = 'png' | 'jpeg'
type ExportMode = 'all' | 'selection'

export function ExportDialog({ open, onOpenChange, persons, connections, groups, transform, canvasRef, selectedPersons }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [mode, setMode] = useState<ExportMode>('all')
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  
  const [includeImportanceScore, setIncludeImportanceScore] = useState(true)
  const [includeName, setIncludeName] = useState(true)
  const [includePosition, setIncludePosition] = useState(true)
  const [includePhoto, setIncludePhoto] = useState(true)
  const [includeAdvocate, setIncludeAdvocate] = useState(true)
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const selectionCanvasRef = useRef<HTMLDivElement>(null)

      useEffect(() => {
    if (open && selectedPersons.length > 0) {
      const selectedPersonsData = persons.filter(p => selectedPersons.includes(p.id))
      if (selectedPersonsData.length > 0) {
        const cardWidth = 200
        const cardHeight = 280
        const bounds = {
          minX: Math.min(...selectedPersonsData.map(p => p.x)),
          minY: Math.min(...selectedPersonsData.map(p => p.y)),
          maxX: Math.max(...selectedPersonsData.map(p => p.x + cardWidth)),
          maxY: Math.max(...selectedPersonsData.map(p => p.y + cardHeight)),
        }
        setSelectionRect({
          x: bounds.minX - 15,
          y: bounds.minY - 15,
          width: bounds.maxX - bounds.minX + 30,
          height: bounds.maxY - bounds.minY + 30,
        })
        setMode('selection')
      }
    }
  }, [open, selectedPersons, persons])

  const handleStartSelection = useCallback(() => {
    setIsSelecting(true)
    setSelectionRect(null)
    onOpenChange(false)
    setTimeout(() => {
      toast.info('Click and drag on the canvas to select export area', {
        duration: 5000,
      })
    }, 100)
  }, [onOpenChange])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - transform.x) / transform.scale
    const y = (e.clientY - rect.top - transform.y) / transform.scale
    
    setDragStart({ x, y })
    setSelectionRect(null)
  }, [isSelecting, transform])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !dragStart) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - transform.x) / transform.scale
    const y = (e.clientY - rect.top - transform.y) / transform.scale
    
    const minX = Math.min(dragStart.x, x)
    const minY = Math.min(dragStart.y, y)
    const width = Math.abs(x - dragStart.x)
    const height = Math.abs(y - dragStart.y)
    
    setSelectionRect({ x: minX, y: minY, width, height })
  }, [isSelecting, dragStart, transform])

  const handleCanvasMouseUp = useCallback(() => {
    if (!isSelecting || !selectionRect) return
    
    setDragStart(null)
    setIsSelecting(false)
    toast.success('Export area selected')
    setTimeout(() => {
      onOpenChange(true)
    }, 100)
  }, [isSelecting, selectionRect, onOpenChange])

  const handleClearSelection = useCallback(() => {
    setSelectionRect(null)
    setIsSelecting(false)
    setDragStart(null)
  }, [])

  const generateCanvasBlob = useCallback(async (): Promise<Blob | null> => {
    try {
      let bounds: { minX: number; minY: number; maxX: number; maxY: number }
      
      if (mode === 'selection' && selectionRect) {
        bounds = {
          minX: selectionRect.x,
          minY: selectionRect.y,
          maxX: selectionRect.x + selectionRect.width,
          maxY: selectionRect.y + selectionRect.height,
        }
      } else {
        if (persons.length === 0 && groups.length === 0) {
          toast.error('Nothing to export')
          return null
        }
        
        const cardWidth = 200
        const cardHeight = 280
        
        const allX = [
          ...persons.map(p => p.x),
          ...persons.map(p => p.x + cardWidth),
          ...groups.map(g => g.x),
          ...groups.map(g => g.x + g.width),
        ]
        const allY = [
          ...persons.map(p => p.y),
          ...persons.map(p => p.y + cardHeight),
          ...groups.map(g => g.y),
          ...groups.map(g => g.y + g.height),
        ]
        
        bounds = {
          minX: Math.min(...allX) - 15,
          minY: Math.min(...allY) - 15,
          maxX: Math.max(...allX) + 15,
          maxY: Math.max(...allY) + 15,
        }
      }
      
      const width = bounds.maxX - bounds.minX
      const height = bounds.maxY - bounds.minY
      
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d', { alpha: true })
      
      if (!ctx) {
        toast.error('Failed to create canvas context')
        return null
      }
      
      ctx.scale(scale, scale)
      
      if (format === 'jpeg') {
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)
      }
      
      ctx.save()
      ctx.translate(-bounds.minX, -bounds.minY)
      
      const groupsInBounds = groups.filter(g => {
        const gRight = g.x + g.width
        const gBottom = g.y + g.height
        return !(gRight < bounds.minX || g.x > bounds.maxX || gBottom < bounds.minY || g.y > bounds.maxY)
      })
      
      for (const group of groupsInBounds) {
        const colorMap: Record<string, string> = {
          blue: getComputedStyle(document.documentElement).getPropertyValue('--group-blue').trim(),
          purple: getComputedStyle(document.documentElement).getPropertyValue('--group-purple').trim(),
          pink: getComputedStyle(document.documentElement).getPropertyValue('--group-pink').trim(),
          yellow: getComputedStyle(document.documentElement).getPropertyValue('--group-yellow').trim(),
          teal: getComputedStyle(document.documentElement).getPropertyValue('--group-teal').trim(),
          indigo: getComputedStyle(document.documentElement).getPropertyValue('--group-indigo').trim(),
          rose: getComputedStyle(document.documentElement).getPropertyValue('--group-rose').trim(),
          emerald: getComputedStyle(document.documentElement).getPropertyValue('--group-emerald').trim(),
          amber: getComputedStyle(document.documentElement).getPropertyValue('--group-amber').trim(),
          cyan: getComputedStyle(document.documentElement).getPropertyValue('--group-cyan').trim(),
        }
        
        const color = colorMap[group.color] || colorMap.blue
        
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 6
        ctx.setLineDash([12, 8])
        
        if (group.solidBackground) {
          ctx.fillStyle = color.replace(')', ' / 0.12)')
          ctx.fillRect(group.x, group.y, group.width, group.height)
        }
        
        ctx.strokeRect(group.x, group.y, group.width, group.height)
        ctx.restore()
        
        ctx.save()
        const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim()
        ctx.fillStyle = cardColor
        ctx.font = '600 16px Inter, sans-serif'
        ctx.fillText(group.name, group.x + 12, group.y + 28)
        ctx.restore()
      }
      
      const personsInBounds = persons.filter(p => {
        const cardWidth = 200
        const cardHeight = 280
        const pRight = p.x + cardWidth
        const pBottom = p.y + cardHeight
        return !(pRight < bounds.minX || p.x > bounds.maxX || pBottom < bounds.minY || p.y > bounds.maxY)
      })
      
      const personIds = new Set(personsInBounds.map(p => p.id))
      const connectionsInBounds = connections.filter(c => 
        personIds.has(c.fromPersonId) && personIds.has(c.toPersonId)
      )
      
      for (const conn of connectionsInBounds) {
        const fromPerson = persons.find(p => p.id === conn.fromPersonId)
        const toPerson = persons.find(p => p.id === conn.toPersonId)
        
        if (!fromPerson || !toPerson) continue
        
        const cardWidth = 200
        const cardHeight = 280
        const fromX = fromPerson.x + cardWidth / 2
        const fromY = fromPerson.y + cardHeight / 2
        const toX = toPerson.x + cardWidth / 2
        const toY = toPerson.y + cardHeight / 2
        
        ctx.save()
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
        ctx.strokeStyle = primaryColor
        
        const lineStyle = conn.style || 'solid'
        const thickness = conn.weight || 'medium'
        
        const thicknessMap = {
          thin: 2.5,
          medium: 4.5,
          thick: 7.5
        }
        ctx.lineWidth = thicknessMap[thickness]
        
        if (lineStyle === 'dashed') {
          ctx.setLineDash([12, 8])
        }
        
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        ctx.lineTo(toX, toY)
        ctx.stroke()
        ctx.restore()
        
        if (conn.direction && conn.direction !== 'none') {
          const dx = toX - fromX
          const dy = toY - fromY
          const length = Math.sqrt(dx * dx + dy * dy)
          const centerX = fromX + dx * 0.5
          const centerY = fromY + dy * 0.5
          
          const angle = Math.atan2(dy, dx)
          
          ctx.save()
          ctx.translate(centerX, centerY)
          ctx.rotate(angle)
          
          const arrowSize = conn.direction === 'bidirectional' ? 12 : 16
          ctx.fillStyle = primaryColor
          ctx.globalAlpha = 0.9
          
          if (conn.direction === 'forward' || conn.direction === 'bidirectional') {
            ctx.beginPath()
            ctx.moveTo(arrowSize, 0)
            ctx.lineTo(-arrowSize / 2, -arrowSize / 2)
            ctx.lineTo(-arrowSize / 2, arrowSize / 2)
            ctx.closePath()
            ctx.fill()
          }
          
          if (conn.direction === 'backward' || conn.direction === 'bidirectional') {
            ctx.beginPath()
            ctx.moveTo(-arrowSize, 0)
            ctx.lineTo(arrowSize / 2, -arrowSize / 2)
            ctx.lineTo(arrowSize / 2, arrowSize / 2)
            ctx.closePath()
            ctx.fill()
          }
          
          ctx.restore()
        }
      }
      
      for (const person of personsInBounds) {
        const frameColorMap: Record<string, string> = {
          red: getComputedStyle(document.documentElement).getPropertyValue('--frame-red').trim(),
          green: getComputedStyle(document.documentElement).getPropertyValue('--frame-green').trim(),
          orange: getComputedStyle(document.documentElement).getPropertyValue('--frame-orange').trim(),
          white: getComputedStyle(document.documentElement).getPropertyValue('--frame-white').trim(),
        }
        
        const frameColor = frameColorMap[person.frameColor] || frameColorMap.white
        const cardColor = 'oklch(0.21 0.03 230)'
        
        const cardWidth = 200
        const cardHeight = 280
        
        ctx.save()
        ctx.fillStyle = cardColor
        
        const radius = 8
        ctx.beginPath()
        ctx.moveTo(person.x + radius, person.y)
        ctx.lineTo(person.x + cardWidth - radius, person.y)
        ctx.arcTo(person.x + cardWidth, person.y, person.x + cardWidth, person.y + radius, radius)
        ctx.lineTo(person.x + cardWidth, person.y + cardHeight - radius)
        ctx.arcTo(person.x + cardWidth, person.y + cardHeight, person.x + cardWidth - radius, person.y + cardHeight, radius)
        ctx.lineTo(person.x + radius, person.y + cardHeight)
        ctx.arcTo(person.x, person.y + cardHeight, person.x, person.y + cardHeight - radius, radius)
        ctx.lineTo(person.x, person.y + radius)
        ctx.arcTo(person.x, person.y, person.x + radius, person.y, radius)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        
        const photoHeight = 160
        const textAreaHeight = 120
        const photoOffsetX = person.photoOffsetX || 0
        const photoOffsetY = person.photoOffsetY || 0
        const photoZoom = person.photoZoom || 100
        
        if (includePhoto && person.photo) {
          try {
            const img = document.createElement('img')
            img.crossOrigin = 'anonymous'
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject()
              img.src = person.photo!
            })
            
            ctx.save()
            ctx.beginPath()
            const topRadius = 8
            ctx.moveTo(person.x + topRadius, person.y)
            ctx.lineTo(person.x + cardWidth - topRadius, person.y)
            ctx.arcTo(person.x + cardWidth, person.y, person.x + cardWidth, person.y + topRadius, topRadius)
            ctx.lineTo(person.x + cardWidth, person.y + photoHeight)
            ctx.lineTo(person.x, person.y + photoHeight)
            ctx.lineTo(person.x, person.y + topRadius)
            ctx.arcTo(person.x, person.y, person.x + topRadius, person.y, topRadius)
            ctx.closePath()
            ctx.clip()
            
            const renderWidth = cardWidth * (photoZoom / 100)
            const renderHeight = photoHeight * (photoZoom / 100)
            
            const containerCenterX = person.x + cardWidth / 2
            const containerCenterY = person.y + photoHeight / 2
            
            const bgPosX = 50 + photoOffsetX
            const bgPosY = 50 + photoOffsetY
            
            const imgX = person.x + (cardWidth * bgPosX / 100) - (renderWidth / 2)
            const imgY = person.y + (photoHeight * bgPosY / 100) - (renderHeight / 2)
            
            ctx.drawImage(img, imgX, imgY, renderWidth, renderHeight)
            ctx.restore()
          } catch (err) {
            console.error('Failed to load photo:', err)
            
            if (includeName) {
              ctx.save()
              ctx.fillStyle = frameColor
              ctx.beginPath()
              const topRadius = 8
              ctx.moveTo(person.x + topRadius, person.y)
              ctx.lineTo(person.x + cardWidth - topRadius, person.y)
              ctx.arcTo(person.x + cardWidth, person.y, person.x + cardWidth, person.y + topRadius, topRadius)
              ctx.lineTo(person.x + cardWidth, person.y + photoHeight)
              ctx.lineTo(person.x, person.y + photoHeight)
              ctx.lineTo(person.x, person.y + topRadius)
              ctx.arcTo(person.x, person.y, person.x + topRadius, person.y, topRadius)
              ctx.closePath()
              ctx.fill()
              
              ctx.fillStyle = 'oklch(1 0 0)'
              ctx.font = 'bold 36px Inter, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              ctx.fillText(initials, person.x + cardWidth / 2, person.y + photoHeight / 2)
              ctx.restore()
            }
          }
        } else if (!includePhoto || !person.photo) {
          ctx.save()
          ctx.fillStyle = frameColor
          ctx.beginPath()
          const topRadius = 8
          ctx.moveTo(person.x + topRadius, person.y)
          ctx.lineTo(person.x + cardWidth - topRadius, person.y)
          ctx.arcTo(person.x + cardWidth, person.y, person.x + cardWidth, person.y + topRadius, topRadius)
          ctx.lineTo(person.x + cardWidth, person.y + photoHeight)
          ctx.lineTo(person.x, person.y + photoHeight)
          ctx.lineTo(person.x, person.y + topRadius)
          ctx.arcTo(person.x, person.y, person.x + topRadius, person.y, topRadius)
          ctx.closePath()
          ctx.fill()
          
          if (includeName) {
            ctx.fillStyle = 'oklch(1 0 0)'
            ctx.font = 'bold 36px Inter, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            ctx.fillText(initials, person.x + cardWidth / 2, person.y + photoHeight / 2)
          }
          ctx.restore()
        }
        
        if (includeImportanceScore) {
          const badgeSize = 32
          const badgeX = person.x + cardWidth - badgeSize - 6
          const badgeY = person.y + 6
          
          ctx.save()
          const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
          const primaryForegroundColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-foreground').trim()
          ctx.fillStyle = primaryColor
          ctx.strokeStyle = primaryColor
          ctx.lineWidth = 0
          const badgeRadius = 6
          ctx.beginPath()
          ctx.moveTo(badgeX + badgeRadius, badgeY)
          ctx.lineTo(badgeX + badgeSize - badgeRadius, badgeY)
          ctx.arcTo(badgeX + badgeSize, badgeY, badgeX + badgeSize, badgeY + badgeRadius, badgeRadius)
          ctx.lineTo(badgeX + badgeSize, badgeY + badgeSize - badgeRadius)
          ctx.arcTo(badgeX + badgeSize, badgeY + badgeSize, badgeX + badgeSize - badgeRadius, badgeY + badgeSize, badgeRadius)
          ctx.lineTo(badgeX + badgeRadius, badgeY + badgeSize)
          ctx.arcTo(badgeX, badgeY + badgeSize, badgeX, badgeY + badgeSize - badgeRadius, badgeRadius)
          ctx.lineTo(badgeX, badgeY + badgeRadius)
          ctx.arcTo(badgeX, badgeY, badgeX + badgeRadius, badgeY, badgeRadius)
          ctx.closePath()
          ctx.fill()
          
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2
          ctx.fill()
          ctx.shadowColor = 'transparent'
          
          ctx.fillStyle = primaryForegroundColor
          ctx.font = 'bold 14px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(person.score.toString(), badgeX + badgeSize / 2, badgeY + badgeSize / 2)
          ctx.restore()
        }
        
        if (includeAdvocate && person.advocate) {
          const starSize = 32
          const starX = person.x + 6
          const starY = person.y + 6
          
          ctx.save()
          ctx.fillStyle = 'rgb(250, 204, 21)'
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2
          
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
            const x = starX + starSize / 2 + (starSize / 2) * Math.cos(angle)
            const y = starY + starSize / 2 + (starSize / 2) * Math.sin(angle)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
            
            const innerAngle = angle + (2 * Math.PI) / 10
            const innerX = starX + starSize / 2 + (starSize / 5) * Math.cos(innerAngle)
            const innerY = starY + starSize / 2 + (starSize / 5) * Math.sin(innerAngle)
            ctx.lineTo(innerX, innerY)
          }
          ctx.closePath()
          ctx.fill()
          ctx.restore()
        }
        
        if (includeName || includePosition) {
          const textX = person.x + 12
          const textStartY = person.y + photoHeight + 0
          const textWidth = cardWidth - 24
          
          ctx.save()
          let currentY = textStartY
          const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()
          const mutedForegroundColor = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim()
          
          if (includeName) {
            ctx.fillStyle = foregroundColor
            ctx.font = '600 16px Inter, sans-serif'
            ctx.textBaseline = 'top'
            
            const maxWidth = textWidth
            let displayName = person.name
            let metrics = ctx.measureText(displayName)
            if (metrics.width > maxWidth) {
              while (metrics.width > maxWidth - 20 && displayName.length > 0) {
                displayName = displayName.slice(0, -1)
                metrics = ctx.measureText(displayName + '...')
              }
              displayName += '...'
            }
            ctx.fillText(displayName, textX, currentY)
            currentY += 18 + 2
          }
          
          if (includePosition) {
            ctx.fillStyle = mutedForegroundColor
            ctx.font = '400 12px Inter, sans-serif'
            const maxWidth = textWidth
            
            if (person.position) {
              const lineHeight = 16.2
              const maxLines = 3
              let wrappedLines: string[] = []
              
              const words = person.position.split(' ')
              let currentLine = ''
              
              for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word
                const metrics = ctx.measureText(testLine)
                
                if (metrics.width > maxWidth && currentLine) {
                  wrappedLines.push(currentLine)
                  currentLine = word
                } else {
                  currentLine = testLine
                }
              }
              
              if (currentLine) {
                wrappedLines.push(currentLine)
              }
              
              const linesToRender = wrappedLines.slice(0, maxLines)
              
              for (let i = 0; i < linesToRender.length; i++) {
                let line = linesToRender[i]
                
                if (i === maxLines - 1 && wrappedLines.length > maxLines) {
                  let metrics = ctx.measureText(line + '...')
                  while (metrics.width > maxWidth && line.length > 0) {
                    line = line.slice(0, -1)
                    metrics = ctx.measureText(line + '...')
                  }
                  line += '...'
                }
                
                ctx.fillText(line, textX, currentY)
                currentY += lineHeight
              }
              
              if (linesToRender.length < maxLines) {
                currentY += lineHeight * (maxLines - linesToRender.length)
              }
            } else {
              currentY += 16.2 * 3
            }
            
            currentY += 2
            
            if (person.position2) {
              const lineHeight = 15
              let displayPos2 = person.position2
              let metrics = ctx.measureText(displayPos2)
              if (metrics.width > maxWidth) {
                while (metrics.width > maxWidth - 20 && displayPos2.length > 0) {
                  displayPos2 = displayPos2.slice(0, -1)
                  metrics = ctx.measureText(displayPos2 + '...')
                }
                displayPos2 += '...'
              }
              ctx.fillText(displayPos2, textX, currentY)
              currentY += lineHeight + 2
            } else {
              currentY += 15 + 2
            }
            
            if (person.position3) {
              let displayPos3 = person.position3
              let metrics = ctx.measureText(displayPos3)
              if (metrics.width > maxWidth) {
                while (metrics.width > maxWidth - 20 && displayPos3.length > 0) {
                  displayPos3 = displayPos3.slice(0, -1)
                  metrics = ctx.measureText(displayPos3 + '...')
                }
                displayPos3 += '...'
              }
              ctx.fillText(displayPos3, textX, currentY)
            }
          }
          
          ctx.restore()
        }
        
        ctx.save()
        ctx.strokeStyle = frameColor
        ctx.lineWidth = 8
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        
        const borderRadius = 8
        ctx.beginPath()
        ctx.moveTo(person.x + borderRadius, person.y)
        ctx.lineTo(person.x + cardWidth - borderRadius, person.y)
        ctx.arcTo(person.x + cardWidth, person.y, person.x + cardWidth, person.y + borderRadius, borderRadius)
        ctx.lineTo(person.x + cardWidth, person.y + cardHeight - borderRadius)
        ctx.arcTo(person.x + cardWidth, person.y + cardHeight, person.x + cardWidth - borderRadius, person.y + cardHeight, borderRadius)
        ctx.lineTo(person.x + borderRadius, person.y + cardHeight)
        ctx.arcTo(person.x, person.y + cardHeight, person.x, person.y + cardHeight - borderRadius, borderRadius)
        ctx.lineTo(person.x, person.y + borderRadius)
        ctx.arcTo(person.x, person.y, person.x + borderRadius, person.y, borderRadius)
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }
      
      ctx.restore()
      
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = format === 'jpeg' ? 0.95 : undefined
      
      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, mimeType, quality)
      })
      
    } catch (err) {
      console.error('Canvas generation failed:', err)
      return null
    }
  }, [format, mode, selectionRect, persons, connections, groups, includeImportanceScore, includeName, includePosition, includePhoto, includeAdvocate])

  const copyToClipboard = useCallback(async () => {
    setIsExporting(true)
    
    try {
      const blob = await generateCanvasBlob()
      
      if (!blob) {
        setIsExporting(false)
        return
      }

      if (!navigator.clipboard || !navigator.clipboard.write) {
        toast.error('Clipboard API not supported in this browser')
        setIsExporting(false)
        return
      }

      const clipboardItem = new ClipboardItem({ [blob.type]: blob })
      await navigator.clipboard.write([clipboardItem])
      
      toast.success('Canvas copied to clipboard')
      setIsExporting(false)
      onOpenChange(false)
      
    } catch (err) {
      console.error('Copy to clipboard failed:', err)
      toast.error('Failed to copy to clipboard')
      setIsExporting(false)
    }
  }, [generateCanvasBlob, onOpenChange])

  const exportCanvas = useCallback(async () => {
    setIsExporting(true)
    
    try {
      const blob = await generateCanvasBlob()
      
      if (!blob) {
        setIsExporting(false)
        return
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `network-export.${format}`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('Canvas exported successfully')
      setIsExporting(false)
      onOpenChange(false)
      
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Export failed')
      setIsExporting(false)
    }
  }, [generateCanvasBlob, format, onOpenChange])

  useEffect(() => {
    if (!open) {
      setIsSelecting(false)
      setSelectionRect(null)
      setDragStart(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ExportIcon size={18} className="text-primary-foreground" weight="duotone" />
            </div>
            Export Canvas
          </DialogTitle>
          <DialogDescription>
            {selectedPersons.length > 0 
              ? `Export selection (${selectedPersons.length} person${selectedPersons.length > 1 ? 's' : ''}) or choose a different area`
              : 'Choose export format and select the area to export'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="png" id="format-png" />
                <Label htmlFor="format-png" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium">PNG</div>
                  <div className="text-xs text-muted-foreground">Lossless, transparent background</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:border-primary hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="jpeg" id="format-jpeg" />
                <Label htmlFor="format-jpeg" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium">JPEG</div>
                  <div className="text-xs text-muted-foreground">Smaller file size</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as ExportMode)} className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:border-primary hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="all" id="mode-all" />
                <Label htmlFor="mode-all" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium">Entire Canvas</div>
                  <div className="text-xs text-muted-foreground">Export everything</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:border-primary hover:bg-muted transition-colors cursor-pointer">
                <RadioGroupItem value="selection" id="mode-selection" />
                <Label htmlFor="mode-selection" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium">Selected Area</div>
                  <div className="text-xs text-muted-foreground">Export specific region</div>
                </Label>
              </div>
            </RadioGroup>

            {mode === 'selection' && (
              <div className="space-y-2 pt-2">
                {!selectionRect ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartSelection}
                    disabled={isSelecting}
                    className="w-full h-10"
                  >
                    <Selection size={16} className="mr-2" />
                    {isSelecting ? 'Selecting area...' : 'Draw selection on canvas'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm bg-primary/20 rounded-lg p-3">
                      <CheckCircle size={18} weight="fill" className="text-accent flex-shrink-0" />
                      <div>
                        <div className="font-medium">Area selected</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(selectionRect.width)} × {Math.round(selectionRect.height)}
                          {selectedPersons.length > 0 && ` • ${selectedPersons.length} person${selectedPersons.length > 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartSelection}
                        className="flex-1 h-10"
                      >
                        <Selection size={16} className="mr-2" />
                        Change
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                        className="h-10"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="space-y-2 rounded-lg bg-card p-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="include-name" 
                  checked={includeName} 
                  onCheckedChange={(checked) => setIncludeName(checked === true)}
                />
                <Label htmlFor="include-name" className="font-normal cursor-pointer text-sm">
                  Person name
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="include-position" 
                  checked={includePosition} 
                  onCheckedChange={(checked) => setIncludePosition(checked === true)}
                />
                <Label htmlFor="include-position" className="font-normal cursor-pointer text-sm">
                  Position/Title
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="include-importance" 
                  checked={includeImportanceScore} 
                  onCheckedChange={(checked) => setIncludeImportanceScore(checked === true)}
                />
                <Label htmlFor="include-importance" className="font-normal cursor-pointer text-sm">
                  Importance score
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="include-photo" 
                  checked={includePhoto} 
                  onCheckedChange={(checked) => setIncludePhoto(checked === true)}
                />
                <Label htmlFor="include-photo" className="font-normal cursor-pointer text-sm">
                  Photos
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="include-advocate" 
                  checked={includeAdvocate} 
                  onCheckedChange={(checked) => setIncludeAdvocate(checked === true)}
                />
                <Label htmlFor="include-advocate" className="font-normal cursor-pointer text-sm">
                  Advocate indicator
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1 h-11"
                disabled={isExporting || (mode === 'selection' && !selectionRect)}
              >
                <ClipboardText size={18} className="mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={exportCanvas}
                className="flex-1 bg-gradient-to-r from-primary to-accent h-11 shadow-lg"
                disabled={isExporting || (mode === 'selection' && !selectionRect)}
              >
                <Image size={18} className="mr-2" />
                {isExporting ? 'Exporting...' : 'Download'}
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full h-10"
              disabled={isExporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>

      {isSelecting && canvasRef.current && (
        <div
          className="fixed inset-0 z-[100] cursor-crosshair"
          style={{ pointerEvents: 'all' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
          <div
            className="absolute"
            style={{
              left: transform.x,
              top: transform.y,
              transform: `scale(${transform.scale})`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
            }}
          >
            {selectionRect && (
              <div
                className="absolute border-[3px] border-accent bg-accent/15 pointer-events-none shadow-2xl rounded-lg"
                style={{
                  left: selectionRect.x,
                  top: selectionRect.y,
                  width: selectionRect.width,
                  height: selectionRect.height,
                }}
              />
            )}
          </div>
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-4 rounded-xl shadow-2xl font-semibold text-lg">
            Click and drag to select export area
          </div>
        </div>
      )}
    </Dialog>
  )
}
