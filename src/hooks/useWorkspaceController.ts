import { useCallback, useRef } from 'react'
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
  smartArrange
} from '@/lib/layoutAlgorithms'

interface UseWorkspaceControllerOptions {
  initialWorkspace: Workspace
}

export function useWorkspaceController({ initialWorkspace }: UseWorkspaceControllerOptions) {
  const workspaceState = useWorkspaceState(initialWorkspace)
  const selection = useSelection()
  const transform = useCanvasTransform()
  const interaction = useInteractionState()
  const dialogs = useDialogState()
  const canvasRef = useRef<HTMLDivElement>(null)

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
      selection.selectPerson(personId, shiftKey)
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
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const mouseY = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      interaction.startConnectionDrag(personId, mouseX, mouseY)
      toast.info('Drag to another person to connect')
    }
  }, [workspaceState.workspace.persons, dialogs, transform.transform, interaction])

  const handleConnectionClick = useCallback((connectionId: string, shiftKey: boolean) => {
    selection.selectConnection(connectionId, shiftKey)
  }, [selection])

  const handleConnectionContextMenu = useCallback((connectionId: string, e: React.MouseEvent) => {
    e.preventDefault()
    selection.selectConnection(connectionId, false)
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
    selection.selectGroup(groupId, shiftKey)
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
    workspaceState.addGroup(group)
    dialogs.closeGroupDialog()
    toast.success('Group created')
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
    if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && interaction.isSpacebarPressed)) {
      e.preventDefault()
      transform.startPanning()
    } else if (e.button === 0 && !interaction.isConnecting) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const y = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      interaction.startSelectionDrag(x, y)
    }
  }, [interaction.isConnecting, interaction.isSpacebarPressed, transform, interaction])

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
    
    setTimeout(() => {
      handleZoomToFit()
    }, 50)
    
    toast.success('Force-directed layout applied - connections minimized')
  }, [workspaceState, handleZoomToFit])

  const handleHierarchicalView = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = hierarchicalFromSelected(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    setTimeout(() => {
      handleZoomToFit()
    }, 50)
    
    toast.success('Hierarchical tree layout applied')
  }, [workspaceState, handleZoomToFit])

  const handleTightenNetwork = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = tightenNetwork(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    setTimeout(() => {
      handleZoomToFit()
    }, 50)
    
    toast.success('Circular cluster layout applied')
  }, [workspaceState, handleZoomToFit])

  const handleSmartArrange = useCallback(() => {
    if (workspaceState.workspace.persons.length === 0) {
      toast.info('No persons to organize')
      return
    }

    const organized = smartArrange(
      workspaceState.workspace.persons,
      workspaceState.workspace.connections
    )
    
    const updates = new Map<string, Partial<Person>>()
    organized.forEach(person => {
      updates.set(person.id, { x: person.x, y: person.y })
    })
    
    workspaceState.updatePersonsInBulk(updates)
    
    setTimeout(() => {
      handleZoomToFit()
    }, 50)
    
    toast.success('Force-directed layout applied - connections minimized')
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
    handlers: {
      handlePersonClick,
      handlePersonDoubleClick,
      handlePhotoDoubleClick,
      handlePersonContextMenu,
      handleConnectionClick,
      handleConnectionContextMenu,
      handleGroupClick,
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
      handleCollapseBranch,
      handleExpandBranch,
      handleExpandBranchFromPerson,
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
