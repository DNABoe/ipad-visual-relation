import { useState, useRef, useEffect } from 'react'
import type { Group, GroupColor } from '@/lib/types'
import { GROUP_COLORS, GROUP_COLOR_NAMES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { DotsThree } from '@phosphor-icons/react'

interface GroupFrameProps {
  group: Group
  isSelected: boolean
  isDragging?: boolean
  onClick: (e: React.MouseEvent) => void
  onUpdate: (updates: Partial<Group>) => void
  onRemove?: (groupId: string) => void
  onDragStart?: (e: React.MouseEvent) => void
  onResizeStart?: (e: React.MouseEvent, handle: string) => void
  onContextMenu?: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export function GroupFrame({ group, isSelected, isDragging, onClick, onUpdate, onRemove, onDragStart, onResizeStart, onContextMenu, style }: GroupFrameProps) {
  const groupColor = GROUP_COLORS[group.color]
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(group.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingName])

  const handleNameSave = () => {
    if (editedName.trim()) {
      onUpdate({ name: editedName.trim() })
    }
    setIsEditingName(false)
  }

  const handleColorChange = (color: GroupColor) => {
    onUpdate({ color })
  }

  const handleBackgroundToggle = () => {
    onUpdate({ solidBackground: !group.solidBackground })
  }

  const resizeHandles = [
    { position: 'nw', cursor: 'nw-resize', style: { top: -3, left: -3 } },
    { position: 'ne', cursor: 'ne-resize', style: { top: -3, right: -3 } },
    { position: 'sw', cursor: 'sw-resize', style: { bottom: -3, left: -3 } },
    { position: 'se', cursor: 'se-resize', style: { bottom: -3, right: -3 } },
    { position: 'n', cursor: 'n-resize', style: { top: -3, left: '50%', transform: 'translateX(-50%)' } },
    { position: 's', cursor: 's-resize', style: { bottom: -3, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'w', cursor: 'w-resize', style: { left: -3, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'e', cursor: 'e-resize', style: { right: -3, top: '50%', transform: 'translateY(-50%)' } },
  ]

  const getBackgroundColor = () => {
    if (group.solidBackground) {
      return `color-mix(in oklch, ${groupColor} 25%, oklch(0.21 0.03 230))`
    }
    return `color-mix(in oklch, ${groupColor} 8%, transparent)`
  }

  return (
    <div
      className={cn(
        'absolute rounded-xl border-[2px] group/frame cursor-move transition-all duration-200',
        group.solidBackground ? 'border-solid' : 'border-dashed',
        isSelected && 'shadow-xl scale-[1.01]'
      )}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        borderColor: groupColor,
        backgroundColor: getBackgroundColor(),
        transition: 'none',
        boxShadow: isSelected
          ? `0 0 0 3px oklch(0.88 0.18 185 / 1), 0 0 30px oklch(0.88 0.18 185 / 0.7), 0 4px 16px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)`
          : '0 2px 6px rgba(0, 0, 0, 0.2)',
        ...style,
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (onContextMenu) {
          onContextMenu(e)
        }
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onDragStart) {
          onDragStart(e)
        }
      }}
    >
      <div
        className="absolute -top-9 left-0 flex items-center gap-1"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {isEditingName ? (
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNameSave()
              } else if (e.key === 'Escape') {
                setEditedName(group.name)
                setIsEditingName(false)
              }
            }}
            className="h-8 text-xs w-40 bg-card border-border shadow-md"
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-move shadow-lg border-2"
            style={{
              backgroundColor: groupColor,
              borderColor: groupColor,
              color: '#FFFFFF',
            }}
            onMouseDown={(e) => {
              if (onDragStart) {
                e.stopPropagation()
                onDragStart(e)
              }
            }}
          >
            <span className="tracking-wide drop-shadow-sm">{group.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 rounded-md transition-colors"
                  style={{
                    backgroundColor: 'rgba(11, 12, 16, 0.25)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <DotsThree size={16} weight="bold" className="drop-shadow-sm" style={{ color: '#FFFFFF' }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="bg-card border-border"
              >
                <DropdownMenuLabel className="text-foreground">Edit Group</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditingName(true)} className="cursor-pointer">
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">Change Color</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-card border-border">
                    {GROUP_COLOR_NAMES.map((colorName) => (
                      <DropdownMenuItem
                        key={colorName}
                        onClick={() => handleColorChange(colorName)}
                        className="cursor-pointer"
                      >
                        <div
                          className="w-5 h-5 rounded-md mr-2 border-2 border-border shadow-sm"
                          style={{ backgroundColor: GROUP_COLORS[colorName] }}
                        />
                        <span className="capitalize">{colorName}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={handleBackgroundToggle} className="cursor-pointer">
                  {group.solidBackground ? 'Transparent Background' : 'Solid Background'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onRemove?.(group.id)}
                >
                  Remove Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isSelected && onResizeStart && resizeHandles.map((handle) => (
        <div
          key={handle.position}
          className="absolute w-2 h-2 bg-accent border border-background rounded-sm opacity-0 group-hover/frame:opacity-100 hover:scale-150 transition-all z-10 shadow-md"
          style={{
            ...handle.style,
            cursor: handle.cursor,
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeStart(e, handle.position)
          }}
        />
      ))}
    </div>
  )
}
