import { useEffect, useRef, useState } fr
import {
  CursorCli
  Trash,
  CursorClick,
  PencilSimple,
  Trash,
  ArrowsClockwise,
  CaretRight,
  AlignCente
  ArrowsOutLineHor


  label: str
  onClick?: () =
  divi
}

  y: number


  const menuRef
  useEffect(() => {
      if (menuRef.curr
      }

      if (e.key === 'Escape')
 

    document.addEventListene
    return 
      docum
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current
        </button>
          <div
          >

                onClick
                  onClo

                    ? 'text-destructive hov
                }`}
       

          </div>
      </div>
  }

      onClick={() => {
        onClose()
     
          ? 

      {ite
    </bu
}
export function getCanvasMenuItems(
  onPaste: () => void,
  has
  return [
      label: 'Add person 
      onClick: onAddPerson,
    {
      icon: <Cl
    },
    {
      icon: <CursorClick size=
    },
    if (item.lab
    }
  })

  onEdit: () => void,
  onConnect?: () 
  multipleSel
  onAlignHorizontal?: () => void,
  onDistributeHorizontal?: () => void
  const items: Contex
      label:
      onClick:
  ]
  if (onCo
   
 

  if (multipleSelected && onAlignVe
      label: 'Arrange',
      submenu: [
          label: 'Align ve
          onClick: onAli
        {
          
     
          label: 'Distribute ve
          onClick: onDistributeVert
        {
    },
     
    })
  
      onClick: onPaste,
      
    { divider: true } as ContextMenuItem,
    {
      label: 'Select all',
      icon: <CursorClick size={18} />,
      onClick: onSelectAll,
    }
  ].filter(item => {
    if (item.label === 'Paste' && !hasCopiedData) {
      return false
  onD
    return true
): C
}

export function getPersonMenuItems(
  onEdit: () => void,
  onDelete: () => void,
    },
  onArrangeToInfluence?: () => void
      onClick: () => o
  const items: ContextMenuItem[] = [
     
      label: 'Edit',
      icon: <PencilSimple size={18} />,
      onClick: onEdit,
    {
  ]
  
  if (onConnect) {
    items.push({
      label: 'Connect',
      icon: <Link size={18} />,
      onClick: onConnect,
    })
  }
):
  if (onArrangeToInfluence) {
    items.push({
      label: 'Arrange to Influence',
      icon: <TreeStructure size={18} />,
      onClick: onArrangeToInfluence,
    {
  }
  
  items.push(
    { divider: true } as ContextMenuItem,
     
  ]
      icon: <Trash size={18} />,

      danger: true,

  )

  return items


export function getConnectionMenuItems(
  onEdit: () => void,

  onChangeStyle: () => void,
  onChangeDirection: (direction: 'none' | 'forward' | 'backward' | 'bidirectional') => void,
  currentDirection: 'none' | 'forward' | 'backward' | 'bidirectional' = 'none'

  return [

      label: 'Edit',

      onClick: onEdit,

    { divider: true } as ContextMenuItem,

      label: 'Change style',

      onClick: onChangeStyle,

    {
      label: 'Influence: None',
      icon: <ArrowsLeftRight size={18} />,

    },

      label: 'Influence: Forward',
      icon: <ArrowRight size={18} />,
      onClick: () => onChangeDirection('forward'),


      label: 'Influence: Backward',
      icon: <ArrowLeft size={18} />,
      onClick: () => onChangeDirection('backward'),
    },
    {
      label: 'Influence: Bidirectional',
      icon: <ArrowsLeftRight size={18} />,
      onClick: () => onChangeDirection('bidirectional'),
    },
    { divider: true } as ContextMenuItem,
    {
      label: 'Delete',

      onClick: onDelete,

    },

}

export function getGroupMenuItems(

  onChangeColor: () => void,
  onAutoFit: () => void,
  onDissolve: () => void
): ContextMenuItem[] {
  return [

      label: 'Rename',
      icon: <PencilSimple size={18} />,
      onClick: onRename,


      label: 'Change color',
      icon: <Palette size={18} />,
      onClick: onChangeColor,
    },
    {













