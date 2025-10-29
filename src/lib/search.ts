import type { Person, Group, Connection } from './types'

export interface SearchCriteria {
  query: string
  minScore?: number
  maxScore?: number
  positions?: string[]
  groupIds?: string[]
  frameColors?: string[]
  advocateOnly?: boolean
}

export interface SearchHistoryItem {
  id: string
  criteria: SearchCriteria
  timestamp: number
  label: string
}

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  
  if (textLower.includes(queryLower)) return true
  
  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }
  
  return queryIndex === queryLower.length
}

export function searchPersons(persons: Person[], criteria: SearchCriteria): Person[] {
  return persons.filter(person => {
    if (criteria.query) {
      const matchesName = fuzzyMatch(person.name, criteria.query)
      const matchesPosition = person.position ? fuzzyMatch(person.position, criteria.query) : false
      const matchesPosition2 = person.position2 ? fuzzyMatch(person.position2, criteria.query) : false
      const matchesPosition3 = person.position3 ? fuzzyMatch(person.position3, criteria.query) : false
      
      if (!matchesName && !matchesPosition && !matchesPosition2 && !matchesPosition3) {
        return false
      }
    }
    
    if (criteria.minScore !== undefined && person.score < criteria.minScore) {
      return false
    }
    
    if (criteria.maxScore !== undefined && person.score > criteria.maxScore) {
      return false
    }
    
    if (criteria.positions && criteria.positions.length > 0) {
      const hasMatchingPosition = criteria.positions.some(pos => {
        const posLower = pos.toLowerCase()
        return (
          (person.position && person.position.toLowerCase().includes(posLower)) ||
          (person.position2 && person.position2.toLowerCase().includes(posLower)) ||
          (person.position3 && person.position3.toLowerCase().includes(posLower))
        )
      })
      if (!hasMatchingPosition) {
        return false
      }
    }
    
    if (criteria.groupIds && criteria.groupIds.length > 0) {
      if (!person.groupId || !criteria.groupIds.includes(person.groupId)) {
        return false
      }
    }
    
    if (criteria.frameColors && criteria.frameColors.length > 0) {
      if (!criteria.frameColors.includes(person.frameColor)) {
        return false
      }
    }
    
    if (criteria.advocateOnly && !person.advocate) {
      return false
    }
    
    return true
  })
}

export function findShortestPath(
  fromPersonId: string,
  toPersonId: string,
  persons: Person[],
  connections: Connection[]
): string[] | null {
  if (fromPersonId === toPersonId) return [fromPersonId]
  
  const personIds = new Set(persons.map(p => p.id))
  if (!personIds.has(fromPersonId) || !personIds.has(toPersonId)) {
    return null
  }
  
  const adjacencyList = new Map<string, string[]>()
  persons.forEach(p => adjacencyList.set(p.id, []))
  
  connections.forEach(conn => {
    const from = adjacencyList.get(conn.fromPersonId)
    const to = adjacencyList.get(conn.toPersonId)
    if (from && to) {
      from.push(conn.toPersonId)
      to.push(conn.fromPersonId)
    }
  })
  
  const queue: { id: string; path: string[] }[] = [{ id: fromPersonId, path: [fromPersonId] }]
  const visited = new Set<string>([fromPersonId])
  
  while (queue.length > 0) {
    const current = queue.shift()!
    
    if (current.id === toPersonId) {
      return current.path
    }
    
    const neighbors = adjacencyList.get(current.id) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({
          id: neighbor,
          path: [...current.path, neighbor]
        })
      }
    }
  }
  
  return null
}

export function formatSearchCriteriaLabel(criteria: SearchCriteria): string {
  const parts: string[] = []
  
  if (criteria.query) {
    parts.push(`"${criteria.query}"`)
  }
  
  if (criteria.minScore !== undefined || criteria.maxScore !== undefined) {
    if (criteria.minScore !== undefined && criteria.maxScore !== undefined) {
      parts.push(`score: ${criteria.minScore}-${criteria.maxScore}`)
    } else if (criteria.minScore !== undefined) {
      parts.push(`score ≥ ${criteria.minScore}`)
    } else {
      parts.push(`score ≤ ${criteria.maxScore}`)
    }
  }
  
  if (criteria.positions && criteria.positions.length > 0) {
    parts.push(`positions: ${criteria.positions.join(', ')}`)
  }
  
  if (criteria.groupIds && criteria.groupIds.length > 0) {
    parts.push(`${criteria.groupIds.length} group(s)`)
  }
  
  if (criteria.frameColors && criteria.frameColors.length > 0) {
    parts.push(`colors: ${criteria.frameColors.join(', ')}`)
  }
  
  if (criteria.advocateOnly) {
    parts.push('advocates only')
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'All persons'
}
