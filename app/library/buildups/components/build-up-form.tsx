"use client"

import { useState, useEffect, useRef } from "react"
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
import { cn } from "@/lib/utils"
import { BuildUpChart } from "./build-up-chart"

interface BuildUpFormProps {
  initialData?: SavedBuildUp | null
  isEditing?: boolean
}

interface ContextMenuPosition {
  x: number;
  y: number;
  rowId: string | null;
}

export function BuildUpForm({ initialData, isEditing: defaultIsEditing }: BuildUpFormProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [buildUpName, setBuildUpName] = useState(initialData?.name || "")
  const [buildUpItems, setBuildUpItems] = useState<BuildUpItem[]>(initialData?.items || [])
  const [isEditing, setIsEditing] = useState(defaultIsEditing || false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [toggledItems, setToggledItems] = useState<Set<string>>(new Set())
  const [headerHeight, setHeaderHeight] = useState(0)
  const [showRowDeleteDialog, setShowRowDeleteDialog] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<string | null>(null)
  const gridRef = useRef<AgGridReact>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setBuildUpName(initialData?.name || "")
    
    // Calculate a1a3ExcBiogenic for existing items
    const updatedItems = (initialData?.items || []).map(item => ({
      ...item,
      a1a3ExcBiogenic: Number((item.a1a3IncBiogenic - item.a1a3Biogenic).toFixed(3))
    }));
    
    setBuildUpItems(updatedItems);
    setIsEditing(defaultIsEditing || false)

    // Reset toggledItems when entering edit mode
    if (defaultIsEditing) {
      setToggledItems(new Set())
      
      // Also reset grid selection if grid is ready
      if (gridRef.current?.api) {
        gridRef.current.api.deselectAll()
        gridRef.current.api.refreshCells({ force: true })
      }
    }

    // Log values when build-up changes
    if (initialData?.items) {
      console.group('Build-up Values:', initialData.name);
      
      // Log individual rows
      updatedItems.forEach((item, index) => {
        console.group(`Row ${index + 1}: ${item.itemName || item.material}`);
        console.log('A1-A3, inc biogenic:', item.a1a3IncBiogenic);
        console.log('A1-A3, biogenic:', item.a1a3Biogenic);
        console.log('A1-A3, exc biogenic:', item.a1a3ExcBiogenic);
        console.groupEnd();
      });

      // Calculate and log totals
      const totals = updatedItems.reduce((acc, item) => ({
        incBiogenic: acc.incBiogenic + item.a1a3IncBiogenic,
        biogenic: acc.biogenic + item.a1a3Biogenic,
        excBiogenic: acc.excBiogenic + item.a1a3ExcBiogenic
      }), { incBiogenic: 0, biogenic: 0, excBiogenic: 0 });

      console.group('Totals');
      console.log('Total A1-A3, inc biogenic:', totals.incBiogenic);
      console.log('Total A1-A3, biogenic:', totals.biogenic);
      console.log('Total A1-A3, exc biogenic:', totals.excBiogenic);
      console.groupEnd();

      console.groupEnd();
    }
  }, [initialData, defaultIsEditing])

  // Add another effect to handle isEditing changes
  useEffect(() => {
    if (isEditing) {
      setToggledItems(new Set())
      
      // Reset grid selection if grid is ready
      if (gridRef.current?.api) {
        gridRef.current.api.deselectAll()
        gridRef.current.api.refreshCells({ force: true })
      }
    }
  }, [isEditing])

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (gridRef.current?.api) {
        const headerElement = document.querySelector('.ag-header-row')
        if (headerElement) {
          const height = headerElement.getBoundingClientRect().height
          setHeaderHeight(height)
        }
      }
    }

    // Update on initial render and window resize
    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [])

  // Handle clicking outside context menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        a1a3Biogenic: 0,
        a1a3ExcBiogenic: 0
      }
    ])
  }

  const handleMaterialChange = (params: any) => {
    const material = materials.find(m => m.iceDbName === params.newValue);
    
    if (material) {
      const thickness = Number(params.data.thickness);
      const mass = Number(material.density) * thickness / 1000; // Convert mm to m
      const a1a3IncBiogenic = Number(material.ecfIncBiogenic) * mass;
      const a1a3Biogenic = Number(material.ecfBiogenic) * mass;
      const a1a3ExcBiogenic = a1a3IncBiogenic - a1a3Biogenic;

      const updatedItems = buildUpItems.map(item => {
        if (item.id === params.data.id) {
          return {
            ...item,
            material: material.iceDbName,
            mass: Number(mass.toFixed(3)),
            a1a3IncBiogenic: Number(a1a3IncBiogenic.toFixed(3)),
            a1a3Biogenic: Number(a1a3Biogenic.toFixed(3)),
            a1a3ExcBiogenic: Number(a1a3ExcBiogenic.toFixed(3))
          };
        }
        return item;
      });
      
      setBuildUpItems(updatedItems);
    }
  }

  const handleThicknessChange = (params: any) => {
    const material = materials.find(m => m.iceDbName === params.data.material);
    
    if (material) {
      const thickness = Number(params.newValue);
      const mass = Number(material.density) * thickness / 1000; // Convert mm to m
      const a1a3IncBiogenic = Number(material.ecfIncBiogenic) * mass;
      const a1a3Biogenic = Number(material.ecfBiogenic) * mass;
      const a1a3ExcBiogenic = a1a3IncBiogenic - a1a3Biogenic;

      const updatedItems = buildUpItems.map(item => {
        if (item.id === params.data.id) {
          return {
            ...item,
            thickness,
            mass: Number(mass.toFixed(3)),
            a1a3IncBiogenic: Number(a1a3IncBiogenic.toFixed(3)),
            a1a3Biogenic: Number(a1a3Biogenic.toFixed(3)),
            a1a3ExcBiogenic: Number(a1a3ExcBiogenic.toFixed(3))
          };
        }
        return item;
      });
      
      setBuildUpItems(updatedItems);
    }
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
      onCellValueChanged: handleMaterialChange
    },
    { 
      field: 'thickness', 
      headerName: 'Thickness (mm)',
      editable: isEditing,
      cellEditor: 'agNumberCellEditor',
      valueParser: (params: any) => Number(params.newValue),
      cellStyle: params => ({
        backgroundColor: isEditing ? '#ffffff' : '#f9fafb',
        cursor: isEditing ? 'pointer' : 'default'
      }),
      onCellValueChanged: handleThicknessChange
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
    }
  ]

  // Function to handle row deletion
  const handleRowDelete = () => {
    if (rowToDelete) {
      const updatedItems = buildUpItems.filter(item => item.id !== rowToDelete)
      setBuildUpItems(updatedItems)
      setRowToDelete(null)
      setShowRowDeleteDialog(false)
    }
  }

  return (
    <div className="h-full flex flex-col p-6">
      <style>
        {`
          .ag-theme-alpine .ag-row-selected {
            background-color: #e6f3ff !important;
          }
          .ag-theme-alpine .ag-row-selected > div {
            background-color: #e6f3ff !important;
          }
          .ag-theme-alpine .ag-row-selected > div:first-child {
            border-left: 4px solid #2563eb !important;
          }
          /* Hover styles - only in edit mode */
          ${isEditing ? `
            .ag-theme-alpine .ag-row:hover {
              background-color: #f1f5f9 !important;
            }
            .ag-theme-alpine .ag-row:hover > div {
              background-color: #f1f5f9 !important;
            }
          ` : ''}
          /* Custom context menu styles */
          .custom-context-menu {
            position: fixed;
            background: white;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border-radius: 0.375rem;
            padding: 0.5rem;
            min-width: 160px;
            z-index: 1000;
          }

          .context-menu-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            cursor: pointer;
            color: #ef4444;
            border-radius: 0.25rem;
            transition: background-color 0.2s;
            font-size: 0.875rem;
          }

          .context-menu-item:hover {
            background-color: #fee2e2;
          }
          /* Remove any conflicting styles */
          .ag-theme-alpine .ag-row {
            transition: background-color 0.2s;
          }
          .ag-theme-alpine .ag-row-even {
            background: none;
          }
          .ag-theme-alpine .ag-row-odd {
            background: none;
          }
        `}
      </style>
      
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

      <Dialog open={showRowDeleteDialog} onOpenChange={setShowRowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Row</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this row? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowRowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRowDelete}
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

      <div className="flex gap-8 mb-8">
        <div className="space-y-4 w-1/2">
          <div className="flex items-center gap-2">
            <div className="w-32">
              <label className="text-sm text-muted-foreground">Build-up Name:</label>
            </div>
            <Input 
              value={buildUpName}
              onChange={(e) => setBuildUpName(e.target.value)}
              className="w-[200px]"
              disabled={!isEditing}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32">
              <label className="text-sm text-muted-foreground">Build-up Area:</label>
            </div>
            <div className="text-sm">1 sq. m (Standard)</div>
          </div>
        </div>

        <div className="w-1/2">
          <BuildUpChart items={buildUpItems} toggledItems={toggledItems} />
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

      <div className="flex gap-4">
        <div className="flex flex-col items-center" style={{ width: '24px', marginTop: `${headerHeight}px` }}>
          {buildUpItems.map((item, index) => (
            <div 
              key={item.id} 
              style={{ 
                height: '32px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all duration-200 hover:scale-110",
                        toggledItems.has(item.id) 
                          ? "bg-slate-300 border-slate-300 shadow-sm" 
                          : "bg-white border-slate-200 hover:border-slate-300"
                      )}
                      onClick={() => {
                        const newToggledItems = new Set(toggledItems);
                        if (newToggledItems.has(item.id)) {
                          newToggledItems.delete(item.id);
                        } else {
                          newToggledItems.add(item.id);
                        }
                        setToggledItems(newToggledItems);
                        
                        // Update grid selection
                        if (gridRef.current?.api) {
                          const node = gridRef.current.api.getRowNode(String(index));
                          if (node) {
                            node.setSelected(!node.isSelected());
                            gridRef.current.api.refreshCells({
                              force: true,
                              rowNodes: [node]
                            });
                          }
                        }
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center">
                    <p>Click to toggle</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>

        <div className="flex-1 ag-theme-alpine" style={{ height: '500px' }}>
          <AgGridReact
            ref={gridRef}
            key={initialData?.id || 'new'}
            rowData={buildUpItems}
            columnDefs={columnDefs}
            defaultColDef={{
              flex: 1,
              minWidth: 150,
              resizable: true,
              wrapHeaderText: true,
              autoHeaderHeight: true,
              singleClickEdit: true
            }}
            stopEditingWhenCellsLoseFocus={true}
            enterNavigatesVertically={true}
            enterNavigatesVerticallyAfterEdit={true}
            onCellEditingStopped={(params) => {
              // Ensure the grid refreshes after edit
              params.api.refreshCells({
                force: true,
                rowNodes: [params.node],
                columns: [params.column.getId()]
              });
            }}
            onCellContextMenu={(params) => {
              if (!isEditing) return;
              
              const event = params.event as MouseEvent;
              event.preventDefault();
              
              setContextMenu({
                x: event.clientX,
                y: event.clientY,
                rowId: params.node.data.id
              });
            }}
            enableRangeSelection={false}
            suppressRowClickSelection={true}
            rowSelection="multiple"
            suppressCellFocus={true}
            preventDefaultOnContextMenu={true}
            getRowHeight={() => 32}
            headerHeight={undefined}
            suppressRowHoverHighlight={false}
            onFirstDataRendered={(params) => {
              // Set initial selection
              buildUpItems.forEach((item, index) => {
                if (toggledItems.has(item.id)) {
                  const node = params.api.getRowNode(String(index));
                  if (node) {
                    node.setSelected(true);
                  }
                }
              });
              params.api.refreshCells({ force: true });
            }}
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
              const headerElement = document.querySelector('.ag-header-row');
              if (headerElement) {
                const height = headerElement.getBoundingClientRect().height;
                setHeaderHeight(height);
              }
            }}
            onDisplayedColumnsChanged={() => {
              const headerElement = document.querySelector('.ag-header-row');
              if (headerElement) {
                const height = headerElement.getBoundingClientRect().height;
                setHeaderHeight(height);
              }
            }}
          />

          {/* Custom Context Menu */}
          {contextMenu && isEditing && (
            <div
              ref={contextMenuRef}
              className="custom-context-menu"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`
              }}
            >
              <div
                className="context-menu-item"
                onClick={() => {
                  if (contextMenu.rowId) {
                    setRowToDelete(contextMenu.rowId);
                    setShowRowDeleteDialog(true);
                  }
                  setContextMenu(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Row
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 