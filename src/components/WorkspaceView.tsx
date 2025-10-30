import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { CollapseBranchDialog } from './CollapseBranchDialog'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type { Workspace, Person, AppSettings } from '@/lib/types'
import { encryptData } from '@/lib/encryption'
import { searchPersons, findShortestPath, findLeafTerminatedBranches, type SearchCriteria } from '@/lib/search'
import { generateId, getBounds, serializeWorkspace } from '@/lib/helpers'
import { DEFAULT_APP_SETTINGS } from '@/lib/constants'
import type { SearchBarRef } from './SearchBar'

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
  const [settings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)

  const [showListPanel, setShowListPanel] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [highlightedPersonIds, setHighlightedPersonIds] = useState<Set<string>>(new Set())
  const [searchActive, setSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const searchBarRef = useRef<SearchBarRef>(null!)
  const [shortestPathPersonIds, setShortestPathPersonIds] = useState<string[]>([])
  const [isShortestPathActive, setIsShortestPathActive] = useState(false)

  const controller = useWorkspaceController({
    initialWorkspace: workspace,
    settings,
  })

  const currentWorkspaceStr = useMemo(() => serializeWorkspace(controller.workspace), [controller.workspace])

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
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.key === ' ' && !isInputFocused) {
        e.preventDefault()
        controller.interaction.setSpacebarPressed(true)
        return
      }

      if (e.key === '?' && !isInputFocused) {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
        return
      }

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault()
        searchBarRef.current?.focus()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (downloadUrl) {
          const link = document.createElement('a')
          link.href = downloadUrl
          const downloadFileName = fileName.endsWith('.enc.json') 
            ? fileName 
            : `${fileName}.enc.json`
          link.download = downloadFileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          toast.success('Network saved successfully!')
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        controller.handlers.undo()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isInputFocused) {
        e.preventDefault()
        if (controller.selection.selectedPersons.length > 0) {
          const selectedPersons = controller.workspace.persons.filter(p => 
            controller.selection.selectedPersons.includes(p.id)
          )
          
          const duplicates: Person[] = selectedPersons.map(person => ({
            ...person,
            id: generateId(),
            x: person.x + 50,
            y: person.y + 50,
            createdAt: Date.now(),
          }))
          
          controller.handlers.addPersons(duplicates)
          controller.selection.selectPersons(duplicates.map(p => p.id))
          
          toast.success(`Duplicated ${duplicates.length} person${duplicates.length === 1 ? '' : 's'}`)
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !isInputFocused) {
        e.preventDefault()
        if (controller.selection.selectedPersons.length > 1) {
          controller.dialogs.openGroupDialog()
        } else {
          toast.error('Select at least 2 persons to create a group')
        }
        return
      }

      if (e.key === 'f' && !isInputFocused) {
        e.preventDefault()
        if (controller.selection.selectedPersons.length === 1) {
          controller.handlers.handleFocusPerson(controller.selection.selectedPersons[0])
        } else if (controller.selection.selectedPersons.length > 1) {
          const selectedPersons = controller.workspace.persons.filter(p =>
            controller.selection.selectedPersons.includes(p.id)
          )
          const bounds = getBounds(selectedPersons)
          if (bounds) {
            const centerX = (bounds.minX + bounds.maxX) / 2
            const centerY = (bounds.minY + bounds.maxY) / 2
            const width = bounds.maxX - bounds.minX + 200
            const height = bounds.maxY - bounds.minY + 200
            
            controller.transform.zoomToArea(centerX, centerY, width, height)
          }
        }
        return
      }

      if (['1', '2', '3', '4', '5'].includes(e.key) && !isInputFocused) {
        const score = parseInt(e.key)
        if (controller.selection.selectedPersons.length > 0) {
          e.preventDefault()
          controller.handlers.updatePersonsScore(controller.selection.selectedPersons, score)
          toast.success(`Set score to ${score} for ${controller.selection.selectedPersons.length} person${controller.selection.selectedPersons.length === 1 ? '' : 's'}`)
        }
        return
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isInputFocused) {
        if (controller.selection.selectedPersons.length > 0) {
          e.preventDefault()
          const gridSize = settings?.gridSize ?? 20
          const nudgeAmount = e.shiftKey ? gridSize * 5 : gridSize
          
          let dx = 0
          let dy = 0
          
          if (e.key === 'ArrowLeft') dx = -nudgeAmount
          if (e.key === 'ArrowRight') dx = nudgeAmount
          if (e.key === 'ArrowUp') dy = -nudgeAmount
          if (e.key === 'ArrowDown') dy = nudgeAmount
          
          controller.handlers.nudgePersons(controller.selection.selectedPersons, dx, dy)
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInputFocused) {
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
        }
        return
      }

      if (e.key === 'Escape') {
        controller.interaction.enableSelectMode()
        controller.interaction.setConnectFromPerson(null)
        controller.selection.clearSelection()
        return
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        controller.interaction.setSpacebarPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [controller, settings, downloadUrl, fileName])

  const handleUnsavedAction = useCallback(() => {
    if (controller.dialogs.unsavedDialog.action === 'new') {
      onNewNetwork()
    } else if (controller.dialogs.unsavedDialog.action === 'load') {
      onLoadNetwork()
    }
    controller.dialogs.closeUnsavedDialog()
  }, [controller.dialogs, onNewNetwork, onLoadNetwork])

  const handleSaveAndContinue = useCallback(() => {
    toast.success('Network saved successfully!')
    handleUnsavedAction()
  }, [handleUnsavedAction])

  const handleSearch = useCallback((criteria: SearchCriteria) => {
    const matches = searchPersons(controller.workspace.persons, criteria)
    const matchIds = new Set(matches.map(p => p.id))
    setHighlightedPersonIds(matchIds)
    setSearchActive(true)
    setSearchQuery(criteria.query || '')
    
    if (matches.length === 0) {
      toast.info('No persons match the search criteria')
    } else {
      toast.success(`Found ${matches.length} person${matches.length === 1 ? '' : 's'}`)
    }
  }, [controller.workspace.persons])

  const handleClearSearch = useCallback(() => {
    setHighlightedPersonIds(new Set())
    setSearchActive(false)
    setSearchQuery('')
    setIsShortestPathActive(false)
    setShortestPathPersonIds([])
  }, [])

  const handleFindPath = useCallback(() => {
    if (isShortestPathActive) {
      setIsShortestPathActive(false)
      setShortestPathPersonIds([])
      setHighlightedPersonIds(new Set())
      setSearchActive(false)
      controller.selection.clearSelection()
      setCanvasKey(prev => prev + 1)
      toast.info('Shortest path view cleared')
      return
    }

    if (controller.selection.selectedPersons.length !== 2) {
      toast.error('Please select exactly 2 persons')
      return
    }

    const [from, to] = controller.selection.selectedPersons
    const path = findShortestPath(
      from,
      to,
      controller.workspace.persons,
      controller.workspace.connections
    )

    if (!path) {
      toast.error('No path found between selected persons')
      setIsShortestPathActive(false)
      setShortestPathPersonIds([])
    } else {
      const pathIds = new Set(path)
      setHighlightedPersonIds(pathIds)
      setSearchActive(true)
      setIsShortestPathActive(true)
      setShortestPathPersonIds(path)
      
      const fromPerson = controller.workspace.persons.find(p => p.id === from)
      const toPerson = controller.workspace.persons.find(p => p.id === to)
      
      if (path.length === 2) {
        toast.success(`${fromPerson?.name} and ${toPerson?.name} are directly connected`)
      } else {
        toast.success(`Found path with ${path.length - 1} connection${path.length - 1 === 1 ? '' : 's'} (${path.length} persons)`)
      }
    }
  }, [isShortestPathActive, controller.selection, controller.workspace.persons, controller.workspace.connections, setCanvasKey])

  const canFindPath = controller.selection.selectedPersons.length === 2

  const handleRefreshCanvas = useCallback(() => {
    setCanvasKey(prev => prev + 1)
    toast.success('Canvas refreshed')
  }, [])

  useEffect(() => {
    if (showListPanel !== undefined) {
      const timeoutId = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
        setCanvasKey(prev => prev + 1)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [showListPanel])

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkspaceToolbar
        fileName={fileName}
        downloadUrl={downloadUrl}
        controller={controller}
        showListPanel={showListPanel}
        setShowListPanel={setShowListPanel}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onFindPath={handleFindPath}
        canFindPath={canFindPath}
        isShortestPathActive={isShortestPathActive}
        searchBarRef={searchBarRef}
        onRefreshCanvas={handleRefreshCanvas}
      />

      <div className="flex-1 flex overflow-hidden">
        {showListPanel && (
          <ListPanel
            persons={controller.workspace.persons}
            groups={controller.workspace.groups}
            selectedPersons={controller.selection.selectedPersons}
            onPersonClick={(id) => controller.handlers.handleFocusPerson(id)}
            searchQuery={searchQuery}
            highlightedPersonIds={highlightedPersonIds}
          />
        )}

        <WorkspaceCanvas
          key={canvasKey}
          controller={controller}
          highlightedPersonIds={highlightedPersonIds}
          searchActive={searchActive}
          shortestPathPersonIds={shortestPathPersonIds}
          isShortestPathActive={isShortestPathActive}
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
        onRefreshCanvas={handleRefreshCanvas}
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
        onSaveAndContinue={handleSaveAndContinue}
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

      <KeyboardShortcutsDialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      />

      <CollapseBranchDialog
        open={controller.dialogs.collapseBranchDialog.open}
        onOpenChange={(open) => {
          if (!open) controller.dialogs.closeCollapseBranchDialog()
        }}
        connection={controller.dialogs.collapseBranchDialog.connection || null}
        persons={controller.workspace.persons}
        connections={controller.workspace.connections}
        onConfirm={controller.handlers.handleCollapseBranch}
      />

      <Toaster />
    </div>
  )
}
