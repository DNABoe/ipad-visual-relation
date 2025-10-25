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
  const [position2, setPosition2] = useState(editPerson?.position2 || '')
  const [position3, setPosition3] = useState(editPerson?.position3 || '')
  const [score, setScore] = useState(editPerson?.score || 3)
  const [frameColor, setFrameColor] = useState<FrameColor>(editPerson?.frameColor || 'white')
  const [photo, setPhoto] = useState<string | undefined>(editPerson?.photo)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(editPerson?.name || '')
      setPosition(editPerson?.position || '')
      setPosition2(editPerson?.position2 || '')
      setPosition3(editPerson?.position3 || '')
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
      position2: position2.trim() || undefined,
      position3: position3.trim() || undefined,
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
      setPosition2('')
      setPosition3('')
      setScore(3)
      setFrameColor('white')
      setPhoto(undefined)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPerson ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription>
            {editPerson ? 'Update person details' : 'Add a new person to your network'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="flex flex-col items-center gap-3">
              <div 
                className="relative cursor-pointer group"
                onDoubleClick={() => fileInputRef.current?.click()}
                title="Double-click to upload photo"
              >
                <Avatar className="h-32 w-32 ring-2 ring-border transition-all group-hover:ring-accent">
                  {photo ? (
                    <AvatarImage src={photo} alt={name || 'Person'} className="object-cover" />
                  ) : (
                    <AvatarFallback style={{ backgroundColor: FRAME_COLORS[frameColor], color: frameColor === 'white' ? '#000' : '#fff' }}>
                      <span className="text-3xl font-bold">{name ? getInitials(name) : '?'}</span>
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="text-white" size={32} />
                </div>
              </div>
              <div className="flex gap-2">
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
                    Remove
                  </Button>
                )}
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="frameColor">Frame Color</Label>
                <div className="flex gap-2 justify-center">
                  {FRAME_COLOR_NAMES.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFrameColor(color as FrameColor)}
                      className={`w-10 h-10 rounded-full border-4 transition-all ${
                        frameColor === color ? 'ring-2 ring-accent ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: FRAME_COLORS[color] }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>
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
            <Label htmlFor="position2">Position (Line 2)</Label>
            <Input
              id="position2"
              value={position2}
              onChange={(e) => setPosition2(e.target.value)}
              placeholder="Enter position (line 2)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position3">Position (Line 3)</Label>
            <Input
              id="position3"
              value={position3}
              onChange={(e) => setPosition3(e.target.value)}
              placeholder="Enter position (line 3)"
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
