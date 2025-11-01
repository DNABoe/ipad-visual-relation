import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Person } from '@/lib/types'
import { getInitials } from '@/lib/helpers'
import { FRAME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Star, Stack } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { memo } from 'react'

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
  onContextMenu: (e: React.MouseEvent) => void
  onExpandBranch?: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

const PersonNodeInner = memo(function PersonNodeInner({
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
  onContextMenu,
  onExpandBranch,
  style,
}: PersonNodeProps) {
  const frameColor = FRAME_COLORS[person.frameColor]
  
  const stackCount = (hasCollapsedBranch && collapsedCount > 0) ? Math.min(collapsedCount, 3) : 0
  
  const photoOffsetX = person.photoOffsetX || 0
  const photoOffsetY = person.photoOffsetY || 0
  const photoZoom = person.photoZoom || 100

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
      transition={isDragging ? { 
        duration: 0, 
        type: 'tween',
        ease: 'linear'
      } : {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.5,
        opacity: { duration: 0.15 },
      }}
      style={{ 
        width: 240,
        height: 340,
        willChange: isDragging ? 'transform' : 'auto',
        transform: 'translateZ(0)',
        contain: isDragging ? 'layout style paint' : 'none',
      }}
    >
      {!isDragging && stackCount > 0 && Array.from({ length: stackCount }).map((_, index) => (
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
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <Card
        className={cn(
          'cursor-grab select-none border-[3px] backdrop-blur-none relative overflow-hidden p-0 h-full flex flex-col',
          isDragging ? 'node-dragging scale-[1.03]' : 'transition-all duration-200',
          !isDragging && 'hover:shadow-lg hover:border-primary',
          isSelected && 'scale-[1.02]',
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
          transform: 'translateZ(0)',
          willChange: isDragging ? 'transform, box-shadow' : 'auto',
        }}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        {person.advocate && (
          <div 
            className="absolute top-2 left-2 bg-yellow-400 text-background rounded-full p-2 shadow-lg z-20"
            title="Advocate - Actively promotes messages"
          >
            <Star size={20} weight="fill" />
          </div>
        )}
        {hasCollapsedBranch && collapsedCount > 0 && (
          <div 
            className="absolute top-14 right-2 bg-primary text-primary-foreground rounded-full px-2.5 py-1.5 shadow-lg flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform z-20"
            title={`${collapsedCount} person${collapsedCount > 1 ? 's' : ''} collapsed - click to expand`}
            onClick={(e) => {
              e.stopPropagation()
              onExpandBranch?.(e)
            }}
          >
            <Stack size={16} weight="fill" />
            <span className="text-xs font-bold">{collapsedCount}</span>
          </div>
        )}
        
        <div className="relative flex-shrink-0">
          <div 
            className="w-full h-48 overflow-hidden"
            style={{ 
              backgroundImage: person.photo ? `url(${person.photo})` : undefined,
              backgroundSize: person.photo ? `${photoZoom}%` : 'cover',
              backgroundPosition: `${50 + photoOffsetX}% ${50 + photoOffsetY}%`,
              backgroundRepeat: 'no-repeat',
              backgroundColor: person.photo ? undefined : frameColor,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: isDragging ? 'transform' : 'auto',
            }}
          >
            {!person.photo && (
              <div className="w-full h-full flex items-center justify-center">
                <span 
                  className={cn(
                    "text-5xl font-bold",
                    person.frameColor === 'white' ? 'text-background' : 'text-foreground'
                  )}
                >
                  {getInitials(person.name)}
                </span>
              </div>
            )}
          </div>
          
          <Badge 
            className="absolute top-2 right-2 font-bold text-base px-3 py-1.5 border-0 bg-primary text-primary-foreground" 
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}
          >
            {person.score}
          </Badge>
        </div>

        <div className="p-4 flex flex-col justify-start flex-1 min-h-0" style={{ height: 92 }}>
          <h3 className="font-semibold text-lg leading-tight break-words text-foreground line-clamp-1 mb-1">
            {person.name}
          </h3>
          <p className="text-sm leading-snug break-words text-muted-foreground line-clamp-1 mb-0.5">
            {person.position || '\u00A0'}
          </p>
          <p className="text-sm leading-snug break-words text-muted-foreground line-clamp-1 mb-0.5">
            {person.position2 || '\u00A0'}
          </p>
          <p className="text-sm leading-snug break-words text-muted-foreground line-clamp-1">
            {person.position3 || '\u00A0'}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.person.id === nextProps.person.id &&
    prevProps.person.x === nextProps.person.x &&
    prevProps.person.y === nextProps.person.y &&
    prevProps.person.name === nextProps.person.name &&
    prevProps.person.position === nextProps.person.position &&
    prevProps.person.position2 === nextProps.person.position2 &&
    prevProps.person.position3 === nextProps.person.position3 &&
    prevProps.person.photo === nextProps.person.photo &&
    prevProps.person.photoOffsetX === nextProps.person.photoOffsetX &&
    prevProps.person.photoOffsetY === nextProps.person.photoOffsetY &&
    prevProps.person.photoZoom === nextProps.person.photoZoom &&
    prevProps.person.score === nextProps.person.score &&
    prevProps.person.frameColor === nextProps.person.frameColor &&
    prevProps.person.advocate === nextProps.person.advocate &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isDimmed === nextProps.isDimmed &&
    prevProps.hasCollapsedBranch === nextProps.hasCollapsedBranch &&
    prevProps.collapsedCount === nextProps.collapsedCount
  )
})

export function PersonNode(props: PersonNodeProps) {
  return <PersonNodeInner {...props} />
}
