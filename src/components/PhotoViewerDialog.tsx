import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ArrowsOutSimple, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface PhotoViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  photoUrl: string
  personName: string
}

export function PhotoViewerDialog({ open, onOpenChange, photoUrl, personName }: PhotoViewerDialogProps) {
  const [size, setSize] = useState({ width: 500, height: 500 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setSize({ width: 500, height: 500 })
      setPosition({ x: 0, y: 0 })
    }
  }, [open])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        const delta = Math.max(deltaX, deltaY)
        
        setSize({
          width: Math.max(200, resizeStart.width + delta),
          height: Math.max(200, resizeStart.height + delta),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, resizeStart])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={contentRef}
        className="p-0 overflow-hidden border border-border select-none bg-card shadow-2xl"
        style={{
          width: size.width,
          height: size.height,
          maxWidth: 'none',
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm shadow-lg"
            onClick={() => onOpenChange(false)}
          >
            <X size={16} />
          </Button>
        </div>

        <div className="w-full h-full flex items-center justify-center bg-background">
          <img
            src={photoUrl}
            alt={personName}
            className="max-w-full max-h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>

        <div
          className="resize-handle absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="absolute bottom-1 right-1 text-muted-foreground hover:text-accent">
            <ArrowsOutSimple size={20} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
