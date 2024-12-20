"use client"

import { Home, Library, FolderKanban, Plus, ChevronRight, ChevronDown, MoreVertical, Pencil, Trash2, Copy } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreateProjectModal } from "@/components/create-project-modal"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

export interface BuildingElement {
  id: string
  name: string
  width: number | null
  length: number | null
  area: number | null
  buildupId?: string
}

export type Project = {
  id: string
  name: string
  code: string
  address: string
  typology: "Residential" | "Fit-out"
  stage: string
  yearOfCompletion: number
  giaDemolition: number
  giaNewbuild: number
  giaRetrofit: number
  hasDigitalModel: "Y" | "N"
  hasBimModel: "Y" | "N"
  hasBillOfQuantities: "Y" | "N"
  hasEnergyModelling: "Y" | "N"
  versions: Array<{
    id: string
    name: string
    buildingElements: Record<string, BuildingElement>
  }>
}

const navigation = [
  {
    title: "Home",
    icon: Home,
    href: "/",
    pattern: /^\/$/,
  },
  {
    title: "Library",
    icon: Library,
    href: "/library/materials",
    pattern: /^\/library/,
  },
  {
    title: "Projects",
    icon: FolderKanban,
    href: "/projects",
    pattern: /^\/projects/,
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [editingProject, setEditingProject] = useState<{ id: string; name: string } | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [editingVersion, setEditingVersion] = useState<{ projectId: string; versionId: string; name: string } | null>(null)
  const [deleteVersion, setDeleteVersion] = useState<{ project: Project; version: Project['versions'][0] } | null>(null)

  // Function to load projects from localStorage
  const loadProjects = () => {
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    setProjects(savedProjects)
  }

  useEffect(() => {
    setMounted(true)
    loadProjects() // Initial load

    // Load expanded projects state
    const savedExpandedProjects = JSON.parse(localStorage.getItem('expandedProjects') || '[]')
    setExpandedProjects(new Set(savedExpandedProjects))

    // Create a custom event listener for project updates
    const handleProjectUpdate = () => {
      loadProjects()
    }

    window.addEventListener('projectsUpdated', handleProjectUpdate)

    const handleResize = () => {
      if (window.innerWidth < 768 && state === "expanded") {
        toggleSidebar()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('projectsUpdated', handleProjectUpdate)
      window.removeEventListener('resize', handleResize)
    }
  }, [toggleSidebar, state])

  const handleCreateProject = (project: Omit<Project, 'id' | 'versions'> & { buildingElements?: Record<string, BuildingElement> }) => {
    // Generate a unique project name if needed
    let projectName = project.name.trim() || 'Untitled Project'
    const existingNames = projects.map(p => p.name)
    let counter = 1
    let uniqueName = projectName
    
    while (existingNames.includes(uniqueName)) {
      counter++
      uniqueName = `${projectName} (${counter})`
    }

    // Create the new project with initial version
    const newProjectId = crypto.randomUUID()
    const newVersionId = crypto.randomUUID()
    
    const newProject: Project = {
      ...project,
      id: newProjectId,
      name: uniqueName,
      versions: [{
        id: newVersionId,
        name: 'Version 1',
        buildingElements: project.buildingElements || {}
      }]
    }

    console.log('Creating new project with building elements:', project.buildingElements)
    
    const updatedProjects = [...projects, newProject]
    
    // Update state and localStorage
    setProjects(updatedProjects)
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    
    // Expand the new project in the sidebar
    setExpandedProjects(prev => {
      const next = new Set(prev)
      next.add(newProjectId)
      return next
    })

    // Save expanded state to localStorage
    localStorage.setItem('expandedProjects', JSON.stringify([...expandedProjects, newProjectId]))
    
    // Dispatch custom event to notify about project update
    window.dispatchEvent(new Event('projectsUpdated'))
    
    setShowCreateModal(false)

    // Use router.push instead of window.location.href
    router.push(`/projects/${newProjectId}/versions/${newVersionId}`)
  }

  const handleRenameProject = (projectId: string, newName: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return { ...project, name: newName }
      }
      return project
    })
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
    setEditingProject(null)
    window.dispatchEvent(new Event('projectsUpdated'))
  }

  const handleDuplicateProject = (project: Project) => {
    // Generate a unique name for the duplicate project
    const baseName = `Copy of ${project.name}`
    const existingNames = projects.map(p => p.name)
    let counter = 1
    let uniqueName = baseName
    
    while (existingNames.includes(uniqueName)) {
      counter++
      uniqueName = `${baseName} (${counter})`
    }

    const newProject = {
      ...project,
      id: crypto.randomUUID(),
      name: uniqueName,
      versions: project.versions.map(version => ({
        ...version,
        id: crypto.randomUUID()
      }))
    }
    const updatedProjects = [...projects, newProject]
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
    window.dispatchEvent(new Event('projectsUpdated'))
  }

  const handleDeleteProject = (project: Project) => {
    // Close dialog first
    setDeleteProject(null)
    
    // Update localStorage first
    const updatedProjects = projects.filter(p => p.id !== project.id)
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    
    // Force a page reload to ensure clean state
    window.location.reload()
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      localStorage.setItem('expandedProjects', JSON.stringify(Array.from(next)))
      return next
    })
  }

  // Determine active project and version from pathname
  const activeProjectId = pathname.match(/\/projects\/([^\/]+)/)?.[1]
  const activeVersionId = pathname.match(/\/versions\/([^\/]+)/)?.[1]

  // Ensure active project is expanded
  useEffect(() => {
    if (activeProjectId) {
      setExpandedProjects(prev => {
        const next = new Set(prev)
        next.add(activeProjectId)
        return next
      })
    }
  }, [activeProjectId])

  const handleRenameVersion = (projectId: string, versionId: string, newName: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          versions: project.versions.map(version => {
            if (version.id === versionId) {
              return { ...version, name: newName }
            }
            return version
          })
        }
      }
      return project
    })
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
    setEditingVersion(null)
    window.dispatchEvent(new Event('projectsUpdated'))
  }

  const handleDuplicateVersion = (project: Project, version: Project['versions'][0]) => {
    // Generate a unique name for the duplicate version
    const baseName = `Copy of ${version.name}`
    const existingNames = project.versions.map(v => v.name)
    let counter = 1
    let uniqueName = baseName
    
    while (existingNames.includes(uniqueName)) {
      counter++
      uniqueName = `${baseName} (${counter})`
    }

    const newVersion = {
      ...version,
      id: crypto.randomUUID(),
      name: uniqueName
    }
    const updatedProjects = projects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          versions: [...p.versions, newVersion]
        }
      }
      return p
    })
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
    window.dispatchEvent(new Event('projectsUpdated'))
  }

  const handleDeleteVersion = (project: Project, version: Project['versions'][0]) => {
    if (project.versions.length === 1) {
      alert('Cannot delete the last version of a project')
      return
    }

    // Close dialog first
    setDeleteVersion(null)
    
    // Update localStorage first
    const updatedProjects = projects.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          versions: p.versions.filter(v => v.id !== version.id)
        }
      }
      return p
    })
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    
    // Force a page reload to ensure clean state
    window.location.reload()
  }

  if (!mounted) return null

  return (
    <>
      <CreateProjectModal 
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateProject}
      />

      <Sidebar 
        collapsible="icon" 
        className="bg-[#f9fafb] border-r min-w-[64px] md:block"
      >
        <SidebarHeader>
          <div className="h-14 flex items-center justify-between px-4">
            {state === "expanded" ? (
              <div className="flex items-baseline">
                <span className="font-semibold">BarkTool</span>
                <span className="text-xs text-muted-foreground ml-2">Alpha version</span>
              </div>
            ) : null}
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigation.map((item) => {
              const isActive = item.pattern.test(pathname) && !activeVersionId
              const isProjects = item.title === "Projects"

              return (
                <SidebarMenuItem key={item.title}>
                  <div className={cn(
                    "flex items-center w-full rounded-md",
                    isActive && "bg-primary/5"
                  )}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        state === "expanded" ? "pl-6" : "px-0",
                        "hover:bg-accent/50 transition-all duration-200 relative",
                        isProjects ? "flex-1" : "w-full",
                        isActive && [
                          "after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2",
                          "after:h-8 after:w-1 after:rounded-r-md after:bg-primary after:shadow-[0_0_8px_rgba(var(--primary),.4)]",
                          "bg-primary/5 text-primary",
                          "hover:bg-primary/10"
                        ]
                      )}
                    >
                      <Link 
                        href={item.href} 
                        className={cn(
                          "flex items-center gap-3 py-2",
                          state === "expanded" ? "" : "justify-center w-full"
                        )}
                      >
                        <item.icon 
                          className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            isActive && "text-primary"
                          )} 
                        />
                        <span 
                          className={cn(
                            state === "expanded" ? "block" : "hidden",
                            "font-medium transition-colors duration-200",
                            isActive && "text-primary"
                          )}
                        >
                          {item.title}
                          {isProjects && projects.length > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({projects.length})
                            </span>
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    {isProjects && state === "expanded" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "mr-4 relative transition-all duration-200 ease-in-out create-project-btn",
                                isActive && "bg-primary/10 text-primary",
                                "hover:bg-primary/20 hover:scale-105",
                                "active:scale-95"
                              )}
                              onClick={() => setShowCreateModal(true)}
                            >
                              <Plus className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isActive && "text-primary",
                                "create-project-btn-hover:text-primary create-project-btn-hover:rotate-90"
                              )} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            <p>Create New Project</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {isProjects && state === "expanded" && projects.length > 0 && (
                    <div className="pl-14 space-y-1">
                      {projects.map(project => {
                        const isProjectActive = pathname === `/projects/${project.id}` || pathname.includes(`/projects/${project.id}/versions/`)
                        const isExpanded = expandedProjects.has(project.id)

                        return (
                          <div key={project.id} className="space-y-1">
                            <div className="flex items-center justify-between hover:bg-accent/50 rounded-md group/project">
                              <div className="flex items-center w-full">
                                <button
                                  onClick={() => toggleProject(project.id)}
                                  className="p-2"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  )}
                                </button>
                                {editingProject?.id === project.id ? (
                                  <Input
                                    value={editingProject.name}
                                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRenameProject(project.id, editingProject.name)
                                      } else if (e.key === 'Escape') {
                                        setEditingProject(null)
                                      }
                                    }}
                                    onBlur={() => handleRenameProject(project.id, editingProject.name)}
                                    className="h-6 w-full"
                                    autoFocus
                                  />
                                ) : (
                                  <Link
                                    href={`/projects/${project.id}`}
                                    className={cn(
                                      "flex-1 px-2 py-1.5 rounded-md",
                                      pathname === `/projects/${project.id}` && "bg-accent"
                                    )}
                                  >
                                    <span className={cn(
                                      "truncate font-medium text-sm",
                                      pathname.includes(`/projects/${project.id}`) ? "text-primary" : "text-foreground"
                                    )}>
                                      {project.name}
                                    </span>
                                  </Link>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover/project:opacity-100"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingProject({ id: project.id, name: project.name })}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateProject(project)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteProject(project)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {expandedProjects.has(project.id) && (
                              <div className="ml-4 space-y-1">
                                {project.versions.map((version) => (
                                  <div key={version.id} className="flex items-center justify-between hover:bg-accent/50 rounded-md group/version">
                                    {editingVersion?.versionId === version.id ? (
                                      <Input
                                        value={editingVersion.name}
                                        onChange={(e) => setEditingVersion({ ...editingVersion, name: e.target.value })}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleRenameVersion(project.id, version.id, editingVersion.name)
                                          } else if (e.key === 'Escape') {
                                            setEditingVersion(null)
                                          }
                                        }}
                                        onBlur={() => handleRenameVersion(project.id, version.id, editingVersion.name)}
                                        className="h-6 w-full"
                                        autoFocus
                                      />
                                    ) : (
                                      <Link
                                        href={`/projects/${project.id}/versions/${version.id}`}
                                        className={cn(
                                          "flex items-center gap-2 px-2 py-1.5 rounded-md w-full",
                                          pathname === `/projects/${project.id}/versions/${version.id}` && "bg-accent"
                                        )}
                                      >
                                        <span className={cn(
                                          "truncate text-sm",
                                          pathname === `/projects/${project.id}/versions/${version.id}` 
                                            ? "text-primary font-medium" 
                                            : "text-muted-foreground"
                                        )}>
                                          {version.name}
                                        </span>
                                      </Link>
                                    )}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 opacity-0 group-hover/version:opacity-100"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingVersion({ projectId: project.id, versionId: version.id, name: version.name })}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateVersion(project, version)}>
                                          <Copy className="mr-2 h-4 w-4" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => setDeleteVersion({ project, version })}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteProject?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProject && handleDeleteProject(deleteProject)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteVersion} onOpenChange={() => setDeleteVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteVersion?.version.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVersion && handleDeleteVersion(deleteVersion.project, deleteVersion.version)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

