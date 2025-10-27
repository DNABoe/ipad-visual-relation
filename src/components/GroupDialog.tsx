import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Group, GroupColor } from '@/lib/types'
import { generateId } from '@/lib/helpers'
import { GROUP_COLOR_NAMES } from '@/lib/constants'

interface GroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (group: Group) => void
  onRemove?: (groupId: string) => void
  editGroup?: Group
}

export function GroupDialog({ open, onOpenChange, onSave, onRemove, editGroup }: GroupDialogProps) {
  const [name, setName] = useState(editGroup?.name || '')
  const [color, setColor] = useState<GroupColor>(editGroup?.color || 'blue')

  const handleSave = () => {
    if (!name.trim()) return

    const group: Group = {
      id: editGroup?.id || generateId(),
      name: name.trim(),
      color,
      x: editGroup?.x || 50,
      y: editGroup?.y || 50,
      width: editGroup?.width || 400,
      height: editGroup?.height || 300,
      createdAt: editGroup?.createdAt || Date.now(),
    }

    onSave(group)
    onOpenChange(false)
    
    if (!editGroup) {
      setName('')
      setColor('blue')
    }
  }

  const handleRemove = () => {
    if (editGroup && onRemove) {
      onRemove(editGroup.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editGroup ? 'Edit Group' : 'Add Group'}</DialogTitle>
          <DialogDescription>
            {editGroup ? 'Update group details' : 'Create a visual container for organizing people'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Name *</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupColor">Color</Label>
            <Select value={color} onValueChange={(v) => setColor(v as GroupColor)}>
              <SelectTrigger id="groupColor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_COLOR_NAMES.map(c => (
                  <SelectItem key={c} value={c}>
                    <span className="capitalize">{c}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {editGroup && onRemove && (
            <Button variant="destructive" onClick={handleRemove} className="mr-auto shadow-lg">
              Remove Group
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {editGroup ? 'Update' : 'Create'} Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
