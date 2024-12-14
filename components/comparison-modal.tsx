"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { materials, Material } from "@/lib/database"
import { SavedBuildUp } from "@/app/library/buildups/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"
import { Check, X, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface MaterialCompareItem {
  id: string
  name: string
  ecfIncBiogenic: number
  ecfBiogenic: number
  type: "material"
}

interface BuildUpCompareItem {
  id: string
  name: string
  ecfIncBiogenic: number
  ecfBiogenic: number
  type: "buildup"
}

type CompareItem = MaterialCompareItem | BuildUpCompareItem

type GroupedItems = {
  [key: string]: (MaterialCompareItem | BuildUpCompareItem)[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {label}
          </span>
          {payload.map((item: any, index: number) => (
            <span key={index} className="text-sm text-foreground">
              {item.name}: {item.value.toFixed(4)} kgCO2e/kg
            </span>
          ))}
        </div>
      </div>
    )
  }
  return null
}

interface ComparisonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComparisonModal({ open, onOpenChange }: ComparisonModalProps) {
  const [type, setType] = useState<"materials" | "buildups">("materials")
  const [searchValue, setSearchValue] = useState("")
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Clear selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedItems([])
      setSearchValue("")
      setExpandedGroups([])
    }
  }, [open])

  // Handle clicks outside of dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load saved selections from localStorage
  useEffect(() => {
    const savedSelections = localStorage.getItem('compareSelections')
    if (savedSelections) {
      setSelectedItems(JSON.parse(savedSelections))
    }
  }, [])

  // Save selections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('compareSelections', JSON.stringify(selectedItems))
  }, [selectedItems])

  // Group materials by material type
  const materialGroups: GroupedItems = Object.values(materials).reduce((groups, material) => {
    if (!groups[material.material]) {
      groups[material.material] = []
    }
    groups[material.material].push({
      id: material.uniqueId,
      name: material.iceDbName,
      ecfIncBiogenic: material.ecfIncBiogenic,
      ecfBiogenic: material.ecfBiogenic,
      type: "material" as const,
    })
    return groups
  }, {} as GroupedItems)

  // Load build-ups from localStorage
  const loadBuildUps = (): SavedBuildUp[] => {
    const savedBuildUps = localStorage.getItem('buildUps')
    return savedBuildUps ? JSON.parse(savedBuildUps) : []
  }

  const buildUpItems = loadBuildUps().map(buildUp => ({
    id: buildUp.id,
    name: buildUp.name,
    ecfIncBiogenic: buildUp.totalA1A3IncBiogenic,
    ecfBiogenic: buildUp.totalA1A3Biogenic,
    type: "buildup" as const,
  }))

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    )
  }

  const currentGroups = type === "materials" ? materialGroups : null
  const currentItems = type === "buildups" ? buildUpItems : []

  const filteredGroups = currentGroups ? Object.entries(currentGroups).reduce((acc, [group, items]) => {
    const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    if (filteredItems.length > 0) {
      acc[group] = filteredItems
    }
    return acc
  }, {} as GroupedItems) : {}

  const filteredBuildUps = currentItems.filter(item =>
    item.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  function isMaterialItem(item: CompareItem): item is MaterialCompareItem {
    return item.type === "material"
  }

  function isBuildUpItem(item: CompareItem): item is BuildUpCompareItem {
    return item.type === "buildup"
  }

  const barData = selectedItems
    .filter((item): item is CompareItem => {
      if (type === "materials") {
        return isMaterialItem(item)
      } else {
        return isBuildUpItem(item)
      }
    })
    .map(item => {
      if (isMaterialItem(item)) {
        return {
          name: item.name,
          "ECF, inc biogenic": item.ecfIncBiogenic,
          "ECF biogenic": item.ecfBiogenic,
        }
      } else {
        return {
          name: item.name,
          "Total A1-A3, inc biogenic": item.ecfIncBiogenic,
          "Total A1-A3 biogenic": item.ecfBiogenic,
        }
      }
    })

  // Add this function for text wrapping
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const maxLength = 30; // Maximum characters before truncating
    const displayText = payload.value.length > maxLength 
      ? `${payload.value.substring(0, maxLength)}...` 
      : payload.value;

    return (
      <g transform={`translate(${x},${y})`}>
        <title>{payload.value}</title> {/* This creates the hover tooltip */}
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="end"
          fill="#666"
          transform="rotate(-45)"
          fontSize={12}
        >
          {displayText}
        </text>
      </g>
    );
  };

  const handleRemoveItem = (itemToRemove: CompareItem) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemToRemove.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl min-h-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare</DialogTitle>
        </DialogHeader>

        <Tabs 
          defaultValue="materials" 
          className="flex-1 flex flex-col min-h-0"
          value={type}
          onValueChange={(value) => {
            setType(value as "materials" | "buildups")
            setSearchValue("")
            setIsOpen(false)
          }}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="buildups">Build-ups</TabsTrigger>
          </TabsList>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  placeholder={`Search ${type}...`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  className="w-full"
                />
                {searchValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => {
                      setSearchValue("")
                      setIsOpen(true)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Selected items tags */}
              {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 max-h-[120px] overflow-y-auto">
                  {selectedItems
                    .filter(item => 
                      type === "materials" ? isMaterialItem(item) : isBuildUpItem(item)
                    )
                    .map(item => (
                      <Badge
                        key={item.id}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 flex items-center gap-1 max-w-[300px] group hover:bg-destructive/10"
                      >
                        <span className="truncate" title={item.name}>
                          {item.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleRemoveItem(item)
                          }}
                          className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-70 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </button>
                      </Badge>
                    ))}
                </div>
              )}

              {isOpen && (
                <div className="absolute z-10 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                  <div className="max-h-[300px] overflow-auto p-1">
                    {type === "materials" ? (
                      Object.entries(filteredGroups).map(([group, items]) => (
                        <div key={group} className="mb-1">
                          <div
                            className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => toggleGroup(group)}
                          >
                            {expandedGroups.includes(group) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            {group}
                          </div>
                          {expandedGroups.includes(group) && (
                            <div className="ml-4">
                              {items.map((item: CompareItem) => (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                    selectedItems.some(selected => selected.id === item.id) && "bg-accent"
                                  )}
                                  onClick={() => {
                                    setSelectedItems(prev => {
                                      const isSelected = prev.some(selected => selected.id === item.id)
                                      if (isSelected) {
                                        return prev.filter(selected => selected.id !== item.id)
                                      } else {
                                        return [...prev, item]
                                      }
                                    })
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedItems.some(selected => selected.id === item.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {item.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      filteredBuildUps.map((item: CompareItem) => (
                        <div
                          key={item.id}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                            selectedItems.some(selected => selected.id === item.id) && "bg-accent"
                          )}
                          onClick={() => {
                            setSelectedItems(prev => {
                              const isSelected = prev.some(selected => selected.id === item.id)
                              if (isSelected) {
                                return prev.filter(selected => selected.id !== item.id)
                              } else {
                                return [...prev, item]
                              }
                            })
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedItems.some(selected => selected.id === item.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {item.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 mt-4 min-h-0">
              {barData.length > 0 ? (
                <div className="h-full overflow-x-auto">
                  <div style={{ minWidth: `${Math.max(800, barData.length * 100)}px`, height: "100%" }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={barData}
                        margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          interval={0}
                          axisLine={true}
                          tickLine={true}
                          tick={false}
                          height={20}
                        />
                        <YAxis 
                          label={{ 
                            value: 'kgCO2e/kg', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle' },
                            offset: -20
                          }}
                          tickMargin={5}
                          width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="top"
                          align="right"
                          layout="vertical"
                          wrapperStyle={{ paddingLeft: "20px" }}
                        />
                        {type === "materials" ? (
                          <>
                            <Bar 
                              dataKey="ECF, inc biogenic" 
                              fill="hsl(var(--muted-foreground))" 
                              name="ECF, inc biogenic"
                            />
                            <Bar 
                              dataKey="ECF biogenic" 
                              fill="hsl(142.1 76.2% 36.3%)" 
                              name="ECF biogenic"
                            />
                          </>
                        ) : (
                          <>
                            <Bar 
                              dataKey="Total A1-A3, inc biogenic" 
                              fill="hsl(var(--muted-foreground))" 
                              name="Total A1-A3, inc biogenic"
                            />
                            <Bar 
                              dataKey="Total A1-A3 biogenic" 
                              fill="hsl(142.1 76.2% 36.3%)" 
                              name="Total A1-A3 biogenic"
                            />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-muted-foreground">
                    Select items to compare their carbon footprint
                  </p>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
