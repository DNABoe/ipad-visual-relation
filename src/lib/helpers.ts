

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize
}

export function getBounds(persons: { x: number; y: number }[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (persons.length === 0) return null
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  persons.forEach(p => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  })
  
  return { minX, minY, maxX, maxY }
}

export function isPointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

export function rectsIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    r1.x > r2.x + r2.width ||
    r1.x + r1.width < r2.x ||
    r1.y > r2.y + r2.height ||
    r1.y + r1.height < r2.y
  )
}

export function findBranchNodesBelow(
  connectionId: string,
  connections: { id: string; fromPersonId: string; toPersonId: string }[],
  persons: { id: string }[]
): string[] {
  const connection = connections.find(c => c.id === connectionId)
  if (!connection) return []

  const adjacencyMap = new Map<string, string[]>()
  connections.forEach(conn => {
    if (!adjacencyMap.has(conn.fromPersonId)) {
      adjacencyMap.set(conn.fromPersonId, [])
    }
    adjacencyMap.get(conn.fromPersonId)!.push(conn.toPersonId)
  })

  const startNode = connection.toPersonId
  const visited = new Set<string>()
  const branchNodes: string[] = []

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    branchNodes.push(nodeId)

    const neighbors = adjacencyMap.get(nodeId) || []
    neighbors.forEach(neighborId => {
      dfs(neighborId)
    })
  }

  dfs(startNode)

  branchNodes.shift()

  return branchNodes
}

export function findAllDescendants(
  startPersonId: string,
  connections: { fromPersonId: string; toPersonId: string }[]
): string[] {
  const adjacencyMap = new Map<string, string[]>()
  connections.forEach(conn => {
    if (!adjacencyMap.has(conn.fromPersonId)) {
      adjacencyMap.set(conn.fromPersonId, [])
    }
    adjacencyMap.get(conn.fromPersonId)!.push(conn.toPersonId)
  })

  const visited = new Set<string>()
  const descendants: string[] = []

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const children = adjacencyMap.get(nodeId) || []
    children.forEach(childId => {
      descendants.push(childId)
      dfs(childId)
    })
  }

  dfs(startPersonId)

  return descendants
}

export function serializeWorkspace(workspace: any): string {
  return JSON.stringify(workspace)
}

export function deserializeWorkspace(data: string): any {
  const parsed = JSON.parse(data)
  return {
    ...parsed,
    collapsedBranches: parsed.collapsedBranches || []
  }
}
