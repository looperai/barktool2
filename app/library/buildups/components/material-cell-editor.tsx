"use client"

import { Check } from "lucide-react"
import { ICellEditorParams } from "ag-grid-community"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

interface MaterialType {
  iceDbName: string;
  density: number;
  ecfIncBiogenic: number;
  ecfBiogenic: number;
}

interface MaterialCellEditorProps extends ICellEditorParams {
  materials: MaterialType[];
}

export const MaterialCellEditor = forwardRef((props: MaterialCellEditorProps, ref) => {
  const [value, setValue] = useState(props.value || "")

  useImperativeHandle(ref, () => ({
    getValue() {
      return value
    },
    isCancelBeforeStart() {
      return false
    }
  }))

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)
    // We need to wait for the next tick to ensure the value is updated
    setTimeout(() => {
      props.stopEditing()
    }, 0)
  }

  return (
    <div 
      className="absolute left-0 top-0 w-[400px]"
      style={{
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <Command>
        <CommandInput 
          placeholder="Search materials..." 
          className="h-9"
          autoFocus={true}
        />
        <CommandEmpty>No material found.</CommandEmpty>
        <CommandGroup className="max-h-[200px] overflow-y-auto">
          {props.materials.map((material) => (
            <CommandItem
              key={material.iceDbName}
              value={material.iceDbName}
              onSelect={handleSelect}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === material.iceDbName ? "opacity-100" : "opacity-0"
                )}
              />
              {material.iceDbName}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </div>
  )
})

MaterialCellEditor.displayName = "MaterialCellEditor"