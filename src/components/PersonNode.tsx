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
          'cursor-grab select-none transition-shadow border-4',
          'hover:shadow-lg',
          isSelected && 'ring-2 ring-accent shadow-xl',
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
        <div className="p-3 flex items-center gap-3 pointer-events-none">
          <div 
            className="flex flex-col items-center gap-2 pointer-events-auto"
            onDoubleClick={(e) => {
              if (person.photo && onPhotoDoubleClick) {
                e.stopPropagation()
                onPhotoDoubleClick(e)
              }
            }}
          >
            <Avatar 
              className="h-24 w-24 flex-shrink-0"
            >
              {person.photo && <AvatarImage src={person.photo} alt={person.name} className="object-cover" />}
              <AvatarFallback style={{ backgroundColor: frameColor, color: person.frameColor === 'white' ? '#000' : '#fff' }}>
                <span className="text-2xl font-bold">{getInitials(person.name)}</span>
              </AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="flex-shrink-0 font-bold text-sm">
              {person.score}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight break-words">{person.name}</h3>
            {person.position && <p className="text-sm text-muted-foreground leading-tight break-words">{person.position}</p>}
            {person.position2 && <p className="text-sm text-muted-foreground leading-tight break-words">{person.position2}</p>}
            {person.position3 && <p className="text-sm text-muted-foreground leading-tight break-words">{person.position3}</p>}
          </div>
        </div>
      </Card>
    </div>
  )
}
