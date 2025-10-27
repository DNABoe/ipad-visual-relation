import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Logo } from './Logo'
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
} from '@phosphor-icons/react'
import type { useWorkspaceController } from '@/hooks/useWorkspaceController'

interface WorkspaceToolbarProps {
  fileName: string
  downloadUrl: string | null
  controller: ReturnType<typeof useWorkspaceController>
  showListPanel: boolean
  setShowListPanel: (show: boolean) => void
}

export function WorkspaceToolbar({
  fileName,
  downloadUrl,
  controller,
  showListPanel,
  setShowListPanel,
}: WorkspaceToolbarProps) {
  const [settings, setSettings] = useKV<{
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

  const showGrid = settings?.showGrid ?? true
  const setShowGrid = (show: boolean) => {
    setSettings((current) => ({
      username: current?.username ?? 'admin',
      passwordHash: current?.passwordHash ?? '',
      showGrid: show,
      snapToGrid: current?.snapToGrid ?? false,
      gridSize: current?.gridSize ?? 20,
      showMinimap: current?.showMinimap ?? true,
    }))
  }
  return (
    <TooltipProvider>
      <div className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap shadow-lg bg-toolbar-bg border-b border-toolbar-border">
        <div className="flex items-center gap-3">
          <Logo size={32} showText={false} />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-accent bg-clip-text text-transparent">RelEye</h1>
          <Separator orientation="vertical" className="h-6 bg-border" />
          <div className="flex items-center gap-2">
            {downloadUrl ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={downloadUrl}
                    download={`${fileName}.enc.json`}
                    className="text-sm hover:underline font-medium inline-flex items-center gap-1.5 transition-colors text-accent"
                  >
                    {fileName}
                    <DownloadSimple size={14} weight="bold" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Right-click and "Save link as..." to download</TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-sm font-medium text-foreground">{fileName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <TooltipContent>Hierarchical View (Select 1 Person First)</TooltipContent>
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
              <Button variant="outline" size="sm" onClick={controller.handlers.handleSmartArrange} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Crosshair size={18} weight="duotone" className="text-success" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Smart Arrange (Recommended)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openExportDialog()} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Export size={18} weight="duotone" className="text-warning" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Canvas</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? "default" : "outline"}
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-toolbar-hover hover:border-primary/50"}
              >
                <GridFour size={18} weight={showGrid ? "fill" : "duotone"} className={showGrid ? "" : "text-muted-foreground"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Grid</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

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

          {controller.selection.selectedPersons.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6 bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={controller.handlers.handleDeleteSelectedPersons} className="border-destructive/50 hover:bg-destructive/10 hover:border-destructive">
                    <UserMinus size={18} weight="bold" className="text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Selected Persons</TooltipContent>
              </Tooltip>
            </>
          )}

          {controller.selection.selectedGroups.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6 bg-border" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={controller.handlers.handleDeleteSelectedGroups} className="border-destructive/50 hover:bg-destructive/10 hover:border-destructive">
                    <Trash size={18} weight="bold" className="text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Selected Groups</TooltipContent>
              </Tooltip>
            </>
          )}

          {controller.selection.selectedConnections.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6 bg-border" />
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

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openSettingsDialog()} className="hover:bg-toolbar-hover hover:border-primary/50">
                <Gear size={18} weight="duotone" className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openUnsavedDialog('new')}>
                <FilePlus size={16} className="text-success" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Network</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => controller.dialogs.openUnsavedDialog('load')}>
                <FolderOpen size={16} className="text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Load Network</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
