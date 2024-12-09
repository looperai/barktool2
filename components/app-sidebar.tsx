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

const navigation = [
  {
    title: "Home",
    icon: Home,
    href: "/",
  },
  {
    title: "Library",
    icon: Library,
    href: "/library/materials",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    title: "Compare",
    icon: GitCompare,
    href: "/compare",
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
          {navigation.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.title}
                className={`
                  ${state === "expanded" ? "pl-6" : "px-0"}
                  hover:bg-accent/50 transition-colors
                  w-full
                `}
              >
                <Link 
                  href={item.href} 
                  className={`
                    flex items-center gap-3
                    ${state === "expanded" ? "" : "justify-center w-full"}
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span className={state === "expanded" ? "block" : "hidden"}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

