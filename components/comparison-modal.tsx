"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { materials, Material } from "@/lib/database"
import { SavedBuildUp } from "@/app/library/buildups/types"
import html2canvas from 'html2canvas'
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
import { Check, X, ChevronRight, ChevronDown, Download } from "lucide-react"
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
  const chartRef = useRef<HTMLDivElement>(null);

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
    .map((item, index) => {
      if (isMaterialItem(item)) {
        return {
          name: `${index + 1}`,
          fullName: item.name,
          "ECF, exc biogenic": Math.abs(item.ecfIncBiogenic - item.ecfBiogenic),
          "ECF biogenic": -Math.abs(item.ecfBiogenic),
        }
      } else {
        return {
          name: `${index + 1}`,
          fullName: item.name,
          "Product stage carbon": Math.abs(item.ecfIncBiogenic - item.ecfBiogenic),
          "Biogenic carbon": -Math.abs(item.ecfBiogenic),
        }
      }
    })

  const CustomBarLabel = ({ x, y, width, height, value, viewBox }: any) => {
    // Only show label if bar height is significant enough
    if (Math.abs(height) < 15) return null;
    
    const xPos = x + width / 2;
    const yPos = y + (height > 0 ? height / 2 : height / 2);
    const isNegative = value < 0;
    
    return (
      <text
        x={xPos}
        y={yPos}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fill="#fff"
      >
        {isNegative ? '-' : ''}{Math.abs(value).toFixed(2)}
      </text>
    );
  };

  // Create mapping legend component
  const MappingLegend = () => {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Item Reference</h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3">
          {barData.map((item, index) => (
            <div key={index} className="flex items-center gap-3 min-h-[24px]">
              <div className="relative flex-shrink-0 w-6 h-6">
                <div className="absolute inset-0 rounded-full bg-[rgb(241,245,249)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {index + 1}
                  </span>
                </div>
              </div>
              <span 
                className="truncate text-muted-foreground hover:text-foreground transition-colors text-sm leading-6"
                title={item.fullName}
              >
                {item.fullName}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

  const handleDownload = async () => {
    if (chartRef.current) {
      try {
        // Create a temporary container with fixed dimensions
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1200px'; // Fixed width
        document.body.appendChild(tempContainer);

        // Clone the chart content
        const clone = chartRef.current.cloneNode(true) as HTMLElement;
        clone.style.width = '1200px';
        clone.style.height = 'auto';
        clone.style.position = 'static';
        clone.style.transform = 'none';
        tempContainer.appendChild(clone);

        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(clone, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          width: 1200,
          height: clone.offsetHeight,
          windowWidth: 1200,
          windowHeight: clone.offsetHeight
        });

        // Clean up
        document.body.removeChild(tempContainer);
        
        const image = canvas.toDataURL('image/jpeg', 1.0);
        const link = document.createElement('a');
        link.download = `carbon-comparison-${new Date().toISOString().split('T')[0]}.jpg`;
        link.href = image;
        link.click();
      } catch (err) {
        console.error('Error generating image:', err);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl min-h-[600px] h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-x-4 pr-12">
          <DialogTitle>Compare</DialogTitle>
          {barData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download Chart
            </Button>
          )}
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
                  <div 
                    ref={chartRef}
                    className="bg-white p-6 rounded-lg flex flex-col"
                    style={{ 
                      minWidth: `${Math.max(800, barData.length * 100)}px`,
                      width: '100%'
                    }}
                  >
                    <div className="h-[400px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={barData}
                          margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
                          stackOffset="sign"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name"
                            interval={0}
                            axisLine={true}
                            tickLine={true}
                            height={30}
                          />
                          <YAxis 
                            label={{ 
                              value: 'kgCO2e/kg', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' },
                              offset: -20
                            }}
                            tickFormatter={(value) => value < 0 ? `-${Math.abs(value).toFixed(2)}` : Math.abs(value).toFixed(2)}
                            tickMargin={5}
                            width={80}
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const item = barData.find(d => d.name === label);
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-sm font-medium text-foreground">
                                        {item?.fullName}
                                      </span>
                                      {payload.map((item: any, index: number) => (
                                        <span key={index} className="text-sm text-foreground">
                                          {item.name}: {Math.abs(item.value).toFixed(4)} kgCO2e/kg
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Legend 
                            verticalAlign="top"
                            align="right"
                            layout="vertical"
                            wrapperStyle={{ paddingLeft: "20px" }}
                          />
                          {type === "materials" ? (
                            <>
                              <Bar 
                                name="ECF, exc biogenic"
                                dataKey="ECF, exc biogenic"
                                fill="hsl(var(--muted-foreground))"
                                stackId="stack"
                                label={<CustomBarLabel />}
                              />
                              <Bar 
                                name="ECF biogenic"
                                dataKey="ECF biogenic"
                                fill="hsl(142.1 76.2% 36.3%)"
                                stackId="stack"
                                label={<CustomBarLabel />}
                              />
                            </>
                          ) : (
                            <>
                              <Bar 
                                name="Product stage carbon"
                                dataKey="Product stage carbon"
                                fill="hsl(var(--muted-foreground))"
                                stackId="stack"
                                label={<CustomBarLabel />}
                              />
                              <Bar 
                                name="Biogenic carbon"
                                dataKey="Biogenic carbon"
                                fill="hsl(142.1 76.2% 36.3%)"
                                stackId="stack"
                                label={<CustomBarLabel />}
                              />
                            </>
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full">
                      <MappingLegend />
                    </div>
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
