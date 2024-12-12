"use client"

import { Home, Library, FolderKanban, GitCompare } from 'lucide-react'
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
  {
    title: "Compare",
    icon: GitCompare,
    href: "/compare",
    pattern: /^\/compare/,
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => {
      if (window.innerWidth < 768 && state === "expanded") {
        toggleSidebar()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [toggleSidebar, state])

  if (!mounted) return null

  return (
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
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    state === "expanded" ? "pl-6" : "px-0",
                    "hover:bg-accent/50 transition-colors relative w-full",
                    isActive && [
                      "bg-accent/70",
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
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

