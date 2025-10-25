import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  const [position, setPosition] = useState(() => {
    if (editPerson) {
      const lines = [editPerson.position, editPerson.position2, editPerson.position3].filter(Boolean)
      return lines.join('\n')
    }
    return ''
  })
  const [score, setScore] = useState(editPerson?.score || 3)
  const [frameColor, setFrameColor] = useState<FrameColor>(editPerson?.frameColor || 'white')
  const [photo, setPhoto] = useState<string | undefined>(editPerson?.photo)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(editPerson?.name || '')
      const lines = editPerson ? [editPerson.position, editPerson.position2, editPerson.position3].filter(Boolean) : []
      setPosition(lines.join('\n'))
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

    const positionLines = position.split('\n').slice(0, 3)
    
    const person: Person = {
      id: editPerson?.id || generateId(),
      name: name.trim(),
      position: positionLines[0]?.trim() || '',
      position2: positionLines[1]?.trim() || undefined,
      position3: positionLines[2]?.trim() || undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPerson ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription>
            {editPerson ? 'Update person details' : 'Add a new person to your network'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
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
                <Label htmlFor="frameColor">Status</Label>
                <div className="grid grid-cols-4 gap-3 justify-items-center px-4">
                  {FRAME_COLOR_NAMES.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFrameColor(color as FrameColor)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        frameColor === color ? 'ring-2 ring-accent ring-offset-2 scale-110 shadow-lg' : 'hover:scale-105 border-border'
                      }`}
                      style={{ 
                        backgroundColor: FRAME_COLORS[color],
                        borderColor: frameColor === color ? FRAME_COLORS[color] : undefined
                      }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground text-center space-y-0.5">
                  <p>Red - Negative, Green - Positive</p>
                  <p>Orange - Neutral, White - Uncategorized</p>
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
            <Textarea
              id="position"
              value={position}
              onChange={(e) => {
                const lines = e.target.value.split('\n')
                if (lines.length <= 3) {
                  setPosition(e.target.value)
                }
              }}
              placeholder="Enter position (max 3 lines)"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">You can enter up to 3 lines</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="importance">Importance</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setScore(num)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all font-semibold ${
                    score === num 
                      ? 'bg-primary text-primary-foreground border-primary ring-2 ring-accent ring-offset-2 scale-110' 
                      : 'bg-card hover:bg-muted border-border hover:scale-105'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">1 - High Importance, 5 - Lower Importance</p>
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
