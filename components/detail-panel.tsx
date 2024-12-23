"use client"

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { materials } from '@/lib/database'
import { Search, Plus, Trash2, Copy } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useMemo } from 'react'
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
import { nrmData } from "@/lib/nrm-data"
import { cn } from "@/lib/utils"

type NRMNode = {
  name: string;
  buildUps: Set<SavedBuildUp>;
  children: { [key: string]: NRMNode };
  path: string;
  totalBuildUps: number;
};

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Filter materials based on search
  const filteredMaterials = useMemo(() => 
    materials.filter(material =>
      material.iceDbName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.material.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [searchTerm]
  )

  // Group materials by the material property
  const groupedMaterials = useMemo(() => {
    const groups = new Map<string, typeof materials>()
    filteredMaterials.forEach(material => {
      const existing = groups.get(material.material) || []
      groups.set(material.material, [...existing, material])
    })
    return groups
  }, [filteredMaterials])

  const filteredBuildUps = useMemo(() => 
    buildUps.filter(buildUp =>
      buildUp.name.toLowerCase().includes(buildUpSearchTerm.toLowerCase())
    ),
    [buildUps, buildUpSearchTerm]
  )

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

    // Add event listener for build-up saves
    const handleBuildUpSaved = (event: CustomEvent<{ buildUps: SavedBuildUp[] }>) => {
      setBuildUps(event.detail.buildUps)
    }

    window.addEventListener('buildUpSaved', handleBuildUpSaved as EventListener)

    return () => {
      window.removeEventListener('buildUpSaved', handleBuildUpSaved as EventListener)
    }
  }, [mounted, searchParams, pathname, router])

  const toggleGroup = (material: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(material)) {
        next.delete(material)
      } else {
        next.add(material)
      }
      return next
    })
  }

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
      if (updatedBuildUps.length > 0) {
        // Select the first available build-up
        router.push(`/library/buildups?id=${updatedBuildUps[0].id}`)
      } else {
        router.push('/library/buildups')
      }
    }
  }

  const handleMaterialClick = (material: any) => {
    // Navigate to materials page with the selected material
    router.push(`/library/materials?material=${encodeURIComponent(material.iceDbName)}`)
  }

  const handleDuplicateBuildUp = (buildUp: SavedBuildUp) => {
    if (!mounted) return

    // Create a new build-up with copied data, including NRM elements
    const newBuildUp: SavedBuildUp = {
      ...buildUp,
      id: Math.random().toString(),
      name: `Copy of ${buildUp.name}`,
      nrmElements: buildUp.nrmElements || [], // Ensure NRM elements are copied
      items: buildUp.items.map(item => ({ ...item, id: Math.random().toString() })) // Create new IDs for items
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

  const leftPosition = state === "expanded" ? "left-[16rem]" : "left-[3rem]"

  // Add a helper function for number formatting
  const formatNumber = (value: number) => {
    if (value === 0) return "0 kgCO2e/kg"
    return `${value.toFixed(4)} kgCO2e/kg`
  }

  const createNRMTree = () => {
    // Create the NRM hierarchy first
    const createNode = (obj: any, parentPath = ""): { [key: string]: NRMNode } => {
      const result: { [key: string]: NRMNode } = {};
      // Get keys and sort them to maintain order
      const keys = Object.keys(obj).sort((a, b) => {
        // Extract numbers from the start of the strings
        const aNum = parseFloat(a.split(" ")[0]);
        const bNum = parseFloat(b.split(" ")[0]);
        return aNum - bNum;
      });
      
      keys.forEach(key => {
        const currentPath = parentPath ? `${parentPath} - ${key}` : key;
        result[key] = {
          name: key,
          buildUps: new Set(),
          children: createNode(obj[key], currentPath),
          path: currentPath,
          totalBuildUps: 0
        };
      });
      return result;
    };

    // Initialize tree with NRM structure
    const tree: { [key: string]: NRMNode } = createNode(nrmData);

    // Add "Uncategorized" at the end
    tree["Uncategorized"] = {
      name: "Uncategorized",
      buildUps: new Set(),
      children: {},
      path: "Uncategorized",
      totalBuildUps: 0
    };

    // Add build-ups to their respective nodes
    filteredBuildUps.forEach(buildUp => {
      if (!buildUp.nrmElements || buildUp.nrmElements.length === 0) {
        tree["Uncategorized"].buildUps.add(buildUp);
        tree["Uncategorized"].totalBuildUps++;
        return;
      }

      buildUp.nrmElements.forEach(element => {
        // Extract the NRM code from the element
        const nrmCode = element.match(/^(\d+(\.\d+)*)/)?.[0];
        
        if (!nrmCode) {
          tree["Uncategorized"].buildUps.add(buildUp);
          tree["Uncategorized"].totalBuildUps++;
          return;
        }

        // Find the exact matching node in the tree
        let current = tree;
        let targetNode = null;
        const parts = nrmCode.split('.');
        let currentCode = '';
        let parentNodes: NRMNode[] = [];

        // First, traverse the tree to find the exact matching node
        for (let i = 0; i < parts.length; i++) {
          if (i > 0) currentCode += '.';
          currentCode += parts[i];

          const matchingKey = Object.keys(current).find(key => {
            const keyCode = key.match(/^(\d+(\.\d+)*)/)?.[0];
            return keyCode === currentCode;
          });

          if (matchingKey) {
            if (i === parts.length - 1) {
              // This is the exact matching node
              targetNode = current[matchingKey];
            } else {
              // Add parent nodes to array for updating counts later
              parentNodes.push(current[matchingKey]);
            }
            current = current[matchingKey].children;
          } else {
            // If no matching node found at any level, add to Uncategorized
            targetNode = tree["Uncategorized"];
            parentNodes = [];
            break;
          }
        }

        // Add the build-up only to the exact matching node
        if (targetNode) {
          targetNode.buildUps.add(buildUp);
          targetNode.totalBuildUps++;
          // Update parent node counts
          parentNodes.forEach(node => {
            node.totalBuildUps++;
          });
        } else {
          tree["Uncategorized"].buildUps.add(buildUp);
          tree["Uncategorized"].totalBuildUps++;
        }
      });
    });

    return tree;
  };

  const renderNRMNode = (node: NRMNode, level = 0) => {
    const hasChildren = Object.keys(node.children).length > 0;
    const isExpanded = expandedGroups.has(node.path);
    const buildUpsArray = Array.from(node.buildUps);

    // Show all nodes except empty Uncategorized
    if (node.name === "Uncategorized" && node.totalBuildUps === 0) return null;

    return (
      <div key={node.path} className={cn("space-y-1", level > 0 && "ml-4")}>
        <div
          className={cn(
            "rounded-lg border bg-card p-3 text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer flex justify-between items-center",
            node.totalBuildUps > 0 && "border-primary/20"
          )}
          onClick={() => toggleGroup(node.path)}
        >
          <div className="text-sm font-medium">
            {node.name} {node.totalBuildUps > 0 && `(${node.totalBuildUps})`}
          </div>
          {(hasChildren || buildUpsArray.length > 0) && (
            <div className="text-sm text-muted-foreground">
              {isExpanded ? '▼' : '▶'}
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="space-y-1">
            {/* Render build-ups first if this is a leaf node */}
            {!hasChildren && buildUpsArray.length > 0 && (
              <div className="space-y-1">
                {buildUpsArray.map((buildUp) => (
                  <div
                    key={buildUp.id}
                    className={`group rounded-lg border bg-card text-card-foreground cursor-pointer transition-all relative
                      ${buildUp.id === selectedBuildUpId 
                        ? 'bg-accent/70 border-accent-foreground/20 shadow-[0_2px_10px] shadow-accent/50 ring-1 ring-accent-foreground/20' 
                        : 'hover:bg-accent/50'
                      }
                      p-3 ml-4
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
            )}

            {/* Render children nodes */}
            {Object.entries(node.children)
              .sort(([a], [b]) => {
                // Extract numbers from the start of the strings for proper sorting
                const aMatch = a.match(/^(\d+(\.\d+)*)/);
                const bMatch = b.match(/^(\d+(\.\d+)*)/);
                if (aMatch && bMatch) {
                  const aParts = aMatch[0].split('.').map(Number);
                  const bParts = bMatch[0].split('.').map(Number);
                  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                    const aNum = aParts[i] || 0;
                    const bNum = bParts[i] || 0;
                    if (aNum !== bNum) return aNum - bNum;
                  }
                }
                return a.localeCompare(b);
              })
              .map(([_, childNode]) => renderNRMNode(childNode, level + 1))}

            {/* Render build-ups after children if this is not a leaf node */}
            {hasChildren && buildUpsArray.length > 0 && (
              <div className="space-y-1">
                {buildUpsArray.map((buildUp) => (
                  <div
                    key={buildUp.id}
                    className={`group rounded-lg border bg-card text-card-foreground cursor-pointer transition-all relative
                      ${buildUp.id === selectedBuildUpId 
                        ? 'bg-accent/70 border-accent-foreground/20 shadow-[0_2px_10px] shadow-accent/50 ring-1 ring-accent-foreground/20' 
                        : 'hover:bg-accent/50'
                      }
                      p-3 ml-4
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
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className={`w-[300px] border-r bg-[#f9fafb] fixed top-0 bottom-0 ${leftPosition} z-10 transition-all duration-200 flex flex-col`}>
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

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 pb-5 border-b px-6 pt-6 flex-shrink-0">
          <span className="text-lg font-semibold">Library</span>
        </div>

        <Tabs 
          defaultValue={currentTab} 
          value={currentTab} 
          onValueChange={handleTabChange} 
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 flex-shrink-0">
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
                <div className="px-6 pb-4 flex-shrink-0">
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

                <div className="flex-1 overflow-y-auto px-6 min-h-0">
                  <div className="space-y-2 pb-6">
                    {Array.from(groupedMaterials.entries()).map(([material, items]) => (
                      <div key={material} className="space-y-1">
                        <div
                          className="rounded-lg border bg-card p-3 text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer flex justify-between items-center"
                          onClick={() => toggleGroup(material)}
                        >
                          <div className="text-sm font-medium">
                            {material} ({items.length})
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {expandedGroups.has(material) ? '▼' : '▶'}
                          </div>
                        </div>
                        {expandedGroups.has(material) && (
                          <div className="pl-4 space-y-1">
                            {items.map((item) => (
                              <div
                                key={item.uniqueId}
                                className="rounded-lg border bg-card p-3 text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer"
                                onClick={() => handleMaterialClick(item)}
                              >
                                <div className="text-sm">
                                  {item.iceDbName}
                                </div>
                                <div className="mt-2 flex justify-between text-xs">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="text-muted-foreground">
                                          {formatNumber(item.ecfIncBiogenic)}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Including biogenic carbon</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span className="text-green-600">
                                          {formatNumber(item.ecfBiogenic)}
                                        </span>
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
                        )}
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
                <div className="px-6 pb-4 flex-shrink-0">
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

                <div className="flex-1 overflow-y-auto px-6 min-h-0">
                  <div className="space-y-4 pb-6">
                    <Button 
                      onClick={handleCreateBuildUp} 
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Build-up
                    </Button>

                    <div className="space-y-2">
                      {Object.entries(createNRMTree())
                        .sort(([a], [b]) => a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b))
                        .map(([_, node]) => renderNRMNode(node))}
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

