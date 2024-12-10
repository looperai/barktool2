"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { materials } from "@/lib/database"
import { ICellEditorComp } from "ag-grid-community"
import ReactDOM from "react-dom/client"

export class MaterialCellEditor implements ICellEditorComp {
  private value: string
  private params: any
  private element: HTMLDivElement
  private root: ReactDOM.Root | null = null

  constructor() {
    this.value = ''
    this.element = document.createElement('div')
  }

  init(params: any) {
    this.params = params
    this.value = this.params.value || ''
    
    // Calculate width - use at least 500px or double the column width if larger
    const width = Math.max(500, this.params.column.getActualWidth() * 2)
    this.element.style.width = `${width}px`
    this.element.className = 'z-[9999] absolute'
    
    this.root = ReactDOM.createRoot(this.element)
    this.root.render(
      <MaterialCellEditorUI
        initialValue={this.value}
        onValueChange={(newValue) => {
          this.value = newValue
        }}
        stopEditing={() => this.params.stopEditing()}
        width={width}
      />
    )

    // Handle clicks outside
    const handleClickOutside = (event: MouseEvent) => {
      if (!this.element.contains(event.target as Node)) {
        this.params.stopEditing()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
  }

  getGui() {
    return this.element
  }

  getValue() {
    return this.value
  }

  destroy() {
    if (this.root) {
      this.root.unmount()
    }
    // Remove event listeners if they were added
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (!this.element.contains(event.target as Node)) {
      this.params.stopEditing()
    }
  }
}

interface MaterialCellEditorUIProps {
  initialValue: string
  onValueChange: (value: string) => void
  stopEditing: () => void
  width: number
}

function MaterialCellEditorUI({ initialValue, onValueChange, stopEditing, width }: MaterialCellEditorUIProps) {
  const [open, setOpen] = React.useState(true)
  const [value, setValue] = React.useState(initialValue)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    onValueChange(currentValue)
    setOpen(false)
    stopEditing()
  }

  // Handle popover close
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      stopEditing()
    }
  }

  React.useEffect(() => {
    const input = containerRef.current?.querySelector('input')
    if (input) {
      input.focus()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ width }}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-full bg-white"
          >
            <span className="truncate">
              {value
                ? materials.find((material) => material.iceDbName === value)?.iceDbName
                : "Select material..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-none" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0" 
          style={{ width }}
          align="start"
          sideOffset={0}
          side="bottom"
        >
          <Command>
            <CommandInput 
              placeholder="Search materials..." 
              className="h-9"
            />
            <CommandEmpty>No material found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {materials.map((material) => (
                <CommandItem
                  key={material.iceDbName}
                  value={material.iceDbName}
                  onSelect={handleSelect}
                  className="truncate"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-none",
                      value === material.iceDbName ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{material.iceDbName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}