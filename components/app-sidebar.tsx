"use client"

import { Home, Library, FolderKanban, Plus } from 'lucide-react'
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

export type Project = {
  id: string
  name: string
  code: string
  address: string
  typology: "Residential" | "Fit-out"
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

  useEffect(() => {
    setMounted(true)
    // Load projects from localStorage
    const savedProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    setProjects(savedProjects)

    const handleResize = () => {
      if (window.innerWidth < 768 && state === "expanded") {
        toggleSidebar()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [toggleSidebar, state])

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
              const isActive = item.pattern.test(pathname)
              const isProjects = item.title === "Projects"

              return (
                <SidebarMenuItem key={item.title}>
                  <div className={cn(
                    "flex items-center w-full",
                    isActive && "bg-accent/70"
                  )}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        state === "expanded" ? "pl-6" : "px-0",
                        "hover:bg-accent/50 transition-colors relative",
                        isProjects ? "flex-1" : "w-full",
                        isActive && [
                          "after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2",
                          "after:h-8 after:w-1 after:rounded-r-md after:bg-primary",
                          "hover:bg-accent/70"
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
                            "h-4 w-4 transition-colors",
                            isActive && "text-primary"
                          )} 
                        />
                        <span 
                          className={cn(
                            state === "expanded" ? "block" : "hidden",
                            "font-medium",
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
                                isActive && "bg-accent/70",
                                "hover:bg-primary/10 hover:scale-105",
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
                      {projects.map(project => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className={cn(
                            "block py-1 px-2 text-sm rounded-sm hover:bg-accent/50 transition-colors",
                            pathname === `/projects/${project.id}` && "bg-accent/70 text-primary"
                          )}
                        >
                          {project.name}
                        </Link>
                      ))}
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

