import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  onContextMenu: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export function PersonNode({
  person,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
  onContextMenu,
  style,
}: PersonNodeProps) {
  const frameColor = FRAME_COLORS[person.frameColor]

  return (
    <Card
      className={cn(
        'absolute cursor-grab select-none transition-shadow',
        'hover:shadow-lg',
        isSelected && 'ring-2 ring-accent shadow-xl',
        isDragging && 'node-dragging shadow-2xl'
      )}
      style={{
        left: person.x,
        top: person.y,
        width: 240,
        borderColor: frameColor,
        borderWidth: 3,
        ...style,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarFallback style={{ backgroundColor: frameColor, color: person.frameColor === 'white' ? '#000' : '#fff' }}>
            {getInitials(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{person.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{person.position}</p>
        </div>
        <Badge variant="secondary" className="flex-shrink-0 font-bold text-xs">
          {person.score}
        </Badge>
      </div>
    </Card>
  )
}
