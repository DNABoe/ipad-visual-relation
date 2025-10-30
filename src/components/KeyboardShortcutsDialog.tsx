import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutItem[]
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const sections: ShortcutSection[] = [
    {
      title: 'File Operations',
      shortcuts: [
        { keys: [isMac ? 'Cmd' : 'Ctrl', '+', 'S'], description: 'Save network file' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Space', '+', 'Drag'], description: 'Pan canvas' },
        { keys: ['Middle Click', '+', 'Drag'], description: 'Pan canvas (alternative)' },
        { keys: ['Scroll'], description: 'Zoom in/out at cursor' },
        { keys: ['Arrow Keys'], description: 'Nudge selected by grid increment' },
        { keys: ['Shift', '+', 'Arrow Keys'], description: 'Nudge selected by larger increment' },
        { keys: ['F'], description: 'Focus on selected person' },
        { keys: ['Escape'], description: 'Clear selection / Cancel mode' },
      ],
    },
    {
      title: 'Selection',
      shortcuts: [
        { keys: [isMac ? 'Cmd' : 'Ctrl', '+', 'Click'], description: 'Multi-select persons' },
        { keys: ['Click', '+', 'Drag'], description: 'Select multiple with box' },
        { keys: ['Click'], description: 'Select person/group/connection' },
      ],
    },
    {
      title: 'Editing',
      shortcuts: [
        { keys: [isMac ? 'Cmd' : 'Ctrl', '+', 'D'], description: 'Duplicate selected person(s)' },
        { keys: [isMac ? 'Cmd' : 'Ctrl', '+', 'G'], description: 'Group selected persons' },
        { keys: [isMac ? 'Cmd' : 'Ctrl', '+', 'Z'], description: 'Undo last action' },
        { keys: ['Delete'], description: 'Delete selected items' },
        { keys: ['Backspace'], description: 'Delete selected items' },
      ],
    },
    {
      title: 'Person Scoring',
      shortcuts: [
        { keys: ['1'], description: 'Set selected person score to 1' },
        { keys: ['2'], description: 'Set selected person score to 2' },
        { keys: ['3'], description: 'Set selected person score to 3' },
        { keys: ['4'], description: 'Set selected person score to 4' },
        { keys: ['5'], description: 'Set selected person score to 5' },
      ],
    },
    {
      title: 'Search & Tools',
      shortcuts: [
        { keys: ['/'], description: 'Focus search bar' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for all keyboard shortcuts and hotkeys
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut, shortcutIdx) => (
                    <div
                      key={shortcutIdx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          key === '+' ? (
                            <span key={keyIdx} className="text-muted-foreground mx-1">+</span>
                          ) : (
                            <Badge
                              key={keyIdx}
                              variant="secondary"
                              className="px-2 py-1 text-xs font-mono font-semibold bg-card border border-border"
                            >
                              {key}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {sectionIdx < sections.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
