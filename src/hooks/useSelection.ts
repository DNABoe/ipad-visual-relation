import { useState, useCallback } from 'react'

export type SelectionType = 'person' | 'group' | 'connection'

interface Selection {
  personIds: string[]
  groupIds: string[]
  connectionIds: string[]
}

export function useSelection() {
  const [selection, setSelection] = useState<Selection>({
    personIds: [],
    groupIds: [],
    connectionIds: [],
  })

  const selectPerson = useCallback((personId: string, multi: boolean = false) => {
    setSelection(prev => ({
      ...prev,
      personIds: multi ? (prev.personIds.includes(personId) ? prev.personIds.filter(id => id !== personId) : [...prev.personIds, personId]) : [personId],
    }))
  }, [])

  const selectGroup = useCallback((groupId: string, multi: boolean = false) => {
    setSelection(prev => ({
      ...prev,
      groupIds: multi ? (prev.groupIds.includes(groupId) ? prev.groupIds.filter(id => id !== groupId) : [...prev.groupIds, groupId]) : [groupId],
    }))
  }, [])

  const selectConnection = useCallback((connectionId: string, multi: boolean = false) => {
    setSelection(prev => ({
      ...prev,
      connectionIds: multi ? (prev.connectionIds.includes(connectionId) ? prev.connectionIds.filter(id => id !== connectionId) : [...prev.connectionIds, connectionId]) : [connectionId],
    }))
  }, [])

  const selectPersons = useCallback((personIds: string[]) => {
    setSelection(prev => ({ ...prev, personIds }))
  }, [])

  const selectGroups = useCallback((groupIds: string[]) => {
    setSelection(prev => ({ ...prev, groupIds }))
  }, [])

  const selectConnections = useCallback((connectionIds: string[]) => {
    setSelection(prev => ({ ...prev, connectionIds }))
  }, [])

  const clearSelection = useCallback(() => {
    setSelection({
      personIds: [],
      groupIds: [],
      connectionIds: [],
    })
  }, [])

  const clearPersonSelection = useCallback(() => {
    setSelection(prev => ({ ...prev, personIds: [] }))
  }, [])

  const clearGroupSelection = useCallback(() => {
    setSelection(prev => ({ ...prev, groupIds: [] }))
  }, [])

  const clearConnectionSelection = useCallback(() => {
    setSelection(prev => ({ ...prev, connectionIds: [] }))
  }, [])

  return {
    selectedPersons: selection.personIds,
    selectedGroups: selection.groupIds,
    selectedConnections: selection.connectionIds,
    selectPerson,
    selectGroup,
    selectConnection,
    selectPersons,
    selectGroups,
    selectConnections,
    clearSelection,
    clearPersonSelection,
    clearGroupSelection,
    clearConnectionSelection,
    hasSelection: selection.personIds.length > 0 || selection.groupIds.length > 0 || selection.connectionIds.length > 0,
  }
}
