import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Person } from '@/lib/types'
import { getInitials } from '@/lib/helpers'
import { FRAME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Megaphone } from '@phosphor-icons/react'

interface PersonNodeProps {
  person: Person
  isSelected: boolean
  isDragging: boolean
  isHighlighted?: boolean
  isDimmed?: boolean
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
  isHighlighted,
  isDimmed,
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
        width: 280,
        transition: 'none',
      }}
    >
      <Card
        className={cn(
          'cursor-grab select-none border-[3px] backdrop-blur-none relative transition-all duration-200',
          'hover:shadow-lg hover:border-primary',
          isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-canvas-bg border-accent glow-accent',
          isDragging && 'node-dragging',
          isHighlighted && 'ring-2 ring-success ring-offset-2 ring-offset-canvas-bg glow-accent-strong scale-105',
          isDimmed && 'opacity-30 grayscale'
        )}
        style={{
          ...style,
          borderColor: frameColor,
          backgroundColor: 'oklch(0.21 0.03 230)',
          boxShadow: isHighlighted 
            ? '0 4px 20px rgba(0, 255, 128, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)' 
            : '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        {person.advocate && (
          <div 
            className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full p-1.5 shadow-lg border-2 border-card z-10"
            title="Advocate - Actively promotes messages"
          >
            <Megaphone size={16} weight="fill" />
          </div>
        )}
        <div className="flex items-start gap-3.5 p-3.5">
          <div 
            className="cursor-pointer"
            onDoubleClick={(e) => {
              e.stopPropagation()
              onPhotoDoubleClick?.(e)
            }}
          >
            <Avatar className="h-24 w-24 flex-shrink-0 border-0 ring-1 ring-border" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)' }}>
              {person.photo && <AvatarImage src={person.photo} alt={person.name} className="object-cover" />}
              <AvatarFallback 
                className={cn(
                  "text-2xl font-bold",
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
          <div className="flex-1 min-w-0 space-y-1 pt-1">
            <h3 className="font-semibold text-sm leading-tight break-words tracking-tight text-foreground">{person.name}</h3>
            {person.position && <p className="text-xs leading-tight break-words text-muted-foreground">{person.position}</p>}
          </div>
          <Badge className="flex-shrink-0 font-bold text-xs px-2.5 py-1.5 border-0 bg-primary text-primary-foreground mt-1" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' }}>
            {person.score}
          </Badge>
        </div>
      </Card>
    </div>
  )
}
