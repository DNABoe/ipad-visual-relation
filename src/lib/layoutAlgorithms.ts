import type { Person, Connection } from './types'

const CARD_WIDTH = 280
const CARD_HEIGHT = 160
const MIN_SPACING = 40

interface Point {
  x: number
  y: number
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

function checkOverlap(p1: Person, p2: Person, padding = MIN_SPACING): boolean {
  const left1 = p1.x - CARD_WIDTH / 2
  const right1 = p1.x + CARD_WIDTH / 2
  const top1 = p1.y - CARD_HEIGHT / 2
  const bottom1 = p1.y + CARD_HEIGHT / 2

  const left2 = p2.x - CARD_WIDTH / 2
  const right2 = p2.x + CARD_WIDTH / 2
  const top2 = p2.y - CARD_HEIGHT / 2
  const bottom2 = p2.y + CARD_HEIGHT / 2

  return !(
    right1 + padding < left2 ||
    left1 - padding > right2 ||
    bottom1 + padding < top2 ||
    top1 - padding > bottom2
  )
}

function resolveOverlaps(persons: Person[]): Person[] {
  const result = [...persons]
  const maxIterations = 100
  let iteration = 0

  while (iteration < maxIterations) {
    let hasOverlap = false

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (checkOverlap(result[i], result[j])) {
          hasOverlap = true
          
          const dx = result[j].x - result[i].x
          const dy = result[j].y - result[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          const minDist = CARD_WIDTH + MIN_SPACING
          const pushDistance = (minDist - dist) / 2 + 5
          
          if (dist < 0.01) {
            result[i].x -= 20
            result[j].x += 20
          } else {
            const pushX = (dx / dist) * pushDistance
            const pushY = (dy / dist) * pushDistance
            
            result[i].x -= pushX
            result[i].y -= pushY
            result[j].x += pushX
            result[j].y += pushY
          }
        }
      }
    }

    if (!hasOverlap) break
    iteration++
  }

  return result
}

export function organizeByImportance(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []

  const result = persons.map(p => ({ ...p }))
  
  const scoreGroups = {
    1: result.filter(p => p.score === 1),
    2: result.filter(p => p.score === 2),
    3: result.filter(p => p.score === 3),
    4: result.filter(p => p.score === 4),
    5: result.filter(p => p.score === 5),
  }

  const rings = [
    { score: 1, radius: 0 },
    { score: 2, radius: 350 },
    { score: 3, radius: 700 },
    { score: 4, radius: 1050 },
    { score: 5, radius: 1400 },
  ]

  rings.forEach(({ score, radius }) => {
    const group = scoreGroups[score as keyof typeof scoreGroups]
    if (group.length === 0) return

    if (radius === 0) {
      group.forEach(p => {
        p.x = 0
        p.y = 0
      })
    } else {
      const angleStep = (2 * Math.PI) / group.length
      group.forEach((person, index) => {
        const angle = index * angleStep
        person.x = Math.cos(angle) * radius
        person.y = Math.sin(angle) * radius
      })
    }
  })

  return resolveOverlaps(result)
}

export function organizeMinimalOverlap(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []

  const result = persons.map(p => ({ ...p }))
  
  const connectionMap = new Map<string, string[]>()
  connections.forEach(conn => {
    if (!connectionMap.has(conn.fromPersonId)) {
      connectionMap.set(conn.fromPersonId, [])
    }
    if (!connectionMap.has(conn.toPersonId)) {
      connectionMap.set(conn.toPersonId, [])
    }
    connectionMap.get(conn.fromPersonId)!.push(conn.toPersonId)
    connectionMap.get(conn.toPersonId)!.push(conn.fromPersonId)
  })

  const sortedByConnections = [...result].sort((a, b) => {
    const aConns = connectionMap.get(a.id)?.length || 0
    const bConns = connectionMap.get(b.id)?.length || 0
    return bConns - aConns
  })

  if (sortedByConnections.length > 0) {
    sortedByConnections[0].x = 0
    sortedByConnections[0].y = 0
  }

  const placed = new Set<string>([sortedByConnections[0]?.id])
  const toPlace = sortedByConnections.slice(1)

  toPlace.forEach(person => {
    const connectedIds = connectionMap.get(person.id) || []
    const placedConnected = result.filter(p => 
      placed.has(p.id) && connectedIds.includes(p.id)
    )

    if (placedConnected.length > 0) {
      const avgX = placedConnected.reduce((sum, p) => sum + p.x, 0) / placedConnected.length
      const avgY = placedConnected.reduce((sum, p) => sum + p.y, 0) / placedConnected.length
      
      person.x = avgX
      person.y = avgY
    } else {
      const placedPersons = result.filter(p => placed.has(p.id))
      if (placedPersons.length > 0) {
        const avgX = placedPersons.reduce((sum, p) => sum + p.x, 0) / placedPersons.length
        const avgY = placedPersons.reduce((sum, p) => sum + p.y, 0) / placedPersons.length
        
        const angle = Math.random() * 2 * Math.PI
        const radius = 400
        person.x = avgX + Math.cos(angle) * radius
        person.y = avgY + Math.sin(angle) * radius
      }
    }
    
    placed.add(person.id)
  })

  return resolveOverlaps(result)
}

export function tightenNetwork(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []

  const result = persons.map(p => ({ ...p }))
  
  const centerX = result.reduce((sum, p) => sum + p.x, 0) / result.length
  const centerY = result.reduce((sum, p) => sum + p.y, 0) / result.length

  const connectionLengths = connections
    .map(conn => {
      const from = result.find(p => p.id === conn.fromPersonId)
      const to = result.find(p => p.id === conn.toPersonId)
      if (!from || !to) return 0
      return distance(from, to)
    })
    .filter(len => len > 0)

  const avgConnectionLength = connectionLengths.length > 0
    ? connectionLengths.reduce((sum, len) => sum + len, 0) / connectionLengths.length
    : 400

  const targetLength = Math.max(300, avgConnectionLength * 0.7)

  result.forEach(person => {
    const dx = person.x - centerX
    const dy = person.y - centerY
    const currentDist = Math.sqrt(dx * dx + dy * dy)
    
    if (currentDist > 1) {
      const scale = Math.min(1, targetLength / avgConnectionLength)
      person.x = centerX + dx * scale
      person.y = centerY + dy * scale
    }
  })

  return resolveOverlaps(result)
}

export function smartArrange(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []

  const result = persons.map(p => ({ ...p }))
  
  const connectionMap = new Map<string, Set<string>>()
  connections.forEach(conn => {
    if (!connectionMap.has(conn.fromPersonId)) {
      connectionMap.set(conn.fromPersonId, new Set())
    }
    if (!connectionMap.has(conn.toPersonId)) {
      connectionMap.set(conn.toPersonId, new Set())
    }
    connectionMap.get(conn.fromPersonId)!.add(conn.toPersonId)
    connectionMap.get(conn.toPersonId)!.add(conn.fromPersonId)
  })

  result.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    const aConns = connectionMap.get(a.id)?.size || 0
    const bConns = connectionMap.get(b.id)?.size || 0
    return bConns - aConns
  })

  const centerPersons = result.filter(p => p.score === 1)
  const layer2Persons = result.filter(p => p.score === 2)
  const layer3Persons = result.filter(p => p.score === 3)
  const layer4Persons = result.filter(p => p.score === 4)
  const layer5Persons = result.filter(p => p.score === 5)

  const layers = [
    { persons: centerPersons, radius: 0 },
    { persons: layer2Persons, radius: 380 },
    { persons: layer3Persons, radius: 700 },
    { persons: layer4Persons, radius: 1020 },
    { persons: layer5Persons, radius: 1340 },
  ]

  layers.forEach(({ persons: layerPersons, radius }) => {
    if (layerPersons.length === 0) return

    if (radius === 0) {
      if (layerPersons.length === 1) {
        layerPersons[0].x = 0
        layerPersons[0].y = 0
      } else {
        const smallRadius = 120
        layerPersons.forEach((person, i) => {
          const angle = (i / layerPersons.length) * 2 * Math.PI
          person.x = Math.cos(angle) * smallRadius
          person.y = Math.sin(angle) * smallRadius
        })
      }
    } else {
      layerPersons.forEach((person, i) => {
        const angle = (i / layerPersons.length) * 2 * Math.PI
        person.x = Math.cos(angle) * radius
        person.y = Math.sin(angle) * radius
      })
    }
  })

  const maxIterations = 50
  for (let iter = 0; iter < maxIterations; iter++) {
    result.forEach(person => {
      const connectedIds = Array.from(connectionMap.get(person.id) || [])
      if (connectedIds.length === 0) return

      const connected = result.filter(p => connectedIds.includes(p.id))
      const avgX = connected.reduce((sum, p) => sum + p.x, 0) / connected.length
      const avgY = connected.reduce((sum, p) => sum + p.y, 0) / connected.length

      const currentDist = Math.sqrt(person.x ** 2 + person.y ** 2)
      const targetX = (person.x + avgX) / 2
      const targetY = (person.y + avgY) / 2
      const targetDist = Math.sqrt(targetX ** 2 + targetY ** 2)

      if (currentDist > 1) {
        const scale = currentDist / targetDist
        person.x = targetX * scale * 0.3 + person.x * 0.7
        person.y = targetY * scale * 0.3 + person.y * 0.7
      }
    })
  }

  return resolveOverlaps(result)
}
