import { useState, useCallback, useEffect, useRef } from 'react'
import type { Workspace, Person, Connection, Group, ViewTransform } from '@/lib/types'
import { toast } from 'sonner'

interface UndoAction {
  type: 'delete-persons' | 'delete-groups' | 'delete-connections' | 'add-persons' | 'add-groups' | 'add-connections' | 'update-persons'
  persons?: Person[]
  groups?: Group[]
  connections?: Connection[]
  previousPersons?: Person[]
}

export function useWorkspaceState(initialWorkspace: Workspace) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const initialWorkspaceRef = useRef<string>(JSON.stringify(initialWorkspace))

  useEffect(() => {
    const newInitialStr = JSON.stringify(initialWorkspace)
    if (newInitialStr !== initialWorkspaceRef.current) {
      initialWorkspaceRef.current = newInitialStr
      setWorkspace(initialWorkspace)
      setUndoStack([])
    }
  }, [initialWorkspace])

  const addPerson = useCallback((person: Person) => {
    setWorkspace(prev => ({
      ...prev,
      persons: [...prev.persons, person],
    }))
  }, [])

  const updatePerson = useCallback((personId: string, updates: Partial<Person>) => {
    let oldPerson: Person | undefined
    setWorkspace(prev => {
      oldPerson = prev.persons.find(p => p.id === personId)
      return {
        ...prev,
        persons: prev.persons.map(p =>
          p.id === personId ? { ...p, ...updates } : p
        ),
      }
    })
    if (oldPerson) {
      setUndoStack(stack => [...stack, {
        type: 'update-persons',
        persons: [{ ...oldPerson! }],
      }])
    }
  }, [])

  const replacePerson = useCallback((person: Person) => {
    let oldPerson: Person | undefined
    setWorkspace(prev => {
      oldPerson = prev.persons.find(p => p.id === person.id)
      return {
        ...prev,
        persons: prev.persons.map(p => p.id === person.id ? person : p),
      }
    })
    if (oldPerson) {
      setUndoStack(stack => [...stack, {
        type: 'update-persons',
        persons: [{ ...oldPerson! }],
      }])
    }
  }, [])

  const deletePerson = useCallback((personId: string) => {
    let personToDelete: Person | undefined
    let connectionsToDelete: Connection[] = []
    
    setWorkspace(prev => {
      personToDelete = prev.persons.find(p => p.id === personId)
      connectionsToDelete = prev.connections.filter(
        c => c.fromPersonId === personId || c.toPersonId === personId
      )

      return {
        ...prev,
        persons: prev.persons.filter(p => p.id !== personId),
        connections: prev.connections.filter(
          c => c.fromPersonId !== personId && c.toPersonId !== personId
        ),
      }
    })
    
    if (personToDelete) {
      setUndoStack(stack => [...stack, {
        type: 'delete-persons',
        persons: [personToDelete!],
        connections: connectionsToDelete,
      }])
    }
  }, [])

  const deletePersons = useCallback((personIds: string[]) => {
    let personsToDelete: Person[] = []
    let connectionsToDelete: Connection[] = []
    
    setWorkspace(prev => {
      personsToDelete = prev.persons.filter(p => personIds.includes(p.id))
      connectionsToDelete = prev.connections.filter(
        c => personIds.includes(c.fromPersonId) || personIds.includes(c.toPersonId)
      )

      return {
        ...prev,
        persons: prev.persons.filter(p => !personIds.includes(p.id)),
        connections: prev.connections.filter(
          c => !personIds.includes(c.fromPersonId) && !personIds.includes(c.toPersonId)
        ),
      }
    })
    
    if (personsToDelete.length > 0) {
      setUndoStack(stack => [...stack, {
        type: 'delete-persons',
        persons: personsToDelete,
        connections: connectionsToDelete,
      }])
    }
  }, [])

  const addConnection = useCallback((connection: Connection) => {
    setWorkspace(prev => {
      const exists = prev.connections.find(
        c => (c.fromPersonId === connection.fromPersonId && c.toPersonId === connection.toPersonId) ||
             (c.fromPersonId === connection.toPersonId && c.toPersonId === connection.fromPersonId)
      )
      if (exists) {
        return prev
      }
      return {
        ...prev,
        connections: [...prev.connections, connection],
      }
    })
  }, [])

  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setWorkspace(prev => ({
      ...prev,
      connections: prev.connections.map(c =>
        c.id === connectionId ? { ...c, ...updates } : c
      ),
    }))
  }, [])

  const deleteConnection = useCallback((connectionId: string) => {
    let connectionToDelete: Connection | undefined
    
    setWorkspace(prev => {
      connectionToDelete = prev.connections.find(c => c.id === connectionId)
      return {
        ...prev,
        connections: prev.connections.filter(c => c.id !== connectionId),
      }
    })
    
    if (connectionToDelete) {
      setUndoStack(stack => [...stack, {
        type: 'delete-connections',
        connections: [connectionToDelete!],
      }])
    }
  }, [])

  const deleteConnections = useCallback((connectionIds: string[]) => {
    let connectionsToDelete: Connection[] = []
    
    setWorkspace(prev => {
      connectionsToDelete = prev.connections.filter(c => connectionIds.includes(c.id))
      return {
        ...prev,
        connections: prev.connections.filter(c => !connectionIds.includes(c.id)),
      }
    })
    
    if (connectionsToDelete.length > 0) {
      setUndoStack(stack => [...stack, {
        type: 'delete-connections',
        connections: connectionsToDelete,
      }])
    }
  }, [])

  const addGroup = useCallback((group: Group) => {
    setWorkspace(prev => ({
      ...prev,
      groups: [...prev.groups, group],
    }))
  }, [])

  const updateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    setWorkspace(prev => ({
      ...prev,
      groups: prev.groups.map(g =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
    }))
  }, [])

  const deleteGroup = useCallback((groupId: string) => {
    let groupToDelete: Group | undefined
    
    setWorkspace(prev => {
      groupToDelete = prev.groups.find(g => g.id === groupId)
      return {
        ...prev,
        groups: prev.groups.filter(g => g.id !== groupId),
      }
    })
    
    if (groupToDelete) {
      setUndoStack(stack => [...stack, {
        type: 'delete-groups',
        groups: [groupToDelete!],
      }])
    }
  }, [])

  const deleteGroups = useCallback((groupIds: string[]) => {
    let groupsToDelete: Group[] = []
    
    setWorkspace(prev => {
      groupsToDelete = prev.groups.filter(g => groupIds.includes(g.id))
      return {
        ...prev,
        groups: prev.groups.filter(g => !groupIds.includes(g.id)),
      }
    })
    
    if (groupsToDelete.length > 0) {
      setUndoStack(stack => [...stack, {
        type: 'delete-groups',
        groups: groupsToDelete,
      }])
    }
  }, [])

  const undo = useCallback(() => {
    if (undoStack.length === 0) {
      toast.info('Nothing to undo')
      return
    }

    const lastAction = undoStack[undoStack.length - 1]

    if (lastAction.type === 'delete-persons') {
      setWorkspace(prev => ({
        ...prev,
        persons: [...prev.persons, ...(lastAction.persons || [])],
        connections: [...prev.connections, ...(lastAction.connections || [])],
      }))
      toast.success('Restored deleted persons')
    } else if (lastAction.type === 'delete-groups') {
      setWorkspace(prev => ({
        ...prev,
        groups: [...prev.groups, ...(lastAction.groups || [])],
      }))
      toast.success('Restored deleted groups')
    } else if (lastAction.type === 'delete-connections') {
      setWorkspace(prev => ({
        ...prev,
        connections: [...prev.connections, ...(lastAction.connections || [])],
      }))
      toast.success('Restored deleted connections')
    } else if (lastAction.type === 'update-persons' && lastAction.persons) {
      setWorkspace(prev => ({
        ...prev,
        persons: prev.persons.map(p => {
          const restored = lastAction.persons?.find(restored => restored.id === p.id)
          return restored || p
        }),
      }))
      toast.success('Restored previous state')
    }

    setUndoStack(prev => prev.slice(0, -1))
  }, [undoStack])

  const updatePersonsInBulk = useCallback((updates: Map<string, Partial<Person>>, skipUndo = false) => {
    let previousPersons: Person[] = []
    
    setWorkspace(prev => {
      if (!skipUndo) {
        previousPersons = prev.persons
          .filter(p => updates.has(p.id))
          .map(p => ({ ...p }))
      }

      const newPersons = prev.persons.map(p => {
        const update = updates.get(p.id)
        if (!update) return p
        
        let hasChanges = false
        for (const key in update) {
          if (update[key as keyof Person] !== p[key as keyof Person]) {
            hasChanges = true
            break
          }
        }
        
        return hasChanges ? { ...p, ...update } : p
      })

      return {
        ...prev,
        persons: newPersons,
      }
    })
    
    if (!skipUndo && previousPersons.length > 0) {
      setUndoStack(stack => [...stack, {
        type: 'update-persons',
        persons: previousPersons,
      }])
    }
  }, [])

  const replaceWorkspace = useCallback((newWorkspace: Workspace) => {
    setWorkspace(newWorkspace)
    setUndoStack([])
  }, [])

  const collapseBranch = useCallback((parentId: string, collapsedPersonIds: string[]) => {
    setWorkspace(prev => {
      const collapsedBranches = prev.collapsedBranches || []
      
      const existingBranchIndex = collapsedBranches.findIndex(b => b.parentId === parentId)
      
      const parent = prev.persons.find(p => p.id === parentId)
      if (!parent) return prev
      
      const parentPositionAtCollapse = { x: parent.x, y: parent.y }
      
      const newBranch = { parentId, collapsedPersonIds, parentPositionAtCollapse }
      
      let newCollapsed: typeof collapsedBranches
      if (existingBranchIndex >= 0) {
        newCollapsed = [...collapsedBranches]
        const existingIds = new Set(collapsedBranches[existingBranchIndex].collapsedPersonIds)
        const newIds = collapsedPersonIds.filter(id => !existingIds.has(id))
        
        newCollapsed[existingBranchIndex] = {
          ...newBranch,
          collapsedPersonIds: [...collapsedBranches[existingBranchIndex].collapsedPersonIds, ...newIds]
        }
      } else {
        newCollapsed = [...collapsedBranches, newBranch]
      }
      
      return {
        ...prev,
        collapsedBranches: newCollapsed,
        persons: prev.persons.map(p => 
          collapsedPersonIds.includes(p.id) 
            ? { ...p, hidden: true }
            : p
        ),
      }
    })
  }, [])

  const expandBranch = useCallback((parentId: string) => {
    setWorkspace(prev => {
      const collapsedBranches = prev.collapsedBranches || []
      const branch = collapsedBranches.find(b => b.parentId === parentId)
      const branchPersonIds = branch?.collapsedPersonIds || []
      
      if (!branch) return prev
      
      const parent = prev.persons.find(p => p.id === parentId)
      if (!parent) return prev
      
      const dx = parent.x - branch.parentPositionAtCollapse.x
      const dy = parent.y - branch.parentPositionAtCollapse.y
      
      const newCollapsed = collapsedBranches.filter(b => b.parentId !== parentId)
      
      return {
        ...prev,
        collapsedBranches: newCollapsed,
        persons: prev.persons.map(p => {
          if (branchPersonIds.includes(p.id)) {
            return { ...p, hidden: false, x: p.x + dx, y: p.y + dy }
          }
          return p
        }),
      }
    })
  }, [])

  const updateCanvasTransform = useCallback((transform: ViewTransform) => {
    setWorkspace(prev => ({
      ...prev,
      canvasTransform: transform,
    }))
  }, [])

  return {
    workspace,
    setWorkspace,
    addPerson,
    updatePerson,
    replacePerson,
    deletePerson,
    deletePersons,
    addConnection,
    updateConnection,
    deleteConnection,
    deleteConnections,
    addGroup,
    updateGroup,
    deleteGroup,
    deleteGroups,
    undo,
    updatePersonsInBulk,
    replaceWorkspace,
    collapseBranch,
    expandBranch,
    updateCanvasTransform,
    hasUndo: undoStack.length > 0,
  }
}
