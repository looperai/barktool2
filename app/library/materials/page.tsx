"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { materials } from "@/lib/database"
import { AgGridReact } from 'ag-grid-react'
import { ColDef, GridApi } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { useSearchParams } from 'next/navigation'

interface Material {
  uniqueId: string
  material: string
  iceDbName: string
  density: string // Updated to match the actual type from database
  ecfIncBiogenic: number
  ecfBiogenic: number
  a4Default: string
  lifespan: number
  wasteRate: number
  eolReuse: number
  eolRecycle: number
  eolIncineration: number
  eolLandfill: number
  c3: number | null
  c4: number | null
  d1: number | null
  thermalConductivity: number
}

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const gridRef = useRef<AgGridReact>(null)
  const searchParams = useSearchParams()
  
  // AG Grid column definitions
  const columnDefs: ColDef<Material>[] = useMemo(() => [
    { field: 'material', headerName: 'Material', sortable: true, filter: true },
    { field: 'iceDbName', headerName: 'ICE DB Name', sortable: true, filter: true },
    { field: 'density', headerName: 'Density', sortable: true, filter: true },
    { field: 'ecfIncBiogenic', headerName: 'ECF inc biogenic', sortable: true, filter: true },
    { field: 'ecfBiogenic', headerName: 'ECF biogenic', sortable: true, filter: true },
    { field: 'a4Default', headerName: 'A4 Default', sortable: true, filter: true },
    { field: 'lifespan', headerName: 'Lifespan', sortable: true, filter: true },
    { field: 'wasteRate', headerName: 'Waste Rate', sortable: true, filter: true },
    { field: 'eolReuse', headerName: 'EOL Reuse', sortable: true, filter: true },
    { field: 'eolRecycle', headerName: 'EOL Recycle', sortable: true, filter: true },
    { field: 'eolIncineration', headerName: 'EOL Incineration', sortable: true, filter: true },
    { field: 'eolLandfill', headerName: 'EOL Landfill', sortable: true, filter: true },
    { field: 'thermalConductivity', headerName: 'Thermal Conductivity', sortable: true, filter: true }
  ], [])

  // Filter materials based on search term
  const filteredMaterials = useMemo(() => 
    materials.filter(material =>
      material.iceDbName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [searchTerm]
  )

  // Effect to handle material selection from URL
  useEffect(() => {
    const selectedMaterial = searchParams.get('material')
    if (selectedMaterial && gridRef.current?.api) {
      const gridApi = gridRef.current.api
      
      // Find the row index of the selected material
      const rowIndex = filteredMaterials.findIndex(
        material => material.iceDbName === selectedMaterial
      )
      
      if (rowIndex >= 0) {
        // Clear previous selection
        gridApi.deselectAll()
        
        // Wait for the grid to be ready
        setTimeout(() => {
          // Scroll to the row
          gridApi.ensureIndexVisible(rowIndex, 'top')
          
          // Select the row
          gridApi.getDisplayedRowAtIndex(rowIndex)?.setSelected(true)
        }, 100)
      }
    }
  }, [searchParams, filteredMaterials])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Input
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xl"
        />
      </div>

      <div className="flex-1 ag-theme-alpine w-full h-[calc(100vh-8rem)]">
        <AgGridReact
          ref={gridRef}
          rowData={filteredMaterials}
          columnDefs={columnDefs}
          defaultColDef={{
            flex: 1,
            minWidth: 150,
            resizable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            autoHeight: true
          }}
          rowHeight={undefined}
          rowSelection="single"
          suppressScrollOnNewData={true}
          domLayout="normal"
          pagination={false}
          onGridReady={(params) => {
            params.api.sizeColumnsToFit()
          }}
        />
      </div>
    </div>
  )
} 