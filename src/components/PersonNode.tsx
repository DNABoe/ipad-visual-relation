import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Person } from '@/lib/types'
import { getInitials } from '@/lib/helpers'
import { FRAME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface PersonNodeProps {
  person: Person
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onPhotoDoubleClick?: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export function PersonNode({
  person,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
  onDoubleClick,
  onPhotoDoubleClick,
  onContextMenu,
  style,
}: PersonNodeProps) {
  const frameColor = FRAME_COLORS[person.frameColor]

  return (
    <div 
      className="absolute" 
      style={{ 
        left: person.x, 
        top: person.y, 
        width: 260,
        transition: isDragging ? 'none' : undefined,
      }}
    >
      <Card
        className={cn(
          'cursor-grab select-none border-[3px] shadow-lg backdrop-blur-none',
          'hover:shadow-xl hover:border-primary',
          isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-canvas-bg shadow-2xl border-accent glow-accent',
          isDragging && 'node-dragging shadow-2xl'
        )}
        style={{
          ...style,
          borderColor: frameColor,
          backgroundColor: 'oklch(0.21 0.03 230)',
        }}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <div className="flex items-center gap-3 p-3">
          <div 
            onDoubleClick={(e) => {
              e.stopPropagation()
              onPhotoDoubleClick?.(e)
            }}
          >
            <Avatar className="h-20 w-20 flex-shrink-0 border-0 shadow-md">
              {person.photo && <AvatarImage src={person.photo} alt={person.name} className="object-cover" />}
              <AvatarFallback 
                className={cn(
                  "text-xl font-bold",
                  person.frameColor === 'white' ? 'text-background' : 'text-foreground'
                )}
                style={{ 
                  backgroundColor: frameColor,
                }}
              >
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h3 className="font-semibold text-sm leading-tight break-words tracking-tight text-foreground">{person.name}</h3>
            {person.position && <p className="text-xs leading-tight break-words text-muted-foreground">{person.position}</p>}
          </div>
          <Badge className="flex-shrink-0 font-bold text-xs px-2.5 py-1 border-0 shadow-md bg-primary text-primary-foreground">
            {person.score}
          </Badge>
        </div>
      </Card>
    </div>
  )
}
