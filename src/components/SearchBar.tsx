import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  MagnifyingGlass,
  X,
  Funnel,
  ClockCounterClockwise,
  Trash,
} from '@phosphor-icons/react'
import type { Person, Group } from '@/lib/types'
import type { SearchCriteria, SearchHistoryItem } from '@/lib/search'
import { formatSearchCriteriaLabel } from '@/lib/search'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/helpers'

interface SearchBarProps {
  persons: Person[]
  groups: Group[]
  onSearch: (criteria: SearchCriteria) => void
  onClear: () => void
  className?: string
}

export interface SearchBarRef {
  focus: () => void
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({
  persons,
  groups,
  onSearch,
  onClear,
  className,
}, ref) => {
  const [searchHistory, setSearchHistory] = useKV<SearchHistoryItem[]>('search-history', [])
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [minScore, setMinScore] = useState<number | undefined>(undefined)
  const [maxScore, setMaxScore] = useState<number | undefined>(undefined)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedFrameColors, setSelectedFrameColors] = useState<string[]>([])
  const [advocateOnly, setAdvocateOnly] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  const uniquePositions = Array.from(
    new Set(
      persons.flatMap(p => [p.position, p.position2, p.position3].filter(Boolean) as string[])
    )
  ).sort()

  const frameColors = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'orange', label: 'Orange' },
    { value: 'white', label: 'White' },
  ]

  const currentCriteria: SearchCriteria = {
    query,
    minScore,
    maxScore,
    positions: selectedPositions.length > 0 ? selectedPositions : undefined,
    groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
    frameColors: selectedFrameColors.length > 0 ? selectedFrameColors : undefined,
    advocateOnly,
  }

  const hasActiveFilters =
    query ||
    minScore !== undefined ||
    maxScore !== undefined ||
    selectedPositions.length > 0 ||
    selectedGroupIds.length > 0 ||
    selectedFrameColors.length > 0 ||
    advocateOnly

  const executeSearch = useCallback(() => {
    onSearch(currentCriteria)
    
    if (hasActiveFilters) {
      const historyItem: SearchHistoryItem = {
        id: generateId(),
        criteria: currentCriteria,
        timestamp: Date.now(),
        label: formatSearchCriteriaLabel(currentCriteria),
      }
      
      setSearchHistory((current) => {
        const filtered = (current || []).filter(
          item => JSON.stringify(item.criteria) !== JSON.stringify(currentCriteria)
        )
        return [historyItem, ...filtered].slice(0, 10)
      })
    }
    
    setShowHistory(false)
  }, [currentCriteria, hasActiveFilters, onSearch, setSearchHistory])

  const handleClear = useCallback(() => {
    setQuery('')
    setMinScore(undefined)
    setMaxScore(undefined)
    setSelectedPositions([])
    setSelectedGroupIds([])
    setSelectedFrameColors([])
    setAdvocateOnly(false)
    onClear()
  }, [onClear])

  const loadFromHistory = useCallback((item: SearchHistoryItem) => {
    setQuery(item.criteria.query || '')
    setMinScore(item.criteria.minScore)
    setMaxScore(item.criteria.maxScore)
    setSelectedPositions(item.criteria.positions || [])
    setSelectedGroupIds(item.criteria.groupIds || [])
    setSelectedFrameColors(item.criteria.frameColors || [])
    setAdvocateOnly(item.criteria.advocateOnly || false)
    
    setTimeout(() => {
      onSearch(item.criteria)
    }, 0)
    
    setShowHistory(false)
  }, [onSearch])

  const deleteHistoryItem = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchHistory((current) => (current || []).filter(item => item.id !== itemId))
  }, [setSearchHistory])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [setSearchHistory])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query || hasActiveFilters) {
        executeSearch()
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [query, minScore, maxScore, selectedPositions, selectedGroupIds, selectedFrameColors, advocateOnly])

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative flex-1 max-w-md">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search persons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              executeSearch()
            } else if (e.key === 'Escape') {
              handleClear()
            }
          }}
          className="pl-10 pr-10 bg-card/80 border-border hover:border-primary/50 focus:border-primary transition-colors"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/20"
          >
            <X size={16} className="text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>

      <Popover open={showFilters} onOpenChange={setShowFilters}>
        <PopoverTrigger asChild>
          <Button
            variant={hasActiveFilters && !query ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'relative',
              hasActiveFilters && !query && 'bg-primary text-primary-foreground'
            )}
          >
            <Funnel size={18} weight={hasActiveFilters ? 'fill' : 'regular'} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent border border-card" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <ScrollArea className="h-[480px] pr-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-3">Filter Options</h4>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Score Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minScore ?? ''}
                    onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxScore ?? ''}
                    onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {uniquePositions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Positions</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {uniquePositions.map((position) => (
                        <div key={position} className="flex items-center gap-2">
                          <Checkbox
                            id={`pos-${position}`}
                            checked={selectedPositions.includes(position)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPositions([...selectedPositions, position])
                              } else {
                                setSelectedPositions(selectedPositions.filter(p => p !== position))
                              }
                            }}
                          />
                          <label
                            htmlFor={`pos-${position}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {position}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedPositions.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPositions([])}
                        className="h-7 text-xs"
                      >
                        Clear positions
                      </Button>
                    )}
                  </div>
                </>
              )}

              {groups.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Groups</Label>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={selectedGroupIds.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGroupIds([...selectedGroupIds, group.id])
                              } else {
                                setSelectedGroupIds(selectedGroupIds.filter(g => g !== group.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="text-sm flex-1 cursor-pointer flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: `var(--group-${group.color})` }}
                            />
                            {group.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedGroupIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroupIds([])}
                        className="h-7 text-xs"
                      >
                        Clear groups
                      </Button>
                    )}
                  </div>
                </>
              )}

              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Frame Colors</Label>
                <div className="space-y-2">
                  {frameColors.map((color) => (
                    <div key={color.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`color-${color.value}`}
                        checked={selectedFrameColors.includes(color.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFrameColors([...selectedFrameColors, color.value])
                          } else {
                            setSelectedFrameColors(selectedFrameColors.filter(c => c !== color.value))
                          }
                        }}
                      />
                      <label
                        htmlFor={`color-${color.value}`}
                        className="text-sm flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: `var(--frame-${color.value})` }}
                        />
                        {color.label}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedFrameColors.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFrameColors([])}
                    className="h-7 text-xs"
                  >
                    Clear colors
                  </Button>
                )}
              </div>

              <Separator />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="advocate-only"
                  checked={advocateOnly}
                  onCheckedChange={(checked) => setAdvocateOnly(!!checked)}
                />
                <label htmlFor="advocate-only" className="text-sm cursor-pointer">
                  Advocates only
                </label>
              </div>

              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    executeSearch()
                    setShowFilters(false)
                  }}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Popover open={showHistory} onOpenChange={setShowHistory}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <ClockCounterClockwise size={18} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Search History</h4>
              {searchHistory && searchHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-7 text-xs"
                >
                  <Trash size={14} className="mr-1" />
                  Clear
                </Button>
              )}
            </div>
            {!searchHistory || searchHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No search history yet
              </div>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
    </TooltipProvider>
  )
})

SearchBar.displayName = 'SearchBar'
