import { useState, useCallback } from 'react'
import type { Person, Connection, Group } from '@/lib/types'

export function useDialogState() {
  const [personDialog, setPersonDialog] = useState<{ open: boolean; editPerson?: Person }>({ open: false })
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; editGroup?: Group }>({ open: false })
  const [settingsDialog, setSettingsDialog] = useState<{ open: boolean; initialTab?: string }>({ open: false })
  const [photoViewer, setPhotoViewer] = useState<{ open: boolean; photoUrl?: string; name?: string }>({ open: false })
  const [exportDialog, setExportDialog] = useState(false)
  const [unsavedDialog, setUnsavedDialog] = useState<{ open: boolean; action?: 'new' | 'load' }>({ open: false })
  const [collapseBranchDialog, setCollapseBranchDialog] = useState<{ open: boolean; connection?: Connection }>({ open: false })
  const [connectionDialog, setConnectionDialog] = useState<{ open: boolean; connection?: Connection }>({ open: false })

  const openPersonDialog = useCallback((editPerson?: Person) => {
    setPersonDialog({ open: true, editPerson })
  }, [])

  const closePersonDialog = useCallback(() => {
    setPersonDialog({ open: false })
  }, [])

  const openGroupDialog = useCallback((editGroup?: Group) => {
    setGroupDialog({ open: true, editGroup })
  }, [])

  const closeGroupDialog = useCallback(() => {
    setGroupDialog({ open: false })
  }, [])

  const openSettingsDialog = useCallback((initialTab?: string) => {
    setSettingsDialog({ open: true, initialTab })
  }, [])

  const closeSettingsDialog = useCallback(() => {
    setSettingsDialog({ open: false })
  }, [])

  const openPhotoViewer = useCallback((photoUrl: string, name: string) => {
    setPhotoViewer({ open: true, photoUrl, name })
  }, [])

  const closePhotoViewer = useCallback(() => {
    setPhotoViewer({ open: false })
  }, [])

  const openExportDialog = useCallback(() => {
    setExportDialog(true)
  }, [])

  const closeExportDialog = useCallback(() => {
    setExportDialog(false)
  }, [])

  const openUnsavedDialog = useCallback((action: 'new' | 'load') => {
    setUnsavedDialog({ open: true, action })
  }, [])

  const closeUnsavedDialog = useCallback(() => {
    setUnsavedDialog({ open: false })
  }, [])

  const openCollapseBranchDialog = useCallback((connection: Connection) => {
    setCollapseBranchDialog({ open: true, connection })
  }, [])

  const closeCollapseBranchDialog = useCallback(() => {
    setCollapseBranchDialog({ open: false })
  }, [])

  const openConnectionDialog = useCallback((connection: Connection) => {
    setConnectionDialog({ open: true, connection })
  }, [])

  const closeConnectionDialog = useCallback(() => {
    setConnectionDialog({ open: false })
  }, [])

  return {
    personDialog,
    groupDialog,
    settingsDialog,
    photoViewer,
    exportDialog,
    unsavedDialog,
    collapseBranchDialog,
    connectionDialog,
    openPersonDialog,
    closePersonDialog,
    openGroupDialog,
    closeGroupDialog,
    openSettingsDialog,
    closeSettingsDialog,
    openPhotoViewer,
    closePhotoViewer,
    openExportDialog,
    closeExportDialog,
    openUnsavedDialog,
    closeUnsavedDialog,
    openCollapseBranchDialog,
    closeCollapseBranchDialog,
    openConnectionDialog,
    closeConnectionDialog,
  }
}
