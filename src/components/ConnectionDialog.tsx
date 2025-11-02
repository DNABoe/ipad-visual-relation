import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Connection, ConnectionStyle, ConnectionWeight, ConnectionDirection } from '@/lib/types'
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowsLeftRight,
  Minus,
  CheckCircle
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: Connection | null
  onSave: (connectionId: string, updates: Partial<Connection>) => void
  fromPersonName: string
  toPersonName: string
}

export function ConnectionDialog({
  open,
  onOpenChange,
  connection,
  onSave,
  fromPersonName,
  toPersonName,
}: ConnectionDialogProps) {
  const [style, setStyle] = useState<ConnectionStyle>('solid')
  const [weight, setWeight] = useState<ConnectionWeight>('medium')
  const [direction, setDirection] = useState<ConnectionDirection>('none')

  useEffect(() => {
    if (connection) {
      setStyle(connection.style || 'solid')
      setWeight(connection.weight || 'medium')
      setDirection(connection.direction || 'none')
    }
  }, [connection])

  const handleSave = () => {
    if (!connection) return
    
    onSave(connection.id, {
      style,
      weight,
      direction,
    })
    
    onOpenChange(false)
  }

  if (!connection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Connection Settings</DialogTitle>
          <DialogDescription>
            Configure the visual appearance and direction of this connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50">
            <div className="text-sm">
              <span className="font-medium text-foreground">{fromPersonName}</span>
              <span className="text-muted-foreground mx-2">↔</span>
              <span className="font-medium text-foreground">{toPersonName}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Line Style</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStyle('solid')}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-accent/50",
                    style === 'solid' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  {style === 'solid' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="absolute top-2 right-2 text-accent" 
                    />
                  )}
                  <div className="h-0.5 w-full bg-foreground rounded-full" />
                  <span className="text-sm font-medium">Solid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStyle('dashed')}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-accent/50",
                    style === 'dashed' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  {style === 'dashed' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="absolute top-2 right-2 text-accent" 
                    />
                  )}
                  <div className="w-full flex items-center justify-center gap-1.5">
                    <div className="h-0.5 w-4 bg-foreground rounded-full" />
                    <div className="h-0.5 w-4 bg-foreground rounded-full" />
                    <div className="h-0.5 w-4 bg-foreground rounded-full" />
                    <div className="h-0.5 w-4 bg-foreground rounded-full" />
                  </div>
                  <span className="text-sm font-medium">Dashed</span>
                </button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold mb-3 block">Line Weight</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setWeight('thin')}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-accent/50",
                    weight === 'thin' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  {weight === 'thin' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="absolute top-2 right-2 text-accent" 
                    />
                  )}
                  <div className="h-0.5 w-full bg-foreground rounded-full" />
                  <span className="text-sm font-medium">Thin</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWeight('medium')}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-accent/50",
                    weight === 'medium' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  {weight === 'medium' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="absolute top-2 right-2 text-accent" 
                    />
                  )}
                  <div className="h-1 w-full bg-foreground rounded-full" />
                  <span className="text-sm font-medium">Medium</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWeight('thick')}
                  className={cn(
                    "relative flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:border-accent/50",
                    weight === 'thick' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  {weight === 'thick' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="absolute top-2 right-2 text-accent" 
                    />
                  )}
                  <div className="h-1.5 w-full bg-foreground rounded-full" />
                  <span className="text-sm font-medium">Thick</span>
                </button>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-semibold mb-3 block">Direction (Influence)</Label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setDirection('none')}
                  className={cn(
                    "relative w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-accent/50",
                    direction === 'none' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  <Minus size={20} className="text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 text-left">No Direction</span>
                  {direction === 'none' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="text-accent" 
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('forward')}
                  className={cn(
                    "relative w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-accent/50",
                    direction === 'forward' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  <ArrowRight size={20} className="text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 text-left">
                    {fromPersonName} → {toPersonName}
                  </span>
                  {direction === 'forward' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="text-accent" 
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('backward')}
                  className={cn(
                    "relative w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-accent/50",
                    direction === 'backward' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  <ArrowLeft size={20} className="text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 text-left">
                    {toPersonName} → {fromPersonName}
                  </span>
                  {direction === 'backward' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="text-accent" 
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('bidirectional')}
                  className={cn(
                    "relative w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-accent/50",
                    direction === 'bidirectional' 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  )}
                >
                  <ArrowsLeftRight size={20} className="text-muted-foreground" />
                  <span className="text-sm font-medium flex-1 text-left">Bidirectional Influence</span>
                  {direction === 'bidirectional' && (
                    <CheckCircle 
                      size={18} 
                      weight="fill" 
                      className="text-accent" 
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
