import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Connection, ConnectionStyle, ConnectionWeight, ConnectionDirection } from '@/lib/types'
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowsLeftRight,
  Minus
} from '@phosphor-icons/react'

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connection Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Connection Between</Label>
            <div className="text-sm text-muted-foreground">
              {fromPersonName} ↔ {toPersonName}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Line Style</Label>
            <RadioGroup value={style} onValueChange={(v) => setStyle(v as ConnectionStyle)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solid" id="style-solid" />
                <Label htmlFor="style-solid" className="flex items-center gap-3 cursor-pointer">
                  <span>Solid</span>
                  <div className="h-0.5 w-20 bg-foreground" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dashed" id="style-dashed" />
                <Label htmlFor="style-dashed" className="flex items-center gap-3 cursor-pointer">
                  <span>Dashed</span>
                  <div className="h-0.5 w-20 border-t-2 border-dashed border-foreground" />
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Line Weight</Label>
            <RadioGroup value={weight} onValueChange={(v) => setWeight(v as ConnectionWeight)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thin" id="weight-thin" />
                <Label htmlFor="weight-thin" className="flex items-center gap-3 cursor-pointer">
                  <span>Thin</span>
                  <div className="h-0.5 w-20 bg-foreground" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="weight-medium" />
                <Label htmlFor="weight-medium" className="flex items-center gap-3 cursor-pointer">
                  <span>Medium</span>
                  <div className="h-1 w-20 bg-foreground" />
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thick" id="weight-thick" />
                <Label htmlFor="thick" className="flex items-center gap-3 cursor-pointer">
                  <span>Thick</span>
                  <div className="h-1.5 w-20 bg-foreground" />
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Direction (Influence)</Label>
            <RadioGroup value={direction} onValueChange={(v) => setDirection(v as ConnectionDirection)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="dir-none" />
                <Label htmlFor="dir-none" className="flex items-center gap-3 cursor-pointer">
                  <Minus size={20} />
                  <span>None</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="forward" id="dir-forward" />
                <Label htmlFor="dir-forward" className="flex items-center gap-3 cursor-pointer">
                  <ArrowRight size={20} />
                  <span>{fromPersonName} → {toPersonName}</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="backward" id="dir-backward" />
                <Label htmlFor="dir-backward" className="flex items-center gap-3 cursor-pointer">
                  <ArrowLeft size={20} />
                  <span>{toPersonName} → {fromPersonName}</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bidirectional" id="dir-bi" />
                <Label htmlFor="dir-bi" className="flex items-center gap-3 cursor-pointer">
                  <ArrowsLeftRight size={20} />
                  <span>Bidirectional</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
