import type { Person } from './types'
import { NODE_WIDTH, NODE_HEIGHT } from './constants'

export function alignVertical(persons: Person[]): Person[] {
  if (persons.length < 2) return persons

  const leftmost = Math.min(...persons.map(p => p.x))
  
  return persons.map(p => ({
    ...p,
    x: leftmost
  }))
}

export function alignHorizontal(persons: Person[]): Person[] {
  if (persons.length < 2) return persons

  const topmost = Math.min(...persons.map(p => p.y))
  
  return persons.map(p => ({
    ...p,
    y: topmost
  }))
}

export function distributeVertical(persons: Person[]): Person[] {
  if (persons.length < 3) return persons

  const sorted = [...persons].sort((a, b) => a.y - b.y)
  const topmost = sorted[0].y
  const bottommost = sorted[sorted.length - 1].y
  
  const totalSpace = bottommost - topmost
  const spacing = totalSpace / (sorted.length - 1)
  
  return persons.map(p => {
    const sortedIndex = sorted.findIndex(sp => sp.id === p.id)
    return {
      ...p,
      y: topmost + (sortedIndex * spacing)
    }
  })
}

export function distributeHorizontal(persons: Person[]): Person[] {
  if (persons.length < 3) return persons

  const sorted = [...persons].sort((a, b) => a.x - b.x)
  const leftmost = sorted[0].x
  const rightmost = sorted[sorted.length - 1].x
  
  const totalSpace = rightmost - leftmost
  const spacing = totalSpace / (sorted.length - 1)
  
  return persons.map(p => {
    const sortedIndex = sorted.findIndex(sp => sp.id === p.id)
    return {
      ...p,
      x: leftmost + (sortedIndex * spacing)
    }
  })
}
