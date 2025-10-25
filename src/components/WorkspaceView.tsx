import { useState, useRef, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PersonNode } from './PersonNode'
import { GroupFrame } from './GroupFrame'
import { CanvasEdges } from './CanvasEdges'
import { PersonDialog } from './PersonDialog'
import { GroupDialog } from './GroupDialog'
import { SettingsDialog } from './SettingsDialog'
import { ListPanel } from './ListPanel'
import { PhotoViewerDialog } from './PhotoViewerDialog'
import type { Person, Connection, Group, Workspace } from '@/lib/types'
import { generateId, getBounds, snapToGrid as snapValue } from '@/lib/helpers'
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, NODE_WIDTH, NODE_HEIGHT } from '@/lib/constants'
import { 
  Plus, 
  UsersThree, 
  Link, 
  MagnifyingGlassPlus, 
  MagnifyingGlassMinus, 
  ArrowsOut, 
  GridFour, 
  List, 
  Gear,
  SignOut,
  Trash,
  X
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateSampleData } from '@/lib/sampleData'

interface WorkspaceViewProps {
  onLogout?: () => void
}

export function WorkspaceView({ onLogout }: WorkspaceViewProps) {
  const [workspace, setWorkspace] = useKV<Workspace>('workspace', { persons: [], connections: [], groups: [] })
  const [settings] = useKV<{ showGrid: boolean; snapToGrid: boolean; showMinimap: boolean }>('app-settings', {
    showGrid: true,
    snapToGrid: false,
    showMinimap: true,
  })

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [selectedPersons, setSelectedPersons] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [showPersonDialog, setShowPersonDialog] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showListPanel, setShowListPanel] = useState(false)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [photoViewerData, setPhotoViewerData] = useState<{ url: string; name: string } | null>(null)
  const [editPerson, setEditPerson] = useState<Person | undefined>()
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [draggingPerson, setDraggingPerson] = useState<string | null>(null)
  const [draggingGroup, setDraggingGroup] = useState<string | null>(null)
  const [draggingGroupPersons, setDraggingGroupPersons] = useState<string[]>([])
  const [resizingGroup, setResizingGroup] = useState<{ id: string; handle: string; startX: number; startY: number; startWidth: number; startHeight: number; startGroupX: number; startGroupY: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [showGrid, setShowGrid] = useState(settings?.showGrid ?? true)
  const [draggingConnection, setDraggingConnection] = useState<{ fromPersonId: string; mouseX: number; mouseY: number } | null>(null)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })

  const handleAddPerson = useCallback((person: Person) => {
    setWorkspace((current) => ({
      ...current!,
      persons: editPerson
        ? current!.persons.map(p => p.id === person.id ? person : p)
        : [...current!.persons, person],
    }))
    setEditPerson(undefined)
    toast.success(editPerson ? 'Person updated' : 'Person added')
  }, [editPerson, setWorkspace])

  const handleAddGroup = useCallback((group: Group) => {
    setWorkspace((current) => ({
      ...current!,
      groups: [...current!.groups, group],
    }))
    toast.success('Group created')
  }, [setWorkspace])

  const handleDeleteSelected = useCallback(() => {
    if (selectedPersons.length === 0) return
    
    setWorkspace((current) => ({
      ...current!,
      persons: current!.persons.filter(p => !selectedPersons.includes(p.id)),
      connections: current!.connections.filter(
        c => !selectedPersons.includes(c.fromPersonId) && !selectedPersons.includes(c.toPersonId)
      ),
    }))
    setSelectedPersons([])
    toast.success('Deleted selected persons')
  }, [selectedPersons, setWorkspace])

  const handleConnectionClick = useCallback((connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.shiftKey) {
      setSelectedConnections(prev =>
        prev.includes(connectionId) ? prev.filter(id => id !== connectionId) : [...prev, connectionId]
      )
    } else {
      setSelectedConnections([connectionId])
    }
  }, [])

  const handleConnectionContextMenu = useCallback((connectionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWorkspace((current) => ({
      ...current!,
      connections: current!.connections.filter(c => c.id !== connectionId),
    }))
    setSelectedConnections(prev => prev.filter(id => id !== connectionId))
    toast.success('Connection removed')
  }, [setWorkspace])

  const handlePersonClick = useCallback((personId: string, e: React.MouseEvent) => {
    if (connectMode) {
      e.stopPropagation()
      if (!connectFrom) {
        setConnectFrom(personId)
        toast.info('Click another person to connect')
      } else if (connectFrom !== personId) {
        const newConnection: Connection = {
          id: generateId(),
          fromPersonId: connectFrom,
          toPersonId: personId,
        }
        setWorkspace((current) => ({
          ...current!,
          connections: [...current!.connections, newConnection],
        }))
        setConnectMode(false)
        setConnectFrom(null)
        toast.success('Connection created')
      }
    } else {
      e.stopPropagation()
      if (e.shiftKey) {
        setSelectedPersons(prev =>
          prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
        )
      } else {
        setSelectedPersons([personId])
      }
    }
  }, [connectMode, connectFrom, setWorkspace])

  const handlePersonContextMenu = useCallback((personId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.ctrlKey || e.metaKey) {
      const person = workspace?.persons.find(p => p.id === personId)
      if (person) {
        setEditPerson(person)
        setShowPersonDialog(true)
      }
    } else {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const mouseX = (e.clientX - rect.left - transform.x) / transform.scale
      const mouseY = (e.clientY - rect.top - transform.y) / transform.scale
      
      setDraggingConnection({
        fromPersonId: personId,
        mouseX,
        mouseY,
      })
      toast.info('Drag to another person to connect')
    }
  }, [workspace, transform])

  const handlePersonDoubleClick = useCallback((personId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const person = workspace?.persons.find(p => p.id === personId)
    if (person) {
      setEditPerson(person)
      setShowPersonDialog(true)
    }
  }, [workspace])

  const handlePhotoDoubleClick = useCallback((personId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const person = workspace?.persons.find(p => p.id === personId)
    if (person && person.photo) {
      setPhotoViewerData({ url: person.photo, name: person.name })
      setShowPhotoViewer(true)
    }
  }, [workspace])

  const handlePersonDragStart = useCallback((personId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectMode || draggingConnection) return
    setDraggingPerson(personId)
    if (!selectedPersons.includes(personId)) {
      setSelectedPersons([personId])
    }
  }, [connectMode, draggingConnection, selectedPersons])

  const handleGroupDragStart = useCallback((groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDraggingGroup(groupId)
    if (!selectedGroups.includes(groupId)) {
      setSelectedGroups([groupId])
    }
    
    if (workspace) {
      const group = workspace.groups.find(g => g.id === groupId)
      if (group) {
        const personsInGroup = workspace.persons.filter(person => {
          const personCenterX = person.x + NODE_WIDTH / 2
          const personCenterY = person.y + NODE_HEIGHT / 2
          return (
            personCenterX >= group.x &&
            personCenterX <= group.x + group.width &&
            personCenterY >= group.y &&
            personCenterY <= group.y + group.height
          )
        })
        setDraggingGroupPersons(personsInGroup.map(p => p.id))
      }
    }
  }, [selectedGroups, workspace])
  
  const getPersonsInGroup = useCallback((groupId: string) => {
    if (!workspace) return []
    const group = workspace.groups.find(g => g.id === groupId)
    if (!group) return []
    
    return workspace.persons.filter(person => {
      const personCenterX = person.x + NODE_WIDTH / 2
      const personCenterY = person.y + NODE_HEIGHT / 2
      return (
        personCenterX >= group.x &&
        personCenterX <= group.x + group.width &&
        personCenterY >= group.y &&
        personCenterY <= group.y + group.height
      )
    })
  }, [workspace])

  const handleGroupResizeStart = useCallback((groupId: string, handle: string, e: React.MouseEvent) => {
    const group = workspace?.groups.find(g => g.id === groupId)
    if (!group) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setResizingGroup({
      id: groupId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: group.width,
      startHeight: group.height,
      startGroupX: group.x,
      startGroupY: group.y,
    })
  }, [workspace])

  const handleGroupUpdate = useCallback((groupId: string, updates: Partial<Group>) => {
    setWorkspace((current) => ({
      ...current!,
      groups: current!.groups.map(g => g.id === groupId ? { ...g, ...updates } : g),
    }))
  }, [setWorkspace])

  const handleGroupRemove = useCallback((groupId: string) => {
    setWorkspace((current) => ({
      ...current!,
      groups: current!.groups.filter(g => g.id !== groupId),
    }))
    setSelectedGroups(prev => prev.filter(id => id !== groupId))
    toast.success('Group removed')
  }, [setWorkspace])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingConnection) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const mouseX = (e.clientX - rect.left - transform.x) / transform.scale
      const mouseY = (e.clientY - rect.top - transform.y) / transform.scale
      
      setDraggingConnection({
        ...draggingConnection,
        mouseX,
        mouseY,
      })
    } else if (draggingPerson && workspace) {
      const dx = e.movementX / transform.scale
      const dy = e.movementY / transform.scale
      
      setWorkspace((current) => ({
        ...current!,
        persons: current!.persons.map(p => {
          if (selectedPersons.includes(p.id)) {
            const newX = settings?.snapToGrid ? snapValue(p.x + dx) : p.x + dx
            const newY = settings?.snapToGrid ? snapValue(p.y + dy) : p.y + dy
            return { ...p, x: newX, y: newY }
          }
          return p
        }),
      }))
    } else if (draggingGroup && workspace) {
      const dx = e.movementX / transform.scale
      const dy = e.movementY / transform.scale
      
      setWorkspace((current) => ({
        ...current!,
        groups: current!.groups.map(g => {
          if (g.id === draggingGroup) {
            const newX = settings?.snapToGrid ? snapValue(g.x + dx) : g.x + dx
            const newY = settings?.snapToGrid ? snapValue(g.y + dy) : g.y + dy
            return { ...g, x: newX, y: newY }
          }
          return g
        }),
        persons: current!.persons.map(p => {
          if (draggingGroupPersons.includes(p.id)) {
            const newX = settings?.snapToGrid ? snapValue(p.x + dx) : p.x + dx
            const newY = settings?.snapToGrid ? snapValue(p.y + dy) : p.y + dy
            return { ...p, x: newX, y: newY }
          }
          return p
        }),
      }))
    } else if (resizingGroup && workspace) {
      const dx = (e.clientX - resizingGroup.startX) / transform.scale
      const dy = (e.clientY - resizingGroup.startY) / transform.scale
      
      setWorkspace((current) => ({
        ...current!,
        groups: current!.groups.map(g => {
          if (g.id === resizingGroup.id) {
            const handle = resizingGroup.handle
            let newX = g.x
            let newY = g.y
            let newWidth = g.width
            let newHeight = g.height
            
            if (handle.includes('w')) {
              newX = resizingGroup.startGroupX + dx
              newWidth = Math.max(100, resizingGroup.startWidth - dx)
            }
            if (handle.includes('e')) {
              newWidth = Math.max(100, resizingGroup.startWidth + dx)
            }
            if (handle.includes('n')) {
              newY = resizingGroup.startGroupY + dy
              newHeight = Math.max(100, resizingGroup.startHeight - dy)
            }
            if (handle.includes('s')) {
              newHeight = Math.max(100, resizingGroup.startHeight + dy)
            }
            
            return { ...g, x: newX, y: newY, width: newWidth, height: newHeight }
          }
          return g
        }),
      }))
    } else if (isPanning.current) {
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }))
    } else if (dragStart) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const currentX = (e.clientX - rect.left - transform.x) / transform.scale
      const currentY = (e.clientY - rect.top - transform.y) / transform.scale
      
      setSelectionRect({
        x: Math.min(dragStart.x, currentX),
        y: Math.min(dragStart.y, currentY),
        width: Math.abs(currentX - dragStart.x),
        height: Math.abs(currentY - dragStart.y),
      })
    }
  }, [draggingConnection, draggingPerson, draggingGroup, draggingGroupPersons, resizingGroup, dragStart, selectedPersons, transform, workspace, settings, setWorkspace])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggingConnection && workspace) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) {
        setDraggingConnection(null)
        return
      }
      
      const mouseX = (e.clientX - rect.left - transform.x) / transform.scale
      const mouseY = (e.clientY - rect.top - transform.y) / transform.scale
      
      const targetPerson = workspace.persons.find(p => {
        return (
          mouseX >= p.x &&
          mouseX <= p.x + NODE_WIDTH &&
          mouseY >= p.y &&
          mouseY <= p.y + NODE_HEIGHT
        )
      })
      
      if (targetPerson && targetPerson.id !== draggingConnection.fromPersonId) {
        const existingConnection = workspace.connections.find(
          c => c.fromPersonId === draggingConnection.fromPersonId && c.toPersonId === targetPerson.id
        )
        
        if (!existingConnection) {
          const newConnection: Connection = {
            id: generateId(),
            fromPersonId: draggingConnection.fromPersonId,
            toPersonId: targetPerson.id,
          }
          setWorkspace((current) => ({
            ...current!,
            connections: [...current!.connections, newConnection],
          }))
          toast.success('Connection created')
        } else {
          toast.info('Connection already exists')
        }
      }
      
      setDraggingConnection(null)
    } else if (selectionRect && workspace) {
      const selected = workspace.persons.filter(p => {
        const px = p.x + NODE_WIDTH / 2
        const py = p.y + NODE_HEIGHT / 2
        return (
          px >= selectionRect.x &&
          px <= selectionRect.x + selectionRect.width &&
          py >= selectionRect.y &&
          py <= selectionRect.y + selectionRect.height
        )
      }).map(p => p.id)
      
      setSelectedPersons(selected)
    }
    
    setDraggingPerson(null)
    setDraggingGroup(null)
    setDraggingGroupPersons([])
    setResizingGroup(null)
    setDragStart(null)
    setSelectionRect(null)
    isPanning.current = false
  }, [draggingConnection, selectionRect, workspace, transform, setWorkspace])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault()
      isPanning.current = true
      lastPanPos.current = { x: e.clientX, y: e.clientY }
    } else if (e.button === 0 && !connectMode) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = (e.clientX - rect.left - transform.x) / transform.scale
      const y = (e.clientY - rect.top - transform.y) / transform.scale
      
      setDragStart({ x, y })
      setSelectedPersons([])
      setSelectedConnections([])
    }
  }, [connectMode, transform])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, transform.scale + delta))
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const scaleRatio = newScale / transform.scale
    
    setTransform({
      x: mouseX - (mouseX - transform.x) * scaleRatio,
      y: mouseY - (mouseY - transform.y) * scaleRatio,
      scale: newScale,
    })
  }, [transform])

  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(MAX_ZOOM, prev.scale + ZOOM_STEP),
    }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(MIN_ZOOM, prev.scale - ZOOM_STEP),
    }))
  }, [])

  const handleZoomToFit = useCallback(() => {
    if (!workspace || workspace.persons.length === 0) return
    
    const bounds = getBounds(workspace.persons)
    if (!bounds) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const padding = 100
    const contentWidth = bounds.maxX - bounds.minX + NODE_WIDTH + padding * 2
    const contentHeight = bounds.maxY - bounds.minY + NODE_HEIGHT + padding * 2
    
    const scaleX = rect.width / contentWidth
    const scaleY = rect.height / contentHeight
    const scale = Math.min(scaleX, scaleY, MAX_ZOOM)
    
    const centerX = (bounds.minX + bounds.maxX) / 2 + NODE_WIDTH / 2
    const centerY = (bounds.minY + bounds.maxY) / 2 + NODE_HEIGHT / 2
    
    setTransform({
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale,
    })
  }, [workspace])

  const handleLoadSample = useCallback(() => {
    const sample = generateSampleData()
    setWorkspace((current) => ({
      persons: [...(current?.persons || []), ...sample.persons],
      connections: [...(current?.connections || []), ...sample.connections],
      groups: [...(current?.groups || []), ...sample.groups],
    }))
    toast.success('Sample data loaded')
  }, [setWorkspace])

  const handleImport = useCallback((imported: Workspace) => {
    setWorkspace(imported)
  }, [setWorkspace])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPersons.length > 0) {
          e.preventDefault()
          handleDeleteSelected()
        } else if (selectedGroups.length > 0) {
          e.preventDefault()
          setWorkspace((current) => ({
            ...current!,
            groups: current!.groups.filter(g => !selectedGroups.includes(g.id)),
          }))
          setSelectedGroups([])
          toast.success('Deleted selected groups')
        } else if (selectedConnections.length > 0) {
          e.preventDefault()
          setWorkspace((current) => ({
            ...current!,
            connections: current!.connections.filter(c => !selectedConnections.includes(c.id)),
          }))
          setSelectedConnections([])
          toast.success('Deleted selected connections')
        }
      } else if (e.key === 'Escape') {
        setConnectMode(false)
        setConnectFrom(null)
        setSelectedPersons([])
        setSelectedGroups([])
        setSelectedConnections([])
      }
    }
    
    const handleGlobalMouseUp = () => {
      setDraggingPerson(null)
      setDraggingGroup(null)
      setDraggingGroupPersons([])
      setResizingGroup(null)
      setDragStart(null)
      setSelectionRect(null)
      setDraggingConnection(null)
      isPanning.current = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [selectedPersons, selectedGroups, selectedConnections, handleDeleteSelected, setWorkspace])

  if (!workspace) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <div className="border-b bg-card px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Visual Relationship Network</h1>
            {workspace.persons.length === 0 && (
              <Button variant="outline" size="sm" onClick={handleLoadSample}>
                Load Sample Data
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={connectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setConnectMode(!connectMode)
                    setConnectFrom(null)
                  }}
                >
                  {connectMode ? <X size={16} /> : <Link size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{connectMode ? 'Cancel Connect' : 'Connect Mode'}</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowPersonDialog(true)}>
                  <Plus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Person</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowGroupDialog(true)}>
                  <UsersThree size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Group</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <MagnifyingGlassPlus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <MagnifyingGlassMinus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleZoomToFit}>
                  <ArrowsOut size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom to Fit</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <GridFour size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showListPanel ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowListPanel(!showListPanel)}
                >
                  <List size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle List</TooltipContent>
            </Tooltip>

            {selectedPersons.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                      <Trash size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected Persons</TooltipContent>
                </Tooltip>
              </>
            )}

            {selectedGroups.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        setWorkspace((current) => ({
                          ...current!,
                          groups: current!.groups.filter(g => !selectedGroups.includes(g.id)),
                        }))
                        setSelectedGroups([])
                        toast.success('Deleted selected groups')
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected Groups</TooltipContent>
                </Tooltip>
              </>
            )}

            {selectedConnections.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        setWorkspace((current) => ({
                          ...current!,
                          connections: current!.connections.filter(c => !selectedConnections.includes(c.id)),
                        }))
                        setSelectedConnections([])
                        toast.success('Deleted selected connections')
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected Connections</TooltipContent>
                </Tooltip>
              </>
            )}

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
                  <Gear size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            {onLogout && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={onLogout}>
                    <SignOut size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {showListPanel && workspace && (
            <ListPanel
              persons={workspace.persons}
              groups={workspace.groups}
              selectedPersons={selectedPersons}
              onPersonClick={(id) => {
                setSelectedPersons([id])
                const person = workspace.persons.find(p => p.id === id)
                if (person && canvasRef.current) {
                  const rect = canvasRef.current.getBoundingClientRect()
                  setTransform({
                    x: rect.width / 2 - (person.x + NODE_WIDTH / 2) * transform.scale,
                    y: rect.height / 2 - (person.y + NODE_HEIGHT / 2) * transform.scale,
                    scale: transform.scale,
                  })
                }
              }}
            />
          )}

          <div
            ref={canvasRef}
            className={`flex-1 relative overflow-hidden ${showGrid ? 'canvas-grid' : ''}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              className="absolute inset-0 z-10"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
                pointerEvents: 'none',
              }}
            >
              {workspace.groups.map(group => (
                <GroupFrame
                  key={group.id}
                  group={group}
                  isSelected={selectedGroups.includes(group.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedGroups([group.id])
                  }}
                  onUpdate={(updates) => handleGroupUpdate(group.id, updates)}
                  onRemove={handleGroupRemove}
                  onDragStart={(e) => handleGroupDragStart(group.id, e)}
                  onResizeStart={(e, handle) => handleGroupResizeStart(group.id, handle, e)}
                  style={{ pointerEvents: 'auto' }}
                />
              ))}

              {workspace.persons.map(person => (
                <PersonNode
                  key={person.id}
                  person={person}
                  isSelected={selectedPersons.includes(person.id)}
                  isDragging={draggingPerson === person.id}
                  onMouseDown={(e) => handlePersonDragStart(person.id, e)}
                  onClick={(e) => handlePersonClick(person.id, e)}
                  onDoubleClick={(e) => handlePersonDoubleClick(person.id, e)}
                  onPhotoDoubleClick={(e) => handlePhotoDoubleClick(person.id, e)}
                  onContextMenu={(e) => handlePersonContextMenu(person.id, e)}
                  style={{ pointerEvents: 'auto' }}
                />
              ))}

              {selectionRect && (
                <div
                  className="selection-rect absolute pointer-events-none"
                  style={{
                    left: selectionRect.x,
                    top: selectionRect.y,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                />
              )}

              {draggingConnection && workspace && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                  }}
                >
                  {(() => {
                    const fromPerson = workspace.persons.find(p => p.id === draggingConnection.fromPersonId)
                    if (!fromPerson) return null
                    
                    const fromX = fromPerson.x + NODE_WIDTH / 2
                    const fromY = fromPerson.y + NODE_HEIGHT / 2
                    const toX = draggingConnection.mouseX
                    const toY = draggingConnection.mouseY
                    
                    return (
                      <>
                        <line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke="oklch(0.65 0.15 200)"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                        <circle
                          cx={toX}
                          cy={toY}
                          r="6"
                          fill="oklch(0.65 0.15 200)"
                        />
                      </>
                    )
                  })()}
                </svg>
              )}
            </div>

            <div className="absolute inset-0 z-0">
              <CanvasEdges
                persons={workspace.persons}
                connections={workspace.connections}
                transform={transform}
                selectedConnections={selectedConnections}
                onConnectionClick={handleConnectionClick}
                onConnectionContextMenu={handleConnectionContextMenu}
              />
            </div>

            {connectMode && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg">
                {connectFrom ? 'Click target person to connect' : 'Click first person to start'}
              </div>
            )}
          </div>
        </div>

        <PersonDialog
          open={showPersonDialog}
          onOpenChange={(open) => {
            setShowPersonDialog(open)
            if (!open) setEditPerson(undefined)
          }}
          onSave={handleAddPerson}
          editPerson={editPerson}
        />

        <GroupDialog
          open={showGroupDialog}
          onOpenChange={setShowGroupDialog}
          onSave={handleAddGroup}
        />

        <SettingsDialog
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          workspace={workspace}
          onImport={handleImport}
        />

        {photoViewerData && (
          <PhotoViewerDialog
            open={showPhotoViewer}
            onOpenChange={setShowPhotoViewer}
            photoUrl={photoViewerData.url}
            personName={photoViewerData.name}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
