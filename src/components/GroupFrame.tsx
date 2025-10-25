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
  onClick: (e: React.MouseEvent) => void
  onUpdate: (updates: Partial<Group>) => void
  onDragStart?: (e: React.MouseEvent) => void
  onResizeStart?: (e: React.MouseEvent, handle: string) => void
  style?: React.CSSProperties
}

export function GroupFrame({ group, isSelected, onClick, onUpdate, onDragStart, onResizeStart, style }: GroupFrameProps) {
  const groupColor = GROUP_COLORS[group.color]
  const isSolid = group.solidBackground ?? false
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
    { position: 'nw', cursor: 'nw-resize', style: { top: -4, left: -4 } },
    { position: 'ne', cursor: 'ne-resize', style: { top: -4, right: -4 } },
    { position: 'sw', cursor: 'sw-resize', style: { bottom: -4, left: -4 } },
    { position: 'se', cursor: 'se-resize', style: { bottom: -4, right: -4 } },
    { position: 'n', cursor: 'n-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 's', cursor: 's-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'w', cursor: 'w-resize', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'e', cursor: 'e-resize', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } },
  ]

  return (
    <div
      className={cn(
        'absolute rounded-lg border-2 pointer-events-auto group/frame',
        'transition-all',
        isSolid ? 'border-solid' : 'border-dashed',
        isSelected && 'ring-2 ring-accent'
      )}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        borderColor: groupColor,
        backgroundColor: isSolid ? groupColor : `${groupColor}15`,
        ...style,
      }}
      onClick={onClick}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onDragStart) {
          onDragStart(e)
        }
      }}
    >
      <div
        className="absolute -top-8 left-0 flex items-center gap-1"
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
            className="h-7 text-xs w-32 bg-white"
          />
        ) : (
          <div
            className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 cursor-move"
            style={{
              backgroundColor: groupColor,
              color: '#fff',
            }}
            onMouseDown={(e) => {
              if (onDragStart) {
                e.stopPropagation()
                onDragStart(e)
              }
            }}
          >
            <span>{group.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DotsThree size={14} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Edit Group</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditingName(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Color</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {GROUP_COLOR_NAMES.map((colorName) => (
                      <DropdownMenuItem
                        key={colorName}
                        onClick={() => handleColorChange(colorName)}
                      >
                        <div
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: GROUP_COLORS[colorName] }}
                        />
                        {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={handleBackgroundToggle}>
                  {isSolid ? 'Transparent Background' : 'Solid Background'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isSelected && onResizeStart && resizeHandles.map((handle) => (
        <div
          key={handle.position}
          className="absolute w-2 h-2 bg-accent border border-white rounded-sm opacity-0 group-hover/frame:opacity-100 transition-opacity"
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
