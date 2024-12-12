"use client"

import { Check, ChevronRight, ChevronDown } from "lucide-react"
import { ICellEditorParams } from "ag-grid-community"
import { forwardRef, useEffect, useImperativeHandle, useState, useRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

interface MaterialType {
  material: string;
  iceDbName: string;
  density: number;
  ecfIncBiogenic: number;
  ecfBiogenic: number;
}

interface MaterialCellEditorProps extends ICellEditorParams {
  materials: MaterialType[];
}

interface GroupedMaterials {
  [key: string]: MaterialType[];
}

export const MaterialCellEditor = forwardRef((props: MaterialCellEditorProps, ref) => {
  const [value, setValue] = useState(props.value || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined)

  useImperativeHandle(ref, () => ({
    getValue() {
      return value
    },
    isCancelBeforeStart() {
      return false
    },
    isCancelAfterEnd() {
      return false
    }
  }))

  // Group materials and filter based on search
  const groupedAndFilteredMaterials = useMemo(() => {
    // First, group all materials
    const groups: GroupedMaterials = {}
    props.materials.forEach(material => {
      if (!groups[material.material]) {
        groups[material.material] = []
      }
      groups[material.material].push(material)
    })

    // If there's no search term, return all groups
    if (!searchTerm.trim()) {
      return groups
    }

    // If there is a search term, filter groups and items
    const searchLower = searchTerm.toLowerCase().trim()
    const filteredGroups: GroupedMaterials = {}

    Object.entries(groups).forEach(([groupName, items]) => {
      // Keep items that match the search term in either group name or item name
      const filteredItems = items.filter(item => 
        item.iceDbName.toLowerCase().includes(searchLower) ||
        item.material.toLowerCase().includes(searchLower)
      )

      // If there are matching items or the group name matches, keep the group
      if (filteredItems.length > 0 || groupName.toLowerCase().includes(searchLower)) {
        filteredGroups[groupName] = filteredItems
      }
    })

    return filteredGroups
  }, [props.materials, searchTerm])

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    if (props.api) {
      const node = props.api.getRowNode(String(props.rowIndex))
      if (node) {
        node.setDataValue(props.column.getColId(), currentValue)
      }
    }
    setTimeout(() => {
      props.stopEditing()
    }, 0)
  }

  const toggleGroup = (material: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(material)) {
        next.delete(material)
      } else {
        next.add(material)
      }
      return next
    })
  }

  useEffect(() => {
    if (props.eGridCell) {
      const rect = props.eGridCell.getBoundingClientRect()
      const maxHeight = window.innerHeight - rect.bottom - 20
      setMaxHeight(maxHeight)
    }
  }, [props.eGridCell])

  // Handle group expansion/collapse based on search
  useEffect(() => {
    if (searchTerm.trim()) {
      // Expand groups when searching
      setExpandedGroups(prev => {
        const next = new Set(prev)
        Object.keys(groupedAndFilteredMaterials).forEach(groupName => {
          next.add(groupName)
        })
        return next
      })
    } else {
      // Collapse all groups when search is cleared
      setExpandedGroups(new Set())
    }
  }, [searchTerm, groupedAndFilteredMaterials])

  return (
    <div 
      ref={containerRef}
      className="absolute left-0 w-[400px]"
      style={{
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transform: 'translateX(-12px)'
      }}
    >
      <Command className="border-none">
        <CommandInput 
          placeholder="Search materials..." 
          className="h-9"
          value={searchTerm}
          onValueChange={setSearchTerm}
          autoFocus={true}
        />
        <CommandGroup 
          className="overflow-y-auto"
          style={{ maxHeight: maxHeight ? `${maxHeight}px` : '200px' }}
        >
          {Object.entries(groupedAndFilteredMaterials).map(([material, items]) => (
            <div key={material} className="space-y-1 px-2">
              <div
                className="rounded-lg p-2 text-sm font-medium hover:bg-accent/50 transition-colors cursor-pointer flex items-center justify-between"
                onClick={() => toggleGroup(material)}
              >
                <div className="flex items-center gap-2">
                  {expandedGroups.has(material) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{material} ({items.length})</span>
                </div>
              </div>
              {expandedGroups.has(material) && (
                <div className="pl-4 space-y-1">
                  {items.map((item) => (
                    <CommandItem
                      key={item.iceDbName}
                      value={item.iceDbName}
                      onSelect={() => handleSelect(item.iceDbName)}
                      className="rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.iceDbName ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="text-sm truncate">{item.iceDbName}</span>
                    </CommandItem>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CommandGroup>
      </Command>
    </div>
  )
})

MaterialCellEditor.displayName = "MaterialCellEditor"
