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
import { NODE_WIDTH, NODE_HEIGHT } from '@/lib/constants'

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
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const selectionCanvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && selectedPersons.length > 0) {
      const selectedPersonsData = persons.filter(p => selectedPersons.includes(p.id))
      if (selectedPersonsData.length > 0) {
        const bounds = {
          minX: Math.min(...selectedPersonsData.map(p => p.x)),
          minY: Math.min(...selectedPersonsData.map(p => p.y)),
          maxX: Math.max(...selectedPersonsData.map(p => p.x + NODE_WIDTH)),
          maxY: Math.max(...selectedPersonsData.map(p => p.y + NODE_HEIGHT)),
        }
        setSelectionRect({
          x: bounds.minX - 40,
          y: bounds.minY - 40,
          width: bounds.maxX - bounds.minX + 80,
          height: bounds.maxY - bounds.minY + 80,
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
        
        const allX = [
          ...persons.map(p => p.x),
          ...persons.map(p => p.x + NODE_WIDTH),
          ...groups.map(g => g.x),
          ...groups.map(g => g.x + g.width),
        ]
        const allY = [
          ...persons.map(p => p.y),
          ...persons.map(p => p.y + NODE_HEIGHT),
          ...groups.map(g => g.y),
          ...groups.map(g => g.y + g.height),
        ]
        
        bounds = {
          minX: Math.min(...allX) - 40,
          minY: Math.min(...allY) - 40,
          maxX: Math.max(...allX) + 40,
          maxY: Math.max(...allY) + 40,
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
        ctx.fillStyle = 'oklch(0.96 0.01 250)'
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
          blue: 'oklch(0.55 0.15 250)',
          purple: 'oklch(0.55 0.15 290)',
          pink: 'oklch(0.70 0.15 340)',
          yellow: 'oklch(0.75 0.15 90)',
          teal: 'oklch(0.60 0.12 200)',
          indigo: 'oklch(0.50 0.15 270)',
          rose: 'oklch(0.65 0.15 10)',
          emerald: 'oklch(0.60 0.15 160)',
          amber: 'oklch(0.70 0.15 70)',
          cyan: 'oklch(0.65 0.15 210)',
        }
        
        const color = colorMap[group.color] || colorMap.blue
        
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.setLineDash([8, 6])
        
        if (group.solidBackground) {
          ctx.fillStyle = color.replace(')', ' / 0.08)')
          ctx.fillRect(group.x, group.y, group.width, group.height)
        }
        
        ctx.strokeRect(group.x, group.y, group.width, group.height)
        ctx.restore()
        
        ctx.save()
        ctx.fillStyle = 'oklch(0.20 0.02 250)'
        ctx.font = '600 14px Inter, sans-serif'
        ctx.fillText(group.name, group.x + 12, group.y + 24)
        ctx.restore()
      }
      
      const personsInBounds = persons.filter(p => {
        const pRight = p.x + NODE_WIDTH
        const pBottom = p.y + NODE_HEIGHT
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
        
        const fromX = fromPerson.x + NODE_WIDTH / 2
        const fromY = fromPerson.y + NODE_HEIGHT / 2
        const toX = toPerson.x + NODE_WIDTH / 2
        const toY = toPerson.y + NODE_HEIGHT / 2
        
        ctx.save()
        ctx.strokeStyle = 'oklch(0.35 0.02 250)'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(fromX, fromY)
        ctx.lineTo(toX, toY)
        ctx.stroke()
        ctx.restore()
      }
      
      for (const person of personsInBounds) {
        const frameColorMap: Record<string, string> = {
          red: 'oklch(0.60 0.20 25)',
          green: 'oklch(0.65 0.18 145)',
          orange: 'oklch(0.70 0.16 60)',
          white: 'oklch(0.95 0.01 250)',
        }
        
        const frameColor = frameColorMap[person.frameColor] || frameColorMap.white
        
        ctx.save()
        ctx.fillStyle = 'oklch(1 0 0)'
        ctx.strokeStyle = frameColor
        ctx.lineWidth = 4
        
        const radius = 8
        ctx.beginPath()
        ctx.moveTo(person.x + radius, person.y)
        ctx.lineTo(person.x + NODE_WIDTH - radius, person.y)
        ctx.arcTo(person.x + NODE_WIDTH, person.y, person.x + NODE_WIDTH, person.y + radius, radius)
        ctx.lineTo(person.x + NODE_WIDTH, person.y + NODE_HEIGHT - radius)
        ctx.arcTo(person.x + NODE_WIDTH, person.y + NODE_HEIGHT, person.x + NODE_WIDTH - radius, person.y + NODE_HEIGHT, radius)
        ctx.lineTo(person.x + radius, person.y + NODE_HEIGHT)
        ctx.arcTo(person.x, person.y + NODE_HEIGHT, person.x, person.y + NODE_HEIGHT - radius, radius)
        ctx.lineTo(person.x, person.y + radius)
        ctx.arcTo(person.x, person.y, person.x + radius, person.y, radius)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.restore()
        
        const avatarSize = 80
        const avatarX = person.x + 4
        const avatarY = person.y + 4
        const avatarRadius = avatarSize / 2
        
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
            ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2)
            ctx.closePath()
            ctx.clip()
            
            ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
            ctx.restore()
          } catch (err) {
            console.error('Failed to load photo:', err)
            
            if (includeName) {
              ctx.save()
              ctx.fillStyle = frameColor
              ctx.beginPath()
              ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2)
              ctx.fill()
              
              ctx.fillStyle = person.frameColor === 'white' ? '#000' : '#fff'
              ctx.font = 'bold 28px Inter, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              ctx.fillText(initials, avatarX + avatarRadius, avatarY + avatarRadius)
              ctx.restore()
            }
          }
        } else if (includeName) {
          ctx.save()
          ctx.fillStyle = frameColor
          ctx.beginPath()
          ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.fillStyle = person.frameColor === 'white' ? '#000' : '#fff'
          ctx.font = 'bold 28px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
          ctx.fillText(initials, avatarX + avatarRadius, avatarY + avatarRadius)
          ctx.restore()
        }
        
        if (includeImportanceScore) {
          const badgeWidth = 30
          const badgeHeight = 18
          const badgeX = avatarX + (avatarSize - badgeWidth) / 2
          const badgeY = avatarY + avatarSize + 4
          
          ctx.save()
          ctx.fillStyle = 'oklch(0.97 0 0)'
          ctx.strokeStyle = 'oklch(0.88 0.01 250)'
          ctx.lineWidth = 1
          const badgeRadius = 4
          ctx.beginPath()
          ctx.moveTo(badgeX + badgeRadius, badgeY)
          ctx.lineTo(badgeX + badgeWidth - badgeRadius, badgeY)
          ctx.arcTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + badgeRadius, badgeRadius)
          ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - badgeRadius)
          ctx.arcTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - badgeRadius, badgeY + badgeHeight, badgeRadius)
          ctx.lineTo(badgeX + badgeRadius, badgeY + badgeHeight)
          ctx.arcTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - badgeRadius, badgeRadius)
          ctx.lineTo(badgeX, badgeY + badgeRadius)
          ctx.arcTo(badgeX, badgeY, badgeX + badgeRadius, badgeY, badgeRadius)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          
          ctx.fillStyle = 'oklch(0.20 0.02 250)'
          ctx.font = 'bold 11px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(person.score.toString(), badgeX + badgeWidth / 2, badgeY + badgeHeight / 2)
          ctx.restore()
        }
        
        if (includeName || includePosition) {
          const textX = person.x + avatarSize + 12
          const textStartY = person.y + 16
          
          ctx.save()
          let currentY = textStartY
          
          if (includeName) {
            ctx.fillStyle = 'oklch(0.20 0.02 250)'
            ctx.font = '600 14px Inter, sans-serif'
            ctx.textBaseline = 'top'
            ctx.fillText(person.name, textX, currentY)
            currentY += 18
          }
          
          if (includePosition) {
            if (person.position) {
              ctx.fillStyle = 'oklch(0.50 0.02 250)'
              ctx.font = '400 12px Inter, sans-serif'
              ctx.fillText(person.position, textX, currentY)
              currentY += 16
            }
            
            if (person.position2) {
              ctx.fillStyle = 'oklch(0.50 0.02 250)'
              ctx.font = '400 12px Inter, sans-serif'
              ctx.fillText(person.position2, textX, currentY)
              currentY += 16
            }
            
            if (person.position3) {
              ctx.fillStyle = 'oklch(0.50 0.02 250)'
              ctx.font = '400 12px Inter, sans-serif'
              ctx.fillText(person.position3, textX, currentY)
            }
          }
          
          ctx.restore()
        }
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
  }, [format, mode, selectionRect, persons, connections, groups, includeImportanceScore, includeName, includePosition, includePhoto])

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
      <DialogContent className="max-w-md !bg-card border-border !opacity-100" style={{ opacity: 1, backgroundColor: 'oklch(0.22 0.025 250)' }}>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ExportIcon size={18} className="text-white" weight="duotone" />
            </div>
            Export Canvas
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedPersons.length > 0 
              ? `Export selection (${selectedPersons.length} person${selectedPersons.length > 1 ? 's' : ''}) or choose a different area`
              : 'Choose export format and select the area to export'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/60 hover:bg-primary/8 transition-colors cursor-pointer">
                <RadioGroupItem value="png" id="format-png" />
                <Label htmlFor="format-png" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-foreground">PNG</div>
                  <div className="text-xs text-muted-foreground">Lossless, transparent background</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/60 hover:bg-primary/8 transition-colors cursor-pointer">
                <RadioGroupItem value="jpeg" id="format-jpeg" />
                <Label htmlFor="format-jpeg" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-foreground">JPEG</div>
                  <div className="text-xs text-muted-foreground">Smaller file size</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as ExportMode)} className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/60 hover:bg-primary/8 transition-colors cursor-pointer">
                <RadioGroupItem value="all" id="mode-all" />
                <Label htmlFor="mode-all" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-foreground">Entire Canvas</div>
                  <div className="text-xs text-muted-foreground">Export everything</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/60 hover:bg-primary/8 transition-colors cursor-pointer">
                <RadioGroupItem value="selection" id="mode-selection" />
                <Label htmlFor="mode-selection" className="font-normal cursor-pointer flex-1">
                  <div className="font-medium text-foreground">Selected Area</div>
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
                    className="w-full border-2 h-10"
                  >
                    <Selection size={16} className="mr-2" />
                    {isSelecting ? 'Selecting area...' : 'Draw selection on canvas'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground bg-accent/15 border border-accent/30 rounded-lg p-3">
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
                        className="flex-1 border-2 h-10"
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
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="include-name" 
                  checked={includeName} 
                  onCheckedChange={(checked) => setIncludeName(checked === true)}
                  className="border-border/70"
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
                  className="border-border/70"
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
                  className="border-border/70"
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
                  className="border-border/70"
                />
                <Label htmlFor="include-photo" className="font-normal cursor-pointer text-sm">
                  Photos
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1 border-2 h-11"
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
