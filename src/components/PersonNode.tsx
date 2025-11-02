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
      animate={{
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
        ease: 'linear',
      } : {
        type: 'spring',
        stiffness: 400,
        damping: 35,
        mass: 0.5,
        opacity: { duration: 0.15 },
      }}
      style={{ 
        width: 200,
        height: 280,
        willChange: isDragging ? 'transform' : 'auto',
        transform: 'translateZ(0)',
        contain: 'layout style paint',
        pointerEvents: isDragging ? 'none' : 'auto',
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
            top: (stackCount - index) * 2.5,
            left: (stackCount - index) * 1.5,
            right: -(stackCount - index) * 1.5,
            borderColor: frameColor,
            backgroundColor: 'oklch(0.18 0.03 230)',
            border: '2px solid',
            zIndex: -index - 1,
            transform: 'translateZ(0)',
          }}
        />
      ))}
      <Card
        className={cn(
          'cursor-grab select-none border-[3px] backdrop-blur-none relative overflow-hidden p-0 h-full flex flex-col',
          isDragging ? 'node-dragging scale-[1.03] shadow-2xl' : 'transition-all duration-200',
          !isDragging && !isSelected && 'hover:shadow-lg hover:border-primary',
          isHighlighted && 'ring-2 ring-success ring-offset-2 ring-offset-canvas-bg glow-accent-strong scale-105',
          isDimmed && 'opacity-30 grayscale',
          hasCollapsedBranch && 'cursor-pointer relative z-10'
        )}
        style={{
          ...style,
          borderColor: isSelected ? 'oklch(0.88 0.18 185)' : frameColor,
          backgroundColor: 'oklch(0.21 0.03 230)',
          boxShadow: isDragging
            ? '0 8px 32px rgba(0, 0, 0, 0.6)'
            : isSelected
            ? `0 0 20px oklch(0.88 0.18 185 / 1), 0 0 40px oklch(0.88 0.18 185 / 0.8), 0 0 80px oklch(0.88 0.18 185 / 0.5), 0 8px 24px rgba(0, 0, 0, 0.6)`
            : isHighlighted 
            ? '0 3px 16px rgba(0, 255, 128, 0.4), 0 1px 6px rgba(0, 0, 0, 0.3)' 
            : '0 2px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
          transform: 'translateZ(0)',
          willChange: isDragging ? 'transform' : 'auto',
          contentVisibility: isDragging ? 'auto' : 'visible',
        }}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
      >
        {person.advocate && (
          <div 
            className="absolute top-1.5 left-1.5 bg-yellow-400 text-background rounded-full p-1.5 shadow-lg z-20"
            title="Advocate - Actively promotes messages"
          >
            <Star size={16} weight="fill" />
          </div>
        )}
        {hasCollapsedBranch && collapsedCount > 0 && (
          <div 
            className="absolute top-12 right-1.5 bg-primary text-primary-foreground rounded-full px-2 py-1 shadow-lg flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform z-20"
            title={`${collapsedCount} person${collapsedCount > 1 ? 's' : ''} collapsed - click to expand`}
            onClick={(e) => {
              e.stopPropagation()
              onExpandBranch?.(e)
            }}
          >
            <Stack size={14} weight="fill" />
            <span className="text-xs font-bold">{collapsedCount}</span>
          </div>
        )}
        
        <div className="relative flex-shrink-0">
          <div 
            className="w-full h-40 overflow-hidden bg-image-container rounded-t-lg"
            style={{ 
              backgroundImage: isDragging && person.photo ? 'none' : person.photo ? `url(${person.photo})` : undefined,
              backgroundSize: person.photo ? `${photoZoom}%` : 'cover',
              backgroundPosition: `${50 + photoOffsetX}% ${50 + photoOffsetY}%`,
              backgroundRepeat: 'no-repeat',
              backgroundColor: frameColor,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              willChange: isDragging ? 'transform' : 'auto',
            }}
          >
            {!person.photo && (
              <div className="w-full h-full flex items-center justify-center">
                <span 
                  className="text-4xl font-bold text-foreground"
                >
                  {getInitials(person.name)}
                </span>
              </div>
            )}
          </div>
          
          <Badge 
            className="absolute top-1.5 right-1.5 font-bold text-sm px-2.5 py-1 border-0 bg-primary text-primary-foreground" 
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)' }}
          >
            {person.score}
          </Badge>
        </div>

        <div className="px-3 py-2 flex flex-col justify-start flex-1 min-h-0" style={{ height: 80 }}>
          <h3 className="font-semibold text-base leading-tight break-words text-foreground line-clamp-1 mb-1.5">
            {person.name}
          </h3>
          <p className="text-xs leading-[1.35] break-words text-muted-foreground line-clamp-3 mb-0.5">
            {person.position || '\u00A0'}
          </p>
          <p className="text-xs leading-[1.25] break-words text-muted-foreground line-clamp-1 mb-0.5">
            {person.position2 || '\u00A0'}
          </p>
          <p className="text-xs leading-[1.25] break-words text-muted-foreground line-clamp-1">
            {person.position3 || '\u00A0'}
          </p>
        </div>
      </Card>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  if (prevProps.isDragging || nextProps.isDragging) {
    return false
  }
  
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
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isDimmed === nextProps.isDimmed &&
    prevProps.hasCollapsedBranch === nextProps.hasCollapsedBranch &&
    prevProps.collapsedCount === nextProps.collapsedCount
  )
})

export function PersonNode(props: PersonNodeProps) {
  return <PersonNodeInner {...props} />
}
