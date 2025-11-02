import type { Person, Connection } from './types'

const CARD_WIDTH = 240
const CARD_HEIGHT = 340
const MIN_SPACING = 80

interface Point {
  x: number
  y: number
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

function checkOverlap(p1: Person, p2: Person, padding = MIN_SPACING): boolean {
  const halfWidth = CARD_WIDTH / 2 + padding
  const halfHeight = CARD_HEIGHT / 2 + padding
  
  const left1 = p1.x - halfWidth
  const right1 = p1.x + halfWidth
  const top1 = p1.y - halfHeight
  const bottom1 = p1.y + halfHeight
  
  const left2 = p2.x - halfWidth
  const right2 = p2.x + halfWidth
  const top2 = p2.y - halfHeight
  const bottom2 = p2.y + halfHeight
  
  return !(
    right1 < left2 ||
    left1 > right2 ||
    bottom1 < top2 ||
    top1 > bottom2
  )
}

function resolveOverlaps(persons: Person[], iterations = 300): Person[] {
  const result = persons.map(p => ({ ...p }))
  
  for (let iteration = 0; iteration < iterations; iteration++) {
    let hasOverlap = false
    let totalMovement = 0

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].x - result[i].x
        const dy = result[j].y - result[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        const minDistX = CARD_WIDTH + MIN_SPACING
        const minDistY = CARD_HEIGHT + MIN_SPACING
        
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)
        
        if (absX < minDistX && absY < minDistY) {
          hasOverlap = true
          
          if (dist < 1) {
            const angle = Math.random() * 2 * Math.PI
            const pushDist = (minDistX + minDistY) / 2
            const moveX = Math.cos(angle) * pushDist
            const moveY = Math.sin(angle) * pushDist
            
            result[i].x -= moveX
            result[i].y -= moveY
            result[j].x += moveX
            result[j].y += moveY
            totalMovement += pushDist * 2
          } else {
            const overlapX = minDistX - absX
            const overlapY = minDistY - absY
            
            if (overlapX > 0 || overlapY > 0) {
              let pushX = 0
              let pushY = 0
              
              if (overlapX > 0) {
                pushX = ((overlapX / 2) + 15) * (dx > 0 ? 1 : -1)
              }
              
              if (overlapY > 0) {
                pushY = ((overlapY / 2) + 15) * (dy > 0 ? 1 : -1)
              }
              
              result[i].x -= pushX
              result[i].y -= pushY
              result[j].x += pushX
              result[j].y += pushY
              
              totalMovement += Math.abs(pushX) + Math.abs(pushY)
            }
          }
        }
      }
    }

    if (!hasOverlap || totalMovement < 1) break
  }

  return result
}

function buildAdjacencyMap(connections: Connection[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  
  connections.forEach(conn => {
    if (!map.has(conn.fromPersonId)) {
      map.set(conn.fromPersonId, new Set())
    }
    if (!map.has(conn.toPersonId)) {
      map.set(conn.toPersonId, new Set())
    }
    map.get(conn.fromPersonId)!.add(conn.toPersonId)
    map.get(conn.toPersonId)!.add(conn.fromPersonId)
  })
  
  return map
}

export function forceDirectedLayout(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))
  const adjacency = buildAdjacencyMap(connections)

  const REPULSION_STRENGTH = 80000
  const ATTRACTION_STRENGTH = 0.03
  const DAMPING = 0.85
  const iterations = 150

  const velocities = new Map<string, { vx: number; vy: number }>()
  result.forEach(p => velocities.set(p.id, { vx: 0, vy: 0 }))

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>()
    result.forEach(p => forces.set(p.id, { fx: 0, fy: 0 }))

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const p1 = result[i]
        const p2 = result[j]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const distSq = dx * dx + dy * dy

        if (distSq === 0) continue

        const dist = Math.sqrt(distSq)
        const repulsionForce = REPULSION_STRENGTH / distSq

        const fx = (dx / dist) * repulsionForce
        const fy = (dy / dist) * repulsionForce

        const f1 = forces.get(p1.id)!
        const f2 = forces.get(p2.id)!
        f1.fx -= fx
        f1.fy -= fy
        f2.fx += fx
        f2.fy += fy
      }
    }

    connections.forEach(conn => {
      const p1 = result.find(p => p.id === conn.fromPersonId)
      const p2 = result.find(p => p.id === conn.toPersonId)

      if (!p1 || !p2) return

      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist === 0) return

      const displacement = dist - 300
      const force = displacement * ATTRACTION_STRENGTH

      const fx = (dx / dist) * force
      const fy = (dy / dist) * force

      const f1 = forces.get(p1.id)!
      const f2 = forces.get(p2.id)!
      f1.fx += fx
      f1.fy += fy
      f2.fx -= fx
      f2.fy -= fy
    })

    result.forEach(person => {
      const force = forces.get(person.id)!
      const vel = velocities.get(person.id)!
      vel.vx = (vel.vx + force.fx) * DAMPING
      vel.vy = (vel.vy + force.fy) * DAMPING

      const maxSpeed = 50
      const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy)
      if (speed > maxSpeed) {
        vel.vx = (vel.vx / speed) * maxSpeed
        vel.vy = (vel.vy / speed) * maxSpeed
      }

      person.x += vel.vx
      person.y += vel.vy
    })
  }

  const finalResult = resolveOverlaps(result, 100)

  const centerX = finalResult.reduce((sum, p) => sum + p.x, 0) / finalResult.length
  const centerY = finalResult.reduce((sum, p) => sum + p.y, 0) / finalResult.length

  finalResult.forEach(person => {
    person.x -= centerX
    person.y -= centerY
  })

  return finalResult
}

export function hierarchicalTreeLayout(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))
  const adjacency = buildAdjacencyMap(connections)

  const connectionCounts = new Map<string, number>()
  result.forEach(p => {
    connectionCounts.set(p.id, (adjacency.get(p.id)?.size || 0))
  })

  result.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    const aConns = connectionCounts.get(a.id) || 0
    const bConns = connectionCounts.get(b.id) || 0
    return bConns - aConns
  })

  const visited = new Set<string>()
  const layers = new Map<string, number>()
  const queue: Array<{ id: string; layer: number }> = [{ id: result[0].id, layer: 0 }]

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!

    if (visited.has(id)) continue
    visited.add(id)
    layers.set(id, layer)

    const neighbors = adjacency.get(id) || new Set()
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        queue.push({ id: neighborId, layer: layer + 1 })
      }
    })
  }

  result.forEach(p => {
    if (!layers.has(p.id)) {
      layers.set(p.id, result.length)
    }
  })

  const layerGroups = new Map<number, Person[]>()
  result.forEach(person => {
    const layer = layers.get(person.id) || 0
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, [])
    }
    layerGroups.get(layer)!.push(person)
  })

  const sortedLayers = Array.from(layerGroups.keys()).sort((a, b) => a - b)
  const LAYER_HEIGHT = 380
  const MIN_NODE_SPACING = 360

  sortedLayers.forEach((layerNum, layerIndex) => {
    const layerPersons = layerGroups.get(layerNum)!
    const y = layerIndex * LAYER_HEIGHT

    layerPersons.sort((a, b) => {
      const aNeighbors = Array.from(adjacency.get(a.id) || [])
        .map(id => result.find(p => p.id === id))
        .filter(p => p && (layers.get(p.id) || 0) < layerNum)

      const bNeighbors = Array.from(adjacency.get(b.id) || [])
        .map(id => result.find(p => p.id === id))
        .filter(p => p && (layers.get(p.id) || 0) < layerNum)

      if (aNeighbors.length === 0 && bNeighbors.length === 0) return 0
      if (aNeighbors.length === 0) return 1
      if (bNeighbors.length === 0) return -1

      const aAvgX = aNeighbors.reduce((sum, p) => sum + (p?.x || 0), 0) / aNeighbors.length
      const bAvgX = bNeighbors.reduce((sum, p) => sum + (p?.x || 0), 0) / bNeighbors.length

      return aAvgX - bAvgX
    })

    const totalWidth = Math.max(layerPersons.length * MIN_NODE_SPACING, 1000)
    const spacing = layerPersons.length > 1 ? totalWidth / (layerPersons.length - 1) : 0
    const startX = -totalWidth / 2

    layerPersons.forEach((person, index) => {
      person.x = layerPersons.length === 1 ? 0 : startX + index * spacing
      person.y = y
    })
  })

  for (let iter = 0; iter < 60; iter++) {
    sortedLayers.forEach((layerNum) => {
      const layerPersons = layerGroups.get(layerNum)!

      layerPersons.forEach(person => {
        const neighbors = Array.from(adjacency.get(person.id) || [])
          .map(id => result.find(p => p.id === id))
          .filter(p => p !== undefined) as Person[]

        if (neighbors.length === 0) return

        const avgX = neighbors.reduce((sum, p) => sum + p.x, 0) / neighbors.length
        const dx = avgX - person.x

        person.x += dx * 0.15
      })
    })
  }

  const finalResult = resolveOverlaps(result, 150)

  const centerX = finalResult.reduce((sum, p) => sum + p.x, 0) / finalResult.length
  const centerY = finalResult.reduce((sum, p) => sum + p.y, 0) / finalResult.length

  finalResult.forEach(person => {
    person.x -= centerX
    person.y -= centerY
  })

  return finalResult
}

export function circularClusterLayout(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))
  const adjacency = buildAdjacencyMap(connections)

  const clusters: Set<string>[] = []
  const personToCluster = new Map<string, number>()

  result.forEach(person => {
    if (personToCluster.has(person.id)) return

    const cluster = new Set<string>()
    const queue = [person.id]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (cluster.has(currentId)) continue

      cluster.add(currentId)
      personToCluster.set(currentId, clusters.length)

      const neighbors = adjacency.get(currentId) || new Set()
      neighbors.forEach(neighborId => {
        if (!cluster.has(neighborId) && !personToCluster.has(neighborId)) {
          queue.push(neighborId)
        }
      })
    }

    clusters.push(cluster)
  })

  const clusterGroups: Person[][] = clusters.map(() => [])
  result.forEach(person => {
    const clusterIndex = personToCluster.get(person.id)
    if (clusterIndex !== undefined) {
      clusterGroups[clusterIndex].push(person)
    }
  })

  clusterGroups.sort((a, b) => b.length - a.length)

  if (clusterGroups.length === 1) {
    const cluster = clusterGroups[0]
    const clusterAdjacency = buildAdjacencyMap(
      connections.filter(c =>
        cluster.some(p => p.id === c.fromPersonId) &&
        cluster.some(p => p.id === c.toPersonId)
      )
    )

    const sortedPersons = [...cluster].sort((a, b) => {
      const aConns = clusterAdjacency.get(a.id)?.size || 0
      const bConns = clusterAdjacency.get(b.id)?.size || 0
      if (aConns !== bConns) return bConns - aConns
      return a.score - b.score
    })

    const center = sortedPersons[0]
    center.x = 0
    center.y = 0

    const remaining = sortedPersons.slice(1)
    const baseRadius = 420
    const ringsNeeded = Math.ceil(remaining.length / 6)

    let personIndex = 0
    for (let ring = 0; ring < ringsNeeded && personIndex < remaining.length; ring++) {
      const radius = baseRadius + ring * 340
      const personsInRing = Math.min(6 + ring * 3, remaining.length - personIndex)

      for (let i = 0; i < personsInRing && personIndex < remaining.length; i++) {
        const angle = (i / personsInRing) * 2 * Math.PI - Math.PI / 2
        const person = remaining[personIndex]
        person.x = Math.cos(angle) * radius
        person.y = Math.sin(angle) * radius
        personIndex++
      }
    }
  } else {
    const clusterRadius = 350
    const mainRadius = Math.max(550, clusterGroups.length * 220)

    clusterGroups.forEach((cluster, clusterIndex) => {
      const clusterAngle = (clusterIndex / clusterGroups.length) * 2 * Math.PI
      const clusterCenterX = Math.cos(clusterAngle) * mainRadius
      const clusterCenterY = Math.sin(clusterAngle) * mainRadius

      const clusterAdjacency = buildAdjacencyMap(
        connections.filter(c =>
          cluster.some(p => p.id === c.fromPersonId) &&
          cluster.some(p => p.id === c.toPersonId)
        )
      )

      const sortedCluster = [...cluster].sort((a, b) => {
        const aConns = clusterAdjacency.get(a.id)?.size || 0
        const bConns = clusterAdjacency.get(b.id)?.size || 0
        if (aConns !== bConns) return bConns - aConns
        return a.score - b.score
      })

      if (sortedCluster.length === 1) {
        sortedCluster[0].x = clusterCenterX
        sortedCluster[0].y = clusterCenterY
      } else {
        sortedCluster.forEach((person, index) => {
          const personAngle = (index / sortedCluster.length) * 2 * Math.PI
          person.x = clusterCenterX + Math.cos(personAngle) * clusterRadius
          person.y = clusterCenterY + Math.sin(personAngle) * clusterRadius
        })
      }
    })
  }

  for (let iter = 0; iter < 80; iter++) {
    result.forEach(person => {
      const neighbors = Array.from(adjacency.get(person.id) || [])
        .map(id => result.find(p => p.id === id))
        .filter(p => p !== undefined) as Person[]

      if (neighbors.length === 0) return

      const avgX = neighbors.reduce((sum, p) => sum + p.x, 0) / neighbors.length
      const avgY = neighbors.reduce((sum, p) => sum + p.y, 0) / neighbors.length

      const dx = avgX - person.x
      const dy = avgY - person.y

      person.x += dx * 0.12
      person.y += dy * 0.12
    })
  }

  const finalResult = resolveOverlaps(result, 150)

  const centerX = finalResult.reduce((sum, p) => sum + p.x, 0) / finalResult.length
  const centerY = finalResult.reduce((sum, p) => sum + p.y, 0) / finalResult.length

  finalResult.forEach(person => {
    person.x -= centerX
    person.y -= centerY
  })

  return finalResult
}

export function arrangeByImportanceAndAttitude(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))
  const adjacency = buildAdjacencyMap(connections)

  result.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score

    const attitudeOrder = { green: 0, orange: 1, white: 2, red: 3 }
    const aAttitude = attitudeOrder[a.frameColor as keyof typeof attitudeOrder] ?? 4
    const bAttitude = attitudeOrder[b.frameColor as keyof typeof attitudeOrder] ?? 4

    if (aAttitude !== bAttitude) return aAttitude - bAttitude

    const aConns = adjacency.get(a.id)?.size || 0
    const bConns = adjacency.get(b.id)?.size || 0
    return bConns - aConns
  })

  const mostImportant = result[0]
  mostImportant.x = 0
  mostImportant.y = 0

  const remaining = result.slice(1)
  const positivePeople = remaining.filter(p => p.frameColor === 'green')
  const neutralPeople = remaining.filter(p => p.frameColor === 'orange' || p.frameColor === 'white')
  const negativePeople = remaining.filter(p => p.frameColor === 'red')

  const placeInRing = (people: Person[], startAngle: number, endAngle: number, baseRadius: number) => {
    const ringsNeeded = Math.ceil(people.length / 5)
    let personIndex = 0

    for (let ring = 0; ring < ringsNeeded && personIndex < people.length; ring++) {
      const radius = baseRadius + ring * 380
      const personsInRing = Math.min(5 + ring * 2, people.length - personIndex)

      for (let i = 0; i < personsInRing && personIndex < people.length; i++) {
        const angle = startAngle + ((endAngle - startAngle) * i / Math.max(personsInRing - 1, 1))
        const person = people[personIndex]

        const importanceFactor = 1 + (person.score - 1) * 0.12
        person.x = Math.cos(angle) * radius * importanceFactor
        person.y = Math.sin(angle) * radius * importanceFactor
        personIndex++
      }
    }
  }

  const topRadius = 450
  placeInRing(positivePeople, -Math.PI * 0.65, -Math.PI * 0.35, topRadius)
  placeInRing(neutralPeople, -Math.PI * 0.3, Math.PI * 0.3, topRadius + 120)
  placeInRing(negativePeople, Math.PI * 0.35, Math.PI * 0.65, topRadius + 200)

  for (let iter = 0; iter < 80; iter++) {
    result.forEach(person => {
      if (person === mostImportant) return

      const neighbors = Array.from(adjacency.get(person.id) || [])
        .map(id => result.find(p => p.id === id))
        .filter(p => p !== undefined) as Person[]

      if (neighbors.length === 0) return

      const avgX = neighbors.reduce((sum, p) => sum + p.x, 0) / neighbors.length
      const avgY = neighbors.reduce((sum, p) => sum + p.y, 0) / neighbors.length

      const dx = avgX - person.x
      const dy = avgY - person.y

      person.x += dx * 0.1
      person.y += dy * 0.1
    })
  }

  const finalResult = resolveOverlaps(result, 200)

  const centerX = finalResult.reduce((sum, p) => sum + p.x, 0) / finalResult.length
  const centerY = finalResult.reduce((sum, p) => sum + p.y, 0) / finalResult.length

  finalResult.forEach(person => {
    person.x -= centerX
    person.y -= centerY
  })

  return finalResult
}

export function arrangeByImportanceAndAdvocate(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))
  const adjacency = buildAdjacencyMap(connections)

  result.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score

    if (a.advocate !== b.advocate) return (b.advocate ? 1 : 0) - (a.advocate ? 1 : 0)

    const aConns = adjacency.get(a.id)?.size || 0
    const bConns = adjacency.get(b.id)?.size || 0
    return bConns - aConns
  })

  const mostImportant = result[0]
  mostImportant.x = 0
  mostImportant.y = 0

  const remaining = result.slice(1)
  const advocates = remaining.filter(p => p.advocate)
  const nonAdvocates = remaining.filter(p => !p.advocate)

  const placeInRing = (people: Person[], baseRadius: number, radiusMultiplier: number = 1) => {
    const ringsNeeded = Math.ceil(people.length / 6)
    let personIndex = 0

    for (let ring = 0; ring < ringsNeeded && personIndex < people.length; ring++) {
      const radius = (baseRadius + ring * 340) * radiusMultiplier
      const personsInRing = Math.min(6 + ring * 3, people.length - personIndex)

      for (let i = 0; i < personsInRing && personIndex < people.length; i++) {
        const angle = (i / personsInRing) * 2 * Math.PI - Math.PI / 2
        const person = people[personIndex]

        const importanceFactor = 1 + (person.score - 1) * 0.1
        person.x = Math.cos(angle) * radius * importanceFactor
        person.y = Math.sin(angle) * radius * importanceFactor
        personIndex++
      }
    }
  }

  placeInRing(advocates, 420, 0.85)
  placeInRing(nonAdvocates, 470, 1.15)

  for (let iter = 0; iter < 80; iter++) {
    result.forEach(person => {
      if (person === mostImportant) return

      const neighbors = Array.from(adjacency.get(person.id) || [])
        .map(id => result.find(p => p.id === id))
        .filter(p => p !== undefined) as Person[]

      if (neighbors.length === 0) return

      const avgX = neighbors.reduce((sum, p) => sum + p.x, 0) / neighbors.length
      const avgY = neighbors.reduce((sum, p) => sum + p.y, 0) / neighbors.length

      const dx = avgX - person.x
      const dy = avgY - person.y

      person.x += dx * 0.1
      person.y += dy * 0.1
    })
  }

  const finalResult = resolveOverlaps(result, 200)

  const centerX = finalResult.reduce((sum, p) => sum + p.x, 0) / finalResult.length
  const centerY = finalResult.reduce((sum, p) => sum + p.y, 0) / finalResult.length

  finalResult.forEach(person => {
    person.x -= centerX
    person.y -= centerY
  })

  return finalResult
}

export function influenceHierarchyLayout(
  persons: Person[],
  connections: Connection[],
  targetPersonId: string
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))
  const targetPerson = result.find(p => p.id === targetPersonId)

  if (!targetPerson) {
    return forceDirectedLayout(persons, connections)
  }

  const influenceScores = new Map<string, number>()
  const pathsToTarget = new Map<string, string[][]>()

  const getConnectionWeight = (conn: Connection, fromId: string, toId: string): number => {
    let weight = 1.0

    if (conn.weight === 'thick') weight *= 3.0
    else if (conn.weight === 'medium') weight *= 1.8
    else weight *= 1.0

    if (conn.direction === 'forward' && conn.fromPersonId === fromId && conn.toPersonId === toId) {
      weight *= 2.5
    } else if (conn.direction === 'backward' && conn.fromPersonId === toId && conn.toPersonId === fromId) {
      weight *= 2.5
    } else if (conn.direction === 'bidirectional') {
      weight *= 1.5
    } else if (conn.direction === 'none') {
      weight *= 1.0
    }

    return weight
  }

  const getPersonMultiplier = (person: Person): number => {
    let multiplier = 1.0

    if (person.advocate) multiplier *= 3.0

    if (person.frameColor === 'green') multiplier *= 2.5
    else if (person.frameColor === 'orange') multiplier *= 1.3
    else if (person.frameColor === 'red') multiplier *= 0.25

    const importanceWeight = Math.pow(1.5, (6 - person.score))
    multiplier *= importanceWeight

    return multiplier
  }

  result.forEach(person => {
    if (person.id === targetPersonId) {
      influenceScores.set(person.id, 0)
      return
    }

    const visited = new Set<string>()
    let maxInfluence = 0

    const queue: Array<{
      id: string
      path: string[]
      cumulativeInfluence: number
    }> = [{ id: person.id, path: [person.id], cumulativeInfluence: 0 }]

    const personPaths: string[][] = []
    const MAX_DEPTH = 6

    while (queue.length > 0) {
      const { id, path, cumulativeInfluence } = queue.shift()!

      if (path.length > MAX_DEPTH) continue

      if (id === targetPersonId) {
        personPaths.push(path)

        let pathInfluence = 0
        for (let i = 0; i < path.length - 1; i++) {
          const fromPerson = result.find(p => p.id === path[i])!
          const toPerson = result.find(p => p.id === path[i + 1])!

          const conn = connections.find(c =>
            (c.fromPersonId === fromPerson.id && c.toPersonId === toPerson.id) ||
            (c.fromPersonId === toPerson.id && c.toPersonId === fromPerson.id)
          )

          const connWeight = conn ? getConnectionWeight(conn, fromPerson.id, toPerson.id) : 0.5
          const personMult = getPersonMultiplier(fromPerson)

          const stepInfluence = connWeight * personMult
          const depthDecay = Math.pow(0.65, i)
          pathInfluence += stepInfluence * depthDecay
        }

        maxInfluence = Math.max(maxInfluence, pathInfluence)
        continue
      }

      if (visited.has(id)) continue
      visited.add(id)

      const relatedConnections = connections.filter(c =>
        c.fromPersonId === id || c.toPersonId === id
      )

      relatedConnections.forEach(conn => {
        const nextId = conn.fromPersonId === id ? conn.toPersonId : conn.fromPersonId

        if (!path.includes(nextId)) {
          const currentPerson = result.find(p => p.id === id)!
          const connWeight = getConnectionWeight(conn, id, nextId)
          const personMult = getPersonMultiplier(currentPerson)

          queue.push({
            id: nextId,
            path: [...path, nextId],
            cumulativeInfluence: cumulativeInfluence + (connWeight * personMult)
          })
        }
      })
    }

    influenceScores.set(person.id, maxInfluence)
    pathsToTarget.set(person.id, personPaths)
  })

  const layers = new Map<string, number>()
  const processedIds = new Set<string>([targetPersonId])
  layers.set(targetPersonId, 0)

  const sortedByInfluence = result
    .filter(p => p.id !== targetPersonId)
    .sort((a, b) => {
      const aScore = influenceScores.get(a.id) || 0
      const bScore = influenceScores.get(b.id) || 0
      return bScore - aScore
    })

  sortedByInfluence.forEach(person => {
    const paths = pathsToTarget.get(person.id) || []

    if (paths.length === 0) {
      layers.set(person.id, 999)
      return
    }

    let minLayer = 999

    paths.forEach(path => {
      for (let i = path.length - 2; i >= 0; i--) {
        const currentId = path[i]
        const nextId = path[i + 1]

        if (processedIds.has(nextId)) {
          const nextLayer = layers.get(nextId) || 0
          const proposedLayer = nextLayer + 1
          minLayer = Math.min(minLayer, proposedLayer)
          break
        }
      }
    })

    layers.set(person.id, minLayer === 999 ? 3 : minLayer)
    processedIds.add(person.id)
  })

  const layerGroups = new Map<number, Person[]>()
  result.forEach(person => {
    const layer = layers.get(person.id) || 999
    if (!layerGroups.has(layer)) {
      layerGroups.set(layer, [])
    }
    layerGroups.get(layer)!.push(person)
  })

  layerGroups.forEach((layerPersons) => {
    layerPersons.sort((a, b) => {
      const aInfluence = influenceScores.get(a.id) || 0
      const bInfluence = influenceScores.get(b.id) || 0

      if (Math.abs(aInfluence - bInfluence) > 0.01) {
        return bInfluence - aInfluence
      }

      const attitudeOrder = { green: 0, orange: 1, white: 2, red: 3 }
      const aAttitude = attitudeOrder[a.frameColor as keyof typeof attitudeOrder] ?? 4
      const bAttitude = attitudeOrder[b.frameColor as keyof typeof attitudeOrder] ?? 4
      if (aAttitude !== bAttitude) return aAttitude - bAttitude

      return 0
    })
  })

  targetPerson.x = 0
  targetPerson.y = -1000

  const sortedLayers = Array.from(layerGroups.keys())
    .filter(l => l !== 0)
    .sort((a, b) => a - b)

  const VERTICAL_SPACING = 400
  const BASE_HORIZONTAL_SPACING = 340

  sortedLayers.forEach((layerNum) => {
    const layerPersons = layerGroups.get(layerNum)!
    const y = (layerNum * VERTICAL_SPACING) - 600

    if (layerPersons.length === 1) {
      layerPersons[0].x = 0
      layerPersons[0].y = y
    } else {
      const connections_map = new Map<string, Person[]>()

      layerPersons.forEach(person => {
        const connectedToPreviousLayer = connections
          .filter(c =>
            (c.fromPersonId === person.id || c.toPersonId === person.id)
          )
          .map(c => {
            const otherId = c.fromPersonId === person.id ? c.toPersonId : c.fromPersonId
            return result.find(p => p.id === otherId)
          })
          .filter(p => p && (layers.get(p.id) || 0) < layerNum) as Person[]

        connections_map.set(person.id, connectedToPreviousLayer)
      })

      layerPersons.sort((a, b) => {
        const aConns = connections_map.get(a.id) || []
        const bConns = connections_map.get(b.id) || []

        if (aConns.length === 0 && bConns.length === 0) {
          const aInfluence = influenceScores.get(a.id) || 0
          const bInfluence = influenceScores.get(b.id) || 0
          return bInfluence - aInfluence
        }

        if (aConns.length === 0) return 1
        if (bConns.length === 0) return -1

        const aAvgX = aConns.reduce((sum, p) => sum + p.x, 0) / aConns.length
        const bAvgX = bConns.reduce((sum, p) => sum + p.x, 0) / bConns.length

        return aAvgX - bAvgX
      })

      const totalWidth = Math.max((layerPersons.length - 1) * BASE_HORIZONTAL_SPACING, 400)
      const spacing = layerPersons.length > 1 ? totalWidth / (layerPersons.length - 1) : 0
      const startX = -totalWidth / 2

      layerPersons.forEach((person, index) => {
        person.x = startX + index * spacing
        person.y = y
      })
    }
  })

  const unconnectedPersons = layerGroups.get(999)
  if (unconnectedPersons && unconnectedPersons.length > 0) {
    const maxLayer = Math.max(...Array.from(layerGroups.keys()).filter(k => k !== 999))
    const unconnectedY = ((maxLayer + 2) * VERTICAL_SPACING) - 600

    unconnectedPersons.forEach((person, index) => {
      const totalWidth = (unconnectedPersons.length - 1) * BASE_HORIZONTAL_SPACING
      const startX = -totalWidth / 2
      person.x = startX + index * BASE_HORIZONTAL_SPACING
      person.y = unconnectedY
    })
  }

  for (let iter = 0; iter < 200; iter++) {
    result.forEach(person => {
      if (person.id === targetPersonId) return

      const personLayer = layers.get(person.id) || 0

      const connectedPersons = connections
        .filter(c => c.fromPersonId === person.id || c.toPersonId === person.id)
        .map(c => {
          const otherId = c.fromPersonId === person.id ? c.toPersonId : c.fromPersonId
          const connectedPerson = result.find(p => p.id === otherId)
          return connectedPerson
        })
        .filter(p => p !== undefined) as Person[]

      if (connectedPersons.length === 0) return

      const adjacentLayerPersons = connectedPersons.filter(p => {
        const pLayer = layers.get(p.id) || 0
        return Math.abs(pLayer - personLayer) === 1
      })

      if (adjacentLayerPersons.length > 0) {
        const avgX = adjacentLayerPersons.reduce((sum, p) => sum + p.x, 0) / adjacentLayerPersons.length
        const dx = avgX - person.x
        person.x += dx * 0.08
      }
    })
  }

  for (let crossingReduction = 0; crossingReduction < 100; crossingReduction++) {
    let improved = false

    sortedLayers.forEach((layerNum) => {
      const layerPersons = layerGroups.get(layerNum)!
      if (layerPersons.length < 2) return

      for (let i = 0; i < layerPersons.length - 1; i++) {
        for (let j = i + 1; j < layerPersons.length; j++) {
          const p1 = layerPersons[i]
          const p2 = layerPersons[j]

          const p1Conns = connections
            .filter(c => c.fromPersonId === p1.id || c.toPersonId === p1.id)
            .map(c => c.fromPersonId === p1.id ? c.toPersonId : c.fromPersonId)

          const p2Conns = connections
            .filter(c => c.fromPersonId === p2.id || c.toPersonId === p2.id)
            .map(c => c.fromPersonId === p2.id ? c.toPersonId : c.fromPersonId)

          let currentCrossings = 0
          let swappedCrossings = 0

          p1Conns.forEach(p1ConnId => {
            const p1ConnPerson = result.find(p => p.id === p1ConnId)
            if (!p1ConnPerson) return

            p2Conns.forEach(p2ConnId => {
              const p2ConnPerson = result.find(p => p.id === p2ConnId)
              if (!p2ConnPerson) return

              if ((p1.x < p2.x && p1ConnPerson.x > p2ConnPerson.x) ||
                  (p1.x > p2.x && p1ConnPerson.x < p2ConnPerson.x)) {
                currentCrossings++
              }

              if ((p2.x < p1.x && p1ConnPerson.x > p2ConnPerson.x) ||
                  (p2.x > p1.x && p1ConnPerson.x < p2ConnPerson.x)) {
                swappedCrossings++
              }
            })
          })

          if (swappedCrossings < currentCrossings) {
            const tempX = p1.x
            p1.x = p2.x
            p2.x = tempX

            const tempIndex = layerPersons.indexOf(p1)
            const otherIndex = layerPersons.indexOf(p2)
            layerPersons[tempIndex] = p2
            layerPersons[otherIndex] = p1

            improved = true
          }
        }
      }
    })

    if (!improved) break
  }

  const finalResult = resolveOverlaps(result, 100)

  const targetY = -800
  const yOffset = targetY - targetPerson.y

  finalResult.forEach(person => {
    person.y += yOffset
  })

  const centerX = finalResult.reduce((sum, p) => sum + p.x, 0) / finalResult.length

  finalResult.forEach(person => {
    person.x -= centerX
  })

  return finalResult
}

export const organizeByImportance = forceDirectedLayout
export const hierarchicalFromSelected = hierarchicalTreeLayout
export const tightenNetwork = circularClusterLayout
export const smartArrange = forceDirectedLayout

export function compactNetworkLayout(
  persons: Person[],
  connections: Connection[]
): Person[] {
  if (persons.length === 0) return []
  if (persons.length === 1) {
    return [{ ...persons[0], x: 0, y: 0 }]
  }

  const result = persons.map(p => ({ ...p }))

  const centerX = result.reduce((sum, p) => sum + p.x, 0) / result.length
  const centerY = result.reduce((sum, p) => sum + p.y, 0) / result.length

  result.forEach(person => {
    person.x -= centerX
    person.y -= centerY
  })

  const SCALE_FACTOR = 0.7

  result.forEach(person => {
    person.x *= SCALE_FACTOR
    person.y *= SCALE_FACTOR
  })

  const COMPACT_CARD_WIDTH = CARD_WIDTH
  const COMPACT_CARD_HEIGHT = CARD_HEIGHT
  const TIGHT_SPACING = 60

  for (let iter = 0; iter < 250; iter++) {
    let anyMoved = false

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const p1 = result[i]
        const p2 = result[j]

        const dx = p2.x - p1.x
        const dy = p2.y - p1.y

        const minDistX = COMPACT_CARD_WIDTH + TIGHT_SPACING
        const minDistY = COMPACT_CARD_HEIGHT + TIGHT_SPACING

        const absX = Math.abs(dx)
        const absY = Math.abs(dy)

        if (absX < minDistX && absY < minDistY) {
          anyMoved = true

          if (Math.sqrt(dx * dx + dy * dy) < 1) {
            const angle = Math.random() * 2 * Math.PI
            const pushDist = (minDistX + minDistY) / 4
            p1.x -= Math.cos(angle) * pushDist
            p1.y -= Math.sin(angle) * pushDist
            p2.x += Math.cos(angle) * pushDist
            p2.y += Math.sin(angle) * pushDist
          } else {
            const overlapX = Math.max(0, minDistX - absX)
            const overlapY = Math.max(0, minDistY - absY)

            if (overlapX > 0 || overlapY > 0) {
              const pushX = overlapX > 0 ? ((overlapX / 2) + 10) * Math.sign(dx) : 0
              const pushY = overlapY > 0 ? ((overlapY / 2) + 10) * Math.sign(dy) : 0

              p1.x -= pushX
              p1.y -= pushY
              p2.x += pushX
              p2.y += pushY
            }
          }
        }
      }
    }

    if (!anyMoved) break
  }

  const finalCenterX = result.reduce((sum, p) => sum + p.x, 0) / result.length
  const finalCenterY = result.reduce((sum, p) => sum + p.y, 0) / result.length

  result.forEach(person => {
    person.x -= finalCenterX
    person.y -= finalCenterY
  })

  return result
}
