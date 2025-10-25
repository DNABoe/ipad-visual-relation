import { useState, useRef, useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PersonNode } from './PersonNode'
import { GroupFrame } from './GroupFrame'
import { CanvasEdges, getConnectionsInRect } from './CanvasEdges'
import { PersonDialog } from './PersonDialog'
import { GroupDialog } from './GroupDialog'
import { SettingsDialog } from './SettingsDialog'
import { ListPanel } from './ListPanel'
import { PhotoViewerDialog } from './PhotoViewerDialog'
import type { Person, Connection, Group, Workspace } from '@/lib/types'
import { generateId, getBounds, snapToGrid as snapValue } from '@/lib/helpers'
import { MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, NODE_WIDTH, NODE_HEIGHT, GRID_SIZE } from '@/lib/constants'
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
  Trash,
  X,
  TreeStructure,
  Target,
  FilePlus,
  FloppyDisk,
  FolderOpen,
  ArrowCounterClockwise,
  UserMinus,
  LinkBreak
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateSampleData } from '@/lib/sampleData'
import { encryptData } from '@/lib/encryption'

interface UndoAction {
  type: 'delete-persons' | 'delete-groups' | 'delete-connections'
  persons?: Person[]
  groups?: Group[]
  connections?: Connection[]
}

interface WorkspaceViewProps {
  workspace: Workspace
  setWorkspace: (update: Workspace | ((current: Workspace) => Workspace)) => void
  fileName: string
  password: string
  onNewNetwork: () => void
  onLoadNetwork: () => void
}

export function WorkspaceView({ workspace, setWorkspace, fileName, password, onNewNetwork, onLoadNetwork }: WorkspaceViewProps) {
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
  const [dragAccumulator, setDragAccumulator] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [showGrid, setShowGrid] = useState(settings?.showGrid ?? true)
  const [draggingConnection, setDraggingConnection] = useState<{ fromPersonId: string; mouseX: number; mouseY: number } | null>(null)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPanPos = useRef({ x: 0, y: 0 })

  const handleAddPerson = useCallback((person: Person) => {
    setWorkspace((current) => ({
      ...current,
      persons: editPerson
        ? current.persons.map(p => p.id === person.id ? person : p)
        : [...current.persons, person],
    }))
    setEditPerson(undefined)
    toast.success(editPerson ? 'Person updated' : 'Person added')
  }, [editPerson, setWorkspace])

  const handleDeletePerson = useCallback((personId: string) => {
    const personToDelete = workspace.persons.find(p => p.id === personId)
    const connectionsToDelete = workspace.connections.filter(
      c => c.fromPersonId === personId || c.toPersonId === personId
    )
    
    if (personToDelete) {
      setUndoStack(prev => [...prev, {
        type: 'delete-persons',
        persons: [personToDelete],
        connections: connectionsToDelete,
      }])
    }
    
    setWorkspace((current) => ({
      ...current,
      persons: current.persons.filter(p => p.id !== personId),
      connections: current.connections.filter(
        c => c.fromPersonId !== personId && c.toPersonId !== personId
      ),
    }))
    setSelectedPersons([])
    setEditPerson(undefined)
    toast.success('Person deleted')
  }, [workspace, setWorkspace])

  const handleAddGroup = useCallback((group: Group) => {
    setWorkspace((current) => ({
      ...current,
      groups: [...current.groups, group],
    }))
    toast.success('Group created')
  }, [setWorkspace])

  const handleDeleteSelected = useCallback(() => {
    if (selectedPersons.length === 0) return
    
    const personsToDelete = workspace.persons.filter(p => selectedPersons.includes(p.id))
    const connectionsToDelete = workspace.connections.filter(
      c => selectedPersons.includes(c.fromPersonId) || selectedPersons.includes(c.toPersonId)
    )
    
    setUndoStack(prev => [...prev, {
      type: 'delete-persons',
      persons: personsToDelete,
      connections: connectionsToDelete,
    }])
    
    setWorkspace((current) => ({
      ...current,
      persons: current.persons.filter(p => !selectedPersons.includes(p.id)),
      connections: current.connections.filter(
        c => !selectedPersons.includes(c.fromPersonId) && !selectedPersons.includes(c.toPersonId)
      ),
    }))
    setSelectedPersons([])
    toast.success('Deleted selected persons')
  }, [selectedPersons, workspace, setWorkspace])

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
    
    setSelectedConnections([connectionId])
  }, [])

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
          ...current,
          connections: [...current.connections, newConnection],
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
      const person = workspace.persons.find(p => p.id === personId)
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
    const person = workspace.persons.find(p => p.id === personId)
    if (person) {
      setEditPerson(person)
      setShowPersonDialog(true)
    }
  }, [workspace])

  const handlePhotoDoubleClick = useCallback((personId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const person = workspace.persons.find(p => p.id === personId)
    if (person && person.photo) {
      setPhotoViewerData({ url: person.photo, name: person.name })
      setShowPhotoViewer(true)
    }
  }, [workspace])

  const handlePersonDragStart = useCallback((personId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return
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
  }, [selectedGroups, workspace])
  
  const getPersonsInGroup = useCallback((groupId: string) => {
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
    const group = workspace.groups.find(g => g.id === groupId)
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
      ...current,
      groups: current.groups.map(g => g.id === groupId ? { ...g, ...updates } : g),
    }))
  }, [setWorkspace])

  const handleGroupRemove = useCallback((groupId: string) => {
    setWorkspace((current) => ({
      ...current,
      groups: current.groups.filter(g => g.id !== groupId),
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
      
      if (settings?.snapToGrid) {
        setDragAccumulator((acc) => {
          const newAccX = acc.x + dx
          const newAccY = acc.y + dy
          
          const gridStepsX = Math.floor(newAccX / GRID_SIZE)
          const gridStepsY = Math.floor(newAccY / GRID_SIZE)
          
          if (gridStepsX !== 0 || gridStepsY !== 0) {
            const moveX = gridStepsX * GRID_SIZE
            const moveY = gridStepsY * GRID_SIZE
            
            setWorkspace((current) => ({
              ...current,
              persons: current.persons.map(p => {
                if (selectedPersons.includes(p.id)) {
                  return { ...p, x: p.x + moveX, y: p.y + moveY }
                }
                return p
              }),
            }))
            
            return { x: newAccX - moveX, y: newAccY - moveY }
          }
          
          return { x: newAccX, y: newAccY }
        })
      } else {
        setWorkspace((current) => ({
          ...current,
          persons: current.persons.map(p => {
            if (selectedPersons.includes(p.id)) {
              return { ...p, x: p.x + dx, y: p.y + dy }
            }
            return p
          }),
        }))
      }
    } else if (draggingGroup) {
      const dx = e.movementX / transform.scale
      const dy = e.movementY / transform.scale
      
      if (settings?.snapToGrid) {
        setDragAccumulator((acc) => {
          const newAccX = acc.x + dx
          const newAccY = acc.y + dy
          
          const gridStepsX = Math.floor(newAccX / GRID_SIZE)
          const gridStepsY = Math.floor(newAccY / GRID_SIZE)
          
          if (gridStepsX !== 0 || gridStepsY !== 0) {
            const moveX = gridStepsX * GRID_SIZE
            const moveY = gridStepsY * GRID_SIZE
            
            setWorkspace((current) => ({
              ...current,
              groups: current.groups.map(g => {
                if (g.id === draggingGroup) {
                  return { ...g, x: g.x + moveX, y: g.y + moveY }
                }
                return g
              }),
              persons: current.persons.map(p => {
                if (draggingGroupPersons.includes(p.id)) {
                  return { ...p, x: p.x + moveX, y: p.y + moveY }
                }
                return p
              }),
            }))
            
            return { x: newAccX - moveX, y: newAccY - moveY }
          }
          
          return { x: newAccX, y: newAccY }
        })
      } else {
        setWorkspace((current) => ({
          ...current,
          groups: current.groups.map(g => {
            if (g.id === draggingGroup) {
              return { ...g, x: g.x + dx, y: g.y + dy }
            }
            return g
          }),
          persons: current.persons.map(p => {
            if (draggingGroupPersons.includes(p.id)) {
              return { ...p, x: p.x + dx, y: p.y + dy }
            }
            return p
          }),
        }))
      }
    } else if (resizingGroup) {
      const dx = (e.clientX - resizingGroup.startX) / transform.scale
      const dy = (e.clientY - resizingGroup.startY) / transform.scale
      
      setWorkspace((current) => ({
        ...current,
        groups: current.groups.map(g => {
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
    if (draggingConnection) {
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
            ...current,
            connections: [...current.connections, newConnection],
          }))
          toast.success('Connection created')
        } else {
          toast.info('Connection already exists')
        }
      }
      
      setDraggingConnection(null)
    } else if (selectionRect) {
      const selectedPersons = workspace.persons.filter(p => {
        const px = p.x + NODE_WIDTH / 2
        const py = p.y + NODE_HEIGHT / 2
        return (
          px >= selectionRect.x &&
          px <= selectionRect.x + selectionRect.width &&
          py >= selectionRect.y &&
          py <= selectionRect.y + selectionRect.height
        )
      }).map(p => p.id)
      
      const selectedConnectionIds = getConnectionsInRect(
        workspace.persons,
        workspace.connections,
        selectionRect.x,
        selectionRect.y,
        selectionRect.width,
        selectionRect.height
      )
      
      setSelectedPersons(selectedPersons)
      setSelectedConnections(selectedConnectionIds)
    }
    
    setDraggingPerson(null)
    setDraggingGroup(null)
    setDraggingGroupPersons([])
    setResizingGroup(null)
    setDragStart(null)
    setSelectionRect(null)
    setDragAccumulator({ x: 0, y: 0 })
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
    if (workspace.persons.length === 0) return
    
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

  const handleAutoArrange = useCallback(() => {
    if (workspace.persons.length === 0) return

    const persons = [...workspace.persons]
    const connections = workspace.connections

    const connectionMap = new Map<string, Set<string>>()
    connections.forEach(conn => {
      if (!connectionMap.has(conn.fromPersonId)) {
        connectionMap.set(conn.fromPersonId, new Set())
      }
      if (!connectionMap.has(conn.toPersonId)) {
        connectionMap.set(conn.toPersonId, new Set())
      }
      connectionMap.get(conn.fromPersonId)!.add(conn.toPersonId)
      connectionMap.get(conn.toPersonId)!.add(conn.fromPersonId)
    })

    const connectionCounts = new Map<string, number>()
    persons.forEach(p => {
      connectionCounts.set(p.id, connectionMap.get(p.id)?.size || 0)
    })

    const maxConnections = Math.max(...Array.from(connectionCounts.values()), 1)

    const canvasWidth = 1600
    const canvasHeight = 1600
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    persons.forEach(p => {
      const angle = Math.random() * Math.PI * 2
      const connectionCount = connectionCounts.get(p.id) || 0
      const normalizedConnectivity = connectionCount / maxConnections
      
      const maxRadius = 600
      const minRadius = 100
      const radius = maxRadius - (normalizedConnectivity * (maxRadius - minRadius))
      
      p.x = centerX + Math.cos(angle) * radius
      p.y = centerY + Math.sin(angle) * radius
    })

    const iterations = 400
    const repulsionForce = 18000
    const attractionForce = 0.08
    const centeringForce = 0.02
    const dampening = 0.85
    const minDistance = NODE_WIDTH + 30

    const velocities = new Map<string, { vx: number; vy: number }>()
    persons.forEach(p => velocities.set(p.id, { vx: 0, vy: 0 }))

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { fx: number; fy: number }>()
      persons.forEach(p => forces.set(p.id, { fx: 0, fy: 0 }))

      for (let i = 0; i < persons.length; i++) {
        for (let j = i + 1; j < persons.length; j++) {
          const p1 = persons[i]
          const p2 = persons[j]
          
          const dx = (p2.x + NODE_WIDTH / 2) - (p1.x + NODE_WIDTH / 2)
          const dy = (p2.y + NODE_HEIGHT / 2) - (p1.y + NODE_HEIGHT / 2)
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq)
          
          if (dist > 0) {
            let repulsion = repulsionForce / distSq
            
            if (dist < minDistance) {
              repulsion *= 3.5
            }
            
            const fx = (dx / dist) * repulsion
            const fy = (dy / dist) * repulsion
            
            const f1 = forces.get(p1.id)!
            const f2 = forces.get(p2.id)!
            f1.fx -= fx
            f1.fy -= fy
            f2.fx += fx
            f2.fy += fy
          }
        }
      }

      connections.forEach(conn => {
        const p1 = persons.find(p => p.id === conn.fromPersonId)
        const p2 = persons.find(p => p.id === conn.toPersonId)
        
        if (p1 && p2) {
          const dx = (p2.x + NODE_WIDTH / 2) - (p1.x + NODE_WIDTH / 2)
          const dy = (p2.y + NODE_HEIGHT / 2) - (p1.y + NODE_HEIGHT / 2)
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist > 0) {
            const p1Connections = connectionCounts.get(p1.id) || 0
            const p2Connections = connectionCounts.get(p2.id) || 0
            const avgConnections = (p1Connections + p2Connections) / 2
            const connectivityFactor = 1 + (avgConnections / maxConnections) * 0.4
            
            const idealDistance = 280 / connectivityFactor
            const displacement = dist - idealDistance
            const attraction = displacement * attractionForce
            const fx = (dx / dist) * attraction
            const fy = (dy / dist) * attraction
            
            const f1 = forces.get(p1.id)!
            const f2 = forces.get(p2.id)!
            f1.fx += fx
            f1.fy += fy
            f2.fx -= fx
            f2.fy -= fy
          }
        }
      })

      persons.forEach(p => {
        const connectionCount = connectionCounts.get(p.id) || 0
        const normalizedConnectivity = connectionCount / maxConnections
        
        const dx = centerX - (p.x + NODE_WIDTH / 2)
        const dy = centerY - (p.y + NODE_HEIGHT / 2)
        const distToCenter = Math.sqrt(dx * dx + dy * dy)
        
        if (distToCenter > 0) {
          const centerPull = centeringForce * normalizedConnectivity * distToCenter
          const force = forces.get(p.id)!
          force.fx += (dx / distToCenter) * centerPull
          force.fy += (dy / distToCenter) * centerPull
        }
      })

      persons.forEach(p => {
        const force = forces.get(p.id)!
        const vel = velocities.get(p.id)!
        
        vel.vx = (vel.vx + force.fx) * dampening
        vel.vy = (vel.vy + force.fy) * dampening
        
        p.x += vel.vx
        p.y += vel.vy
      })
    }

    for (let overlapIter = 0; overlapIter < 60; overlapIter++) {
      let hadOverlap = false
      for (let i = 0; i < persons.length; i++) {
        for (let j = i + 1; j < persons.length; j++) {
          const p1 = persons[i]
          const p2 = persons[j]
          
          const dx = (p2.x + NODE_WIDTH / 2) - (p1.x + NODE_WIDTH / 2)
          const dy = (p2.y + NODE_HEIGHT / 2) - (p1.y + NODE_HEIGHT / 2)
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < minDistance && dist > 0) {
            hadOverlap = true
            const overlap = minDistance - dist
            const pushX = (dx / dist) * overlap * 0.5
            const pushY = (dy / dist) * overlap * 0.5
            
            p1.x -= pushX
            p1.y -= pushY
            p2.x += pushX
            p2.y += pushY
          }
        }
      }
      if (!hadOverlap) break
    }

    const minX = Math.min(...persons.map(p => p.x))
    const minY = Math.min(...persons.map(p => p.y))
    
    persons.forEach(p => {
      p.x = Math.round(p.x - minX + 100)
      p.y = Math.round(p.y - minY + 100)
      
      if (settings?.snapToGrid) {
        p.x = snapValue(p.x)
        p.y = snapValue(p.y)
      }
    })

    setWorkspace((current) => ({
      ...current!,
      persons,
    }))

    setTimeout(() => {
      handleZoomToFit()
    }, 50)

    toast.success('Layout optimized')
  }, [workspace, settings, setWorkspace, handleZoomToFit])

  const handleArrangeByScore = useCallback(() => {
    if (workspace.persons.length === 0) return

    const persons = [...workspace.persons]

    const canvasWidth = 1600
    const canvasHeight = 1600
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    persons.forEach(p => {
      const angle = Math.random() * Math.PI * 2
      const normalizedScore = (p.score - 1) / 4
      
      const minRadius = 80
      const maxRadius = 600
      const radius = minRadius + (normalizedScore * (maxRadius - minRadius))
      
      p.x = centerX + Math.cos(angle) * radius
      p.y = centerY + Math.sin(angle) * radius
    })

    const iterations = 400
    const repulsionForce = 18000
    const dampening = 0.85
    const minDistance = NODE_WIDTH + 30

    const velocities = new Map<string, { vx: number; vy: number }>()
    persons.forEach(p => velocities.set(p.id, { vx: 0, vy: 0 }))

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { fx: number; fy: number }>()
      persons.forEach(p => forces.set(p.id, { fx: 0, fy: 0 }))

      for (let i = 0; i < persons.length; i++) {
        for (let j = i + 1; j < persons.length; j++) {
          const p1 = persons[i]
          const p2 = persons[j]
          
          const dx = (p2.x + NODE_WIDTH / 2) - (p1.x + NODE_WIDTH / 2)
          const dy = (p2.y + NODE_HEIGHT / 2) - (p1.y + NODE_HEIGHT / 2)
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq)
          
          if (dist > 0) {
            let repulsion = repulsionForce / distSq
            
            if (dist < minDistance) {
              repulsion *= 4
            }
            
            const fx = (dx / dist) * repulsion
            const fy = (dy / dist) * repulsion
            
            const f1 = forces.get(p1.id)!
            const f2 = forces.get(p2.id)!
            f1.fx -= fx
            f1.fy -= fy
            f2.fx += fx
            f2.fy += fy
          }
        }
      }

      persons.forEach(p => {
        const normalizedScore = (p.score - 1) / 4
        const idealRadius = 80 + (normalizedScore * (600 - 80))
        
        const dx = (p.x + NODE_WIDTH / 2) - centerX
        const dy = (p.y + NODE_HEIGHT / 2) - centerY
        const distToCenter = Math.sqrt(dx * dx + dy * dy)
        
        if (distToCenter > 0) {
          const radiusDiff = distToCenter - idealRadius
          const radialForce = radiusDiff * 0.025
          
          const force = forces.get(p.id)!
          force.fx -= (dx / distToCenter) * radialForce
          force.fy -= (dy / distToCenter) * radialForce
        }
      })

      persons.forEach(p => {
        const force = forces.get(p.id)!
        const vel = velocities.get(p.id)!
        
        vel.vx = (vel.vx + force.fx) * dampening
        vel.vy = (vel.vy + force.fy) * dampening
        
        p.x += vel.vx
        p.y += vel.vy
      })
    }

    for (let overlapIter = 0; overlapIter < 60; overlapIter++) {
      let hadOverlap = false
      for (let i = 0; i < persons.length; i++) {
        for (let j = i + 1; j < persons.length; j++) {
          const p1 = persons[i]
          const p2 = persons[j]
          
          const dx = (p2.x + NODE_WIDTH / 2) - (p1.x + NODE_WIDTH / 2)
          const dy = (p2.y + NODE_HEIGHT / 2) - (p1.y + NODE_HEIGHT / 2)
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < minDistance && dist > 0) {
            hadOverlap = true
            const overlap = minDistance - dist
            const pushX = (dx / dist) * overlap * 0.5
            const pushY = (dy / dist) * overlap * 0.5
            
            p1.x -= pushX
            p1.y -= pushY
            p2.x += pushX
            p2.y += pushY
          }
        }
      }
      if (!hadOverlap) break
    }

    const minX = Math.min(...persons.map(p => p.x))
    const minY = Math.min(...persons.map(p => p.y))
    
    persons.forEach(p => {
      p.x = Math.round(p.x - minX + 100)
      p.y = Math.round(p.y - minY + 100)
      
      if (settings?.snapToGrid) {
        p.x = snapValue(p.x)
        p.y = snapValue(p.y)
      }
    })

    setWorkspace((current) => ({
      ...current!,
      persons,
    }))

    setTimeout(() => {
      handleZoomToFit()
    }, 50)

    toast.success('Arranged by score - lowest in center')
  }, [workspace, settings, setWorkspace, handleZoomToFit])

  const handleLoadSample = useCallback(() => {
    const sample = generateSampleData()
    setWorkspace((current) => ({
      persons: [...current.persons, ...sample.persons],
      connections: [...current.connections, ...sample.connections],
      groups: [...current.groups, ...sample.groups],
    }))
    toast.success('Sample data loaded')
  }, [setWorkspace])

  const handleSaveNetwork = useCallback(async () => {
    try {
      const encrypted = await encryptData(JSON.stringify(workspace), password)
      const fileData = JSON.stringify(encrypted, null, 2)

      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `${fileName}.enc.json`,
            types: [{
              description: 'Encrypted Network File',
              accept: { 'application/json': ['.enc.json', '.json'] }
            }]
          })

          const writable = await fileHandle.createWritable()
          await writable.write(fileData)
          await writable.close()

          toast.success('Network saved')
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            toast.info('Save cancelled')
            return
          }
          throw error
        }
      } else {
        const blob = new Blob([fileData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileName}.enc.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Network saved - check your Downloads folder')
      }
    } catch (error) {
      toast.error('Failed to save')
      console.error(error)
    }
  }, [workspace, password, fileName])

  const handleImport = useCallback((imported: Workspace) => {
    setWorkspace(imported)
  }, [setWorkspace])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      toast.info('Nothing to undo')
      return
    }
    
    const lastAction = undoStack[undoStack.length - 1]
    
    if (lastAction.type === 'delete-persons') {
      setWorkspace((current) => ({
        ...current,
        persons: [...current.persons, ...(lastAction.persons || [])],
        connections: [...current.connections, ...(lastAction.connections || [])],
      }))
      toast.success('Restored deleted persons')
    } else if (lastAction.type === 'delete-groups') {
      setWorkspace((current) => ({
        ...current,
        groups: [...current.groups, ...(lastAction.groups || [])],
      }))
      toast.success('Restored deleted groups')
    } else if (lastAction.type === 'delete-connections') {
      setWorkspace((current) => ({
        ...current,
        connections: [...current.connections, ...(lastAction.connections || [])],
      }))
      toast.success('Restored deleted connections')
    }
    
    setUndoStack(prev => prev.slice(0, -1))
  }, [undoStack, setWorkspace])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPersons.length > 0) {
          e.preventDefault()
          handleDeleteSelected()
        } else if (selectedGroups.length > 0) {
          e.preventDefault()
          const groupsToDelete = workspace.groups.filter(g => selectedGroups.includes(g.id))
          
          setUndoStack(prev => [...prev, {
            type: 'delete-groups',
            groups: groupsToDelete,
          }])
          
          setWorkspace((current) => ({
            ...current,
            groups: current.groups.filter(g => !selectedGroups.includes(g.id)),
          }))
          setSelectedGroups([])
          toast.success('Deleted selected groups')
        } else if (selectedConnections.length > 0) {
          e.preventDefault()
          const connectionsToDelete = workspace.connections.filter(c => selectedConnections.includes(c.id))
          
          setUndoStack(prev => [...prev, {
            type: 'delete-connections',
            connections: connectionsToDelete,
          }])
          
          setWorkspace((current) => ({
            ...current,
            connections: current.connections.filter(c => !selectedConnections.includes(c.id)),
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
      setDragAccumulator({ x: 0, y: 0 })
      isPanning.current = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [selectedPersons, selectedGroups, selectedConnections, workspace, handleDeleteSelected, handleUndo, setWorkspace])

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        <div className="border-b bg-card px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Visual Relationship Network</h1>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground font-medium">{fileName}</span>
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
                <Button variant="outline" size="sm" onClick={handleAutoArrange}>
                  <TreeStructure size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Auto Arrange</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleArrangeByScore}>
                  <Target size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Arrange by Score (Center)</TooltipContent>
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
                      <UserMinus size={16} />
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
                        const groupsToDelete = workspace.groups.filter(g => selectedGroups.includes(g.id))
                        
                        setUndoStack(prev => [...prev, {
                          type: 'delete-groups',
                          groups: groupsToDelete,
                        }])
                        
                        setWorkspace((current) => ({
                          ...current,
                          groups: current.groups.filter(g => !selectedGroups.includes(g.id)),
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
                        const connectionsToDelete = workspace.connections.filter(c => selectedConnections.includes(c.id))
                        
                        setUndoStack(prev => [...prev, {
                          type: 'delete-connections',
                          connections: connectionsToDelete,
                        }])
                        
                        setWorkspace((current) => ({
                          ...current,
                          connections: current.connections.filter(c => !selectedConnections.includes(c.id)),
                        }))
                        setSelectedConnections([])
                        toast.success('Deleted selected connections')
                      }}
                    >
                      <LinkBreak size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected Connections</TooltipContent>
                </Tooltip>
              </>
            )}

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                >
                  <ArrowCounterClockwise size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowSettingsDialog(true)}>
                  <Gear size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onNewNetwork}>
                  <FilePlus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Network</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleSaveNetwork}>
                  <FloppyDisk size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Network - Choose where to save on your computer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onLoadNetwork}>
                  <FolderOpen size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load Network</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {showListPanel && (
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

              {draggingConnection && (
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
                selectionRect={selectionRect}
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
          onDelete={handleDeletePerson}
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
