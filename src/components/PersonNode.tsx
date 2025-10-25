import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Person } from '@/lib/types'
import { getInitials } from '@/lib/helpers'
import { FRAME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export type ConnectionSide = 'top' | 'right' | 'bottom' | 'left'

interface PersonNodeProps {
  person: Person
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onPhotoDoubleClick?: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onHubMouseDown?: (e: React.MouseEvent, side: ConnectionSide) => void
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
  onHubMouseDown,
  style,
}: PersonNodeProps) {
  const frameColor = FRAME_COLORS[person.frameColor]

  const hubClass = "absolute w-3 h-3 bg-accent border-2 border-accent-foreground rounded-full cursor-crosshair hover:scale-150 transition-transform z-10 pointer-events-auto"

  const handleHubMouseDown = (e: React.MouseEvent, side: ConnectionSide) => {
    e.preventDefault()
    e.stopPropagation()
    if (onHubMouseDown) {
      onHubMouseDown(e, side)
    }
  }

  return (
    <div className="absolute pointer-events-none" style={{ left: person.x, top: person.y, width: 260 }}>
      {onHubMouseDown && (
        <>
          <div
            className={hubClass}
            style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
            onMouseDown={(e) => handleHubMouseDown(e, 'top')}
          />
          <div
            className={hubClass}
            style={{ top: '50%', right: -6, transform: 'translateY(-50%)' }}
            onMouseDown={(e) => handleHubMouseDown(e, 'right')}
          />
          <div
            className={hubClass}
            style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
            onMouseDown={(e) => handleHubMouseDown(e, 'bottom')}
          />
          <div
            className={hubClass}
            style={{ top: '50%', left: -6, transform: 'translateY(-50%)' }}
            onMouseDown={(e) => handleHubMouseDown(e, 'left')}
          />
        </>
      )}
      <Card
        className={cn(
          'cursor-grab select-none transition-shadow pointer-events-auto',
          'hover:shadow-lg',
          isSelected && 'ring-2 ring-accent shadow-xl',
          isDragging && 'node-dragging shadow-2xl'
        )}
        style={style}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        <div className="p-3 flex items-center gap-3">
          <div 
            className="flex flex-col items-center gap-2"
            onDoubleClick={(e) => {
              if (person.photo && onPhotoDoubleClick) {
                e.stopPropagation()
                onPhotoDoubleClick(e)
              }
            }}
          >
            <Avatar className="h-24 w-24 flex-shrink-0 ring-2 ring-border">
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
