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
          'hover:shadow-xl hover:shadow-primary/20',
          isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-2xl shadow-accent/30',
          isDragging && 'node-dragging shadow-2xl'
        )}
        style={{
          ...style,
          borderColor: frameColor,
          background: 'oklch(0.22 0.025 250)',
        }}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <div className="p-2 flex items-center gap-2.5 pointer-events-none">
          <div 
            className="flex flex-col items-center gap-1.5 pointer-events-auto"
            onDoubleClick={(e) => {
              if (person.photo && onPhotoDoubleClick) {
                e.stopPropagation()
                onPhotoDoubleClick(e)
              }
            }}
          >
            <Avatar 
              className={cn(
                "h-20 w-20 flex-shrink-0 ring-2 ring-offset-2 ring-offset-card transition-all",
                isSelected ? "ring-accent" : "ring-border/50"
              )}
            >
              {person.photo && <AvatarImage src={person.photo} alt={person.name} className="object-cover" />}
              <AvatarFallback style={{ backgroundColor: frameColor, color: person.frameColor === 'white' ? '#000' : '#fff' }}>
                <span className="text-xl font-bold">{getInitials(person.name)}</span>
              </AvatarFallback>
            </Avatar>
            <Badge 
              variant="secondary" 
              className="flex-shrink-0 font-bold text-xs px-2 py-0.5 bg-muted text-foreground border border-border/70 shadow-sm"
            >
              {person.score}
            </Badge>
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <h3 className="font-semibold text-sm leading-tight break-words text-foreground tracking-tight">{person.name}</h3>
            {person.position && <p className="text-xs text-muted-foreground leading-tight break-words">{person.position}</p>}
            {person.position2 && <p className="text-xs text-muted-foreground leading-tight break-words">{person.position2}</p>}
            {person.position3 && <p className="text-xs text-muted-foreground leading-tight break-words">{person.position3}</p>}
          </div>
        </div>
      </Card>
    </div>
  )
}
