"use client"

import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { materials } from "@/lib/database"
import { SavedBuildUp } from "../library/buildups/types"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts"

interface CompareItem {
  id: string
  name: string
  ecfIncBiogenic: number
  ecfBiogenic: number
}

// Modern color palette with distinct colors
const COLORS = [
  "hsl(221, 83%, 53%)", // blue-600
  "hsl(292, 91%, 73%)", // pink-300
  "hsl(262, 83%, 58%)", // purple-600
  "hsl(144, 61%, 52%)", // emerald-500
  "hsl(43, 96%, 56%)",  // amber-400
  "hsl(172, 66%, 50%)", // teal-400
]

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

export default function ComparePage() {
  const [type, setType] = useState<"materials" | "buildups">("materials")
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([])
  const [buildUps, setBuildUps] = useState<SavedBuildUp[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load build-ups from localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)
  }, [])

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

  // Get available options based on selected type
  const getOptions = (): CompareItem[] => {
    if (type === "materials") {
      return materials.map(m => ({
        id: m.uniqueId,
        name: m.iceDbName,
        ecfIncBiogenic: Number(m.ecfIncBiogenic),
        ecfBiogenic: Number(m.ecfBiogenic)
      }))
    } else {
      return buildUps.map(b => ({
        id: b.id,
        name: b.name,
        ecfIncBiogenic: b.totalA1A3IncBiogenic,
        ecfBiogenic: b.totalA1A3Biogenic
      }))
    }
  }

  // Filter options based on search value
  const filteredOptions = getOptions().filter(option =>
    option.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Prepare data for charts
  const barChartData = selectedItems.map(item => ({
    name: item.name,
    "ECF inc biogenic": Math.abs(item.ecfIncBiogenic),
    "ECF biogenic": Math.abs(item.ecfBiogenic)
  }))

  const pieChartData = selectedItems.map(item => ({
    name: item.name,
    value: Math.abs(item.ecfIncBiogenic)
  }))

  return (
    <div className="flex flex-col h-full p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Compare</h2>
          <p className="text-muted-foreground">
            Select materials or build-ups to compare their environmental impact
          </p>
        </div>

        <RadioGroup
          value={type}
          onValueChange={(value) => {
            setType(value as "materials" | "buildups")
            setSelectedItems([])
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem value="materials" id="materials" className="peer sr-only" />
            <label
              htmlFor="materials"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-sm font-medium">Materials</span>
            </label>
          </div>
          <div>
            <RadioGroupItem value="buildups" id="buildups" className="peer sr-only" />
            <label
              htmlFor="buildups"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <span className="text-sm font-medium">Build-ups</span>
            </label>
          </div>
        </RadioGroup>

        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={`Search ${type}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchValue("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-[200px] justify-between"
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedItems.length === 0
                ? `Select ${type}`
                : `${selectedItems.length} selected`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <div className="max-h-[300px] overflow-auto p-1">
                {filteredOptions.map(option => (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      selectedItems.some(item => item.id === option.id) && "bg-accent"
                    )}
                    onClick={() => {
                      setSelectedItems(prev => {
                        const isSelected = prev.some(item => item.id === option.id)
                        if (isSelected) {
                          return prev.filter(item => item.id !== option.id)
                        } else {
                          return [...prev, option]
                        }
                      })
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedItems.some(item => item.id === option.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="space-y-8">
            <div className="rounded-xl border bg-card text-card-foreground">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Embodied Carbon Comparison</h3>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={barChartData}
                      margin={{ top: 20, right: 30, left: 40, bottom: 120 }}
                    >
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        interval={0}
                        tick={(props) => {
                          const { x, y, payload } = props;
                          const words = payload.value.split(' ');
                          const lineHeight = 12;
                          const maxWidth = 150; // Maximum width for wrapped text
                          let lines: string[] = [];
                          let currentLine = '';
                          
                          words.forEach((word: string) => {
                            const testLine = currentLine ? `${currentLine} ${word}` : word;
                            if (testLine.length * 6 < maxWidth) { // Approximate character width
                              currentLine = testLine;
                            } else {
                              lines.push(currentLine);
                              currentLine = word;
                            }
                          });
                          if (currentLine) {
                            lines.push(currentLine);
                          }

                          return (
                            <g transform={`translate(${x},${y})`}>
                              {lines.map((line, i) => (
                                <text
                                  key={i}
                                  x={0}
                                  y={0}
                                  dy={i * lineHeight}
                                  textAnchor="end"
                                  fill="hsl(var(--foreground))"
                                  fontSize={12}
                                  transform="rotate(-45)"
                                >
                                  {line}
                                </text>
                              ))}
                            </g>
                          );
                        }}
                      />
                      <YAxis
                        stroke="hsl(var(--foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value.toFixed(4)}`}
                        label={{ 
                          value: 'kgCO2e/kg',
                          angle: -90,
                          position: 'insideLeft',
                          offset: -20,
                          style: { fill: 'hsl(var(--foreground))' }
                        }}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                      />
                      <Legend 
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => (
                          <span className="text-sm text-foreground">{value}</span>
                        )}
                      />
                      <Bar
                        name="ECF inc biogenic"
                        dataKey="ECF inc biogenic"
                        fill={COLORS[0]}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        name="ECF biogenic"
                        dataKey="ECF biogenic"
                        fill={COLORS[1]}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">ECF inc biogenic Distribution</h3>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value }) => {
                          const words = name.split(' ');
                          const lines = [];
                          let currentLine = '';
                          
                          words.forEach((word: string) => {
                            const testLine = currentLine ? `${currentLine} ${word}` : word;
                            if (testLine.length < 30) { // Adjust this value to control line length
                              currentLine = testLine;
                            } else {
                              lines.push(currentLine);
                              currentLine = word;
                            }
                          });
                          if (currentLine) {
                            lines.push(currentLine);
                          }
                          lines.push(`(${value.toFixed(4)})`);
                          
                          return lines.join('\n');
                        }}
                        outerRadius={180}
                        fill={COLORS[0]}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            className="stroke-background hover:opacity-80"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        formatter={(value) => {
                          // Wrap legend text
                          const words = value.split(' ');
                          const lines = [];
                          let currentLine = '';
                          
                          words.forEach((word: string) => {
                            const testLine = currentLine ? `${currentLine} ${word}` : word;
                            if (testLine.length < 40) { // Adjust this value for legend width
                              currentLine = testLine;
                            } else {
                              lines.push(currentLine);
                              currentLine = word;
                            }
                          });
                          if (currentLine) {
                            lines.push(currentLine);
                          }
                          
                          return (
                            <span className="text-sm text-foreground">
                              {lines.map((line, i) => (
                                <tspan key={i} x="0" dy={i ? "1.2em" : 0}>
                                  {line}
                                </tspan>
                              ))}
                            </span>
                          );
                        }}
                        wrapperStyle={{
                          paddingTop: '20px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 