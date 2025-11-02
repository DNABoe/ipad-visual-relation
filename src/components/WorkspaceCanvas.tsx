import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { PersonNode } from './PersonNode'
import { GroupFrame } from './GroupFrame'
import { CanvasEdges, getConnectionsInRect } from './CanvasEdges'
import type { useWorkspaceController } from '@/hooks/useWorkspaceController'
import { NODE_WIDTH, NODE_HEIGHT, ZOOM_STEP, DEFAULT_WORKSPACE_SETTINGS } from '@/lib/constants'
import { calculateAlignment } from '@/lib/alignment'
import { generateId } from '@/lib/helpers'
import { toast } from 'sonner'
import type { Person } from '@/lib/types'

interface WorkspaceCanvasProps {
  controller: ReturnType<typeof useWorkspaceController>
  highlightedPersonIds?: Set<string>
  searchActive?: boolean
  shortestPathPersonIds?: string[]
  isShortestPathActive?: boolean
}

export function WorkspaceCanvas({ controller, highlightedPersonIds, searchActive, shortestPathPersonIds = [], isShortestPathActive = false }: WorkspaceCanvasProps) {
  const workspaceSettings = controller.workspace.settings || DEFAULT_WORKSPACE_SETTINGS
  
  const magneticSnap = workspaceSettings.magneticSnap
  const gridSize = workspaceSettings.gridSize
  const organicLines = workspaceSettings.organicLines
  const gridOpacity = workspaceSettings.gridOpacity
  const showGrid = workspaceSettings.showGrid

  const pendingUpdate = useRef<{
    updates: Map<string, Partial<Person>>
    animationFrame?: number
  }>({ updates: new Map() })

  const collapsedBranchesMap = useMemo(() => {
    const map = new Map<string, { collapsedPersonIds: string[] }>()
    const branches = controller.workspace.collapsedBranches || []
    branches.forEach(branch => {
      if (branch.collapsedPersonIds && branch.collapsedPersonIds.length > 0) {
        map.set(branch.parentId, branch)
      }
    })
    return map
  }, [controller.workspace.collapsedBranches])

  const visiblePersons = useMemo(() => {
    return controller.workspace.persons.filter(p => !p.hidden)
  }, [controller.workspace.persons])

  useEffect(() => {
    const canvas = controller.canvasRef.current
    if (!canvas) return

    const { x, y, scale } = controller.transform.transform
    const scaledGridSize = gridSize * scale
    
    canvas.style.setProperty('--grid-size', `${scaledGridSize}px`)
    canvas.style.setProperty('--grid-opacity', `${gridOpacity / 100}`)
    canvas.style.setProperty('--grid-x', `${x}px`)
    canvas.style.setProperty('--grid-y', `${y}px`)
    
    if (showGrid) {
      canvas.classList.add('canvas-with-grid')
    } else {
      canvas.classList.remove('canvas-with-grid')
    }
  }, [gridSize, gridOpacity, showGrid, controller.transform.transform.x, controller.transform.transform.y, controller.transform.transform.scale, controller.canvasRef])

  const workspacePersonsRef = useRef(controller.workspace.persons)
  const updatePersonsInBulkRef = useRef(controller.handlers.updatePersonsInBulk)
  
  useEffect(() => {
    workspacePersonsRef.current = controller.workspace.persons
    updatePersonsInBulkRef.current = controller.handlers.updatePersonsInBulk
  })

  const updatePersonPositions = useCallback((personIds: string[], dx: number, dy: number, skipUndo = true) => {
    const personsMap = new Map(workspacePersonsRef.current.map(p => [p.id, p]))
    
    for (const personId of personIds) {
      const person = personsMap.get(personId)
      if (person) {
        const newX = person.x + dx
        const newY = person.y + dy
        if (person.x !== newX || person.y !== newY) {
          pendingUpdate.current.updates.set(personId, { x: newX, y: newY })
        }
      }
    }
    
    if (pendingUpdate.current.animationFrame) {
      cancelAnimationFrame(pendingUpdate.current.animationFrame)
    }
    
    pendingUpdate.current.animationFrame = requestAnimationFrame(() => {
      if (pendingUpdate.current.updates.size > 0) {
        const updates = new Map(pendingUpdate.current.updates)
        pendingUpdate.current.updates.clear()
        updatePersonsInBulkRef.current(updates, skipUndo)
      }
      pendingUpdate.current.animationFrame = undefined
    })
  }, [])

  useEffect(() => {
    return () => {
      if (pendingUpdate.current.animationFrame) {
        cancelAnimationFrame(pendingUpdate.current.animationFrame)
        if (pendingUpdate.current.updates.size > 0) {
          updatePersonsInBulkRef.current(new Map(pendingUpdate.current.updates), true)
        }
      }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { interaction, transform, handlers, workspace, selection } = controller

    const rect = controller.canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentX = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
    const currentY = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

    if (interaction.dragState.type === 'connection') {
      const mouseX = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const mouseY = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      interaction.updateConnectionDrag(mouseX, mouseY)
    } else if (interaction.dragState.type === 'person') {
      if (!interaction.dragState.hasMoved) {
        interaction.markDragAsMoved()
      }
      
      const dx = e.movementX / transform.transform.scale
      const dy = e.movementY / transform.transform.scale

      if (!magneticSnap) {
        const newAccX = interaction.dragAccumulator.current.x + dx
        const newAccY = interaction.dragAccumulator.current.y + dy

        const gridStepsX = Math.floor(newAccX / gridSize)
        const gridStepsY = Math.floor(newAccY / gridSize)

        if (gridStepsX !== 0 || gridStepsY !== 0) {
          const moveX = gridStepsX * gridSize
          const moveY = gridStepsY * gridSize

          updatePersonPositions(selection.selectedPersons, moveX, moveY)

          interaction.dragAccumulator.current = { x: newAccX - moveX, y: newAccY - moveY }
        } else {
          interaction.dragAccumulator.current = { x: newAccX, y: newAccY }
        }
      } else {
        const selectedIds = selection.selectedPersons
        const personsMap = new Map(workspace.persons.map(p => [p.id, p]))
        
        const movingPersons: Person[] = []
        for (const id of selectedIds) {
          const person = personsMap.get(id)
          if (person) {
            movingPersons.push({ ...person, x: person.x + dx, y: person.y + dy })
          }
        }
        
        const staticPersons = workspace.persons.filter(
          p => !selectedIds.includes(p.id)
        )
        
        const alignment = calculateAlignment(movingPersons, staticPersons)
        
        const finalDx = dx + (alignment?.x || 0)
        const finalDy = dy + (alignment?.y || 0)
        
        updatePersonPositions(selectedIds, finalDx, finalDy)
        
        interaction.updateAlignmentGuides(alignment?.guides || [])
      }
    } else if (interaction.dragState.type === 'group') {
      if (!interaction.dragState.hasMoved) {
        interaction.markDragAsMoved()
      }
      const dx = e.movementX / transform.transform.scale
      const dy = e.movementY / transform.transform.scale

      const group = controller.workspace.groups.find(g => g.id === interaction.dragState.id)
      if (!group) return

      const personsInGroup = controller.workspace.persons.filter(person => {
        const personCenterX = person.x + NODE_WIDTH / 2
        const personCenterY = person.y + NODE_HEIGHT / 2
        return (
          personCenterX >= group.x &&
          personCenterX <= group.x + group.width &&
          personCenterY >= group.y &&
          personCenterY <= group.y + group.height
        )
      })

      if (!magneticSnap) {
        const newAccX = interaction.dragAccumulator.current.x + dx
        const newAccY = interaction.dragAccumulator.current.y + dy

        const gridStepsX = Math.floor(newAccX / gridSize)
        const gridStepsY = Math.floor(newAccY / gridSize)

        if (gridStepsX !== 0 || gridStepsY !== 0) {
          const moveX = gridStepsX * gridSize
          const moveY = gridStepsY * gridSize

          handlers.updateGroup(group.id, { x: group.x + moveX, y: group.y + moveY })

          const personUpdates = new Map()
          personsInGroup.forEach(person => {
            personUpdates.set(person.id, { x: person.x + moveX, y: person.y + moveY })
          })
          handlers.updatePersonsInBulk(personUpdates)

          interaction.dragAccumulator.current = { x: newAccX - moveX, y: newAccY - moveY }
        } else {
          interaction.dragAccumulator.current = { x: newAccX, y: newAccY }
        }
      } else {
        handlers.updateGroup(group.id, { x: group.x + dx, y: group.y + dy })

        const personUpdates = new Map()
        personsInGroup.forEach(person => {
          personUpdates.set(person.id, { x: person.x + dx, y: person.y + dy })
        })
        handlers.updatePersonsInBulk(personUpdates)
      }
    } else if (interaction.resizeState) {
      const dx = (e.clientX - interaction.resizeState.startX) / transform.transform.scale
      const dy = (e.clientY - interaction.resizeState.startY) / transform.transform.scale

      const group = controller.workspace.groups.find(g => g.id === interaction.resizeState!.groupId)
      if (!group) return

      const handle = interaction.resizeState.handle
      let newX = group.x
      let newY = group.y
      let newWidth = group.width
      let newHeight = group.height

      if (handle.includes('w')) {
        newX = interaction.resizeState.startGroupX + dx
        newWidth = Math.max(100, interaction.resizeState.startWidth - dx)
      }
      if (handle.includes('e')) {
        newWidth = Math.max(100, interaction.resizeState.startWidth + dx)
      }
      if (handle.includes('n')) {
        newY = interaction.resizeState.startGroupY + dy
        newHeight = Math.max(100, interaction.resizeState.startHeight - dy)
      }
      if (handle.includes('s')) {
        newHeight = Math.max(100, interaction.resizeState.startHeight + dy)
      }

      handlers.updateGroup(group.id, { x: newX, y: newY, width: newWidth, height: newHeight })
    } else if (transform.isPanning) {
      transform.pan(e.movementX, e.movementY)
    } else if (interaction.dragState.type === 'selection') {
      interaction.updateSelectionDrag(currentX, currentY)
      if (!interaction.dragState.hasMoved) {
        interaction.markDragAsMoved()
      }
    }
  }, [controller, magneticSnap, gridSize, updatePersonPositions])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const { interaction, transform } = controller

    if (interaction.dragState.type === 'connection') {
      return
    } else if (interaction.dragState.type === 'person' || interaction.dragState.type === 'group') {
      interaction.endDrag()
    } else if (transform.isPanning) {
      transform.stopPanning()
    } else {
      interaction.endDrag()
    }

    interaction.endResize()
  }, [controller])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP

    const rect = controller.canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    controller.transform.zoom(delta, mouseX, mouseY)
  }, [controller])

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      controller.interaction.endDrag()
      controller.interaction.endResize()
      controller.transform.stopPanning()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      if (e.code === 'Space' && !e.repeat && !isInputField) {
        e.preventDefault()
        controller.interaction.setSpacebarPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      if (e.code === 'Space' && !isInputField) {
        e.preventDefault()
        controller.interaction.setSpacebarPressed(false)
        controller.transform.stopPanning()
      }
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [controller])

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = controller.canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const canvasX = (e.clientX - rect.left - controller.transform.transform.x) / controller.transform.transform.scale
    const canvasY = (e.clientY - rect.top - controller.transform.transform.y) / controller.transform.transform.scale
    
    controller.setContextMenu({
      type: 'canvas',
      x: e.clientX,
      y: e.clientY,
      canvasX,
      canvasY
    })
  }, [controller])

  return (
    <div
      ref={controller.canvasRef}
      className="flex-1 relative overflow-hidden bg-canvas-bg"
      style={{ 
        cursor: controller.transform.isPanning 
          ? 'grabbing' 
          : controller.interaction.isSpacebarPressed 
            ? 'grab' 
            : 'default',
      } as React.CSSProperties}
      onMouseDown={controller.handlers.handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleCanvasContextMenu}
    >
      <div className="absolute inset-0 z-0">
        <CanvasEdges
          persons={controller.workspace.persons}
          connections={controller.workspace.connections}
          transform={controller.transform.transform}
          selectedConnections={controller.selection.selectedConnections}
          selectionRect={controller.interaction.selectionRect}
          organicLines={organicLines}
          shortestPathPersonIds={shortestPathPersonIds}
          isShortestPathActive={isShortestPathActive}
          onConnectionClick={(connectionId, e) => {
            e.stopPropagation()
            controller.handlers.handleConnectionClick(connectionId, e.shiftKey)
          }}
          onConnectionDoubleClick={(connectionId, e) => {
            e.stopPropagation()
            controller.handlers.handleConnectionDoubleClick(connectionId)
          }}
          onConnectionContextMenu={(connectionId, e) => {
            e.preventDefault()
            e.stopPropagation()
            controller.handlers.handleConnectionContextMenu(connectionId, e)
          }}
        />
      </div>

      <div
        className="absolute inset-0 z-10"
        style={{
          transform: `translate(${controller.transform.transform.x}px, ${controller.transform.transform.y}px) scale(${controller.transform.transform.scale})`,
          transformOrigin: '0 0',
          pointerEvents: 'none',
        }}
      >
        {controller.workspace.groups.map(group => (
          <GroupFrame
            key={group.id}
            group={group}
            isSelected={controller.selection.selectedGroups.includes(group.id)}
            isDragging={controller.interaction.dragState.type === 'group' && controller.interaction.dragState.id === group.id && controller.interaction.dragState.hasMoved === true}
            onClick={(e) => {
              e.stopPropagation()
              controller.handlers.handleGroupClick(group.id, e.shiftKey)
            }}
            onUpdate={(updates) => controller.handlers.handleUpdateGroup(group.id, updates)}
            onRemove={() => controller.handlers.handleDeleteGroup(group.id)}
            onDragStart={(e) => {
              e.stopPropagation()
              if (!controller.selection.selectedGroups.includes(group.id)) {
                controller.selection.selectGroup(group.id, false)
              }
              controller.interaction.startGroupDrag(group.id)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              controller.handlers.handleGroupContextMenu(group.id, e)
            }}
            onResizeStart={(e, handle) => {
              const rect = controller.canvasRef.current?.getBoundingClientRect()
              if (!rect) return

              controller.interaction.startGroupResize(
                group.id,
                handle,
                e.clientX,
                e.clientY,
                group.width,
                group.height,
                group.x,
                group.y
              )
            }}
            style={{ pointerEvents: 'auto' }}
          />
        ))}

        {visiblePersons.map(person => {
          const isHighlighted = highlightedPersonIds?.has(person.id) ?? false
          const isDimmed = searchActive && highlightedPersonIds && highlightedPersonIds.size > 0 && !isHighlighted
          
          const branch = collapsedBranchesMap.get(person.id)
          const hasCollapsedBranch = !!branch
          const collapsedCount = branch?.collapsedPersonIds.length || 0
          
          const isDraggingThisCard = (
            controller.interaction.dragState.type === 'person' && 
            controller.selection.selectedPersons.includes(person.id) &&
            controller.interaction.dragState.hasMoved
          )
          
          return (
          <PersonNode
            key={person.id}
            person={person}
            isSelected={controller.selection.selectedPersons.includes(person.id)}
            isDragging={isDraggingThisCard}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            hasCollapsedBranch={hasCollapsedBranch}
            collapsedCount={collapsedCount}
            connectionCount={0}
            onMouseDown={(e) => {
              e.stopPropagation()
              if (e.button !== 0) return
              
              if (controller.interaction.dragState.type === 'connection') {
                return
              }
              if (controller.interaction.isConnecting) return
              
              const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey
              
              if (!isMultiSelect && !controller.selection.selectedPersons.includes(person.id)) {
                controller.selection.selectPerson(person.id, false)
              } else if (isMultiSelect && controller.selection.selectedPersons.includes(person.id)) {
              } else if (isMultiSelect) {
                controller.selection.selectPerson(person.id, true)
              }
              
              controller.interaction.startPersonDrag(person.id)
            }}
            onMouseUp={(e) => {
              e.stopPropagation()
              if (e.button !== 0) return
              
              if (controller.interaction.dragState.type === 'connection' && controller.interaction.dragState.id) {
                const fromPersonId = controller.interaction.dragState.id
                const toPersonId = person.id
                
                if (fromPersonId !== toPersonId) {
                  const existingConnection = controller.workspace.connections.find(
                    c => (c.fromPersonId === fromPersonId && c.toPersonId === toPersonId) ||
                         (c.fromPersonId === toPersonId && c.toPersonId === fromPersonId)
                  )

                  if (!existingConnection) {
                    const newConnection = {
                      id: generateId(),
                      fromPersonId: fromPersonId,
                      toPersonId: toPersonId,
                    }
                    controller.handlers.addConnection(newConnection)
                    controller.selection.clearSelection()
                    toast.success('Connection created')
                  } else {
                    toast.info('Connection already exists')
                  }
                }
                
                controller.interaction.endDrag()
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              controller.handlers.handlePersonDoubleClick(person.id)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              controller.handlers.handlePersonContextMenu(person.id, e, e.ctrlKey || e.metaKey)
            }}
            onExpandBranch={(e) => {
              e.stopPropagation()
              controller.handlers.handleExpandBranchFromPerson(person.id)
            }}
            style={{ pointerEvents: 'auto' }}
          />
          )
        })}

        {controller.interaction.selectionRect && (
          <div
            className="selection-rect absolute pointer-events-none"
            style={{
              left: controller.interaction.selectionRect.x,
              top: controller.interaction.selectionRect.y,
              width: controller.interaction.selectionRect.width,
              height: controller.interaction.selectionRect.height,
            }}
          />
        )}

        {controller.interaction.alignmentGuides.map((guide, index) => (
          <div
            key={`${guide.orientation}-${guide.position}-${index}`}
            className="absolute pointer-events-none"
            style={{
              position: 'absolute',
              ...(guide.orientation === 'horizontal' ? {
                left: 0,
                right: 0,
                top: guide.position,
                height: '2px',
                width: '100%',
                backgroundImage: 'repeating-linear-gradient(90deg, oklch(0.72 0.18 45) 0, oklch(0.72 0.18 45) 8px, transparent 8px, transparent 16px)',
              } : {
                top: 0,
                bottom: 0,
                left: guide.position,
                width: '2px',
                height: '100%',
                backgroundImage: 'repeating-linear-gradient(0deg, oklch(0.72 0.18 45) 0, oklch(0.72 0.18 45) 8px, transparent 8px, transparent 16px)',
              }),
              zIndex: 1000,
            }}
          />
        ))}

        {controller.interaction.dragState.type === 'connection' && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
          >
            {(() => {
              const fromPerson = controller.workspace.persons.find(p => p.id === controller.interaction.dragState.id)
              if (!fromPerson) return null

              const fromX = fromPerson.x + NODE_WIDTH / 2
              const fromY = fromPerson.y + NODE_HEIGHT / 2
              const toX = controller.interaction.dragState.mouseX || 0
              const toY = controller.interaction.dragState.mouseY || 0

              const accentColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent')
                .trim()

              return (
                <>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={accentColor}
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    opacity="0.8"
                  />
                  <circle
                    cx={toX}
                    cy={toY}
                    r="6"
                    fill={accentColor}
                  />
                </>
              )
            })()}
          </svg>
        )}
      </div>

      {controller.interaction.isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg">
          {controller.interaction.connectFrom ? 'Click target person to connect' : 'Click first person to start'}
        </div>
      )}
    </div>
  )
}
