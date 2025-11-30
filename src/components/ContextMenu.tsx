import { useEffect, useRef, useState } from 'react'
import {
  CursorClick,
  Trash,
  PencilSimple,
  ArrowsClockwise,
  CaretRight,
  AlignCenterVertical,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  Link,
  TreeStructure,
  ArrowsLeftRight,
  ArrowRight,
  ArrowLeft,
  Palette,
  Users,
  Copy,
  ClipboardText,
  UserPlus
} from '@phosphor-icons/react'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  divider?: boolean
  danger?: boolean
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
  const [submenuState, setSubmenuState] = useState<{ index: number; x: number; y: number } | null>(null)

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

      if (rect.right > viewportWidth) {
        menu.style.left = `${viewportWidth - rect.width - 10}px`
      }
      if (rect.bottom > viewportHeight) {
        menu.style.top = `${viewportHeight - rect.height - 10}px`
      }
    }
  }, [x, y])

  const handleItemClick = (item: ContextMenuItem, index: number) => {
    if (item.submenu) {
      if (submenuState?.index === index) {
        setSubmenuState(null)
      } else {
        const menuItem = menuRef.current?.children[index] as HTMLElement
        if (menuItem) {
          const rect = menuItem.getBoundingClientRect()
          setSubmenuState({
            index,
            x: rect.right,
            y: rect.top
          })
        }
      }
    } else {
      item.onClick?.()
      onClose()
    }
  }

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-[100] min-w-[200px] rounded-md border border-border bg-popover shadow-lg"
        style={{ left: x, top: y }}
      >
        <div className="p-1">
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1 h-px bg-border" />
            }

            return (
              <button
                key={index}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-sm transition-colors ${
                  item.danger
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'hover:bg-accent text-foreground'
                } ${item.submenu ? 'pr-2' : ''}`}
                onClick={() => handleItemClick(item, index)}
                onMouseEnter={() => {
                  if (item.submenu) {
                    const menuItem = menuRef.current?.children[0]?.children[index] as HTMLElement
                    if (menuItem) {
                      const rect = menuItem.getBoundingClientRect()
                      setSubmenuState({
                        index,
                        x: rect.right,
                        y: rect.top
                      })
                    }
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.submenu && <CaretRight size={16} />}
              </button>
            )
          })}
        </div>
      </div>

      {submenuState && items[submenuState.index]?.submenu && (
        <div
          className="fixed z-[101] min-w-[180px] rounded-md border border-border bg-popover shadow-lg"
          style={{ left: submenuState.x, top: submenuState.y }}
        >
          <div className="p-1">
            {items[submenuState.index].submenu!.map((subitem, subindex) => (
              <button
                key={subindex}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-accent transition-colors text-foreground"
                onClick={() => {
                  subitem.onClick?.()
                  onClose()
                }}
              >
                {subitem.icon}
                <span>{subitem.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export function getCanvasMenuItems(
  onAddPerson: () => void,
  onPaste: () => void,
  hasCopiedData: boolean,
  onSelectAll: () => void
): ContextMenuItem[] {
  return [
    {
      label: 'Add person',
      icon: <UserPlus size={18} />,
      onClick: onAddPerson,
    },
    { divider: true } as ContextMenuItem,
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
    }
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
  onCopy?: () => void,
  multipleSelected?: boolean,
  onAlignVertical?: () => void,
  onAlignHorizontal?: () => void,
  onDistributeVertical?: () => void,
  onDistributeHorizontal?: () => void,
  onArrangeToInfluence?: () => void
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
      submenu: [
        {
          label: 'Align vertical',
          icon: <AlignCenterVertical size={18} />,
          onClick: onAlignVertical,
        },
        {
          label: 'Align horizontal',
          icon: <AlignCenterVertical size={18} className="rotate-90" />,
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

  if (onCopy) {
    items.push({
      label: 'Copy',
      icon: <Copy size={18} />,
      onClick: onCopy,
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
      icon: <ArrowsClockwise size={18} />,
      onClick: onAutoFit,
    },
    { divider: true } as ContextMenuItem,
    {
      label: 'Dissolve group',
      icon: <Users size={18} />,
      onClick: onDissolve,
      danger: true,
    },
  ]
}
