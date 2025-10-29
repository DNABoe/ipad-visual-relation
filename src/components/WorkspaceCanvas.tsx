import { useCallback, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { PersonNode } from './PersonNode'
import { GroupFrame } from './GroupFrame'
import { CanvasEdges, getConnectionsInRect } from './CanvasEdges'
import type { useWorkspaceController } from '@/hooks/useWorkspaceController'
import { NODE_WIDTH, NODE_HEIGHT, ZOOM_STEP, DEFAULT_APP_SETTINGS } from '@/lib/constants'
import { calculateAlignment } from '@/lib/alignment'
import { toast } from 'sonner'
import type { AppSettings } from '@/lib/types'

interface WorkspaceCanvasProps {
  controller: ReturnType<typeof useWorkspaceController>
  highlightedPersonIds?: Set<string>
  searchActive?: boolean
}

export function WorkspaceCanvas({ controller, highlightedPersonIds, searchActive }: WorkspaceCanvasProps) {
  const [settings] = useKV<AppSettings>('app-settings', DEFAULT_APP_SETTINGS)

  const snapToGrid = settings?.snapToGrid ?? false
  const gridSize = settings?.gridSize ?? 20
  const showGrid = settings?.showGrid ?? true
  const organicLines = settings?.organicLines ?? false
  const gridOpacity = settings?.gridOpacity ?? 15

  useEffect(() => {
    const canvas = controller.canvasRef.current
    if (!canvas) return

    const { x, y, scale } = controller.transform.transform
    const scaledGridSize = gridSize * scale
    
    canvas.style.setProperty('--grid-size', `${gridSize}px`)
    canvas.style.setProperty('--grid-opacity', `${gridOpacity / 100}`)
    canvas.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`
    canvas.style.backgroundPosition = `${x}px ${y}px`
    
    if (showGrid) {
      canvas.classList.add('canvas-grid')
    } else {
      canvas.classList.remove('canvas-grid')
    }
  }, [gridSize, showGrid, gridOpacity, controller.transform.transform, controller.canvasRef, settings])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { interaction, transform, handlers } = controller

    if (interaction.dragState.type === 'connection') {
      const rect = controller.canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const mouseY = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      interaction.updateConnectionDrag(mouseX, mouseY)
    } else if (interaction.dragState.type === 'person') {
      const dx = e.movementX / transform.transform.scale
      const dy = e.movementY / transform.transform.scale

      if (snapToGrid) {
        const newAccX = interaction.dragAccumulator.current.x + dx
        const newAccY = interaction.dragAccumulator.current.y + dy

        const gridStepsX = Math.floor(newAccX / gridSize)
        const gridStepsY = Math.floor(newAccY / gridSize)

        if (gridStepsX !== 0 || gridStepsY !== 0) {
          const moveX = gridStepsX * gridSize
          const moveY = gridStepsY * gridSize

          const updates = new Map()
          controller.selection.selectedPersons.forEach(personId => {
            const person = controller.workspace.persons.find(p => p.id === personId)
            if (person) {
              updates.set(personId, { x: person.x + moveX, y: person.y + moveY })
            }
          })
          handlers.updatePersonsInBulk(updates)

          interaction.dragAccumulator.current = { x: newAccX - moveX, y: newAccY - moveY }
        } else {
          interaction.dragAccumulator.current = { x: newAccX, y: newAccY }
        }
      } else {
        const movingPersons = controller.selection.selectedPersons
          .map(id => controller.workspace.persons.find(p => p.id === id))
          .filter((p): p is typeof controller.workspace.persons[0] => p !== undefined)
          .map(p => ({ ...p, x: p.x + dx, y: p.y + dy }))
        
        const staticPersons = controller.workspace.persons.filter(
          p => !controller.selection.selectedPersons.includes(p.id)
        )
        
        const alignment = calculateAlignment(movingPersons, staticPersons)
        
        const updates = new Map()
        const finalDx = dx + (alignment?.x || 0)
        const finalDy = dy + (alignment?.y || 0)
        
        controller.selection.selectedPersons.forEach(personId => {
          const person = controller.workspace.persons.find(p => p.id === personId)
          if (person) {
            updates.set(personId, { x: person.x + finalDx, y: person.y + finalDy })
          }
        })
        handlers.updatePersonsInBulk(updates)
        
        interaction.updateAlignmentGuides(alignment?.guides || [])
      }
    } else if (interaction.dragState.type === 'group') {
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

      if (snapToGrid) {
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
      const rect = controller.canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const currentX = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const currentY = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      interaction.updateSelectionDrag(currentX, currentY)
    }
  }, [controller, snapToGrid, gridSize])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const { interaction, workspace, transform, selection, handlers } = controller

    if (interaction.dragState.type === 'connection') {
      const rect = controller.canvasRef.current?.getBoundingClientRect()
      if (!rect) {
        interaction.endDrag()
        return
      }

      const mouseX = (e.clientX - rect.left - transform.transform.x) / transform.transform.scale
      const mouseY = (e.clientY - rect.top - transform.transform.y) / transform.transform.scale

      const targetPerson = workspace.persons.find(p => {
        return (
          mouseX >= p.x &&
          mouseX <= p.x + NODE_WIDTH &&
          mouseY >= p.y &&
          mouseY <= p.y + NODE_HEIGHT
        )
      })

      if (targetPerson && interaction.dragState.id && targetPerson.id !== interaction.dragState.id) {
        const existingConnection = workspace.connections.find(
          c => (c.fromPersonId === interaction.dragState.id && c.toPersonId === targetPerson.id) ||
               (c.fromPersonId === targetPerson.id && c.toPersonId === interaction.dragState.id)
        )

        if (!existingConnection) {
          const newConnection = {
            id: `conn-${Date.now()}`,
            fromPersonId: interaction.dragState.id,
            toPersonId: targetPerson.id,
          }
          handlers.addConnection(newConnection)
          toast.success('Connection created')
        } else {
          toast.info('Connection already exists')
        }
      }

      interaction.endDrag()
    } else if (interaction.selectionRect) {
      const selectedPersons = workspace.persons.filter(p => {
        const px = p.x + NODE_WIDTH / 2
        const py = p.y + NODE_HEIGHT / 2
        return (
          px >= interaction.selectionRect!.x &&
          px <= interaction.selectionRect!.x + interaction.selectionRect!.width &&
          py >= interaction.selectionRect!.y &&
          py <= interaction.selectionRect!.y + interaction.selectionRect!.height
        )
      }).map(p => p.id)

      const selectedConnectionIds = getConnectionsInRect(
        workspace.persons,
        workspace.connections,
        interaction.selectionRect.x,
        interaction.selectionRect.y,
        interaction.selectionRect.width,
        interaction.selectionRect.height
      )

      selection.selectPersons(selectedPersons)
      selection.selectConnections(selectedConnectionIds)
    }

    interaction.endDrag()
    interaction.endResize()
    transform.stopPanning()
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
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        controller.interaction.setSpacebarPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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
    >
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
            isDragging={controller.interaction.dragState.type === 'group' && controller.interaction.dragState.id === group.id}
            onClick={(e) => {
              e.stopPropagation()
              controller.handlers.handleGroupClick(group.id, e.shiftKey)
            }}
            onUpdate={(updates) => controller.handlers.handleUpdateGroup(group.id, updates)}
            onRemove={() => controller.handlers.handleDeleteGroup(group.id)}
            onDragStart={(e) => {
              e.stopPropagation()
              controller.interaction.startGroupDrag(group.id)
              if (!controller.selection.selectedGroups.includes(group.id)) {
                controller.selection.selectGroup(group.id, false)
              }
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

        {controller.workspace.persons.map(person => {
          const isHighlighted = highlightedPersonIds?.has(person.id) ?? false
          const isDimmed = searchActive && highlightedPersonIds && highlightedPersonIds.size > 0 && !isHighlighted
          
          return (
          <PersonNode
            key={person.id}
            person={person}
            isSelected={controller.selection.selectedPersons.includes(person.id)}
            isDragging={controller.interaction.dragState.type === 'person' && controller.interaction.dragState.id === person.id}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            onMouseDown={(e) => {
              e.stopPropagation()
              if (e.button !== 0) return
              if (controller.interaction.isConnecting || controller.interaction.dragState.type === 'connection') return
              controller.interaction.startPersonDrag(person.id)
              if (!controller.selection.selectedPersons.includes(person.id)) {
                controller.selection.selectPerson(person.id, false)
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              controller.handlers.handlePersonClick(person.id, e.shiftKey || e.ctrlKey || e.metaKey)
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              controller.handlers.handlePersonDoubleClick(person.id)
            }}
            onPhotoDoubleClick={(e) => {
              e.stopPropagation()
              controller.handlers.handlePhotoDoubleClick(person.id)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              controller.handlers.handlePersonContextMenu(person.id, e, e.ctrlKey || e.metaKey)
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

      <div className="absolute inset-0 z-0">
        <CanvasEdges
          persons={controller.workspace.persons}
          connections={controller.workspace.connections}
          transform={controller.transform.transform}
          selectedConnections={controller.selection.selectedConnections}
          selectionRect={controller.interaction.selectionRect}
          organicLines={organicLines}
          onConnectionClick={(connectionId, e) => {
            e.stopPropagation()
            controller.handlers.handleConnectionClick(connectionId, e.shiftKey)
          }}
          onConnectionContextMenu={(connectionId, e) => {
            e.preventDefault()
            e.stopPropagation()
            controller.selection.selectConnection(connectionId, false)
          }}
        />
      </div>

      {controller.interaction.isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg">
          {controller.interaction.connectFrom ? 'Click target person to connect' : 'Click first person to start'}
        </div>
      )}
    </div>
  )
}
