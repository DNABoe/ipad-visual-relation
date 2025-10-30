import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import type { Person, FrameColor } from '@/lib/types'
import { generateId, getInitials } from '@/lib/helpers'
import { FRAME_COLOR_NAMES, FRAME_COLORS } from '@/lib/constants'
import { Upload, X, Trash } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface PersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (person: Person) => void
  onDelete?: (personId: string) => void
  editPerson?: Person
}

export function PersonDialog({ open, onOpenChange, onSave, onDelete, editPerson }: PersonDialogProps) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [score, setScore] = useState(3)
  const [frameColor, setFrameColor] = useState<FrameColor>('white')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [advocate, setAdvocate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(editPerson?.name || '')
      const lines = editPerson ? [editPerson.position, editPerson.position2, editPerson.position3].filter(Boolean) : []
      setPosition(lines.join('\n'))
      setScore(editPerson?.score || 3)
      setFrameColor(editPerson?.frameColor || 'white')
      setPhoto(editPerson?.photo)
      setAdvocate(editPerson?.advocate || false)
    } else {
      setName('')
      setPosition('')
      setScore(3)
      setFrameColor('white')
      setPhoto(undefined)
      setAdvocate(false)
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

    const positionLines = position.split('\n').map(line => line.trim()).slice(0, 3)
    
    const person: Person = {
      id: editPerson?.id || generateId(),
      name: name.trim(),
      position: positionLines[0] || '',
      position2: positionLines[1] || undefined,
      position3: positionLines[2] || undefined,
      score,
      frameColor,
      photo,
      advocate,
      x: editPerson?.x || 100,
      y: editPerson?.y || 100,
      groupId: editPerson?.groupId,
      createdAt: editPerson?.createdAt || Date.now(),
    }

    onSave(person)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (editPerson && onDelete) {
      onDelete(editPerson.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editPerson ? 'Edit Person' : 'Add Person'}
          </DialogTitle>
          <DialogDescription>
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
                    <AvatarFallback 
                      className={cn(
                        "text-4xl font-bold",
                        frameColor === 'white' ? 'text-card' : 'text-card-foreground'
                      )}
                      style={{ 
                        backgroundColor: FRAME_COLORS[frameColor], 
                      }}
                    >
                      {name ? getInitials(name) : '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-card opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <Upload className="text-foreground" size={36} weight="duotone" />
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
                  <Upload className="mr-2" size={16} />
                  Upload Photo
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePhoto}
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
                          className={`w-14 h-14 rounded-xl border-2 transition-all shadow-lg ${
                            frameColor === color ? 'ring-2 ring-accent ring-offset-2 ring-offset-background scale-110 shadow-xl border-accent' : 'hover:scale-105 border-border hover:border-border'
                          }`}
                          style={{ 
                            backgroundColor: FRAME_COLORS[color],
                            borderColor: frameColor === color ? undefined : FRAME_COLORS[color]
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
              className="h-11 focus-visible:ring-2"
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
              className="resize-none focus-visible:ring-2"
            />
            <p className="text-xs text-muted-foreground pl-1">You can enter up to 3 lines</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="importance" className="text-sm font-medium">Importance</Label>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setScore(num)}
                  className={`w-14 h-14 rounded-xl border-2 transition-all font-bold text-lg shadow-lg ${
                    score === num 
                      ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-accent ring-2 ring-accent ring-offset-2 ring-offset-background scale-110 shadow-xl' 
                      : 'bg-card hover:bg-muted border-border/60 hover:scale-105 hover:border-accent/40 text-foreground'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">1 - High Importance, 5 - Lower Importance</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
              <Checkbox 
                id="advocate" 
                checked={advocate}
                onCheckedChange={(checked) => setAdvocate(checked === true)}
                className="h-5 w-5"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="advocate" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Advocate
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This person actively promotes the messages
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {editPerson && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto shadow-lg">
              <Trash className="mr-2" size={16} />
              Delete Person
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="bg-gradient-to-r from-primary to-accent shadow-lg">
            {editPerson ? 'Update' : 'Add'} Person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
