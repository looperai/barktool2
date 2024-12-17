"use client"

import { Home, Library, FolderKanban, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const [mounted, setMounted] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

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

    // Navigate to the first version page
    window.location.href = `/projects/${newProjectId}/versions/${newVersionId}`
  }

  // Function to toggle project expansion
  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      // Save to localStorage
      localStorage.setItem('expandedProjects', JSON.stringify([...next]))
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
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleProject(project.id)}
                                className={cn(
                                  "p-1 rounded-sm transition-colors duration-200",
                                  isProjectActive ? "text-primary hover:bg-primary/10" : "hover:bg-accent/50",
                                )}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <Link
                                href={`/projects/${project.id}`}
                                className={cn(
                                  "flex-1 py-1 px-2 text-sm rounded-sm transition-all duration-200",
                                  pathname === `/projects/${project.id}` 
                                    ? "bg-primary/10 text-primary font-medium shadow-sm" 
                                    : "hover:bg-accent/50"
                                )}
                              >
                                {project.name}
                              </Link>
                            </div>
                            {isExpanded && project.versions?.map(version => (
                              <Link
                                key={version.id}
                                href={`/projects/${project.id}/versions/${version.id}`}
                                className={cn(
                                  "block py-1 px-2 pl-7 text-sm rounded-sm transition-all duration-200",
                                  pathname.includes(`/projects/${project.id}/versions/${version.id}`)
                                    ? "bg-primary/10 text-primary font-medium shadow-sm" 
                                    : "hover:bg-accent/50",
                                )}
                              >
                                {version.name}
                              </Link>
                            ))}
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
    </>
  )
}

