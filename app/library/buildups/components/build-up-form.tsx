"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { materials } from "@/lib/database"
import { Trash2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { BuildUpItem, SavedBuildUp } from "../types"
import { MaterialCellEditor } from "./material-cell-editor"

function AddRowHeader(props: { onAddRow: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <Button 
        variant="outline" 
        size="sm"
        onClick={props.onAddRow}
        className="h-8"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add new row
      </Button>
    </div>
  )
}

interface BuildUpFormProps {
  initialData?: SavedBuildUp | null
  isEditing?: boolean
}

export function BuildUpForm({ initialData, isEditing }: BuildUpFormProps) {
  const router = useRouter()
  const [buildUpName, setBuildUpName] = useState(initialData?.name || "")
  const [buildUpItems, setBuildUpItems] = useState<BuildUpItem[]>(initialData?.items || [])

  const handleSave = () => {
    if (!buildUpName) {
      alert("Please enter a build-up name")
      return
    }

    if (buildUpItems.length === 0) {
      alert("Please add at least one item to the build-up")
      return
    }

    // Calculate totals
    const totalThickness = buildUpItems.reduce((sum, item) => sum + item.thickness, 0)
    const totalMass = buildUpItems.reduce((sum, item) => sum + item.mass, 0)
    const totalA1A3IncBiogenic = buildUpItems.reduce((sum, item) => sum + item.a1a3IncBiogenic, 0)
    const totalA1A3Biogenic = buildUpItems.reduce((sum, item) => sum + item.a1a3Biogenic, 0)

    const newBuildUpId = initialData?.id || Math.random().toString()
    const savedBuildUp: SavedBuildUp = {
      id: newBuildUpId,
      name: buildUpName,
      totalThickness,
      totalMass,
      totalA1A3IncBiogenic,
      totalA1A3Biogenic,
      items: buildUpItems
    }

    // Get existing build-ups from localStorage
    const existingBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    
    if (isEditing) {
      // Update existing build-up
      const updatedBuildUps = existingBuildUps.map((buildUp: SavedBuildUp) => 
        buildUp.id === savedBuildUp.id ? savedBuildUp : buildUp
      )
      localStorage.setItem('buildUps', JSON.stringify(updatedBuildUps))
    } else {
      // Add new build-up
      localStorage.setItem('buildUps', JSON.stringify([...existingBuildUps, savedBuildUp]))
    }

    // Navigate to edit mode with the new ID
    router.push(`/library/buildups?id=${newBuildUpId}`)
  }

  const addNewRow = () => {
    setBuildUpItems([
      ...buildUpItems,
      {
        id: Math.random().toString(),
        itemName: '',
        material: '',
        thickness: 0,
        mass: 0,
        a1a3IncBiogenic: 0,
        a1a3Biogenic: 0
      }
    ])
  }

  // Column definitions for the build-up items grid
  const columnDefs: ColDef<BuildUpItem>[] = [
    { 
      field: 'itemName', 
      headerName: 'Item Name',
      editable: true
    },
    { 
      field: 'material', 
      headerName: 'Material',
      editable: true,
      cellEditor: MaterialCellEditor,
      onCellClicked: (params: any) => {
        params.api.startEditingCell({
          rowIndex: params.rowIndex,
          colKey: params.column.getColId()
        });
      },
      onCellValueChanged: (params: any) => {
        const material = materials.find(m => m.iceDbName === params.newValue)
        if (material && params.data.thickness) {
          const mass = Number(material.density) * Number(params.data.thickness) / 1000 // Convert mm to m
          const updatedItems = buildUpItems.map(item => {
            if (item.id === params.data.id) {
              return {
                ...item,
                mass,
                a1a3IncBiogenic: Number(material.ecfIncBiogenic) * mass,
                a1a3Biogenic: Number(material.ecfBiogenic) * mass
              }
            }
            return item
          })
          setBuildUpItems(updatedItems)
        }
      }
    },
    { 
      field: 'thickness', 
      headerName: 'Thickness (mm)',
      editable: true,
      cellEditor: 'agNumberCellEditor',
      onCellValueChanged: (params: any) => {
        const material = materials.find(m => m.iceDbName === params.data.material)
        if (material && params.newValue) {
          const mass = Number(material.density) * Number(params.newValue) / 1000 // Convert mm to m
          const updatedItems = buildUpItems.map(item => {
            if (item.id === params.data.id) {
              return {
                ...item,
                mass,
                a1a3IncBiogenic: Number(material.ecfIncBiogenic) * mass,
                a1a3Biogenic: Number(material.ecfBiogenic) * mass
              }
            }
            return item
          })
          setBuildUpItems(updatedItems)
        }
      }
    },
    { 
      field: 'mass', 
      headerName: 'Mass (kg)',
      editable: false,
    },
    { 
      field: 'a1a3IncBiogenic', 
      headerName: 'A1-A3, inc biogenic (kgCO2e/kg)',
      editable: false,
    },
    { 
      field: 'a1a3Biogenic', 
      headerName: 'A1-A3, biogenic (kgCO2e/kg)',
      editable: false,
    },
    {
      headerName: '',
      width: 50,
      cellRenderer: (params: any) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const updatedItems = buildUpItems.filter(item => item.id !== params.data.id)
              setBuildUpItems(updatedItems)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )
      }
    }
  ]

  return (
    <div className="h-full flex flex-col p-6">
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-48">
            <label className="text-sm text-muted-foreground">Build-up Name:</label>
          </div>
          <Input 
            value={buildUpName}
            onChange={(e) => setBuildUpName(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <label className="text-sm text-muted-foreground">Build-up Area:</label>
          </div>
          <div className="text-sm">1 sq. m (Standard)</div>
        </div>
      </div>

      <div className="h-[calc(100vh-20rem)] ag-theme-alpine">
        <AddRowHeader onAddRow={addNewRow} />
        <div className="h-[calc(100%-40px)]">
          <AgGridReact
            key={initialData?.id || 'new'}
            rowData={buildUpItems}
            columnDefs={columnDefs}
            defaultColDef={{
              flex: 1,
              minWidth: 150,
              resizable: true,
              wrapHeaderText: true,
              autoHeaderHeight: true,
              autoHeight: true,
              singleClickEdit: true
            }}
            stopEditingWhenCellsLoseFocus={true}
            domLayout="normal"
            rowHeight={undefined}
            noRowsOverlayComponent={() => (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground italic">
                  No items exist in this build-up. Click +Add new row to add items
                </p>
              </div>
            )}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={handleSave}>
          {isEditing ? 'Update Build-up' : 'Create Build-up'}
        </Button>
      </div>
    </div>
  )
} 