import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials, findAllDescendants } from '@/lib/helpers'
import type { Person, Connection } from '@/lib/types'

interface CollapseBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: Connection | null
  persons: Person[]
  connections: Connection[]
  onConfirm: (parentId: string, childIds: string[]) => void
}

export function CollapseBranchDialog({
  open,
  onOpenChange,
  connection,
  persons,
  connections,
  onConfirm,
}: CollapseBranchDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string>('')

  if (!connection) return null

  const fromPerson = persons.find(p => p.id === connection.fromPersonId)
  const toPerson = persons.find(p => p.id === connection.toPersonId)

  if (!fromPerson || !toPerson) return null

  const handleConfirm = () => {
    if (!selectedParentId) return

    const childId = selectedParentId === fromPerson.id ? toPerson.id : fromPerson.id
    const allDescendants = findAllDescendants(childId, connections)
    onConfirm(selectedParentId, [childId, ...allDescendants])
    onOpenChange(false)
    setSelectedParentId('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Collapse Connection</DialogTitle>
          <DialogDescription>
            Choose which person should be the parent. The other person will be collapsed into a stack under them.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedParentId} onValueChange={setSelectedParentId} className="space-y-3">
          <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value={fromPerson.id} id={`parent-${fromPerson.id}`} />
            <Label htmlFor={`parent-${fromPerson.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
              <Avatar className="h-12 w-12">
                {fromPerson.photo && <AvatarImage src={fromPerson.photo} alt={fromPerson.name} />}
                <AvatarFallback>{getInitials(fromPerson.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{fromPerson.name}</div>
                {fromPerson.position && <div className="text-sm text-muted-foreground">{fromPerson.position}</div>}
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value={toPerson.id} id={`parent-${toPerson.id}`} />
            <Label htmlFor={`parent-${toPerson.id}`} className="flex items-center gap-3 flex-1 cursor-pointer">
              <Avatar className="h-12 w-12">
                {toPerson.photo && <AvatarImage src={toPerson.photo} alt={toPerson.name} />}
                <AvatarFallback>{getInitials(toPerson.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{toPerson.name}</div>
                {toPerson.position && <div className="text-sm text-muted-foreground">{toPerson.position}</div>}
              </div>
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedParentId}>
            Collapse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
