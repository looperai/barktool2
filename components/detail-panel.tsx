"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { materials } from '@/lib/database'
import { Search, Plus, Trash2, Copy } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from 'react'
import { useSidebar } from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SavedBuildUp } from "@/app/library/buildups/types"
import { ErrorBoundary } from './error-boundary'

export function DetailPanel() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [buildUpSearchTerm, setBuildUpSearchTerm] = useState("")
  const [buildUps, setBuildUps] = useState<SavedBuildUp[]>([])
  const { state } = useSidebar()
  const [buildUpToDelete, setBuildUpToDelete] = useState<SavedBuildUp | null>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedBuildUpId, setSelectedBuildUpId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load build-ups from localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)

    // Get the currently selected build-up ID from URL
    const urlId = searchParams.get('id')
    
    // Check if we're in create mode
    const isCreating = pathname.endsWith('/create')
    
    // If we're on the buildups tab and not creating and there's no selected build-up but we have build-ups,
    // select the first one
    if (pathname.includes('/buildups') && !isCreating && !urlId && savedBuildUps.length > 0) {
      const firstBuildUp = savedBuildUps[0]
      router.push(`/library/buildups?id=${firstBuildUp.id}`)
    } else {
      setSelectedBuildUpId(urlId || null)
    }
  }, [mounted, searchParams, pathname, router])

  if (!pathname.startsWith('/library')) {
    return null
  }

  if (!mounted) {
    return null
  }

  // Update tab detection logic
  const currentTab = pathname.includes('/library/buildups') || pathname.includes('/buildups') ? 'buildups' : 'materials'

  const handleTabChange = (value: string) => {
    if (value === 'buildups') {
      // When switching to buildups tab, check if we have any build-ups
      const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
      if (savedBuildUps.length > 0) {
        // Select the first build-up
        router.push(`/library/buildups?id=${savedBuildUps[0].id}`)
      } else {
        // No build-ups exist, go to create mode
        router.push('/library/buildups/create')
      }
    } else {
      router.push('/library/materials')
    }
  }

  const handleCreateBuildUp = () => {
    // Clear selection and navigate to create mode
    setSelectedBuildUpId(null)
    router.push('/library/buildups/create')
  }

  const handleSelectBuildUp = (buildUp: SavedBuildUp) => {
    setSelectedBuildUpId(buildUp.id)
    router.push(`/library/buildups?id=${buildUp.id}`)
  }

  const handleDeleteBuildUp = (buildUp: SavedBuildUp) => {
    if (!mounted) return

    // Remove from localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    const updatedBuildUps = savedBuildUps.filter((b: SavedBuildUp) => b.id !== buildUp.id)
    localStorage.setItem('buildUps', JSON.stringify(updatedBuildUps))
    
    // Update state
    setBuildUps(updatedBuildUps)
    setBuildUpToDelete(null)

    // If the deleted build-up was selected, clear selection
    if (buildUp.id === selectedBuildUpId) {
      router.push('/library/buildups')
    }
  }

  const handleMaterialClick = (material: any) => {
    // Navigate to materials page with the selected material
    router.push(`/library/materials?material=${encodeURIComponent(material.iceDbName)}`)
  }

  const handleDuplicateBuildUp = (buildUp: SavedBuildUp) => {
    if (!mounted) return

    // Create a new build-up with copied data
    const newBuildUp: SavedBuildUp = {
      ...buildUp,
      id: Math.random().toString(),
      name: `Copy of ${buildUp.name}`,
    }

    // Add to localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    const updatedBuildUps = [...savedBuildUps, newBuildUp]
    localStorage.setItem('buildUps', JSON.stringify(updatedBuildUps))
    
    // Update state
    setBuildUps(updatedBuildUps)

    // Navigate to the new build-up
    router.push(`/library/buildups?id=${newBuildUp.id}`)
  }

  const filteredMaterials = materials.filter(material =>
    material.iceDbName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBuildUps = buildUps.filter(buildUp =>
    buildUp.name.toLowerCase().includes(buildUpSearchTerm.toLowerCase())
  )

  const leftPosition = state === "expanded" ? "left-[16rem]" : "left-[3rem]"

  // Add a helper function for number formatting
  const formatNumber = (value: number) => {
    if (value === 0) return "0 kgCO2e/kg"
    return `${value.toFixed(4)} kgCO2e/kg`
  }

  return (
    <aside className={`w-[300px] border-r bg-[#f9fafb] fixed top-0 bottom-0 ${leftPosition} z-10 transition-all duration-200`}>
      <Dialog open={!!buildUpToDelete} onOpenChange={() => setBuildUpToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Build-up</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this build-up? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBuildUpToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => buildUpToDelete && handleDeleteBuildUp(buildUpToDelete)}
              className="ml-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b px-6 pt-6">
          <span className="text-lg font-semibold">Library</span>
        </div>

        <Tabs 
          defaultValue={currentTab} 
          value={currentTab} 
          onValueChange={handleTabChange} 
          className="h-full flex flex-col"
        >
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-2 h-9 bg-muted/50">
              <TabsTrigger 
                value="materials" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-none"
              >
                Materials
              </TabsTrigger>
              <TabsTrigger 
                value="buildups"
                className="data-[state=active]:bg-background data-[state=active]:shadow-none rounded-none"
              >
                Build-ups
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 mt-4">
            <ErrorBoundary>
              <TabsContent 
                value="materials" 
                className="h-full flex flex-col data-[state=inactive]:hidden m-0"
                forceMount
              >
                <div className="px-6 pb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search materials..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-2">
                    {filteredMaterials.map((material) => (
                      <div
                        key={material.uniqueId}
                        className="rounded-lg border bg-card p-3 text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleMaterialClick(material)}
                      >
                        <div className="text-sm font-medium">
                          {material.iceDbName}
                        </div>
                        <div className="mt-2 flex justify-between text-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-muted-foreground whitespace-nowrap">
                                  {formatNumber(Number(material.ecfIncBiogenic))}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Including biogenic carbon</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-green-600 whitespace-nowrap">
                                  {formatNumber(Number(material.ecfBiogenic))}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Biogenic carbon</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent 
                value="buildups" 
                className="h-full flex flex-col data-[state=inactive]:hidden m-0"
                forceMount
              >
                <div className="px-6 pb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search build-ups..."
                      className="pl-8"
                      value={buildUpSearchTerm}
                      onChange={(e) => setBuildUpSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleCreateBuildUp} 
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Build-up
                    </Button>

                    <div className="space-y-2">
                      {filteredBuildUps.map((buildUp) => (
                        <div
                          key={buildUp.id}
                          className={`group rounded-lg border bg-card text-card-foreground cursor-pointer transition-all relative
                            ${buildUp.id === selectedBuildUpId 
                              ? 'bg-accent/70 border-accent-foreground/20 shadow-[0_2px_10px] shadow-accent/50 ring-1 ring-accent-foreground/20' 
                              : 'hover:bg-accent/50'
                            }
                            p-3
                          `}
                          onClick={() => handleSelectBuildUp(buildUp)}
                        >
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDuplicateBuildUp(buildUp)
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Duplicate</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setBuildUpToDelete(buildUp)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="text-sm font-medium">
                            {buildUp.name}
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>Total Thickness: {buildUp.totalThickness} mm</div>
                            <div>Total Mass: {buildUp.totalMass.toFixed(2)} kg</div>
                            <div>Total A1-A3 inc bio: {buildUp.totalA1A3IncBiogenic.toFixed(2)} kgCO2e</div>
                            <div>Total A1-A3 bio: {buildUp.totalA1A3Biogenic.toFixed(2)} kgCO2e</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ErrorBoundary>
          </div>
        </Tabs>
      </div>
    </aside>
  )
}

