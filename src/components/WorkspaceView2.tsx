import { useCallback, useEffect, useMemo, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { useWorkspaceController } from '@/hooks/useWorkspaceController'
import { WorkspaceToolbar } from './WorkspaceToolbar'
import { WorkspaceCanvas } from './WorkspaceCanvas'
import { ListPanel } from './ListPanel'
import { PersonDialog } from './PersonDialog'
import { GroupDialog } from './GroupDialog'
import { SettingsDialog } from './SettingsDialog'
import { PhotoViewerDialog } from './PhotoViewerDialog'
import { UnsavedChangesDialog } from './UnsavedChangesDialog'
import { ExportDialog } from './ExportDialog'
import { Toaster } from '@/components/ui/sonner'
import type { Workspace } from '@/lib/types'
import { encryptData } from '@/lib/encryption'

interface WorkspaceViewProps {
  workspace: Workspace
  setWorkspace: (update: Workspace | ((current: Workspace) => Workspace)) => void
  fileName: string
  password: string
  onNewNetwork: () => void
  onLoadNetwork: () => void
  onLogout?: () => void
}

export function WorkspaceView({ workspace, setWorkspace, fileName, password, onNewNetwork, onLoadNetwork, onLogout }: WorkspaceViewProps) {
  const [settings] = useKV<{
    username: string
    passwordHash: string
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
    showMinimap: boolean
  }>('app-settings', {
    username: 'admin',
    passwordHash: '',
    showGrid: true,
    snapToGrid: false,
    gridSize: 20,
    showMinimap: true,
  })

  const [showListPanel, setShowListPanel] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const controller = useWorkspaceController({
    initialWorkspace: workspace,
    settings,
  })

  const currentWorkspaceStr = useMemo(() => JSON.stringify(controller.workspace), [controller.workspace])

  useEffect(() => {
    let isMounted = true
    
    const createDownloadUrl = async () => {
      try {
        const encrypted = await encryptData(currentWorkspaceStr, password)
        const fileData = JSON.stringify(encrypted, null, 2)
        const blob = new Blob([fileData], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        
        if (isMounted) {
          setDownloadUrl(prevUrl => {
            if (prevUrl) {
              URL.revokeObjectURL(prevUrl)
            }
            return url
          })
        } else {
          URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error('Error creating download URL:', error)
      }
    }

    createDownloadUrl()

    return () => {
      isMounted = false
    }
  }, [currentWorkspaceStr, password])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        controller.handlers.undo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (controller.selection.selectedPersons.length > 0) {
          e.preventDefault()
          controller.handlers.handleDeleteSelectedPersons()
        } else if (controller.selection.selectedGroups.length > 0) {
          e.preventDefault()
          controller.handlers.handleDeleteSelectedGroups()
        } else if (controller.selection.selectedConnections.length > 0) {
          e.preventDefault()
          controller.handlers.handleDeleteSelectedConnections()
        }
      } else if (e.key === 'Escape') {
        controller.interaction.enableSelectMode()
        controller.interaction.setConnectFromPerson(null)
        controller.selection.clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [controller])

  const handleUnsavedAction = useCallback(() => {
    if (controller.dialogs.unsavedDialog.action === 'new') {
      onNewNetwork()
    } else if (controller.dialogs.unsavedDialog.action === 'load') {
      onLoadNetwork()
    }
    controller.dialogs.closeUnsavedDialog()
  }, [controller.dialogs, onNewNetwork, onLoadNetwork])

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkspaceToolbar
        fileName={fileName}
        downloadUrl={downloadUrl}
        controller={controller}
        showListPanel={showListPanel}
        setShowListPanel={setShowListPanel}
      />

      <div className="flex-1 flex overflow-hidden">
        {showListPanel && (
          <ListPanel
            persons={controller.workspace.persons}
            groups={controller.workspace.groups}
            selectedPersons={controller.selection.selectedPersons}
            onPersonClick={(id) => controller.handlers.handleFocusPerson(id)}
          />
        )}

        <WorkspaceCanvas
          controller={controller}
        />
      </div>

      <PersonDialog
        open={controller.dialogs.personDialog.open}
        onOpenChange={(open) => {
          if (!open) controller.dialogs.closePersonDialog()
        }}
        onSave={controller.handlers.handleSavePerson}
        onDelete={controller.handlers.handleDeletePerson}
        editPerson={controller.dialogs.personDialog.editPerson}
      />

      <GroupDialog
        open={controller.dialogs.groupDialog}
        onOpenChange={(open) => {
          if (!open) controller.dialogs.closeGroupDialog()
        }}
        onSave={controller.handlers.handleSaveGroup}
      />

      <SettingsDialog
        open={controller.dialogs.settingsDialog}
        onOpenChange={(open) => {
          if (!open) controller.dialogs.closeSettingsDialog()
        }}
        workspace={controller.workspace}
        onImport={controller.handlers.replaceWorkspace}
        onLogout={onLogout}
      />

      {controller.dialogs.photoViewer.photoUrl && (
        <PhotoViewerDialog
          open={controller.dialogs.photoViewer.open}
          onOpenChange={(open) => {
            if (!open) controller.dialogs.closePhotoViewer()
          }}
          photoUrl={controller.dialogs.photoViewer.photoUrl}
          personName={controller.dialogs.photoViewer.name || ''}
        />
      )}

      <UnsavedChangesDialog
        open={controller.dialogs.unsavedDialog.open}
        onOpenChange={(open) => {
          if (!open) controller.dialogs.closeUnsavedDialog()
        }}
        onDiscard={handleUnsavedAction}
        fileName={fileName}
        downloadUrl={downloadUrl}
      />

      <ExportDialog
        open={controller.dialogs.exportDialog}
        onOpenChange={(open) => {
          if (!open) controller.dialogs.closeExportDialog()
        }}
        persons={controller.workspace.persons}
        groups={controller.workspace.groups}
        connections={controller.workspace.connections}
        transform={controller.transform.transform}
        canvasRef={controller.canvasRef}
        selectedPersons={controller.selection.selectedPersons}
      />

      <Toaster />
    </div>
  )
}
