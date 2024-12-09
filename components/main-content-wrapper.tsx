"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { usePathname } from 'next/navigation'

interface MainContentWrapperProps {
  children: React.ReactNode
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { state } = useSidebar()
  const pathname = usePathname()
  
  // Calculate left margin based on sidebar state
  const detailPanelWidth = pathname.startsWith('/library') ? "300px" : "0px"
  
  return (
    <main 
      className="flex-1 h-full transition-all duration-200"
      style={{ 
        marginLeft: detailPanelWidth,
        width: `calc(100% - ${detailPanelWidth})`,
      }}
    >
      {children}
    </main>
  )
} 