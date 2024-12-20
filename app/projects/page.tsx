"use client"

import { useState, useEffect } from "react"
import { Project, BuildingElement } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { CreateProjectModal } from "@/components/create-project-modal"
import { FolderKanban, Plus, Building2, MapPin, Hash, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    setProjects(savedProjects)
  }, [])

  const handleCreateProject = (data: Omit<Project, "id" | "versions"> & { buildingElements?: Record<string, BuildingElement> }) => {
    // Extract buildingElements from the data
    const { buildingElements, ...projectData } = data
    
    console.log('Received project data:', data)
    console.log('Building elements:', buildingElements)

    // Create the new project with initial version
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      versions: [{
        id: crypto.randomUUID(),
        name: 'Version 1',
        buildingElements: buildingElements || {}
      }]
    }

    console.log('New project to be saved:', newProject)
    console.log('Building elements in new project:', newProject.versions[0].buildingElements)

    const updatedProjects = [...projects, newProject]
    console.log('Updated projects array:', updatedProjects)
    
    setProjects(updatedProjects)
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    
    // Verify data was saved correctly
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    console.log('Projects after saving to localStorage:', savedProjects)
    console.log('Building elements in saved project:', savedProjects[savedProjects.length - 1].versions[0].buildingElements)
    
    window.dispatchEvent(new Event('projectsUpdated'))
    setShowCreateModal(false)

    // Navigate to the first version of the new project
    window.location.href = `/projects/${newProject.id}/versions/${newProject.versions[0].id}`
  }

  const handleDeleteProject = (project: Project) => {
    const updatedProjects = projects.filter(p => p.id !== project.id)
    setProjects(updatedProjects)
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    window.dispatchEvent(new Event('projectsUpdated'))
    setProjectToDelete(null)
  }

  if (!mounted) return null

  return (
    <>
      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateProject}
      />

      <Dialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setProjectToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
              className="ml-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <FolderKanban className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">No Projects Yet</h2>
              <p className="text-muted-foreground">
                Create your first project to assess the carbon footprint of your building design.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full max-w-xs mx-auto"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {projects.map(project => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={() => window.location.href = `/projects/${project.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                <div className="relative p-6 flex flex-col min-h-[320px]">
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation() // Prevent navigation when clicking delete
                          setProjectToDelete(project)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-4 text-sm text-muted-foreground flex-grow">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span>Code: {project.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-2">Address: {project.address}</span>
                    </div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {project.typology}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary/40 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
} 