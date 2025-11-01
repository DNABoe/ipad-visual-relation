import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Person, FrameColor, Attachment, ActivityLogEntry } from '@/lib/types'
import { generateId, getInitials } from '@/lib/helpers'
import { FRAME_COLOR_NAMES, FRAME_COLORS } from '@/lib/constants'
import { Upload, X, Trash, Note, Paperclip, ClockCounterClockwise, DownloadSimple } from '@phosphor-icons/react'
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
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(editPerson?.name || '')
      const lines = editPerson ? [editPerson.position, editPerson.position2, editPerson.position3].filter(Boolean) : []
      setPosition(lines.join('\n'))
      setScore(editPerson?.score || 3)
      setFrameColor(editPerson?.frameColor || 'white')
      setPhoto(editPerson?.photo)
      setAdvocate(editPerson?.advocate || false)
      setNotes(editPerson?.notes || '')
      setAttachments(editPerson?.attachments || [])
    } else {
      setName('')
      setPosition('')
      setScore(3)
      setFrameColor('white')
      setPhoto(undefined)
      setAdvocate(false)
      setNotes('')
      setAttachments([])
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

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`)
          return
        }
        
        const reader = new FileReader()
        reader.onloadend = () => {
          const newAttachment: Attachment = {
            id: generateId(),
            name: file.name,
            type: file.type,
            data: reader.result as string,
            size: file.size,
            addedAt: Date.now()
          }
          setAttachments(prev => [...prev, newAttachment])
        }
        reader.readAsDataURL(file)
      })
    }
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.data
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRemovePhoto = () => {
    setPhoto(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const createActivityLogEntry = (action: ActivityLogEntry['action'], details?: string): ActivityLogEntry => {
    return {
      id: generateId(),
      timestamp: Date.now(),
      action,
      details
    }
  }

  const handleSave = () => {
    if (!name.trim()) return

    const positionLines = position.split('\n').map(line => line.trim()).slice(0, 3)
    
    const activityLog = editPerson?.activityLog || []
    const newActivityLog = [...activityLog]
    
    if (!editPerson) {
      newActivityLog.push(createActivityLogEntry('created', `Person created`))
    } else {
      if (editPerson.name !== name.trim() || 
          editPerson.position !== positionLines[0] || 
          editPerson.position2 !== positionLines[1] || 
          editPerson.position3 !== positionLines[2] ||
          editPerson.score !== score ||
          editPerson.frameColor !== frameColor ||
          editPerson.advocate !== advocate) {
        newActivityLog.push(createActivityLogEntry('modified', `Person details updated`))
      }
      
      if (editPerson.photo !== photo) {
        if (photo && !editPerson.photo) {
          newActivityLog.push(createActivityLogEntry('photo_added', `Photo added`))
        } else if (!photo && editPerson.photo) {
          newActivityLog.push(createActivityLogEntry('photo_removed', `Photo removed`))
        } else if (photo && editPerson.photo) {
          newActivityLog.push(createActivityLogEntry('modified', `Photo updated`))
        }
      }
      
      if (editPerson.notes !== notes) {
        newActivityLog.push(createActivityLogEntry('note_updated', `Notes updated`))
      }
      
      const prevAttachmentIds = new Set((editPerson.attachments || []).map(a => a.id))
      const currentAttachmentIds = new Set(attachments.map(a => a.id))
      
      const addedAttachments = attachments.filter(a => !prevAttachmentIds.has(a.id))
      const removedAttachments = (editPerson.attachments || []).filter(a => !currentAttachmentIds.has(a.id))
      
      addedAttachments.forEach(att => {
        newActivityLog.push(createActivityLogEntry('attachment_added', `Added "${att.name}"`))
      })
      
      removedAttachments.forEach(att => {
        newActivityLog.push(createActivityLogEntry('attachment_removed', `Removed "${att.name}"`))
      })
    }
    
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
      notes,
      attachments,
      activityLog: newActivityLog,
      x: editPerson?.x || 100,
      y: editPerson?.y || 100,
      groupId: editPerson?.groupId,
      createdAt: editPerson?.createdAt || Date.now(),
      modifiedAt: Date.now(),
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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getActionLabel = (action: ActivityLogEntry['action']) => {
    const labels: Record<ActivityLogEntry['action'], string> = {
      created: 'Created',
      modified: 'Modified',
      photo_added: 'Photo Added',
      photo_removed: 'Photo Removed',
      attachment_added: 'Attachment Added',
      attachment_removed: 'Attachment Removed',
      note_updated: 'Notes Updated'
    }
    return labels[action]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editPerson ? 'Edit Person' : 'Add Person'}
          </DialogTitle>
          <DialogDescription>
            {editPerson ? 'Update person details, notes, and attachments' : 'Add a new person to your network'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">
              <Note className="mr-1.5" size={16} />
              Notes
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="mr-1.5" size={16} />
              Attachments {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <ClockCounterClockwise className="mr-1.5" size={16} />
              Activity
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="details" className="space-y-5 mt-0">
              <div className="space-y-2">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="relative cursor-pointer group"
                    onDoubleClick={() => fileInputRef.current?.click()}
                    title="Double-click to upload photo"
                  >
                    <Avatar className="h-28 w-28 ring-4 ring-border transition-all group-hover:ring-accent group-hover:shadow-xl">
                      {photo ? (
                        <AvatarImage src={photo} alt={name || 'Person'} className="object-cover" />
                      ) : (
                        <AvatarFallback 
                          className={cn(
                            "text-3xl font-bold",
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
                    <div className="absolute inset-0 rounded-full bg-card/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <Upload className="text-foreground" size={32} weight="duotone" />
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="h-10"
                  />
                </div>

                <div className="col-span-2 space-y-2">
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
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Up to 3 lines</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-4 gap-3">
                  {FRAME_COLOR_NAMES.map(color => {
                    const labels: Record<string, string> = {
                      red: 'Negative',
                      green: 'Positive',
                      orange: 'Neutral',
                      white: 'Uncategorized'
                    }
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFrameColor(color as FrameColor)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all",
                          frameColor === color 
                            ? 'border-accent ring-2 ring-accent ring-offset-1 ring-offset-background bg-accent/10' 
                            : 'border-border hover:border-accent/50'
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-md"
                          style={{ backgroundColor: FRAME_COLORS[color] }}
                        />
                        <span className="text-xs text-muted-foreground text-center">{labels[color]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Importance</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScore(num)}
                      className={cn(
                        "flex-1 h-12 rounded-lg border-2 font-bold text-lg transition-all",
                        score === num 
                          ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-accent scale-105 shadow-lg' 
                          : 'bg-card border-border hover:border-accent/50'
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">1 = High, 5 = Lower</p>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border bg-card p-3">
                <Checkbox 
                  id="advocate" 
                  checked={advocate}
                  onCheckedChange={(checked) => setAdvocate(checked === true)}
                  className="h-5 w-5"
                />
                <div className="flex-1">
                  <Label htmlFor="advocate" className="text-sm font-medium cursor-pointer">
                    Advocate
                  </Label>
                  <p className="text-xs text-muted-foreground">Actively promotes messages</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-0 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this person..."
                  rows={12}
                  className="resize-none font-sans"
                />
                <p className="text-xs text-muted-foreground">
                  Use this space for detailed notes, observations, or any relevant information
                </p>
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="mt-0 space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Attached Files</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <Paperclip className="mr-2" size={16} />
                    Add File
                  </Button>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                </div>

                {attachments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Paperclip size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attachments yet</p>
                    <p className="text-xs mt-1">Click "Add File" to attach documents, images, or other files</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">Max 10MB per file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <Paperclip size={20} className="text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)} • {formatTimestamp(attachment.addedAt)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="flex-shrink-0"
                        >
                          <DownloadSimple size={16} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="flex-shrink-0 hover:text-destructive"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Activity Log</Label>
                {!editPerson || !editPerson.activityLog || editPerson.activityLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClockCounterClockwise size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                    <p className="text-xs mt-1">Changes to this person will be logged here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...(editPerson.activityLog || [])].reverse().map(entry => (
                      <div
                        key={entry.id}
                        className="flex gap-3 p-3 rounded-lg border border-border bg-card"
                      >
                        <ClockCounterClockwise size={20} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium">{getActionLabel(entry.action)}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          {entry.details && (
                            <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          {editPerson && onDelete && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash className="mr-2" size={16} />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="bg-gradient-to-r from-primary to-accent">
            {editPerson ? 'Update' : 'Add'} Person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
