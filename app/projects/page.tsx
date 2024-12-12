"use client"

import { useState, useEffect } from "react"
import { Project } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { CreateProjectModal } from "@/components/create-project-modal"
import { FolderKanban, Plus } from "lucide-react"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    setProjects(savedProjects)
  }, [])

  const handleCreateProject = (project: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...project,
      id: Math.random().toString(),
    }

    const updatedProjects = [...projects, newProject]
    setProjects(updatedProjects)
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    setShowCreateModal(false)
  }

  if (!mounted) return null

  return (
    <>
      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateProject}
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-background">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <FolderKanban className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">No Projects Yet</h2>
              <p className="text-muted-foreground">
                Create your first project to start managing your materials and build-ups.
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
          {/* Projects list UI will go here */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <div
                key={project.id}
                className="p-6 rounded-lg border bg-card text-card-foreground hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold mb-2">{project.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Code: {project.code}</p>
                  <p>Type: {project.typology}</p>
                  <p className="truncate">Address: {project.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
} 