"use client"

import { Check } from "lucide-react"
import { ICellEditorParams } from "ag-grid-community"
import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react"
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

  const handleSelect = (currentValue: string) => {
    console.log('Selected material:', currentValue);
    setValue(currentValue);
    if (props.api) {
      const node = props.api.getRowNode(props.rowIndex);
      if (node) {
        node.setDataValue(props.column.getColId(), currentValue);
      }
    }
    setTimeout(() => {
      props.stopEditing();
    }, 0);
  }

  useEffect(() => {
    if (containerRef.current) {
      const cell = props.eGridCell as HTMLElement;
      const cellRect = cell.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Find the AG-Grid container
      const gridContainer = cell.closest('.ag-theme-alpine');
      if (!gridContainer) return;
      
      const gridRect = gridContainer.getBoundingClientRect();
      const spaceBelow = gridRect.bottom - cellRect.bottom - 20; // 20px buffer from grid bottom
      const spaceAbove = cellRect.top - gridRect.top - 20; // 20px buffer from grid top
      
      // If space below is less than 200px and space above is greater,
      // position the dropdown above the cell
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        containerRef.current.style.top = 'auto';
        containerRef.current.style.bottom = '0';
        setMaxHeight(spaceAbove);
      } else {
        containerRef.current.style.top = '0';
        containerRef.current.style.bottom = 'auto';
        setMaxHeight(spaceBelow);
      }
    }
  }, [])

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
          autoFocus={true}
        />
        <CommandEmpty>No material found.</CommandEmpty>
        <CommandGroup 
          className="overflow-y-auto"
          style={{ maxHeight: maxHeight ? `${maxHeight}px` : '200px' }}
        >
          {props.materials.map((material) => (
            <CommandItem
              key={material.iceDbName}
              value={material.iceDbName}
              onSelect={() => handleSelect(material.iceDbName)}
              className="px-3"
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
