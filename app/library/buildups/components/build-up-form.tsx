"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { materials } from "@/lib/database"
import { Trash2, Plus, Pencil, Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { BuildUpItem, SavedBuildUp } from "../types"
import { MaterialCellEditor } from "./material-cell-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BuildUpFormProps {
  initialData?: SavedBuildUp | null
  isEditing?: boolean
}

export function BuildUpForm({ initialData, isEditing: defaultIsEditing }: BuildUpFormProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [buildUpName, setBuildUpName] = useState(initialData?.name || "")
  const [buildUpItems, setBuildUpItems] = useState<BuildUpItem[]>(initialData?.items || [])
  const [isEditing, setIsEditing] = useState(defaultIsEditing || false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    setBuildUpName(initialData?.name || "")
    setBuildUpItems(initialData?.items || [])
    setIsEditing(defaultIsEditing || false)
  }, [initialData, defaultIsEditing])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

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
    
    if (initialData?.id) {
      // Update existing build-up
      const updatedBuildUps = existingBuildUps.map((buildUp: SavedBuildUp) => 
        buildUp.id === savedBuildUp.id ? savedBuildUp : buildUp
      )
      localStorage.setItem('buildUps', JSON.stringify(updatedBuildUps))
    } else {
      // Add new build-up
      localStorage.setItem('buildUps', JSON.stringify([...existingBuildUps, savedBuildUp]))
    }

    setIsEditing(false)
    router.push(`/library/buildups?id=${newBuildUpId}`)
  }

  const handleDelete = () => {
    if (!initialData?.id) return

    const existingBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    const updatedBuildUps = existingBuildUps.filter((b: SavedBuildUp) => b.id !== initialData.id)
    localStorage.setItem('buildUps', JSON.stringify(updatedBuildUps))
    
    setShowDeleteDialog(false)
    router.push('/library/buildups')
  }

  const handleDuplicate = () => {
    if (!initialData) return

    // Create new build-up with copied data
    const newBuildUp: SavedBuildUp = {
      ...initialData,
      id: Math.random().toString(),
      name: `Copy of ${initialData.name}`,
    }

    // Add to localStorage
    const existingBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    localStorage.setItem('buildUps', JSON.stringify([...existingBuildUps, newBuildUp]))

    // Navigate to the new build-up with edit mode enabled
    router.push(`/library/buildups?id=${newBuildUp.id}&edit=true`)
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
      editable: isEditing,
      tooltipField: 'itemName',
      cellStyle: params => ({
        backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
        cursor: isEditing ? 'pointer' : 'default'
      })
    },
    { 
      field: 'material', 
      headerName: 'Material',
      editable: isEditing,
      cellRenderer: (params: any) => {
        return (
          <div className="truncate" title={params.value}>
            {params.value || (isEditing ? "Click to select material" : "-")}
          </div>
        )
      },
      cellEditor: MaterialCellEditor,
      cellEditorPopup: true,
      singleClickEdit: true,
      cellEditorParams: {
        materials: materials
      },
      tooltipField: 'material',
      cellStyle: params => ({
        backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
        cursor: isEditing ? 'pointer' : 'default'
      }),
      onCellValueChanged: (params: any) => {
        console.log("Material changed:", params.newValue);
        console.log("Available materials:", materials.map(m => m.iceDbName));
        const material = materials.find(m => m.iceDbName === params.newValue);
        console.log("Found material:", material);
        
        if (material) {
          const thickness = Number(params.data.thickness);
          console.log("Current thickness:", thickness);
          
          const mass = Number(material.density) * thickness / 1000; // Convert mm to m
          console.log("Calculated mass:", mass, "from density:", material.density);
          
          const a1a3IncBiogenic = Number(material.ecfIncBiogenic) * mass;
          const a1a3Biogenic = Number(material.ecfBiogenic) * mass;
          console.log("Calculated biogenic values:", { a1a3IncBiogenic, a1a3Biogenic });

          const updatedItems = buildUpItems.map(item => {
            if (item.id === params.data.id) {
              const updatedItem = {
                ...item,
                material: material.iceDbName, // Use the exact material name from the database
                mass: Number(mass.toFixed(3)),
                a1a3IncBiogenic: Number(a1a3IncBiogenic.toFixed(3)),
                a1a3Biogenic: Number(a1a3Biogenic.toFixed(3))
              };
              console.log("Updated item:", updatedItem);
              return updatedItem;
            }
            return item;
          });
          
          console.log("Setting build-up items:", updatedItems);
          setBuildUpItems(updatedItems);
        } else {
          console.log("No material found for calculation. Looking for:", params.newValue);
          console.log("Available materials:", materials.map(m => m.iceDbName));
        }
      }
    },
    { 
      field: 'thickness', 
      headerName: 'Thickness (mm)',
      editable: isEditing,
      cellEditor: 'agNumberCellEditor',
      valueParser: (params: any) => {
        const value = Number(params.newValue);
        console.log('Parsing thickness value:', value);
        return value;
      },
      cellStyle: params => ({
        backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
        cursor: isEditing ? 'pointer' : 'default'
      }),
      onCellValueChanged: (params: any) => {
        console.log("Thickness changed:", params.newValue, params.data);
        const material = materials.find(m => m.iceDbName === params.data.material);
        console.log("Found material:", material);
        
        if (material) {
          const thickness = Number(params.newValue);
          console.log("Parsed thickness:", thickness);
          
          const mass = Number(material.density) * thickness / 1000; // Convert mm to m
          console.log("Calculated mass:", mass, "from density:", material.density);
          
          const a1a3IncBiogenic = Number(material.ecfIncBiogenic) * mass;
          const a1a3Biogenic = Number(material.ecfBiogenic) * mass;
          console.log("Calculated biogenic values:", { a1a3IncBiogenic, a1a3Biogenic });

          const updatedItems = buildUpItems.map(item => {
            if (item.id === params.data.id) {
              const updatedItem = {
                ...item,
                thickness,
                mass: Number(mass.toFixed(3)),
                a1a3IncBiogenic: Number(a1a3IncBiogenic.toFixed(3)),
                a1a3Biogenic: Number(a1a3Biogenic.toFixed(3))
              };
              console.log("Updated item:", updatedItem);
              return updatedItem;
            }
            return item;
          });
          
          console.log("Setting build-up items:", updatedItems);
          setBuildUpItems(updatedItems);
        } else {
          console.log("No material found for calculation");
        }
      }
    },
    { 
      field: 'mass', 
      headerName: 'Mass (kg)',
      editable: false,
      cellStyle: { backgroundColor: '#f9fafb' },
      valueFormatter: (params: any) => {
        return params.value ? params.value.toFixed(3) : '0.000'
      }
    },
    { 
      field: 'a1a3IncBiogenic', 
      headerName: 'A1-A3, inc biogenic (kgCO2e/kg)',
      editable: false,
      cellStyle: { backgroundColor: '#f9fafb' },
      valueFormatter: (params: any) => {
        return params.value ? params.value.toFixed(3) : '0.000'
      }
    },
    { 
      field: 'a1a3Biogenic', 
      headerName: 'A1-A3, biogenic (kgCO2e/kg)',
      editable: false,
      cellStyle: { backgroundColor: '#f9fafb' },
      valueFormatter: (params: any) => {
        return params.value ? params.value.toFixed(3) : '0.000'
      }
    },
    {
      headerName: '',
      width: 50,
      cellRenderer: (params: any) => {
        if (!isEditing) return null
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
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Build-up</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this build-up? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="ml-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  disabled={isEditing || !initialData}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDuplicate}
                  disabled={!initialData}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={!initialData}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="ml-auto">
          <Button onClick={handleSave} disabled={!isEditing}>
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-48">
            <label className="text-sm text-muted-foreground">Build-up Name:</label>
          </div>
          <Input 
            value={buildUpName}
            onChange={(e) => setBuildUpName(e.target.value)}
            className="max-w-md"
            disabled={!isEditing}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <label className="text-sm text-muted-foreground">Build-up Area:</label>
          </div>
          <div className="text-sm">1 sq. m (Standard)</div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-start mb-4">
          <Button 
            variant="outline" 
            onClick={addNewRow}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add new row
          </Button>
        </div>
      )}

      <div className="flex-1 ag-theme-alpine">
        <div className="h-full">
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
                  No items exist in this build-up. {isEditing && "Click +Add new row to add items"}
                </p>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  )
} 