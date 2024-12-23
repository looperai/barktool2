"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, X, ChevronsUpDown } from "lucide-react"
import { nrmData } from "@/lib/nrm-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface NRMElementsSelectProps {
  selectedElements: string[]
  onChange: (elements: string[]) => void
}

export function NRMElementsSelect({ selectedElements, onChange }: NRMElementsSelectProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedItems(newExpanded)
  }

  const toggleSelection = (element: string, hasChildren: boolean, e: React.MouseEvent, path = "") => {
    e.stopPropagation()
    // Only allow selection if it's a leaf node (no children)
    if (hasChildren) return;

    // Use just the element text for selection, not the full path
    const newSelected = selectedElements.includes(element)
      ? selectedElements.filter(e => e !== element)
      : [...selectedElements, element]
    onChange(newSelected)
  }

  const removeElement = (element: string) => {
    onChange(selectedElements.filter(e => e !== element))
  }

  const renderElement = (element: string, items: any, path = "", level = 0) => {
    const currentPath = path ? `${path} - ${element}` : element
    const hasChildren = Object.keys(items[element]).length > 0
    const isExpanded = expandedItems.has(currentPath)
    const isSelected = selectedElements.includes(currentPath)

    return (
      <div key={currentPath}>
        <div 
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 rounded cursor-pointer text-sm",
            isSelected && "text-primary font-medium",
            hasChildren && "cursor-default",
            level > 0 && "ml-4"
          )}
          onClick={(e) => toggleSelection(element, hasChildren, e, path)}
        >
          {hasChildren && (
            <button
              onClick={(e) => toggleExpand(currentPath, e)}
              className="p-0.5 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <span className={cn(
            "truncate",
            hasChildren && "text-muted-foreground"
          )}>
            {element}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {Object.entries(items[element])
              .sort(([a], [b]) => {
                // Extract numbers from the start of the strings for proper sorting
                const aMatch = a.match(/^(\d+(\.\d+)*)/);
                const bMatch = b.match(/^(\d+(\.\d+)*)/);
                if (aMatch && bMatch) {
                  const aParts = aMatch[0].split('.').map(Number);
                  const bParts = bMatch[0].split('.').map(Number);
                  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                    const aNum = aParts[i] || 0;
                    const bNum = bParts[i] || 0;
                    if (aNum !== bNum) return aNum - bNum;
                  }
                }
                return a.localeCompare(b);
              })
              .map(([childKey, childItems]) =>
                renderElement(childKey, items[element], currentPath, level + 1)
              )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="border rounded-md p-2 min-h-[40px] max-h-[80px] overflow-y-auto">
        {selectedElements.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedElements.map(element => (
              <Badge 
                key={element} 
                variant="secondary" 
                className="text-xs py-0.5 pl-2 pr-1 flex items-center gap-1 shrink-0"
              >
                {element}
                <button
                  onClick={() => removeElement(element)}
                  className="hover:bg-accent rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No NRM elements selected</p>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between text-sm font-normal"
          >
            Select NRM elements
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="max-h-[300px] overflow-y-auto p-1">
            {Object.entries(nrmData)
              .sort(([a], [b]) => {
                // Extract numbers from the start of the strings for proper sorting
                const aMatch = a.match(/^(\d+(\.\d+)*)/);
                const bMatch = b.match(/^(\d+(\.\d+)*)/);
                if (aMatch && bMatch) {
                  const aParts = aMatch[0].split('.').map(Number);
                  const bParts = bMatch[0].split('.').map(Number);
                  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                    const aNum = aParts[i] || 0;
                    const bNum = bParts[i] || 0;
                    if (aNum !== bNum) return aNum - bNum;
                  }
                }
                return a.localeCompare(b);
              })
              .map(([key, items]) => renderElement(key, nrmData))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 