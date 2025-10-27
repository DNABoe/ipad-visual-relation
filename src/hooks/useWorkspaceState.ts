import { useState, useCallback } from 'react'
import type { Workspace, Person, Connection, Group } from '@/lib/types'
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

  const addPerson = useCallback((person: Person) => {
    setWorkspace(prev => ({
      ...prev,
      persons: [...prev.persons, person],
    }))
  }, [])

  const updatePerson = useCallback((personId: string, updates: Partial<Person>) => {
    setWorkspace(prev => {
      const oldPerson = prev.persons.find(p => p.id === personId)
      if (oldPerson) {
        setUndoStack(stack => [...stack, {
          type: 'update-persons',
          persons: [{ ...oldPerson }],
        }])
      }
      return {
        ...prev,
        persons: prev.persons.map(p =>
          p.id === personId ? { ...p, ...updates } : p
        ),
      }
    })
  }, [])

  const replacePerson = useCallback((person: Person) => {
    setWorkspace(prev => {
      const oldPerson = prev.persons.find(p => p.id === person.id)
      if (oldPerson) {
        setUndoStack(stack => [...stack, {
          type: 'update-persons',
          persons: [{ ...oldPerson }],
        }])
      }
      return {
        ...prev,
        persons: prev.persons.map(p => p.id === person.id ? person : p),
      }
    })
  }, [])

  const deletePerson = useCallback((personId: string) => {
    setWorkspace(prev => {
      const personToDelete = prev.persons.find(p => p.id === personId)
      const connectionsToDelete = prev.connections.filter(
        c => c.fromPersonId === personId || c.toPersonId === personId
      )

      if (personToDelete) {
        setUndoStack(stack => [...stack, {
          type: 'delete-persons',
          persons: [personToDelete],
          connections: connectionsToDelete,
        }])
      }

      return {
        ...prev,
        persons: prev.persons.filter(p => p.id !== personId),
        connections: prev.connections.filter(
          c => c.fromPersonId !== personId && c.toPersonId !== personId
        ),
      }
    })
  }, [])

  const deletePersons = useCallback((personIds: string[]) => {
    setWorkspace(prev => {
      const personsToDelete = prev.persons.filter(p => personIds.includes(p.id))
      const connectionsToDelete = prev.connections.filter(
        c => personIds.includes(c.fromPersonId) || personIds.includes(c.toPersonId)
      )

      if (personsToDelete.length > 0) {
        setUndoStack(stack => [...stack, {
          type: 'delete-persons',
          persons: personsToDelete,
          connections: connectionsToDelete,
        }])
      }

      return {
        ...prev,
        persons: prev.persons.filter(p => !personIds.includes(p.id)),
        connections: prev.connections.filter(
          c => !personIds.includes(c.fromPersonId) && !personIds.includes(c.toPersonId)
        ),
      }
    })
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

  const deleteConnection = useCallback((connectionId: string) => {
    setWorkspace(prev => {
      const connectionToDelete = prev.connections.find(c => c.id === connectionId)
      if (connectionToDelete) {
        setUndoStack(stack => [...stack, {
          type: 'delete-connections',
          connections: [connectionToDelete],
        }])
      }
      return {
        ...prev,
        connections: prev.connections.filter(c => c.id !== connectionId),
      }
    })
  }, [])

  const deleteConnections = useCallback((connectionIds: string[]) => {
    setWorkspace(prev => {
      const connectionsToDelete = prev.connections.filter(c => connectionIds.includes(c.id))
      if (connectionsToDelete.length > 0) {
        setUndoStack(stack => [...stack, {
          type: 'delete-connections',
          connections: connectionsToDelete,
        }])
      }
      return {
        ...prev,
        connections: prev.connections.filter(c => !connectionIds.includes(c.id)),
      }
    })
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
    setWorkspace(prev => {
      const groupToDelete = prev.groups.find(g => g.id === groupId)
      if (groupToDelete) {
        setUndoStack(stack => [...stack, {
          type: 'delete-groups',
          groups: [groupToDelete],
        }])
      }
      return {
        ...prev,
        groups: prev.groups.filter(g => g.id !== groupId),
      }
    })
  }, [])

  const deleteGroups = useCallback((groupIds: string[]) => {
    setWorkspace(prev => {
      const groupsToDelete = prev.groups.filter(g => groupIds.includes(g.id))
      if (groupsToDelete.length > 0) {
        setUndoStack(stack => [...stack, {
          type: 'delete-groups',
          groups: groupsToDelete,
        }])
      }
      return {
        ...prev,
        groups: prev.groups.filter(g => !groupIds.includes(g.id)),
      }
    })
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

  const updatePersonsInBulk = useCallback((updates: Map<string, Partial<Person>>) => {
    setWorkspace(prev => ({
      ...prev,
      persons: prev.persons.map(p => {
        const update = updates.get(p.id)
        return update ? { ...p, ...update } : p
      }),
    }))
  }, [])

  const replaceWorkspace = useCallback((newWorkspace: Workspace) => {
    setWorkspace(newWorkspace)
    setUndoStack([])
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
    deleteConnection,
    deleteConnections,
    addGroup,
    updateGroup,
    deleteGroup,
    deleteGroups,
    undo,
    updatePersonsInBulk,
    replaceWorkspace,
    hasUndo: undoStack.length > 0,
  }
}
