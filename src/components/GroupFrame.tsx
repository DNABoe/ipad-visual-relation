import type { Group } from '@/lib/types'
import { GROUP_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface GroupFrameProps {
  group: Group
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  style?: React.CSSProperties
}

export function GroupFrame({ group, isSelected, onClick, style }: GroupFrameProps) {
  const groupColor = GROUP_COLORS[group.color]

  return (
    <div
      className={cn(
        'absolute rounded-lg border-2 border-dashed pointer-events-auto',
        'transition-all cursor-pointer',
        isSelected && 'ring-2 ring-accent'
      )}
      style={{
        left: group.x,
        top: group.y,
        width: group.width,
        height: group.height,
        borderColor: groupColor,
        backgroundColor: `${groupColor}15`,
        ...style,
      }}
      onClick={onClick}
    >
      <div
        className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: groupColor,
          color: '#fff',
        }}
      >
        {group.name}
      </div>
    </div>
  )
}
