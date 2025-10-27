import type { Person, Connection, FrameColor } from './types'

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
  
  const scoreGroups = {
    1: result.filter(p => p.score === 1),
    2: result.filter(p => p.score === 2),
    3: result.filter(p => p.score === 3),
    4: result.filter(p => p.score === 4),
    5: result.filter(p => p.score === 5),
  }

  const rings = [
    { score: 1, radius: 0 },
    { score: 2, radius: 320 },
    { score: 3, radius: 560 },
    { score: 4, radius: 800 },
    { score: 5, radius: 1040 },
  ]

  rings.forEach(({ score, radius }) => {
    const group = scoreGroups[score as keyof typeof scoreGroups]
    if (group.length === 0) return

    if (radius === 0) {
      if (group.length === 1) {
        group[0].x = 0
        group[0].y = 0
      } else {
        const smallRadius = 120
        group.forEach((person, index) => {
          const angle = (index / group.length) * 2 * Math.PI - Math.PI / 2
          person.x = Math.cos(angle) * smallRadius
          person.y = Math.sin(angle) * smallRadius
        })
      }
    } else {
      group.forEach((person, index) => {
        const angle = (index / group.length) * 2 * Math.PI - Math.PI / 2
        person.x = Math.cos(angle) * radius
        person.y = Math.sin(angle) * radius
      })
    }
  })

  const maxIterations = 60
  for (let iter = 0; iter < maxIterations; iter++) {
    result.forEach(person => {
      const connectedIds = Array.from(connectionMap.get(person.id) || [])
      if (connectedIds.length === 0) return

      const connected = result.filter(p => connectedIds.includes(p.id))
      const avgX = connected.reduce((sum, p) => sum + p.x, 0) / connected.length
      const avgY = connected.reduce((sum, p) => sum + p.y, 0) / connected.length

      const pullStrength = person.score === 1 ? 0.05 : 0.2
      const dx = avgX - person.x
      const dy = avgY - person.y
      
      person.x += dx * pullStrength
      person.y += dy * pullStrength

      const currentDist = Math.sqrt(person.x ** 2 + person.y ** 2)
      const targetRadius = rings.find(r => r.score === person.score)?.radius || 0
      
      if (currentDist > 10) {
        const radiusScale = targetRadius / currentDist
        person.x *= (1 - pullStrength) + pullStrength * radiusScale
        person.y *= (1 - pullStrength) + pullStrength * radiusScale
      }
    })
  }

  return resolveOverlaps(result)
}

export function hierarchicalFromSelected(
  persons: Person[],
  connections: Connection[],
  selectedPersonId: string | null
): Person[] {
  if (persons.length === 0) return []
  if (!selectedPersonId) return persons.map(p => ({ ...p }))

  const result = persons.map(p => ({ ...p }))
  const rootPerson = result.find(p => p.id === selectedPersonId)
  
  if (!rootPerson) return result

  const connectionMap = new Map<string, { connectedId: string, attitude: FrameColor }[]>()
  connections.forEach(conn => {
    const from = result.find(p => p.id === conn.fromPersonId)
    const to = result.find(p => p.id === conn.toPersonId)
    
    if (from && to) {
      if (!connectionMap.has(conn.fromPersonId)) {
        connectionMap.set(conn.fromPersonId, [])
      }
      if (!connectionMap.has(conn.toPersonId)) {
        connectionMap.set(conn.toPersonId, [])
      }
      
      connectionMap.get(conn.fromPersonId)!.push({ 
        connectedId: conn.toPersonId, 
        attitude: to.frameColor 
      })
      connectionMap.get(conn.toPersonId)!.push({ 
        connectedId: conn.fromPersonId, 
        attitude: from.frameColor 
      })
    }
  })

  rootPerson.x = 0
  rootPerson.y = -600

  const connectedToRoot = connectionMap.get(selectedPersonId) || []
  const connectedIds = new Set(connectedToRoot.map(c => c.connectedId))
  
  const remainingPersons = result.filter(p => p.id !== selectedPersonId)
  
  const attitudePriority = { 'green': 0, 'white': 1, 'orange': 2, 'red': 3 }
  
  remainingPersons.sort((a, b) => {
    const aConnected = connectedIds.has(a.id)
    const bConnected = connectedIds.has(b.id)
    
    if (aConnected && !bConnected) return -1
    if (!aConnected && bConnected) return 1
    
    if (a.score !== b.score) return a.score - b.score
    
    const aAttitude = attitudePriority[a.frameColor as keyof typeof attitudePriority] ?? 4
    const bAttitude = attitudePriority[b.frameColor as keyof typeof attitudePriority] ?? 4
    
    return aAttitude - bAttitude
  })

  const layers: Person[][] = []
  const layerHeight = 220
  let currentY = -320
  
  const personsPerLayer = [3, 5, 7, 9, 11]
  let layerIndex = 0
  let currentLayer: Person[] = []
  
  remainingPersons.forEach(person => {
    currentLayer.push(person)
    
    const targetCount = personsPerLayer[Math.min(layerIndex, personsPerLayer.length - 1)]
    
    if (currentLayer.length >= targetCount) {
      layers.push([...currentLayer])
      currentLayer = []
      layerIndex++
    }
  })
  
  if (currentLayer.length > 0) {
    layers.push(currentLayer)
  }

  layers.forEach((layer, idx) => {
    const y = currentY + (idx + 1) * layerHeight
    const width = Math.min(1800, 280 + layer.length * 90)
    const spacing = layer.length > 1 ? width / (layer.length - 1) : 0
    const startX = -width / 2
    
    layer.forEach((person, personIdx) => {
      person.x = layer.length === 1 ? 0 : startX + personIdx * spacing
      person.y = y
    })
  })

  const maxIterations = 40
  for (let iter = 0; iter < maxIterations; iter++) {
    result.forEach(person => {
      if (person.id === selectedPersonId) return

      const connectedIds = Array.from(connectionMap.get(person.id) || []).map(c => c.connectedId)
      if (connectedIds.length === 0) return

      const connected = result.filter(p => connectedIds.includes(p.id))
      const avgX = connected.reduce((sum, p) => sum + p.x, 0) / connected.length

      const pullStrength = 0.15
      const dx = avgX - person.x
      
      person.x += dx * pullStrength
    })
  }

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

  const targetLength = avgConnectionLength * 0.6

  result.forEach(person => {
    const dx = person.x - centerX
    const dy = person.y - centerY
    const currentDist = Math.sqrt(dx * dx + dy * dy)
    
    if (currentDist > 1) {
      const scale = 0.7
      person.x = centerX + dx * scale
      person.y = centerY + dy * scale
    }
  })

  const maxIterations = 50
  for (let iter = 0; iter < maxIterations; iter++) {
    result.forEach(person => {
      const connectedIds = Array.from(connectionMap.get(person.id) || [])
      if (connectedIds.length === 0) return

      const connected = result.filter(p => connectedIds.includes(p.id))
      
      let totalPullX = 0
      let totalPullY = 0
      
      connected.forEach(other => {
        const dx = other.x - person.x
        const dy = other.y - person.y
        const currentDist = Math.sqrt(dx * dx + dy * dy)
        
        if (currentDist > 1) {
          const diff = currentDist - targetLength
          const force = diff / currentDist
          
          totalPullX += dx * force
          totalPullY += dy * force
        }
      })

      const pullStrength = 0.15
      person.x += totalPullX * pullStrength
      person.y += totalPullY * pullStrength
    })
  }

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

  const centerPersons = result.filter(p => p.score === 1)
  const otherPersons = result.filter(p => p.score > 1)

  if (centerPersons.length === 0) {
    return organizeByImportance(persons, connections)
  }

  if (centerPersons.length === 1) {
    centerPersons[0].x = 0
    centerPersons[0].y = 0
  } else {
    const centerRadius = 120
    centerPersons.forEach((person, i) => {
      const angle = (i / centerPersons.length) * 2 * Math.PI - Math.PI / 2
      person.x = Math.cos(angle) * centerRadius
      person.y = Math.sin(angle) * centerRadius
    })
  }

  const placed = new Set<string>(centerPersons.map(p => p.id))
  const toPlace = [...otherPersons]

  toPlace.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    
    const aConns = Array.from(connectionMap.get(a.id) || [])
    const bConns = Array.from(connectionMap.get(b.id) || [])
    
    const aConnectedToPlaced = aConns.filter(id => placed.has(id)).length
    const bConnectedToPlaced = bConns.filter(id => placed.has(id)).length
    
    if (aConnectedToPlaced !== bConnectedToPlaced) {
      return bConnectedToPlaced - aConnectedToPlaced
    }
    
    return bConns.length - aConns.length
  })

  const ringRadii = [320, 560, 800, 1040]
  
  toPlace.forEach(person => {
    const connectedIds = Array.from(connectionMap.get(person.id) || [])
    const placedConnected = result.filter(p => 
      placed.has(p.id) && connectedIds.includes(p.id)
    )

    let targetX = 0
    let targetY = 0
    
    if (placedConnected.length > 0) {
      targetX = placedConnected.reduce((sum, p) => sum + p.x, 0) / placedConnected.length
      targetY = placedConnected.reduce((sum, p) => sum + p.y, 0) / placedConnected.length
    }

    const ringIndex = Math.min(person.score - 2, ringRadii.length - 1)
    const targetRadius = ringRadii[Math.max(0, ringIndex)]

    const currentDist = Math.sqrt(targetX ** 2 + targetY ** 2)
    
    if (currentDist < 1) {
      const randomAngle = Math.random() * 2 * Math.PI
      person.x = Math.cos(randomAngle) * targetRadius
      person.y = Math.sin(randomAngle) * targetRadius
    } else {
      const scale = targetRadius / currentDist
      person.x = targetX * scale
      person.y = targetY * scale
    }

    const jitter = 40
    person.x += (Math.random() - 0.5) * jitter
    person.y += (Math.random() - 0.5) * jitter
    
    placed.add(person.id)
  })

  const maxIterations = 100
  for (let iter = 0; iter < maxIterations; iter++) {
    result.forEach(person => {
      if (person.score === 1) return

      const connectedIds = Array.from(connectionMap.get(person.id) || [])
      if (connectedIds.length === 0) return

      const connected = result.filter(p => connectedIds.includes(p.id))
      const avgX = connected.reduce((sum, p) => sum + p.x, 0) / connected.length
      const avgY = connected.reduce((sum, p) => sum + p.y, 0) / connected.length

      const currentDist = Math.sqrt(person.x ** 2 + person.y ** 2)
      const targetAngle = Math.atan2(person.y, person.x)
      
      const pullStrength = 0.2
      const dx = avgX - person.x
      const dy = avgY - person.y
      
      person.x += dx * pullStrength
      person.y += dy * pullStrength

      if (currentDist > 10) {
        const newDist = Math.sqrt(person.x ** 2 + person.y ** 2)
        const ringIndex = Math.min(person.score - 2, ringRadii.length - 1)
        const targetRadius = ringRadii[Math.max(0, ringIndex)]
        const scale = targetRadius / newDist
        
        person.x *= (1 - pullStrength * 0.5) + (pullStrength * 0.5) * scale
        person.y *= (1 - pullStrength * 0.5) + (pullStrength * 0.5) * scale
      }
    })
  }

  return resolveOverlaps(result)
}
