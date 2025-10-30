import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Person, Group } from '@/lib/types'
import { getInitials } from '@/lib/helpers'
import { FRAME_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ListPanelProps {
  persons: Person[]
  groups: Group[]
  selectedPersons: string[]
  onPersonClick: (id: string) => void
  searchQuery?: string
  highlightedPersonIds?: Set<string>
}

type SortBy = 'name-asc' | 'name-desc' | 'position-asc' | 'position-desc' | 'score-asc' | 'score-desc' | 'created-new' | 'created-old'

export function ListPanel({ persons, groups, selectedPersons, onPersonClick, searchQuery, highlightedPersonIds }: ListPanelProps) {
  const [sortBy, setSortBy] = useState<SortBy>('created-new')
  const [filterGroup, setFilterGroup] = useState<string>('all')

  const sortedPersons = [...persons].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'position-asc':
        return a.position.localeCompare(b.position)
      case 'position-desc':
        return b.position.localeCompare(a.position)
      case 'score-asc':
        return a.score - b.score
      case 'score-desc':
        return b.score - a.score
      case 'created-new':
        return b.createdAt - a.createdAt
      case 'created-old':
        return a.createdAt - b.createdAt
      default:
        return 0
    }
  })

  let filteredPersons = filterGroup === 'all'
    ? sortedPersons
    : filterGroup === 'none'
    ? sortedPersons.filter(p => !p.groupId)
    : sortedPersons.filter(p => p.groupId === filterGroup)

  if (searchQuery && highlightedPersonIds && highlightedPersonIds.size > 0) {
    filteredPersons = filteredPersons.filter(p => highlightedPersonIds.has(p.id))
  }

  return (
    <div className="w-80 border-r flex flex-col" style={{ backgroundColor: '#1F2833', borderColor: '#2E3B4E' }}>
      <div className="p-4 space-y-3">
        <h2 className="font-medium" style={{ color: '#FFFFFF' }}>People ({persons.length})</h2>
        
        <div className="space-y-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="position-asc">Position (A-Z)</SelectItem>
              <SelectItem value="position-desc">Position (Z-A)</SelectItem>
              <SelectItem value="score-desc">Score (5-1)</SelectItem>
              <SelectItem value="score-asc">Score (1-5)</SelectItem>
              <SelectItem value="created-new">Newest First</SelectItem>
              <SelectItem value="created-old">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="none">No Group</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredPersons.map(person => {
            const frameColor = FRAME_COLORS[person.frameColor]
            const isSelected = selectedPersons.includes(person.id)
            
            return (
              <Button
                key={person.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start h-auto p-3',
                  isSelected && 'glow-accent'
                )}
                style={{
                  backgroundColor: isSelected ? '#66FCF1' : 'transparent',
                  color: isSelected ? '#0B0C10' : '#FFFFFF',
                }}
                onClick={() => onPersonClick(person.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback
                      className={cn(
                        "font-bold",
                        person.frameColor === 'white' ? 'text-background' : 'text-foreground'
                      )}
                      style={{
                        backgroundColor: frameColor,
                      }}
                    >
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium text-sm truncate" style={{ color: '#FFFFFF' }}>{person.name}</div>
                    {person.position && <div className="text-xs truncate" style={{ color: '#C5C6C7' }}>{person.position}</div>}
                    {person.position2 && <div className="text-xs truncate" style={{ color: '#C5C6C7' }}>{person.position2}</div>}
                    {person.position3 && <div className="text-xs truncate" style={{ color: '#C5C6C7' }}>{person.position3}</div>}
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 font-bold text-xs" style={{ backgroundColor: '#45A29E', color: '#0B0C10' }}>
                    {person.score}
                  </Badge>
                </div>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
