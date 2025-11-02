import { useEffect, useRef } from 'react'
import {
  UserPlus,
  ClipboardText,
  CursorClick,
  PencilSimple,
  Trash,
  ArrowsClockwise,
  ArrowRight,
  ArrowLeft,
  ArrowsLeftRight,
  Palette,
  TextAlignCenter,
  Crosshair,
  TreeStructure
} from '@phosphor-icons/react'

export type ContextMenuType = 'canvas' | 'person' | 'connection' | 'group'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8
      }

      menu.style.left = `${adjustedX}px`
      menu.style.top = `${adjustedY}px`
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] bg-popover border border-border rounded-lg shadow-lg py-1 animate-fade-in-up"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <div className="h-px bg-border my-1" />
          ) : (
            <button
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                item.danger
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-accent/50'
              }`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export function getCanvasMenuItems(
  onAddPerson: () => void,
  onPaste: () => void,
  onSelectAll: () => void,
  hasCopiedData: boolean
): ContextMenuItem[] {
  return [
    {
      label: 'Add person here',
      icon: <UserPlus size={18} />,
      onClick: onAddPerson,
    },
    {
      label: 'Paste',
      icon: <ClipboardText size={18} />,
      onClick: onPaste,
    },
    { divider: true } as ContextMenuItem,
    {
      label: 'Select all',
      icon: <CursorClick size={18} />,
      onClick: onSelectAll,
    },
  ].filter(item => {
    if (item.label === 'Paste' && !hasCopiedData) {
      return false
    }
    return true
  })
}

export function getPersonMenuItems(
  onEdit: () => void,
  onDelete: () => void,
  onArrangeToInfluence?: () => void
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [
    {
      label: 'Edit',
      icon: <PencilSimple size={18} />,
      onClick: onEdit,
    },
  ]
  
  if (onArrangeToInfluence) {
    items.push({
      label: 'Arrange to Influence',
      icon: <TreeStructure size={18} />,
      onClick: onArrangeToInfluence,
    })
  }
  
  items.push(
    { divider: true } as ContextMenuItem,
    {
      label: 'Delete',
      icon: <Trash size={18} />,
      onClick: onDelete,
      danger: true,
    }
  )
  
  return items
}

export function getConnectionMenuItems(
  onEdit: () => void,
  onDelete: () => void,
  onChangeStyle: () => void,
  onChangeDirection: (direction: 'none' | 'forward' | 'backward' | 'bidirectional') => void,
  currentDirection: 'none' | 'forward' | 'backward' | 'bidirectional' = 'none'
): ContextMenuItem[] {
  return [
    {
      label: 'Edit',
      icon: <PencilSimple size={18} />,
      onClick: onEdit,
    },
    { divider: true } as ContextMenuItem,
    {
      label: 'Change style',
      icon: <ArrowsClockwise size={18} />,
      onClick: onChangeStyle,
    },
    {
      label: 'Influence: None',
      icon: <ArrowsLeftRight size={18} />,
      onClick: () => onChangeDirection('none'),
    },
    {
      label: 'Influence: Forward',
      icon: <ArrowRight size={18} />,
      onClick: () => onChangeDirection('forward'),
    },
    {
      label: 'Influence: Backward',
      icon: <ArrowLeft size={18} />,
      onClick: () => onChangeDirection('backward'),
    },
    {
      label: 'Influence: Bidirectional',
      icon: <ArrowsLeftRight size={18} />,
      onClick: () => onChangeDirection('bidirectional'),
    },
    { divider: true } as ContextMenuItem,
    {
      label: 'Delete',
      icon: <Trash size={18} />,
      onClick: onDelete,
      danger: true,
    },
  ]
}

export function getGroupMenuItems(
  onRename: () => void,
  onChangeColor: () => void,
  onAutoFit: () => void,
  onDissolve: () => void
): ContextMenuItem[] {
  return [
    {
      label: 'Rename',
      icon: <PencilSimple size={18} />,
      onClick: onRename,
    },
    {
      label: 'Change color',
      icon: <Palette size={18} />,
      onClick: onChangeColor,
    },
    {
      label: 'Auto-fit',
      icon: <Crosshair size={18} />,
      onClick: onAutoFit,
    },
    { divider: true } as ContextMenuItem,
    {
      label: 'Dissolve group',
      icon: <Trash size={18} />,
      onClick: onDissolve,
      danger: true,
    },
  ]
}
