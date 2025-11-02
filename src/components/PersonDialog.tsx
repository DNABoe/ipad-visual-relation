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
import { Slider } from '@/components/ui/slider'
import type { Person, FrameColor, Attachment, ActivityLogEntry } from '@/lib/types'
import { generateId, getInitials } from '@/lib/helpers'
import { FRAME_COLOR_NAMES, FRAME_COLORS } from '@/lib/constants'
import { Upload, X, Trash, Note, Paperclip, ClockCounterClockwise, DownloadSimple, ArrowsOutCardinal, MagnifyingGlassMinus, MagnifyingGlassPlus, Detective } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { resampleImage } from '@/lib/imageProcessing'
import { toast } from 'sonner'
import { generateInvestigationPDF } from '@/lib/pdfGenerator'

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
  const [photoOffsetX, setPhotoOffsetX] = useState(0)
  const [photoOffsetY, setPhotoOffsetY] = useState(0)
  const [photoZoom, setPhotoZoom] = useState(100)
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [advocate, setAdvocate] = useState(false)
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [country, setCountry] = useState('')
  const [isInvestigating, setIsInvestigating] = useState(false)
  const [investigationReport, setInvestigationReport] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const photoPreviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setName(editPerson?.name || '')
      const lines = editPerson ? [editPerson.position, editPerson.position2, editPerson.position3].filter(Boolean) : []
      setPosition(lines.join('\n'))
      setScore(editPerson?.score || 3)
      setFrameColor(editPerson?.frameColor || 'white')
      setPhoto(editPerson?.photo)
      setPhotoOffsetX(editPerson?.photoOffsetX || 0)
      setPhotoOffsetY(editPerson?.photoOffsetY || 0)
      setPhotoZoom(editPerson?.photoZoom || 100)
      setAdvocate(editPerson?.advocate || false)
      setNotes(editPerson?.notes || '')
      setAttachments(editPerson?.attachments || [])
    } else {
      setName('')
      setPosition('')
      setScore(3)
      setFrameColor('white')
      setPhoto(undefined)
      setPhotoOffsetX(0)
      setPhotoOffsetY(0)
      setPhotoZoom(100)
      setAdvocate(false)
      setNotes('')
      setAttachments([])
    }
  }, [open, editPerson])

  useEffect(() => {
    if (!editPerson || !open) return
    
    const initialNotes = editPerson.notes || ''
    if (notes === initialNotes) return

    const timeoutId = setTimeout(() => {
      autoSaveNotes()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [notes, editPerson, open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file is too large. Maximum size is 10MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        const originalDataUrl = reader.result as string
        
        try {
          toast.info('Processing image...')
          const { resampled } = await resampleImage(originalDataUrl, {
            maxWidth: 600,
            maxHeight: 600,
            quality: 0.85,
            format: 'image/jpeg'
          })
          
          setPhoto(resampled)
          toast.success('Image loaded and optimized')
        } catch (error) {
          console.error('Error resampling image:', error)
          setPhoto(originalDataUrl)
          toast.warning('Image loaded but could not be optimized')
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
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
          setAttachments(prev => {
            const updated = [...prev, newAttachment]
            if (editPerson) {
              autoSaveAttachments(updated)
            }
            return updated
          })
          toast.success(`Added ${file.name}`)
        }
        reader.readAsDataURL(file)
      })
    }
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => {
      const updated = prev.filter(a => a.id !== attachmentId)
      if (editPerson) {
        const removedAttachment = prev.find(a => a.id === attachmentId)
        if (removedAttachment) {
          toast.success(`Removed ${removedAttachment.name}`)
        }
        autoSaveAttachments(updated)
      }
      return updated
    })
  }

  const autoSaveAttachments = (updatedAttachments: Attachment[]) => {
    if (!editPerson) return

    const positionLines = position.split('\n').map(line => line.trim()).slice(0, 3)
    
    const activityLog = editPerson.activityLog || []
    const newActivityLog = [...activityLog]
    
    const prevAttachmentIds = new Set((editPerson.attachments || []).map(a => a.id))
    const currentAttachmentIds = new Set(updatedAttachments.map(a => a.id))
    
    const addedAttachments = updatedAttachments.filter(a => !prevAttachmentIds.has(a.id))
    const removedAttachments = (editPerson.attachments || []).filter(a => !currentAttachmentIds.has(a.id))
    
    addedAttachments.forEach(att => {
      newActivityLog.push(createActivityLogEntry('attachment_added', `Added "${att.name}"`))
    })
    
    removedAttachments.forEach(att => {
      newActivityLog.push(createActivityLogEntry('attachment_removed', `Removed "${att.name}"`))
    })

    const updatedPerson: Person = {
      ...editPerson,
      name: name.trim() || editPerson.name,
      position: positionLines[0] || editPerson.position,
      position2: positionLines[1] || editPerson.position2,
      position3: positionLines[2] || editPerson.position3,
      score,
      frameColor,
      photo,
      photoOffsetX,
      photoOffsetY,
      photoZoom,
      advocate,
      notes,
      attachments: updatedAttachments,
      activityLog: newActivityLog,
      modifiedAt: Date.now(),
    }

    onSave(updatedPerson)
  }

  const autoSaveNotes = () => {
    if (!editPerson) return

    const positionLines = position.split('\n').map(line => line.trim()).slice(0, 3)
    
    const activityLog = editPerson.activityLog || []
    const newActivityLog = [...activityLog]
    
    if (editPerson.notes !== notes) {
      newActivityLog.push(createActivityLogEntry('note_updated', `Notes updated`))
    }

    const updatedPerson: Person = {
      ...editPerson,
      name: name.trim() || editPerson.name,
      position: positionLines[0] || editPerson.position,
      position2: positionLines[1] || editPerson.position2,
      position3: positionLines[2] || editPerson.position3,
      score,
      frameColor,
      photo,
      photoOffsetX,
      photoOffsetY,
      photoZoom,
      advocate,
      notes,
      attachments,
      activityLog: newActivityLog,
      modifiedAt: Date.now(),
    }

    onSave(updatedPerson)
  }

  const handleDownloadAttachment = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.data
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewAttachment = (attachment: Attachment) => {
    if (attachment.type === 'application/pdf') {
      window.open(attachment.data, '_blank')
    } else if (attachment.type.startsWith('image/')) {
      window.open(attachment.data, '_blank')
    } else {
      toast.info('Preview not available for this file type. Use download instead.')
    }
  }

  const handleAttachmentContextMenu = (e: React.MouseEvent, attachment: Attachment) => {
    e.preventDefault()
    handleDownloadAttachment(attachment)
  }

  const handleRemovePhoto = () => {
    setPhoto(undefined)
    setPhotoOffsetX(0)
    setPhotoOffsetY(0)
    setPhotoZoom(100)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePhotoMouseDown = (e: React.MouseEvent) => {
    if (!photo) return
    e.preventDefault()
    setIsDraggingPhoto(true)
    setDragStartPos({ x: e.clientX, y: e.clientY })
  }

  const handlePhotoMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPhoto || !photo) return
    
    const deltaX = e.clientX - dragStartPos.x
    const deltaY = e.clientY - dragStartPos.y
    
    setPhotoOffsetX(prev => Math.max(-50, Math.min(50, prev + deltaX * 0.2)))
    setPhotoOffsetY(prev => Math.max(-50, Math.min(50, prev + deltaY * 0.2)))
    setDragStartPos({ x: e.clientX, y: e.clientY })
  }

  const handlePhotoMouseUp = () => {
    setIsDraggingPhoto(false)
  }

  const handlePhotoWheel = (e: React.WheelEvent) => {
    if (!photo) return
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -5 : 5
    setPhotoZoom(prev => Math.max(50, Math.min(200, prev + delta)))
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingPhoto(false)
    }
    
    if (isDraggingPhoto) {
      window.addEventListener('mouseup', handleGlobalMouseUp)
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingPhoto])

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
      photoOffsetX,
      photoOffsetY,
      photoZoom,
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

  const handleInvestigate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name first')
      return
    }

    setIsInvestigating(true)
    toast.info('Investigating...')

    try {
      const positionLines = position.split('\n').map(line => line.trim()).filter(Boolean)
      const positionText = positionLines.join(', ')
      
      const promptText = `You are a professional intelligence analyst. Create a comprehensive professional profile for the following person:

Name: ${name}
Position: ${positionText || 'Not specified'}
Country: ${country || 'Not specified'}

Please provide:
1. Professional Background Overview (based on typical career trajectories for this position)
2. Areas of Influence and Expertise
3. Potential Network Connections (types of people/organizations they might interact with)
4. Strategic Importance Assessment
5. Key Considerations for Engagement

Format your response as a professional intelligence brief with clear sections and detailed analysis. Be thorough but realistic based on the position and context provided.`

      const report = await window.spark.llm(promptText, 'gpt-4o-mini')
      setInvestigationReport(report)

      const pdfBlob = await generateInvestigationPDF({
        name: name.trim(),
        position: positionText || 'Not specified',
        country: country || 'Not specified',
        report,
        photo
      })

      const reader = new FileReader()
      reader.onloadend = () => {
        const pdfDataUrl = reader.result as string
        const timestamp = Date.now()
        const fileName = `Investigation_${name.trim().replace(/\s+/g, '_')}_${new Date(timestamp).toISOString().split('T')[0]}.pdf`
        
        const newAttachment: Attachment = {
          id: generateId(),
          name: fileName,
          type: 'application/pdf',
          data: pdfDataUrl,
          size: pdfBlob.size,
          addedAt: timestamp
        }
        
        setAttachments(prev => [...prev, newAttachment])
        toast.success('Investigation report generated and added to attachments')
      }
      reader.readAsDataURL(pdfBlob)

    } catch (error) {
      console.error('Investigation error:', error)
      toast.error('Failed to generate investigation report')
    } finally {
      setIsInvestigating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] h-[740px] max-w-5xl flex flex-col p-0">
        <div className="p-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl">
            {editPerson ? 'Edit Person' : 'Add Person'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {editPerson ? 'Update person details, notes, and attachments' : 'Add a new person to your network'}
          </DialogDescription>
        </div>
        
        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="px-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">
                <Note className="mr-1.5" size={16} />
                Notes {attachments.length > 0 && `(${attachments.length})`}
              </TabsTrigger>
              <TabsTrigger value="investigate">
                <Detective className="mr-1.5" size={16} />
                Investigate
              </TabsTrigger>
              <TabsTrigger value="activity">
                <ClockCounterClockwise className="mr-1.5" size={16} />
                Activity
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 pb-4">
              <TabsContent value="details" className="space-y-3 mt-3 m-0">
                <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-2">
                    <div 
                      ref={photoPreviewRef}
                      className={cn(
                        "relative group w-56 h-44 rounded-t-lg overflow-hidden border-[3px]",
                        isDraggingPhoto && photo && "cursor-grabbing",
                        !isDraggingPhoto && photo && "cursor-grab"
                      )}
                      style={{ borderColor: FRAME_COLORS[frameColor] }}
                      onDoubleClick={() => fileInputRef.current?.click()}
                      onMouseDown={handlePhotoMouseDown}
                      onMouseMove={handlePhotoMouseMove}
                      onMouseUp={handlePhotoMouseUp}
                      onMouseLeave={handlePhotoMouseUp}
                      onWheel={handlePhotoWheel}
                      title={photo ? "Drag to move, scroll to zoom" : "Double-click to upload photo"}
                    >
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: photo ? `url(${photo})` : undefined,
                          backgroundSize: `${photoZoom}%`,
                          backgroundPosition: `${50 + photoOffsetX}% ${50 + photoOffsetY}%`,
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: photo ? undefined : FRAME_COLORS[frameColor],
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        {!photo && (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl font-bold text-foreground">
                              {name ? getInitials(name) : '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      {!photo && (
                        <div className="absolute inset-0 bg-card/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none">
                          <Upload className="text-foreground" size={36} weight="duotone" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 h-8"
                        >
                          <Upload className="mr-1.5" size={14} />
                          Upload Photo
                        </Button>
                        {photo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                            className="h-8 w-8 p-0"
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                      
                      {photo && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <div className="flex items-center gap-1.5">
                              <ArrowsOutCardinal size={12} />
                              <span>Adjust Photo</span>
                            </div>
                            <span className="text-primary font-mono text-[11px]">{photoZoom}%</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MagnifyingGlassMinus size={12} className="text-muted-foreground" />
                              <Slider
                                value={[photoZoom]}
                                onValueChange={([value]) => setPhotoZoom(value)}
                                min={50}
                                max={200}
                                step={5}
                                className="flex-1"
                              />
                              <MagnifyingGlassPlus size={12} className="text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-8">Horiz</span>
                              <Slider
                                value={[photoOffsetX]}
                                onValueChange={([value]) => setPhotoOffsetX(value)}
                                min={-50}
                                max={50}
                                step={1}
                                className="flex-1"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-8">Vert</span>
                              <Slider
                                value={[photoOffsetY]}
                                onValueChange={([value]) => setPhotoOffsetY(value)}
                                min={-50}
                                max={50}
                                step={1}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          {(photoOffsetX !== 0 || photoOffsetY !== 0 || photoZoom !== 100) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPhotoOffsetX(0)
                                setPhotoOffsetY(0)
                                setPhotoZoom(100)
                              }}
                              className="w-full text-[11px] h-7"
                            >
                              Reset All
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name"
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
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
                      className="resize-none text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">Up to 3 lines</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Importance</Label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setScore(num)}
                          className={cn(
                            "w-11 h-11 rounded-lg border-2 font-bold text-lg transition-all flex items-center justify-center",
                            score === num 
                              ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground border-accent scale-105 shadow-lg' 
                              : 'bg-card border-border hover:border-accent/50'
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">1 = High, 5 = Lower</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {FRAME_COLOR_NAMES.map(color => {
                        const labels: Record<string, string> = {
                          red: 'Negative',
                          green: 'Positive',
                          orange: 'Neutral',
                          white: 'None'
                        }
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFrameColor(color as FrameColor)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all",
                              frameColor === color 
                                ? 'border-accent ring-2 ring-accent ring-offset-1 ring-offset-background bg-accent/10' 
                                : 'border-border hover:border-accent/50'
                            )}
                          >
                            <div
                              className="w-8 h-8 rounded-md"
                              style={{ backgroundColor: FRAME_COLORS[color] }}
                            />
                            <span className="text-[10px] text-muted-foreground text-center leading-tight">{labels[color]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Advocate</Label>
                    <div className="flex items-center space-x-2 rounded-lg border border-border bg-card px-3 py-2.5">
                      <Checkbox
                        id="advocate"
                        checked={advocate}
                        onCheckedChange={(checked) => setAdvocate(!!checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="advocate" className="text-sm cursor-pointer">
                        This person actively promotes messages
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-4 m-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  {editPerson && <p className="text-xs text-success">✓ Auto-saved</p>}
                </div>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this person..."
                  rows={8}
                  className="resize-none font-sans"
                />
                <p className="text-xs text-muted-foreground">
                  {editPerson ? 'Changes are automatically saved after 1 second' : 'Notes will be saved when you add the person'}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Attached Files</Label>
                  <div className="flex items-center gap-3">
                    {editPerson && <p className="text-xs text-success">✓ Auto-saved</p>}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <Paperclip className="mr-2" size={16} />
                      Add File
                    </Button>
                  </div>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                </div>

                {attachments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Paperclip size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No attachments yet</p>
                    <p className="text-xs mt-1">Click "Add File" to attach documents, images, or other files</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onDoubleClick={() => handleViewAttachment(attachment)}
                        title={attachment.type === 'application/pdf' ? 'Double-click to view • Right-click filename to download' : 'Double-click to view'}
                      >
                        <Paperclip size={20} className="text-muted-foreground flex-shrink-0" />
                        <div 
                          className="flex-1 min-w-0"
                          onContextMenu={(e) => handleAttachmentContextMenu(e, attachment)}
                        >
                          <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)} • {formatTimestamp(attachment.addedAt)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadAttachment(attachment)
                          }}
                          className="flex-shrink-0"
                          title="Download file"
                        >
                          <DownloadSimple size={16} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveAttachment(attachment.id)
                          }}
                          className="flex-shrink-0 hover:text-destructive"
                          title="Remove attachment"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="investigate" className="mt-4 space-y-4 m-0">
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Detective size={18} />
                    AI-Powered Investigation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generate a professional intelligence brief based on the person's name, position, and country. 
                    The report will be automatically saved to attachments.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="investigate-country" className="text-sm font-medium">Country</Label>
                  <Input
                    id="investigate-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter country (optional)"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing a country helps generate more contextual analysis
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleInvestigate}
                    disabled={isInvestigating || !name.trim()}
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    size="default"
                  >
                    {isInvestigating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Investigating...
                      </>
                    ) : (
                      <>
                        <Detective className="mr-2" size={18} />
                        Investigate
                      </>
                    )}
                  </Button>
                  {investigationReport && (
                    <Button
                      onClick={() => {
                        setInvestigationReport('')
                        setCountry('')
                      }}
                      variant="outline"
                      size="default"
                      title="Clear investigation results"
                    >
                      <X size={18} />
                    </Button>
                  )}
                </div>

                {investigationReport && (
                  <div className="space-y-2 mt-4 p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Investigation Report Preview</Label>
                      <p className="text-xs text-success">✓ Added to attachments</p>
                    </div>
                    <ScrollArea className="h-64 rounded-md border border-border p-3">
                      <div className="text-xs whitespace-pre-wrap font-mono">
                        {investigationReport}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4 m-0">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Activity Log</Label>
                {!editPerson || !editPerson.activityLog || editPerson.activityLog.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
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
            </div>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {editPerson && onDelete && (
              <Button variant="destructive" onClick={handleDelete} size="sm">
                <Trash className="mr-2" size={16} />
                Delete
              </Button>
            )}
            <div className={cn("flex gap-2", !editPerson && "ml-auto")}>
              <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">Cancel</Button>
              <Button onClick={handleSave} disabled={!name.trim()} className="bg-gradient-to-r from-primary to-accent" size="sm">
                {editPerson ? 'Update' : 'Add'} Person
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
