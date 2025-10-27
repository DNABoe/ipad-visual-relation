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
    <div className="absolute" style={{ left: person.x, top: person.y, width: 260 }}>
      <Card
        className={cn(
          'cursor-grab select-none transition-all duration-200 border-[3px]',
          'hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50',
          isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-2xl shadow-accent/40 border-accent/60',
          isDragging && 'node-dragging shadow-2xl'
        )}
        style={{
          ...style,
          borderColor: frameColor,
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
            <Avatar className="h-20 w-20 flex-shrink-0 border-2 border-border/40 shadow-md">
              {person.photo && <AvatarImage src={person.photo} alt={person.name} className="object-cover" />}
              <AvatarFallback style={{ backgroundColor: frameColor, color: person.frameColor === 'white' ? '#000' : '#fff' }}>
                <span className="text-xl font-bold">{getInitials(person.name)}</span>
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h3 className="font-semibold text-sm leading-tight break-words text-foreground tracking-tight">{person.name}</h3>
            {person.position && <p className="text-xs text-muted-foreground leading-tight break-words">{person.position}</p>}
          </div>
          <Badge className="flex-shrink-0 font-bold text-xs px-2.5 py-1 bg-primary/25 text-primary-foreground border-2 border-primary/50 shadow-md">
            {person.score}
          </Badge>
        </div>
      </Card>
    </div>
  )
}
