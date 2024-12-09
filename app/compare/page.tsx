"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { materials } from "@/lib/database"
import { SavedBuildUp } from "../library/buildups/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface CompareItem {
  id: string
  name: string
  ecfIncBiogenic: number
  ecfBiogenic: number
}

// Modern, aesthetically pleasing color palette
const COLORS = [
  '#6366f1', // Primary blue/indigo
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
]

export default function ComparePage() {
  const [type, setType] = useState<"materials" | "buildups">("materials")
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([])
  const [buildUps, setBuildUps] = useState<SavedBuildUp[]>([])

  useEffect(() => {
    // Load build-ups from localStorage
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)
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
      <div className="max-w-3xl mx-auto w-full space-y-8">
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

        <div className="relative">
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
            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <h3 className="font-semibold mb-4">Embodied Carbon Comparison</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ECF inc biogenic" fill={COLORS[0]} />
                      <Bar dataKey="ECF biogenic" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <h3 className="font-semibold mb-4">ECF inc biogenic Distribution</h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
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