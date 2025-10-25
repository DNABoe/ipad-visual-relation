import type { Person, Connection, ConnectionSide } from './types'
import { NODE_WIDTH, NODE_HEIGHT } from './constants'

export function getHubPosition(person: Person, side: ConnectionSide): { x: number; y: number } {
  const centerX = person.x + NODE_WIDTH / 2
  const centerY = person.y + NODE_HEIGHT / 2
  
  switch (side) {
    case 'top':
      return { x: centerX, y: person.y }
    case 'right':
      return { x: person.x + NODE_WIDTH, y: centerY }
    case 'bottom':
      return { x: centerX, y: person.y + NODE_HEIGHT }
    case 'left':
      return { x: person.x, y: centerY }
  }
}

export function getBestConnectionSides(
  fromPerson: Person,
  toPerson: Person
): { fromSide: ConnectionSide; toSide: ConnectionSide } {
  const fromCenterX = fromPerson.x + NODE_WIDTH / 2
  const fromCenterY = fromPerson.y + NODE_HEIGHT / 2
  const toCenterX = toPerson.x + NODE_WIDTH / 2
  const toCenterY = toPerson.y + NODE_HEIGHT / 2
  
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  let fromSide: ConnectionSide
  let toSide: ConnectionSide
  
  if (angle >= -45 && angle < 45) {
    fromSide = 'right'
    toSide = 'left'
  } else if (angle >= 45 && angle < 135) {
    fromSide = 'bottom'
    toSide = 'top'
  } else if (angle >= 135 || angle < -135) {
    fromSide = 'left'
    toSide = 'right'
  } else {
    fromSide = 'top'
    toSide = 'bottom'
  }
  
  return { fromSide, toSide }
}

export function doesLineIntersectPerson(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  person: Person,
  excludePersons: Person[]
): boolean {
  if (excludePersons.some(p => p.id === person.id)) {
    return false
  }
  
  const padding = 10
  const left = person.x - padding
  const right = person.x + NODE_WIDTH + padding
  const top = person.y - padding
  const bottom = person.y + NODE_HEIGHT + padding
  
  return lineIntersectsRect(x1, y1, x2, y2, left, top, right, bottom)
}

function lineIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  left: number,
  top: number,
  right: number,
  bottom: number
): boolean {
  if (pointInRect(x1, y1, left, top, right, bottom) || 
      pointInRect(x2, y2, left, top, right, bottom)) {
    return true
  }
  
  return (
    lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||
    lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom) ||
    lineIntersectsLine(x1, y1, x2, y2, right, bottom, left, bottom) ||
    lineIntersectsLine(x1, y1, x2, y2, left, bottom, left, top)
  )
}

function pointInRect(
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number
): boolean {
  return x >= left && x <= right && y >= top && y <= bottom
}

function lineIntersectsLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) return false
  
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom
  
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
}

export function createRoutedPath(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  fromSide: ConnectionSide,
  toSide: ConnectionSide,
  persons: Person[],
  excludePersons: Person[]
): { path: string; hasCollision: boolean } {
  const dx = toPos.x - fromPos.x
  const dy = toPos.y - fromPos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  const directCollision = persons.some(person => 
    doesLineIntersectPerson(fromPos.x, fromPos.y, toPos.x, toPos.y, person, excludePersons)
  )
  
  const offset = Math.min(80, distance * 0.3)
  
  let controlPoint1: { x: number; y: number }
  let controlPoint2: { x: number; y: number }
  
  if (fromSide === 'right') {
    controlPoint1 = { x: fromPos.x + offset, y: fromPos.y }
  } else if (fromSide === 'left') {
    controlPoint1 = { x: fromPos.x - offset, y: fromPos.y }
  } else if (fromSide === 'bottom') {
    controlPoint1 = { x: fromPos.x, y: fromPos.y + offset }
  } else {
    controlPoint1 = { x: fromPos.x, y: fromPos.y - offset }
  }
  
  if (toSide === 'right') {
    controlPoint2 = { x: toPos.x + offset, y: toPos.y }
  } else if (toSide === 'left') {
    controlPoint2 = { x: toPos.x - offset, y: toPos.y }
  } else if (toSide === 'bottom') {
    controlPoint2 = { x: toPos.x, y: toPos.y + offset }
  } else {
    controlPoint2 = { x: toPos.x, y: toPos.y - offset }
  }
  
  const path = `M ${fromPos.x} ${fromPos.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${toPos.x} ${toPos.y}`
  
  return { path, hasCollision: directCollision }
}
