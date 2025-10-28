import type { Person } from './types'
import { NODE_WIDTH, NODE_HEIGHT } from './constants'

export interface AlignmentGuide {
  position: number
  orientation: 'horizontal' | 'vertical'
  type: 'top' | 'bottom' | 'left' | 'right' | 'center-x' | 'center-y'
}

export interface AlignmentResult {
  x: number
  y: number
  guides: AlignmentGuide[]
}

const SNAP_THRESHOLD = 8

export function calculateAlignment(
  movingPersons: Person[],
  staticPersons: Person[],
  snapThreshold: number = SNAP_THRESHOLD
): AlignmentResult | null {
  if (movingPersons.length === 0 || staticPersons.length === 0) {
    return null
  }

  const movingBounds = getGroupBounds(movingPersons)
  const guides: AlignmentGuide[] = []
  let deltaY = 0
  let hasYSnap = false
  let minYDist = Infinity

  for (const staticPerson of staticPersons) {
    const staticTop = staticPerson.y
    const staticBottom = staticPerson.y + NODE_HEIGHT

    const distTopToTop = Math.abs(movingBounds.top - staticTop)
    if (distTopToTop < snapThreshold && distTopToTop < minYDist) {
      minYDist = distTopToTop
      deltaY = staticTop - movingBounds.top
      hasYSnap = true
      guides.length = 0
      guides.push({
        position: staticTop,
        orientation: 'horizontal',
        type: 'top'
      })
    }

    const distBottomToBottom = Math.abs(movingBounds.bottom - staticBottom)
    if (distBottomToBottom < snapThreshold && distBottomToBottom < minYDist) {
      minYDist = distBottomToBottom
      deltaY = staticBottom - movingBounds.bottom
      hasYSnap = true
      guides.length = 0
      guides.push({
        position: staticBottom,
        orientation: 'horizontal',
        type: 'bottom'
      })
    }
  }

  if (!hasYSnap) {
    return null
  }

  return {
    x: 0,
    y: deltaY,
    guides: guides.filter((guide, index, self) => 
      index === self.findIndex(g => 
        g.position === guide.position && 
        g.orientation === guide.orientation && 
        g.type === guide.type
      )
    )
  }
}

function getGroupBounds(persons: Person[]) {
  const left = Math.min(...persons.map(p => p.x))
  const right = Math.max(...persons.map(p => p.x + NODE_WIDTH))
  const top = Math.min(...persons.map(p => p.y))
  const bottom = Math.max(...persons.map(p => p.y + NODE_HEIGHT))
  
  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
  }
}
