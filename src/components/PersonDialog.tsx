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
import { Upload, X, Trash } from '@phosphor-icons/react'

interface PersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (person: Person) => void
  onDelete?: (personId: string) => void
  editPerson?: Person
}

export function PersonDialog({ open, onOpenChange, onSave, onDelete, editPerson }: PersonDialogProps) {
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

  const handleDelete = () => {
    if (editPerson && onDelete) {
      onDelete(editPerson.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">{editPerson ? 'Edit Person' : 'Add Person'}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editPerson ? 'Update person details' : 'Add a new person to your network'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative cursor-pointer group"
                onDoubleClick={() => fileInputRef.current?.click()}
                title="Double-click to upload photo"
              >
                <Avatar className="h-32 w-32 ring-4 ring-border transition-all group-hover:ring-accent group-hover:shadow-xl">
                  {photo ? (
                    <AvatarImage src={photo} alt={name || 'Person'} className="object-cover" />
                  ) : (
                    <AvatarFallback style={{ backgroundColor: FRAME_COLORS[frameColor], color: frameColor === 'white' ? '#000' : '#fff' }}>
                      <span className="text-4xl font-bold">{name ? getInitials(name) : '?'}</span>
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <Upload className="text-white" size={36} weight="duotone" />
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
                  className="border-2 h-9"
                >
                  <Upload className="mr-2" size={16} />
                  Upload Photo
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
                    className="border-2 h-9"
                  >
                    <X className="mr-2" size={16} />
                    Remove
                  </Button>
                )}
              </div>
              <div className="w-full space-y-3">
                <Label htmlFor="frameColor" className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-4 gap-4 justify-items-center">
                  {FRAME_COLOR_NAMES.map(color => {
                    const labels: Record<string, string> = {
                      red: 'Negative',
                      green: 'Positive',
                      orange: 'Neutral',
                      white: 'Uncategorized'
                    }
                    return (
                      <div key={color} className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFrameColor(color as FrameColor)}
                          className={`w-14 h-14 rounded-xl border-2 transition-all shadow-md ${
                            frameColor === color ? 'ring-2 ring-accent ring-offset-2 ring-offset-background scale-110 shadow-xl' : 'hover:scale-105 border-border/50 hover:border-border'
                          }`}
                          style={{ 
                            backgroundColor: FRAME_COLORS[color],
                            borderColor: frameColor === color ? FRAME_COLORS[color] : undefined
                          }}
                          title={labels[color]}
                        />
                        <span className="text-[11px] text-muted-foreground text-center font-medium">{labels[color]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="border-border/70 h-11 focus-visible:ring-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">Position</Label>
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
              className="resize-none border-border/70 focus-visible:ring-2"
            />
            <p className="text-xs text-muted-foreground/70 pl-1">You can enter up to 3 lines</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="importance" className="text-sm font-medium">Importance</Label>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setScore(num)}
                  className={`w-14 h-14 rounded-xl border-2 transition-all font-bold text-lg shadow-md ${
                    score === num 
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-primary ring-2 ring-accent ring-offset-2 ring-offset-background scale-110 shadow-xl' 
                      : 'bg-card hover:bg-muted border-border/50 hover:scale-105 hover:border-border'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/70 text-center">1 - High Importance, 5 - Lower Importance</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {editPerson && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto h-11 shadow-md">
              <Trash className="mr-2" size={16} />
              Delete Person
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-2 h-11">Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="bg-gradient-to-r from-primary to-accent h-11 shadow-lg">
            {editPerson ? 'Update' : 'Add'} Person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
