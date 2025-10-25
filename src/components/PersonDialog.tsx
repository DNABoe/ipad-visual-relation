import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Person, FrameColor } from '@/lib/types'
import { generateId, getInitials } from '@/lib/helpers'
import { FRAME_COLOR_NAMES, FRAME_COLORS } from '@/lib/constants'
import { Upload, X } from '@phosphor-icons/react'

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
  const [photo, setPhoto] = useState<string | undefined>(editPerson?.photo)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(editPerson?.name || '')
      setPosition(editPerson?.position || '')
      setScore(editPerson?.score || 3)
      setFrameColor(editPerson?.frameColor || 'white')
      setPhoto(editPerson?.photo)
    }
  }, [open, editPerson])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhoto(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    if (!name.trim()) return

    const person: Person = {
      id: editPerson?.id || generateId(),
      name: name.trim(),
      position: position.trim(),
      score,
      frameColor,
      photo,
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
      setPhoto(undefined)
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
            <Label>Photo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {photo ? (
                  <AvatarImage src={photo} alt={name || 'Person'} />
                ) : (
                  <AvatarFallback style={{ backgroundColor: FRAME_COLORS[frameColor], color: frameColor === 'white' ? '#000' : '#fff' }}>
                    {name ? getInitials(name) : '?'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2" />
                  Upload Photo
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                  >
                    <X className="mr-2" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
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
