import { useCallback, useRef, useEffect, useState } from 'react'
import { useWorkspaceState } from './useWorkspaceState'
import { useSelection } from './useSelection'
import { useCanvasTransform } from './useCanvasTransform'
import { useInteractionState } from './useInteractionState'
import { useDialogState } from './useDialogState'
import type { Workspace, Person, Connection, Group } from '@/lib/types'
import { toast } from 'sonner'
import { generateId, getBounds, snapToGrid as snapValue } from '@/lib/helpers'
import { NODE_WIDTH, NODE_HEIGHT } from '@/lib/constants'
import { 
  organizeByImportance, 
  hierarchicalFromSelected, 
  tightenNetwork,
  smartArrange,
  arrangeByImportanceAndAttitude,
  arrangeByImportanceAndAdvocate,
  influenceHierarchyLayout,
  compactNetworkLayout
} from '@/lib/layoutAlgorithms'

export type ContextMenuState = {
  type: 'canvas' | 'person' | 'connection' | 'group'
  x: number
  y: number
  targetId?: string
  canvasX?: number
  canvasY?: number
} | null

interface UseWorkspaceControllerOptions {
  initialWorkspace: Workspace
}

export function useWorkspaceController({ initialWorkspace }: UseWorkspaceControllerOptions) {
  const workspaceState = useWorkspaceState(initialWorkspace)
  const selection = useSelection()
  const transform = useCanvasTransform(initialWorkspace.canvasTransform)
  const interaction = useInteractionState()
  const dialogs = useDialogState()
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastSavedTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null)
  const updateTransformTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)
  const updateCanvasTransformRef = useRef(workspaceState.updateCanvasTransform)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  const [copiedData, setCopiedData] = useState<{persons: Person[], connections: Connection[]} | null>(null)
  
  useEffect(() => {
    updateCanvasTransformRef.current = workspaceState.updateCanvasTransform
  })

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastSavedTransformRef.current = { 
        x: transform.transform.x, 
        y: transform.transform.y, 
        scale: transform.transform.scale 
      }
      return
    }

    const newTransform = transform.transform
    const lastSaved = lastSavedTransformRef.current
    
    if (
      lastSaved &&
      (Math.abs(lastSaved.x - newTransform.x) > 0.5 ||
       Math.abs(lastSaved.y - newTransform.y) > 0.5 ||
       Math.abs(lastSaved.scale - newTransform.scale) > 0.001)
    ) {
      if (updateTransformTimeoutRef.current) {
        clearTimeout(updateTransformTimeoutRef.current)
      }
      
      updateTransformTimeoutRef.current = setTimeout(() => {
        const transformToSave = { 
          x: newTransform.x, 
          y: newTransform.y, 
          scale: newTransform.scale 
        }
        lastSavedTransformRef.current = transformToSave
        updateCanvasTransformRef.current(transformToSave)
        updateTransformTimeoutRef.current = null
      }, 200)
    }
    
    return () => {
      if (updateTransformTimeoutRef.current) {
        clearTimeout(updateTransformTimeoutRef.current)
      }
    }
  }, [transform.transform.x, transform.transform.y, transform.transform.scale])

  const handlePersonClick = useCallback((personId: string, shiftKey: boolean) => {
    if (interaction.isConnecting) {
      if (!interaction.connectFrom) {
        interaction.setConnectFromPerson(personId)
        toast.info('Click another person to connect')
      } else if (interaction.connectFrom !== personId) {
        const existingConnection = workspaceState.workspace.connections.find(
          c => (c.fromPersonId === interaction.connectFrom && c.toPersonId === personId) ||
               (c.fromPersonId === personId && c.toPersonId === interaction.connectFrom)
        )

        if (!existingConnection) {
          const newConnection: Connection = {
            id: generateId(),
            fromPersonId: interaction.connectFrom,
            toPersonId: personId,
          }
          workspaceState.addConnection(newConnection)
          interaction.enableSelectMode()
          interaction.setConnectFromPerson(null)
          toast.success('Connection created')
        } else {
          toast.info('Connection already exists')
          interaction.enableSelectMode()
          interaction.setConnectFromPerson(null)
        }
      }
    } else {
      if (shiftKey) {
        selection.selectPerson(personId, true)
      } else {
        if (!selection.selectedPersons.includes(personId)) {
          selection.clearSelection()
          selection.selectPerson(personId, false)
        }
      }
    }
  }, [interaction, workspaceState, selection])

  const handlePersonDoubleClick = useCallback((personId: string) => {
    const person = workspaceState.workspace.persons.find(p => p.id === personId)
    if (person) {
      dialogs.openPersonDialog(person)
    }
  }, [workspaceState.workspace.persons, dialogs])

  const handlePhotoDoubleClick = useCallback((personId: string) => {
    const person = workspaceState.workspace.persons.find(p => p.id === personId)
    if (person && person.photo) {
      dialogs.openPhotoViewer(person.photo, person.name)
    }
  }, [workspaceState.workspace.persons, dialogs])

  const handlePersonContextMenu = useCallback((personId: string, e: React.MouseEvent, isEditRequest: boolean) => {
    if (isEditRequest) {
      const person = workspaceState.workspace.persons.find(p => p.id === personId)
      if (person) {
        dialogs.openPersonDialog(person)
      }
    } else {
      if (!selection.selectedPersons.includes(personId)) {
        selection.clearSelection()
        selection.selectPerson(personId, false)
      }
      setContextMenu({
        type: 'person',
        x: e.clientX,
        y: e.clientY,
        targetId: personId
      })
    }
  }, [workspaceState.workspace.persons, dialogs, selection])

  const handleConnectionClick = useCallback((connectionId: string, shiftKey: boolean) => {
    if (shiftKey) {
      selection.selectConnection(connectionId, true)
    } else {
      selection.clearSelection()
      selection.selectConnection(connectionId, false)
    }
  }, [selection])

  const handleConnectionDoubleClick = useCallback((connectionId: string) => {
    const connection = workspaceState.workspace.connections.find(c => c.id === connectionId)
    if (connection) {
      dialogs.openConnectionDialog(connection)
    }
  }, [workspaceState.workspace.connections, dialogs])

  const handleUpdateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    workspaceState.updateConnection(connectionId, updates)
    toast.success('Connection updated')
  }, [workspaceState])

  const handleConnectionContextMenu = useCallback((connectionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!selection.selectedConnections.includes(connectionId)) {
      selection.clearSelection()
      selection.selectConnection(connectionId, false)
    }
    setContextMenu({
      type: 'connection',
      x: e.clientX,
      y: e.clientY,
      targetId: connectionId
    })
  }, [selection])

  const handleCollapseBranch = useCallback((parentId: string, childIds: string[]) => {
    if (childIds.length === 0) {
      toast.info('No persons to collapse')
      return
    }
    
    workspaceState.collapseBranch(parentId, childIds)
    toast.success(`Collapsed ${childIds.length} person${childIds.length > 1 ? 's' : ''} under parent`)
  }, [workspaceState])

  const handleExpandBranch = useCallback((parentId: string) => {
    const collapsedBranches = workspaceState.workspace.collapsedBranches || []
    const branch = collapsedBranches.find(b => b.parentId === parentId)
    const childIds = branch?.collapsedPersonIds || []
    
    if (childIds.length === 0) {
      return
    }
    
    workspaceState.expandBranch(parentId)
    toast.success(`Expanded ${childIds.length} person${childIds.length > 1 ? 's' : ''} from stack`)
  }, [workspaceState])

  const handleExpandBranchFromPerson = useCallback((personId: string) => {
    const collapsedBranches = workspaceState.workspace.collapsedBranches || []
    const branch = collapsedBranches.find(b => b.parentId === personId)
    
    if (branch) {
      handleExpandBranch(personId)
    }
  }, [workspaceState.workspace.collapsedBranches, handleExpandBranch])

  const handleGroupClick = useCallback((groupId: string, shiftKey: boolean) => {
    if (shiftKey) {
      selection.selectGroup(groupId, true)
    } else {
      selection.clearSelection()
      selection.selectGroup(groupId, false)
    }
  }, [selection])

  const handleSavePerson = useCallback((person: Person) => {
    if (dialogs.personDialog.editPerson) {
      workspaceState.replacePerson(person)
      toast.success('Person updated')
    } else {
      workspaceState.addPerson(person)
      toast.success('Person added')
    }
    dialogs.closePersonDialog()
  }, [dialogs.personDialog.editPerson, workspaceState, dialogs])

  const handleDeletePerson = useCallback((personId: string) => {
    workspaceState.deletePerson(personId)
    selection.clearPersonSelection()
    dialogs.closePersonDialog()
    toast.success('Person deleted')
  }, [workspaceState, selection, dialogs])

  const handleDeleteSelectedPersons = useCallback(() => {
    if (selection.selectedPersons.length === 0) return
    workspaceState.deletePersons(selection.selectedPersons)
    selection.clearPersonSelection()
    toast.success('Deleted selected persons')
  }, [selection.selectedPersons, workspaceState, selection])

  const handleSaveGroup = useCallback((group: Group) => {
    const existing = workspaceState.workspace.groups.find(g => g.id === group.id)
    if (existing) {
      workspaceState.updateGroup(group.id, group)
      toast.success('Group updated')
    } else {
      workspaceState.addGroup(group)
      toast.success('Group created')
    }
    dialogs.closeGroupDialog()
  }, [workspaceState, dialogs])

  const handleUpdateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    workspaceState.updateGroup(groupId, updates)
  }, [workspaceState])

  const handleDeleteGroup = useCallback((groupId: string) => {
    workspaceState.deleteGroup(groupId)
    selection.clearGroupSelection()
    toast.success('Group removed')
  }, [workspaceState, selection])

  const handleDeleteSelectedGroups = useCallback(() => {
    if (selection.selectedGroups.length === 0) return
    workspaceState.deleteGroups(selection.selectedGroups)
    selection.clearGroupSelection()
    toast.success('Deleted selected groups')
  }, [selection.selectedGroups, workspaceState, selection])

  const handleDeleteSelectedConnections = useCallback(() => {
    if (selection.selectedConnections.length === 0) return
    workspaceState.deleteConnections(selection.selectedConnections)
    selection.clearConnectionSelection()
    toast.success('Deleted selected connections')
  }, [selection.selectedConnections, workspaceState, selection])

  const handleZoomToFit = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) return

    const bounds = getBounds(workspaceState.workspace.persons)
    if (!bounds) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const padding = 100
    const contentWidth = bounds.maxX - bounds.minX + NODE_WIDTH + padding * 2
    const contentHeight = bounds.maxY - bounds.minY + NODE_HEIGHT + padding * 2

    const scaleX = rect.width / contentWidth
    const scaleY = rect.height / contentHeight
    const scale = Math.min(scaleX, scaleY, 2)

    const centerX = (bounds.minX + bounds.maxX) / 2 + NODE_WIDTH / 2
    const centerY = (bounds.minY + bounds.maxY) / 2 + NODE_HEIGHT / 2

    transform.setTransform({
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale,
    })
  }, [workspaceState.workspace.persons, transform])

  const handleFocusPerson = useCallback((personId: string) => {
    const person = workspaceState.workspace.persons.find(p => p.id === personId)
    if (person && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      transform.setTransform({
        x: rect.width / 2 - (person.x + NODE_WIDTH / 2) * transform.transform.scale,
        y: rect.height / 2 - (person.y + NODE_HEIGHT / 2) * transform.transform.scale,
        scale: transform.transform.scale,
      })
      selection.selectPerson(personId, false)
    }
  }, [workspaceState.workspace.persons, transform, selection])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      transform.startPanning()
      return
    }
    
    if (e.button === 0 && interaction.isSpacebarPressed) {
      e.preventDefault()
      transform.startPanning()
      return
    }
    
    if (e.button === 2) {
      return
    }
    
    if (e.button === 0 && !interaction.isConnecting) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const y = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey
      if (!isMultiSelect) {
        selection.clearSelection()
      }

      interaction.startSelectionDrag(x, y)
    }
  }, [interaction, transform, canvasRef, selection])

  const handleOrganizeByImportance = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = organizeByImportance(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Importance rings layout applied')
  }, [workspaceState, handleZoomToFit])

  const handleHierarchicalView = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const selectedPersonId = selection.selectedPersons.length === 1 
      ? selection.selectedPersons[0] 
      : undefined

    const organized = hierarchicalFromSelected(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections,
      selectedPersonId
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Influence tree layout applied')
  }, [workspaceState, selection.selectedPersons, handleZoomToFit])

  const handleTightenNetwork = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = tightenNetwork(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections,
      workspaceState.workspace.groups
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Group columns layout applied')
  }, [workspaceState, handleZoomToFit])

  const handleSmartArrange = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const selectedPersonId = selection.selectedPersons.length === 1 
      ? selection.selectedPersons[0] 
      : undefined

    const organized = smartArrange(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections,
      selectedPersonId
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Influence tree layout applied')
  }, [workspaceState, selection.selectedPersons, handleZoomToFit])

  const handleImportanceAttitudeArrange = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = arrangeByImportanceAndAttitude(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Layout by importance & attitude applied')
  }, [workspaceState, handleZoomToFit])

  const handleImportanceAdvocateArrange = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = arrangeByImportanceAndAdvocate(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Layout by importance & advocate applied')
  }, [workspaceState, handleZoomToFit])

  const handleCompactLayout = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = compactNetworkLayout(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success('Compact layout applied - network tightened')
  }, [workspaceState, handleZoomToFit])

  const addPersons = useCallback((persons: Person[]) => {
    persons.forEach(person => {
      workspaceState.addPerson(person)
    })
  }, [workspaceState])

  const updatePersonsScore = useCallback((personIds: string[], score: number) => {
    const updates = new Map<string, Partial<Person>>()
    personIds.forEach(id => {
      updates.set(id, { score })
    })
    workspaceState.updatePersonsInBulk(updates)
  }, [workspaceState])

  const nudgePersons = useCallback((personIds: string[], dx: number, dy: number) => {
    const updates = new Map<string, Partial<Person>>()
    personIds.forEach(id => {
      const person = workspaceState.workspace.persons.find(p => p.id === id)
      if (person) {
        updates.set(id, { 
          x: person.x + dx, 
          y: person.y + dy 
        })
      }
    })
    workspaceState.updatePersonsInBulk(updates)
  }, [workspaceState])

  const zoomToArea = useCallback((centerX: number, centerY: number, width: number, height: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const scaleX = rect.width / width
    const scaleY = rect.height / height
    const scale = Math.min(scaleX, scaleY, 2)

    transform.setTransform({
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale,
    })
  }, [transform])

  const handleGroupContextMenu = useCallback((groupId: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!selection.selectedGroups.includes(groupId)) {
      selection.clearSelection()
      selection.selectGroup(groupId, false)
    }
    setContextMenu({
      type: 'group',
      x: e.clientX,
      y: e.clientY,
      targetId: groupId
    })
  }, [selection])

  const handleCopySelected = useCallback(() => {
    const selectedPersonIds = new Set(selection.selectedPersons)
    const persons = workspaceState.workspace.persons.filter(p => selectedPersonIds.has(p.id))
    const connections = workspaceState.workspace.connections.filter(c => 
      selectedPersonIds.has(c.fromPersonId) && selectedPersonIds.has(c.toPersonId)
    )
    setCopiedData({ persons, connections })
    toast.success(`Copied ${persons.length} person${persons.length !== 1 ? 's' : ''}`)
  }, [selection.selectedPersons, workspaceState.workspace.persons, workspaceState.workspace.connections])

  const handlePaste = useCallback((pasteX?: number, pasteY?: number) => {
    if (!copiedData || copiedData.persons.length === 0) {
      toast.info('Nothing to paste')
      return
    }

    let minX = Infinity
    let minY = Infinity
    copiedData.persons.forEach(p => {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
    })

    const offsetX = pasteX !== undefined ? pasteX - minX : 40
    const offsetY = pasteY !== undefined ? pasteY - minY : 40

    const idMap = new Map<string, string>()
    const newPersons: Person[] = copiedData.persons.map(p => {
      const newId = generateId()
      idMap.set(p.id, newId)
      return {
        ...p,
        id: newId,
        x: p.x + offsetX,
        y: p.y + offsetY,
        createdAt: Date.now()
      }
    })

    const newConnections: Connection[] = copiedData.connections.map(c => ({
      ...c,
      id: generateId(),
      fromPersonId: idMap.get(c.fromPersonId) || c.fromPersonId,
      toPersonId: idMap.get(c.toPersonId) || c.toPersonId,
    }))

    newPersons.forEach(p => workspaceState.addPerson(p))
    newConnections.forEach(c => workspaceState.addConnection(c))

    selection.clearSelection()
    selection.selectPersons(newPersons.map(p => p.id))

    toast.success(`Pasted ${newPersons.length} person${newPersons.length !== 1 ? 's' : ''}`)
  }, [copiedData, workspaceState, selection])

  const handleSelectAll = useCallback(() => {
    selection.selectPersons(workspaceState.workspace.persons.map(p => p.id))
    toast.success('All persons selected')
  }, [workspaceState.workspace.persons, selection])

  const handleAddPersonAt = useCallback((x: number, y: number) => {
    const newPerson: Person = {
      id: generateId(),
      name: 'New Person',
      position: '',
      score: 0,
      frameColor: 'white',
      x,
      y,
      createdAt: Date.now()
    }
    workspaceState.addPerson(newPerson)
    selection.clearSelection()
    selection.selectPerson(newPerson.id, false)
    dialogs.openPersonDialog(newPerson)
  }, [workspaceState, selection, dialogs])

  const handleToggleConnectionStyle = useCallback((connectionId: string) => {
    const connection = workspaceState.workspace.connections.find(c => c.id === connectionId)
    if (!connection) return
    
    const newStyle = connection.style === 'dashed' ? 'solid' : 'dashed'
    workspaceState.updateConnection(connectionId, { style: newStyle })
    toast.success(`Connection style changed to ${newStyle}`)
  }, [workspaceState])

  const handleChangeConnectionDirection = useCallback((connectionId: string, direction: 'none' | 'forward' | 'backward' | 'bidirectional') => {
    workspaceState.updateConnection(connectionId, { direction })
    toast.success(`Influence direction updated`)
  }, [workspaceState])

  const handleAutoFitGroup = useCallback((groupId: string) => {
    const group = workspaceState.workspace.groups.find(g => g.id === groupId)
    if (!group) return

    const personsInGroup = workspaceState.workspace.persons.filter(p => {
      const personCenterX = p.x + NODE_WIDTH / 2
      const personCenterY = p.y + NODE_HEIGHT / 2
      return (
        personCenterX >= group.x &&
        personCenterX <= group.x + group.width &&
        personCenterY >= group.y &&
        personCenterY <= group.y + group.height
      )
    })

    if (personsInGroup.length === 0) {
      toast.info('No persons in group to fit')
      return
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    personsInGroup.forEach(p => {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x + NODE_WIDTH > maxX) maxX = p.x + NODE_WIDTH
      if (p.y + NODE_HEIGHT > maxY) maxY = p.y + NODE_HEIGHT
    })

    const padding = 40
    workspaceState.updateGroup(groupId, {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    })
    toast.success('Group resized to fit contents')
  }, [workspaceState])

  const handleRenameGroup = useCallback((groupId: string) => {
    const group = workspaceState.workspace.groups.find(g => g.id === groupId)
    if (group) {
      dialogs.openGroupDialog(group)
    }
  }, [workspaceState.workspace.groups, dialogs])

  const handleInfluenceArrange = useCallback((targetPersonId: string) => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const targetPerson = workspaceState.workspace.persons.find(p => p.id === targetPersonId)
    if (!targetPerson) {
      toast.error('Selected person not found')
      return
    }

    const organized = influenceHierarchyLayout(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections,
      targetPersonId
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleZoomToFit()
      })
    })
    
    toast.success(`Network arranged to show influence paths to ${targetPerson.name}`)
  }, [workspaceState, handleZoomToFit])

  const handleStartConnection = useCallback((personId: string) => {
    const person = workspaceState.workspace.persons.find(p => p.id === personId)
    if (!person) return

    setContextMenu(null)
    
    interaction.startConnectionDrag(personId)
    
    toast.info('Move mouse to another card to create connection')
  }, [workspaceState.workspace.persons, interaction])

  return {
    workspace: workspaceState.workspace,
    selection,
    transform: {
      ...transform,
      zoomToArea,
    },
    interaction,
    dialogs,
    canvasRef,
    contextMenu,
    setContextMenu,
    copiedData,
    handlers: {
      handlePersonClick,
      handlePersonDoubleClick,
      handlePhotoDoubleClick,
      handlePersonContextMenu,
      handleConnectionClick,
      handleConnectionDoubleClick,
      handleUpdateConnection,
      handleConnectionContextMenu,
      handleGroupClick,
      handleGroupContextMenu,
      handleSavePerson,
      handleDeletePerson,
      handleDeleteSelectedPersons,
      handleSaveGroup,
      handleUpdateGroup,
      handleDeleteGroup,
      handleDeleteSelectedGroups,
      handleDeleteSelectedConnections,
      handleZoomToFit,
      handleFocusPerson,
      handleCanvasMouseDown,
      handleOrganizeByImportance,
      handleHierarchicalView,
      handleTightenNetwork,
      handleSmartArrange,
      handleImportanceAttitudeArrange,
      handleImportanceAdvocateArrange,
      handleCompactLayout,
      handleCollapseBranch,
      handleExpandBranch,
      handleExpandBranchFromPerson,
      handleCopySelected,
      handlePaste,
      handleSelectAll,
      handleAddPersonAt,
      handleToggleConnectionStyle,
      handleChangeConnectionDirection,
      handleAutoFitGroup,
      handleRenameGroup,
      handleInfluenceArrange,
      handleStartConnection,
      addPersons,
      updatePersonsScore,
      nudgePersons,
      undo: workspaceState.undo,
      replaceWorkspace: workspaceState.replaceWorkspace,
      updatePersonsInBulk: workspaceState.updatePersonsInBulk,
      updatePerson: workspaceState.updatePerson,
      updateGroup: workspaceState.updateGroup,
      addConnection: workspaceState.addConnection,
      setWorkspace: workspaceState.setWorkspace,
    },
    hasUndo: workspaceState.hasUndo,
  }
}
