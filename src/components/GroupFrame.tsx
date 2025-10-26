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
  onRemove?: (groupId: string) => void
  onDragStart?: (e: React.MouseEvent) => void
  onResizeStart?: (e: React.MouseEvent, handle: string) => void
  style?: React.CSSProperties
}

export function GroupFrame({ group, isSelected, onClick, onUpdate, onRemove, onDragStart, onResizeStart, style }: GroupFrameProps) {
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
        'absolute rounded-xl border-[3px] group/frame cursor-move',
        'transition-all duration-200',
        group.solidBackground ? 'border-solid backdrop-blur-sm' : 'border-dashed',
        isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-xl'
      )}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        borderColor: groupColor,
        backgroundColor: group.solidBackground ? `${groupColor}25` : `${groupColor}10`,
        boxShadow: group.solidBackground ? `inset 0 0 40px ${groupColor}15` : 'none',
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
            className="h-8 text-xs w-40 bg-card/95 backdrop-blur-sm border-border/70 shadow-md"
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-move shadow-lg backdrop-blur-sm"
            style={{
              backgroundColor: groupColor,
              color: '#fff',
              border: `2px solid ${groupColor}`,
            }}
            onMouseDown={(e) => {
              if (onDragStart) {
                e.stopPropagation()
                onDragStart(e)
              }
            }}
          >
            <span className="tracking-wide">{group.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-white/20 rounded-md transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <DotsThree size={16} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="backdrop-blur-xl bg-card/95 border-border/70"
              >
                <DropdownMenuLabel className="text-foreground">Edit Group</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsEditingName(true)} className="cursor-pointer">
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">Change Color</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="backdrop-blur-xl bg-card/95 border-border/70">
                    {GROUP_COLOR_NAMES.map((colorName) => (
                      <DropdownMenuItem
                        key={colorName}
                        onClick={() => handleColorChange(colorName)}
                        className="cursor-pointer"
                      >
                        <div
                          className="w-5 h-5 rounded-md mr-2 border-2 border-white/20 shadow-sm"
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
          className="absolute w-2.5 h-2.5 bg-accent border-2 border-white rounded-sm opacity-0 group-hover/frame:opacity-100 hover:scale-150 transition-all z-10 shadow-md"
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
