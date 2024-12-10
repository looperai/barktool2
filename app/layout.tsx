import "./globals.css"
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DetailPanel } from "@/components/detail-panel"
import { MainContentWrapper } from "@/components/main-content-wrapper"

export const metadata = {
  title: "BarkTool",
  description: "A tool for managing materials and build-ups",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 relative">
              <DetailPanel />
              <MainContentWrapper>
                {children}
              </MainContentWrapper>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}

