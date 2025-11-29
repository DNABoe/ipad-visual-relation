import { useEffect, useRef, useState } from 'react'
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
  TreeStructure,
  Link,
  CaretRight,
  AlignLeft,
  AlignCenterVertical,
  ArrowsOutLineVertical,
  ArrowsOutLineHorizontal
} from '@phosphor-icons/react'

export type ContextMenuType = 'canvas' | 'person' | 'connection' | 'group'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  divider?: boolean
  submenu?: ContextMenuItem[]
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
            <MenuItem item={item} onClose={onClose} />
          )}
        </div>
      ))}
    </div>
  )
}

function MenuItem({ item, onClose }: { item: ContextMenuItem; onClose: () => void }) {
  const [showSubmenu, setShowSubmenu] = useState(false)
  const itemRef = useRef<HTMLButtonElement>(null)

  if (item.submenu) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setShowSubmenu(true)}
        onMouseLeave={() => setShowSubmenu(false)}
      >
        <button
          ref={itemRef}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left transition-colors text-foreground hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </div>
          <CaretRight size={16} className="flex-shrink-0" />
        </button>
        {showSubmenu && (
          <div
            className="absolute left-full top-0 ml-1 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg py-1 z-[10000]"
          >
            {item.submenu.map((subItem, subIndex) => (
              <button
                key={subIndex}
                onClick={() => {
                  subItem.onClick?.()
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                  subItem.danger
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-accent/50'
                }`}
              >
                {subItem.icon && <span className="flex-shrink-0">{subItem.icon}</span>}
                <span>{subItem.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => {
        item.onClick?.()
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
  onConnect?: () => void,
  onArrangeToInfluence?: () => void,
  multipleSelected?: boolean,
  onAlignVertical?: () => void,
  onAlignHorizontal?: () => void,
  onDistributeVertical?: () => void,
  onDistributeHorizontal?: () => void
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [
    {
      label: 'Edit',
      icon: <PencilSimple size={18} />,
      onClick: onEdit,
    },
  ]
  
  if (onConnect) {
    items.push({
      label: 'Connect',
      icon: <Link size={18} />,
      onClick: onConnect,
    })
  }
  
  if (multipleSelected && onAlignVertical && onAlignHorizontal && onDistributeVertical && onDistributeHorizontal) {
    items.push({
      label: 'Arrange',
      icon: <AlignCenterVertical size={18} />,
      submenu: [
        {
          label: 'Align vertical',
          icon: <AlignLeft size={18} />,
          onClick: onAlignVertical,
        },
        {
          label: 'Align horizontal',
          icon: <TextAlignCenter size={18} />,
          onClick: onAlignHorizontal,
        },
        {
          label: 'Distribute vertical',
          icon: <ArrowsOutLineVertical size={18} />,
          onClick: onDistributeVertical,
        },
        {
          label: 'Distribute horizontal',
          icon: <ArrowsOutLineHorizontal size={18} />,
          onClick: onDistributeHorizontal,
        },
      ],
    })
  }
  
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
