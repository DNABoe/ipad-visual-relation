import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Logo } from './Logo'
import { SearchBar, type SearchBarRef } from './SearchBar'
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
  X,
  TreeStructure,
  Target,
  FilePlus,
  FolderOpen,
  ArrowCounterClockwise,
  UserMinus,
  Trash,
  LinkBreak,
  Export,
  DownloadSimple,
  CirclesThree,
  ArrowsInCardinal,
  Crosshair,
  Path,
  ArrowsClockwise,
  GitBranch,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react'
import type { useWorkspaceController } from '@/hooks/useWorkspaceController'
import type { SearchCriteria } from '@/lib/search'
import type { AppSettings } from '@/lib/types'
import { DEFAULT_APP_SETTINGS } from '@/lib/constants'

interface WorkspaceToolbarProps {
  fileName: string
  downloadUrl: string | null
  controller: ReturnType<typeof useWorkspaceController>
  showListPanel: boolean
  setShowListPanel: (show: boolean) => void
  onSearch: (criteria: SearchCriteria) => void
  onClearSearch: () => void
  onFindPath: () => void
  canFindPath: boolean
  isShortestPathActive: boolean
  searchBarRef: React.RefObject<SearchBarRef>
  onRefreshCanvas: () => void
}

export function WorkspaceToolbar({
  fileName,
  downloadUrl,
  controller,
  showListPanel,
  setShowListPanel,
  onSearch,
  onClearSearch,
  onFindPath,
  canFindPath,
  isShortestPathActive,
  searchBarRef,
  onRefreshCanvas,
}: WorkspaceToolbarProps) {
  const [settings, setSettings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)

  const showGrid = settings?.showGrid ?? true
  
  const toggleGrid = async () => {
    const newSettings = { ...settings!, showGrid: !showGrid }
    await setSettings(newSettings)
    setTimeout(() => {
      onRefreshCanvas()
      window.dispatchEvent(new CustomEvent('settings-changed'))
    }, 50)
  }

  const handleSaveClick = () => {
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
    }
  }

  return (
    <TooltipProvider>
      <div className="px-4 py-3 space-y-3 shadow-lg bg-toolbar-bg border-b border-toolbar-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Logo size={32} showText={false} />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-accent bg-clip-text text-transparent">RelEye</h1>
          <Separator orientation="vertical" className="h-6 bg-border" />
          <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-md border border-primary/30">
            <span className="text-base font-semibold text-foreground">{fileName.replace('.enc.json', '')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openUnsavedDialog('new')} className="hover:bg-toolbar-hover hover:border-primary/50">
                <FilePlus size={18} className="text-success" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Network</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openUnsavedDialog('load')} className="hover:bg-toolbar-hover hover:border-primary/50">
                <FolderOpen size={18} className="text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load Network</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveClick}
                disabled={!downloadUrl}
                className="hover:bg-toolbar-hover hover:border-success/50 disabled:opacity-40"
              >
                <DownloadSimple size={18} weight="duotone" className={downloadUrl ? "text-accent" : "text-muted-foreground"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Network (Ctrl+S)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openPersonDialog()} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Plus size={18} weight="bold" className="text-success" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Person</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openGroupDialog()} className="hover:bg-toolbar-hover hover:border-primary/50">
                <UsersThree size={18} weight="duotone" className="text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Group</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={controller.interaction.isConnecting ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (controller.interaction.isConnecting) {
                    controller.interaction.enableSelectMode()
                    controller.interaction.setConnectFromPerson(null)
                  } else {
                    controller.interaction.enableConnectMode()
                  }
                }}
                className={controller.interaction.isConnecting ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-toolbar-hover hover:border-primary/50"}
              >
                {controller.interaction.isConnecting ? <X size={18} weight="bold" /> : <Link size={18} weight="duotone" className="text-accent" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{controller.interaction.isConnecting ? 'Cancel Connect' : 'Connect Mode'}</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.handlers.handleSmartArrange} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Crosshair size={18} weight="duotone" className="text-success" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Smart Arrange</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.handlers.handleOrganizeByImportance} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Target size={18} weight="duotone" className="text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Organize by Importance</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.handlers.handleHierarchicalView} className="hover:bg-toolbar-hover hover:border-primary/50">
                <TreeStructure size={18} weight="duotone" className="text-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hierarchical View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.handlers.handleTightenNetwork} className="hover:bg-toolbar-hover hover:border-primary/50">
                <ArrowsInCardinal size={18} weight="duotone" className="text-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tighten Network</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isShortestPathActive ? "default" : "outline"}
                size="sm"
                onClick={onFindPath}
                disabled={!canFindPath}
                className={isShortestPathActive 
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                  : "hover:bg-toolbar-hover hover:border-primary/50 disabled:opacity-40"
                }
              >
                <Path size={18} weight={isShortestPathActive ? "fill" : "duotone"} className={canFindPath ? (isShortestPathActive ? "" : "text-warning") : "text-muted-foreground"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canFindPath ? 'Find Shortest Path (Select 2 persons)' : 'Select 2 persons to find shortest path'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onRefreshCanvas} className="hover:bg-toolbar-hover hover:border-primary/50">
                <ArrowsClockwise size={18} weight="duotone" className="text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Canvas</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.transform.zoomIn} className="hover:bg-toolbar-hover hover:border-primary/50">
                <MagnifyingGlassPlus size={18} weight="duotone" className="text-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.transform.zoomOut} className="hover:bg-toolbar-hover hover:border-primary/50">
                <MagnifyingGlassMinus size={18} weight="duotone" className="text-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={controller.handlers.handleZoomToFit} className="hover:bg-toolbar-hover hover:border-primary/50">
                <ArrowsOut size={18} weight="duotone" className="text-accent" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom to Fit</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? "default" : "outline"}
                size="sm"
                onClick={toggleGrid}
                className={showGrid ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-toolbar-hover hover:border-primary/50"}
              >
                <GridFour size={18} weight={showGrid ? "fill" : "duotone"} className={showGrid ? "" : "text-muted-foreground"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Grid</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showListPanel ? "default" : "outline"}
                size="sm"
                onClick={() => setShowListPanel(!showListPanel)}
                className={showListPanel ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-toolbar-hover hover:border-primary/50"}
              >
                <List size={18} weight={showListPanel ? "fill" : "duotone"} className={showListPanel ? "" : "text-muted-foreground"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openExportDialog()} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Export size={18} weight="duotone" className="text-warning" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Canvas</TooltipContent>
          </Tooltip>

          {(controller.selection.selectedPersons.length > 0 || controller.selection.selectedGroups.length > 0 || controller.selection.selectedConnections.length > 0) && (
            <>
              <Separator orientation="vertical" className="h-6 bg-border" />

              {controller.selection.selectedPersons.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={controller.handlers.handleDeleteSelectedPersons} className="border-destructive/50 hover:bg-destructive/10 hover:border-destructive">
                      <UserMinus size={18} weight="bold" className="text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected Persons</TooltipContent>
                </Tooltip>
              )}

              {controller.selection.selectedGroups.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={controller.handlers.handleDeleteSelectedGroups} className="border-destructive/50 hover:bg-destructive/10 hover:border-destructive">
                      <Trash size={18} weight="bold" className="text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete Selected Groups</TooltipContent>
                </Tooltip>
              )}

              {controller.selection.selectedConnections.length > 0 && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (controller.selection.selectedConnections.length === 1) {
                            const connectionId = controller.selection.selectedConnections[0]
                            const connection = controller.workspace.connections.find(c => c.id === connectionId)
                            if (!connection) return

                            const collapsedBranches = controller.workspace.collapsedBranches || []
                            const fromBranch = collapsedBranches.find(b => b.parentId === connection.fromPersonId && b.collapsedPersonIds.includes(connection.toPersonId))
                            const toBranch = collapsedBranches.find(b => b.parentId === connection.toPersonId && b.collapsedPersonIds.includes(connection.fromPersonId))
                            
                            if (fromBranch) {
                              controller.handlers.handleExpandBranch(connection.fromPersonId)
                            } else if (toBranch) {
                              controller.handlers.handleExpandBranch(connection.toPersonId)
                            } else {
                              controller.dialogs.openCollapseBranchDialog(connection)
                            }
                          }
                        }}
                        disabled={controller.selection.selectedConnections.length !== 1}
                        className="hover:bg-toolbar-hover hover:border-primary/50 disabled:opacity-40"
                      >
                        {(() => {
                          if (controller.selection.selectedConnections.length === 1) {
                            const connectionId = controller.selection.selectedConnections[0]
                            const connection = controller.workspace.connections.find(c => c.id === connectionId)
                            if (!connection) return <GitBranch size={18} weight="duotone" className="text-muted-foreground" />

                            const collapsedBranches = controller.workspace.collapsedBranches || []
                            const fromBranch = collapsedBranches.find(b => b.parentId === connection.fromPersonId && b.collapsedPersonIds.includes(connection.toPersonId))
                            const toBranch = collapsedBranches.find(b => b.parentId === connection.toPersonId && b.collapsedPersonIds.includes(connection.fromPersonId))
                            const isCollapsed = fromBranch || toBranch
                            
                            return isCollapsed ? (
                              <Eye size={18} weight="duotone" className="text-success" />
                            ) : (
                              <GitBranch size={18} weight="duotone" className="text-accent" />
                            )
                          }
                          return <GitBranch size={18} weight="duotone" className="text-muted-foreground" />
                        })()}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {controller.selection.selectedConnections.length === 1 
                        ? (() => {
                            const connectionId = controller.selection.selectedConnections[0]
                            const connection = controller.workspace.connections.find(c => c.id === connectionId)
                            if (!connection) return 'Collapse/Expand Branch'

                            const collapsedBranches = controller.workspace.collapsedBranches || []
                            const fromBranch = collapsedBranches.find(b => b.parentId === connection.fromPersonId && b.collapsedPersonIds.includes(connection.toPersonId))
                            const toBranch = collapsedBranches.find(b => b.parentId === connection.toPersonId && b.collapsedPersonIds.includes(connection.fromPersonId))
                            return (fromBranch || toBranch) ? 'Expand Branch' : 'Collapse Branch'
                          })()
                        : 'Select 1 connection to collapse/expand'}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={controller.handlers.handleDeleteSelectedConnections} className="border-destructive/50 hover:bg-destructive/10 hover:border-destructive">
                        <LinkBreak size={18} weight="bold" className="text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Selected Connections</TooltipContent>
                  </Tooltip>
                </>
              )}
            </>
          )}

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={controller.handlers.undo}
                disabled={!controller.hasUndo}
                className="hover:bg-toolbar-hover hover:border-primary/50 disabled:opacity-40"
              >
                <ArrowCounterClockwise size={18} weight="duotone" className={controller.hasUndo ? "text-warning" : "text-muted-foreground"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openSettingsDialog()} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Gear size={18} weight="duotone" className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
        </div>

        <SearchBar
          ref={searchBarRef}
          persons={controller.workspace.persons}
          groups={controller.workspace.groups}
          onSearch={onSearch}
          onClear={onClearSearch}
        />
      </div>
    </TooltipProvider>
  )
}
