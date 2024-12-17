"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Plus, ChevronLeft } from "lucide-react"
import { AgGridReact } from 'ag-grid-react'
import { ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  versions: Array<{
    id: string
    name: string
    buildingElements: Record<string, {
      id: string
      name: string
      width: number | null
      length: number | null
      area: number | null
      buildupId?: string
    }>
  }>
}

interface BuildUp {
  id: string
  name: string
  totalThickness: number
  totalMass: number
  totalA1A3IncBiogenic: number
  totalA1A3Biogenic: number
  items: Array<{
    id: string
    itemName: string
    material: string
    thickness: number
    mass: number
    a1a3IncBiogenic: number
    a1a3Biogenic: number
    a1a3ExcBiogenic: number
  }>
}

export default function VersionPage({ params }: { params: { projectId: string; versionId: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [version, setVersion] = useState<Project['versions'][0] | null>(null)
  const [buildUps, setBuildUps] = useState<BuildUp[]>([])
  const [expandedBuildUps, setExpandedBuildUps] = useState<Set<string>>(new Set())

  // Function to create a new version
  const handleCreateVersion = () => {
    if (!project) return

    // Get all projects
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    const currentProject = projects.find((p: Project) => p.id === params.projectId)
    
    if (!currentProject) return

    // Create new version
    const newVersionNumber = currentProject.versions.length + 1
    const newVersion = {
      id: crypto.randomUUID(),
      name: `Version ${newVersionNumber}`,
      buildingElements: {}
    }

    // Add new version to project
    currentProject.versions.push(newVersion)

    // Update localStorage
    const updatedProjects = projects.map((p: Project) => 
      p.id === params.projectId ? currentProject : p
    )
    localStorage.setItem('projects', JSON.stringify(updatedProjects))

    // Dispatch event to update sidebar
    window.dispatchEvent(new Event('projectsUpdated'))

    // Navigate to new version
    window.location.href = `/projects/${params.projectId}/versions/${newVersion.id}`
  }

  useEffect(() => {
    // Load project and version data
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    console.log('All Projects:', projects)
    
    const currentProject = projects.find((p: Project) => p.id === params.projectId)
    console.log('Current Project:', currentProject)
    
    const currentVersion = currentProject?.versions.find((v: Project['versions'][0]) => v.id === params.versionId)
    console.log('Current Version:', currentVersion)
    console.log('Building Elements in Version:', currentVersion?.buildingElements)
    
    setProject(currentProject || null)
    setVersion(currentVersion || null)

    // Load build-ups data
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    console.log('Loaded Build-ups:', savedBuildUps)
    setBuildUps(savedBuildUps)

    // Group building elements by build-up
    if (currentVersion?.buildingElements) {
      type BuildingElement = {
        id: string
        name: string
        width: number | null
        length: number | null
        area: number | null
        buildupId?: string
      }

      const elementsByBuildUp = Object.entries(currentVersion.buildingElements).reduce<Record<string, BuildingElement[]>>((acc, [elementId, element]) => {
        const typedElement = element as BuildingElement
        if (typedElement.buildupId) {
          if (!acc[typedElement.buildupId]) {
            acc[typedElement.buildupId] = []
          }
          acc[typedElement.buildupId].push(typedElement)
        }
        return acc
      }, {})
      console.log('Elements grouped by Build-up:', elementsByBuildUp)
    }
  }, [params.projectId, params.versionId])

  if (!project || !version) return null

  const toggleBuildUp = (buildUpId: string) => {
    setExpandedBuildUps(prev => {
      const next = new Set(prev)
      if (next.has(buildUpId)) {
        next.delete(buildUpId)
      } else {
        next.add(buildUpId)
      }
      return next
    })
  }

  const materialColumnDefs: ColDef[] = [
    { field: 'itemName', headerName: 'Item Name', flex: 1 },
    { field: 'material', headerName: 'Material', flex: 1 },
    { field: 'thickness', headerName: 'Thickness (mm)', flex: 1 },
    { field: 'mass', headerName: 'Mass (kg)', flex: 1 },
    { field: 'a1a3IncBiogenic', headerName: 'A1-A3, inc biogenic (kgCO2e)', flex: 1 },
    { field: 'a1a3Biogenic', headerName: 'A1-A3, biogenic (kgCO2e)', flex: 1 },
    { field: 'a1a3ExcBiogenic', headerName: 'A1-A3, exc biogenic (kgCO2e)', flex: 1 },
  ]

  // Group building elements by build-up
  type BuildingElement = {
    id: string
    name: string
    width: number | null
    length: number | null
    area: number | null
    buildupId?: string
  }

  const elementsByBuildUp = Object.entries(version.buildingElements || {}).reduce<Record<string, BuildingElement[]>>((acc, [elementId, element]) => {
    const typedElement = element as BuildingElement
    if (typedElement.buildupId) {
      if (!acc[typedElement.buildupId]) {
        acc[typedElement.buildupId] = []
      }
      acc[typedElement.buildupId].push(typedElement)
    }
    return acc
  }, {})

  console.log('Elements by Build-up:', elementsByBuildUp)
  console.log('Build-ups State:', buildUps)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <nav aria-label="breadcrumb" className="flex items-center space-x-2">
          <div className="inline-flex items-center space-x-2">
            <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="inline-flex items-center space-x-2">
            <Link href={`/projects/${project.id}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {project.name}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="inline-flex items-center">
            <span className="text-sm font-medium">{version.name}</span>
          </div>
        </nav>

        <Button
          onClick={handleCreateVersion}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Version
        </Button>
      </div>

      <h1 className="text-2xl font-bold">Inventory</h1>

      <div className="space-y-6">
        {/* Build-ups Section */}
        <Card>
          <CardHeader>
            <CardTitle>Build-ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(elementsByBuildUp).map(([buildUpId, elements]) => {
              const buildUp = buildUps.find(b => b.id === buildUpId)
              if (!buildUp) return null

              const isExpanded = expandedBuildUps.has(buildUpId)

              return (
                <div key={buildUpId} className="space-y-2">
                  <div
                    className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                    onClick={() => toggleBuildUp(buildUpId)}
                  >
                    <button className="text-sm">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium">{buildUp.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {elements.map(element => (
                          <div key={element.id} className="flex gap-4">
                            <span>{element.name}</span>
                            {element.width && <span>Width: {element.width}m</span>}
                            {element.length && <span>Length: {element.length}m</span>}
                            {element.area && <span>Area: {element.area}m²</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="pl-6 space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Total Thickness:</span>
                            <span className="ml-2">{buildUp.totalThickness} mm</span>
                          </div>
                          <div>
                            <span className="font-medium">Total Mass:</span>
                            <span className="ml-2">{buildUp.totalMass} kg</span>
                          </div>
                          <div>
                            <span className="font-medium">Total A1-A3 (inc biogenic):</span>
                            <span className="ml-2">{buildUp.totalA1A3IncBiogenic} kgCO2e</span>
                          </div>
                          <div>
                            <span className="font-medium">Total A1-A3 (biogenic):</span>
                            <span className="ml-2">{buildUp.totalA1A3Biogenic} kgCO2e</span>
                          </div>
                        </div>
                      </div>
                      <div className="ag-theme-alpine w-full" style={{ height: '200px' }}>
                        <AgGridReact
                          rowData={buildUp.items}
                          columnDefs={materialColumnDefs}
                          suppressMovableColumns={true}
                          suppressCellFocus={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <Button variant="outline" className="w-full" onClick={() => {}}>
              <Plus className="h-4 w-4 mr-2" />
              Add Build-up
            </Button>
          </CardContent>
        </Card>

        {/* Materials Section */}
        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => {}}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 