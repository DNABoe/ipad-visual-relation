import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Person, FrameColor } from '@/lib/types'
import { generateId } from '@/lib/helpers'
import { FRAME_COLOR_NAMES } from '@/lib/constants'

interface PersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (person: Person) => void
  editPerson?: Person
}

export function PersonDialog({ open, onOpenChange, onSave, editPerson }: PersonDialogProps) {
  const [name, setName] = useState(editPerson?.name || '')
  const [position, setPosition] = useState(editPerson?.position || '')
  const [score, setScore] = useState(editPerson?.score || 3)
  const [frameColor, setFrameColor] = useState<FrameColor>(editPerson?.frameColor || 'white')

  const handleSave = () => {
    if (!name.trim()) return

    const person: Person = {
      id: editPerson?.id || generateId(),
      name: name.trim(),
      position: position.trim(),
      score,
      frameColor,
      x: editPerson?.x || 100,
      y: editPerson?.y || 100,
      groupId: editPerson?.groupId,
      createdAt: editPerson?.createdAt || Date.now(),
    }

    onSave(person)
    onOpenChange(false)
    
    if (!editPerson) {
      setName('')
      setPosition('')
      setScore(3)
      setFrameColor('white')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editPerson ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription>
            {editPerson ? 'Update person details' : 'Add a new person to your network'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Enter position"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="score">Score (1-5)</Label>
            <Input
              id="score"
              type="number"
              min="1"
              max="5"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frameColor">Frame Color</Label>
            <Select value={frameColor} onValueChange={(v) => setFrameColor(v as FrameColor)}>
              <SelectTrigger id="frameColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAME_COLOR_NAMES.map(color => (
                  <SelectItem key={color} value={color}>
                    <span className="capitalize">{color}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editPerson ? 'Update' : 'Add'} Person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
