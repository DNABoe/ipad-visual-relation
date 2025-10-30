import { useState, useCallback } from 'react'
import type { Person, Connection } from '@/lib/types'

export function useDialogState() {
  const [personDialog, setPersonDialog] = useState<{ open: boolean; editPerson?: Person }>({ open: false })
  const [groupDialog, setGroupDialog] = useState(false)
  const [settingsDialog, setSettingsDialog] = useState(false)
  const [photoViewer, setPhotoViewer] = useState<{ open: boolean; photoUrl?: string; name?: string }>({ open: false })
  const [exportDialog, setExportDialog] = useState(false)
  const [unsavedDialog, setUnsavedDialog] = useState<{ open: boolean; action?: 'new' | 'load' }>({ open: false })
  const [collapseBranchDialog, setCollapseBranchDialog] = useState<{ open: boolean; connection?: Connection }>({ open: false })

  const openPersonDialog = useCallback((editPerson?: Person) => {
    setPersonDialog({ open: true, editPerson })
  }, [])

  const closePersonDialog = useCallback(() => {
    setPersonDialog({ open: false })
  }, [])

  const openGroupDialog = useCallback(() => {
    setGroupDialog(true)
  }, [])

  const closeGroupDialog = useCallback(() => {
    setGroupDialog(false)
  }, [])

  const openSettingsDialog = useCallback(() => {
    setSettingsDialog(true)
  }, [])

  const closeSettingsDialog = useCallback(() => {
    setSettingsDialog(false)
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

  return {
    personDialog,
    groupDialog,
    settingsDialog,
    photoViewer,
    exportDialog,
    unsavedDialog,
    collapseBranchDialog,
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
  }
}
