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
  let deltaX = 0
  let deltaY = 0
  let hasXSnap = false
  let hasYSnap = false
  let minXDist = Infinity
  let minYDist = Infinity

  for (const staticPerson of staticPersons) {
    const staticTop = staticPerson.y
    const staticBottom = staticPerson.y + NODE_HEIGHT
    const staticLeft = staticPerson.x
    const staticRight = staticPerson.x + NODE_WIDTH
    const staticCenterX = staticPerson.x + NODE_WIDTH / 2
    const staticCenterY = staticPerson.y + NODE_HEIGHT / 2

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

    const distCenterYToCenterY = Math.abs(movingBounds.centerY - staticCenterY)
    if (distCenterYToCenterY < snapThreshold && distCenterYToCenterY < minYDist) {
      minYDist = distCenterYToCenterY
      deltaY = staticCenterY - movingBounds.centerY
      hasYSnap = true
      guides.length = 0
      guides.push({
        position: staticCenterY,
        orientation: 'horizontal',
        type: 'center-y'
      })
    }

    const distLeftToLeft = Math.abs(movingBounds.left - staticLeft)
    if (distLeftToLeft < snapThreshold && distLeftToLeft < minXDist) {
      minXDist = distLeftToLeft
      deltaX = staticLeft - movingBounds.left
      hasXSnap = true
      if (hasYSnap) {
        guides.push({
          position: staticLeft,
          orientation: 'vertical',
          type: 'left'
        })
      } else {
        guides.length = 0
        guides.push({
          position: staticLeft,
          orientation: 'vertical',
          type: 'left'
        })
      }
    }

    const distRightToRight = Math.abs(movingBounds.right - staticRight)
    if (distRightToRight < snapThreshold && distRightToRight < minXDist) {
      minXDist = distRightToRight
      deltaX = staticRight - movingBounds.right
      hasXSnap = true
      if (hasYSnap) {
        guides.push({
          position: staticRight,
          orientation: 'vertical',
          type: 'right'
        })
      } else {
        guides.length = 0
        guides.push({
          position: staticRight,
          orientation: 'vertical',
          type: 'right'
        })
      }
    }

    const distCenterXToCenterX = Math.abs(movingBounds.centerX - staticCenterX)
    if (distCenterXToCenterX < snapThreshold && distCenterXToCenterX < minXDist) {
      minXDist = distCenterXToCenterX
      deltaX = staticCenterX - movingBounds.centerX
      hasXSnap = true
      if (hasYSnap) {
        guides.push({
          position: staticCenterX,
          orientation: 'vertical',
          type: 'center-x'
        })
      } else {
        guides.length = 0
        guides.push({
          position: staticCenterX,
          orientation: 'vertical',
          type: 'center-x'
        })
      }
    }
  }

  if (!hasXSnap && !hasYSnap) {
    return null
  }

  return {
    x: deltaX,
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
