import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Person } from '@/lib/types'
import { getInitials } from '@/lib/helpers'
import { FRAME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Megaphone, Stack } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface PersonNodeProps {
  person: Person
  isSelected: boolean
  isDragging: boolean
  isHighlighted?: boolean
  isDimmed?: boolean
  hasCollapsedBranch?: boolean
  collapsedCount?: number
  connectionCount?: number
  onMouseDown: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  onPhotoDoubleClick?: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onExpandBranch?: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export function PersonNode({
  person,
  isSelected,
  isDragging,
  isHighlighted,
  isDimmed,
  hasCollapsedBranch,
  collapsedCount = 0,
  connectionCount = 0,
  onMouseDown,
  onClick,
  onDoubleClick,
  onPhotoDoubleClick,
  onContextMenu,
  onExpandBranch,
  style,
}: PersonNodeProps) {
  const frameColor = FRAME_COLORS[person.frameColor]
  
  const stackCount = (hasCollapsedBranch && collapsedCount > 0) ? Math.min(collapsedCount, 3) : 0

  return (
    <motion.div 
      className="absolute" 
      initial={false}
      animate={isDragging ? { left: person.x, top: person.y } : {
        left: person.x,
        top: person.y,
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
      }}
      transition={isDragging ? { duration: 0, type: 'tween' } : {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.5,
        opacity: { duration: 0.15 },
      }}
      style={{ 
        width: 240,
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      {stackCount > 0 && Array.from({ length: stackCount }).map((_, index) => (
        <motion.div
          key={`stack-${index}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 0.2 + (index * 0.1), y: 0 }}
          transition={{ delay: 0.05 * (index + 1), duration: 0.3 }}
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            top: (stackCount - index) * 3,
            left: (stackCount - index) * 2,
            right: -(stackCount - index) * 2,
            borderColor: frameColor,
            backgroundColor: 'oklch(0.18 0.03 230)',
            border: '3px solid',
            zIndex: -index - 1,
          }}
        />
      ))}
      <Card
        className={cn(
          'cursor-grab select-none border-[3px] backdrop-blur-none relative transition-all duration-200 overflow-hidden',
          'hover:shadow-lg hover:border-primary',
          isSelected && 'scale-[1.02]',
          isDragging && 'node-dragging scale-[1.03]',
          isHighlighted && 'ring-2 ring-success ring-offset-2 ring-offset-canvas-bg glow-accent-strong scale-105',
          isDimmed && 'opacity-30 grayscale',
          hasCollapsedBranch && 'cursor-pointer relative z-10'
        )}
        style={{
          ...style,
          borderColor: frameColor,
          backgroundColor: 'oklch(0.21 0.03 230)',
          boxShadow: isSelected
            ? `0 0 0 5px oklch(0.88 0.18 185 / 1), 0 0 40px oklch(0.88 0.18 185 / 0.8), 0 6px 20px rgba(0, 0, 0, 0.5), 0 3px 12px rgba(0, 0, 0, 0.4)`
            : isHighlighted 
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
            <Megaphone size={14} weight="fill" />
          </div>
        )}
        {hasCollapsedBranch && collapsedCount > 0 && (
          <div 
            className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 shadow-lg border-2 border-card z-10 flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
            title={`${collapsedCount} person${collapsedCount > 1 ? 's' : ''} collapsed - click to expand`}
            onClick={(e) => {
              e.stopPropagation()
              onExpandBranch?.(e)
            }}
          >
            <Stack size={12} weight="fill" />
            <span className="text-xs font-bold">{collapsedCount}</span>
          </div>
        )}
        
        <div className="relative">
          <div 
            className="cursor-pointer"
            onDoubleClick={(e) => {
              e.stopPropagation()
              onPhotoDoubleClick?.(e)
            }}
          >
            <Avatar className="w-full h-48 rounded-none rounded-t-md border-0" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)' }}>
              {person.photo && <AvatarImage src={person.photo} alt={person.name} className="object-cover" />}
              <AvatarFallback 
                className={cn(
                  "text-5xl font-bold rounded-none",
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
          
          <Badge 
            className="absolute top-2 right-2 font-bold text-sm px-2.5 py-1.5 border-0 bg-primary text-primary-foreground" 
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}
          >
            {person.score}
          </Badge>
        </div>

        <div className="p-3 space-y-0.5">
          <h3 className="font-semibold text-sm leading-tight break-words text-foreground line-clamp-2">
            {person.name}
          </h3>
          {person.position && (
            <p className="text-xs leading-tight break-words text-muted-foreground line-clamp-1">
              {person.position}
            </p>
          )}
          {person.position2 && (
            <p className="text-xs leading-tight break-words text-muted-foreground line-clamp-1">
              {person.position2}
            </p>
          )}
          {person.position3 && (
            <p className="text-xs leading-tight break-words text-muted-foreground line-clamp-1">
              {person.position3}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
