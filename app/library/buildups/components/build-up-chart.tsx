"use client"

import { BuildUpItem } from "../types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"

interface BuildUpChartProps {
  items: BuildUpItem[]
  toggledItems: Set<string>
}

export function BuildUpChart({ items, toggledItems }: BuildUpChartProps) {
  // Calculate totals
  const totalA1A3ExcBiogenic = items.reduce((sum, item) => sum + item.a1a3ExcBiogenic, 0)
  const totalA1A3Biogenic = items.reduce((sum, item) => sum + item.a1a3Biogenic, 0)

  // Calculate toggled totals
  const toggledA1A3ExcBiogenic = items
    .filter(item => toggledItems.has(item.id))
    .reduce((sum, item) => sum + item.a1a3ExcBiogenic, 0)
  const toggledA1A3Biogenic = items
    .filter(item => toggledItems.has(item.id))
    .reduce((sum, item) => sum + item.a1a3Biogenic, 0)

  // Calculate percentages
  const toggledExcBiogenicPercentage = Math.abs(totalA1A3ExcBiogenic) ? 
    (Math.abs(toggledA1A3ExcBiogenic) / Math.abs(totalA1A3ExcBiogenic)) * 100 : 0
  const toggledBiogenicPercentage = Math.abs(totalA1A3Biogenic) ? 
    (Math.abs(toggledA1A3Biogenic) / Math.abs(totalA1A3Biogenic)) * 100 : 0

  // Constants for visualization
  const barWidth = 60 // pixels
  const maxBarHeight = 200 // pixels
  const centerLineY = maxBarHeight / 2
  
  // Helper function to calculate bar height and position
  const getBarStyles = (value: number, percentage: number, isExcBiogenic: boolean, isHovered: boolean = false) => {
    // Find the maximum absolute value among all values for scaling
    const allValues = [
      totalA1A3ExcBiogenic,
      totalA1A3Biogenic,
      ...items.map(item => item.a1a3ExcBiogenic),
      ...items.map(item => item.a1a3Biogenic)
    ]
    const maxAbsValue = Math.max(...allValues.map(Math.abs))
    
    // Calculate height as a proportion of maxBarHeight/2 (since we split above/below)
    const heightScale = (maxBarHeight / 2) / maxAbsValue
    const height = Math.abs(value) * heightScale
    const isNegative = value < 0

    // Define color pairs (base and toggled) for each type
    const excBiogenicColors = {
      base: isHovered ? '#64748b' : '#94a3b8', // Darker on hover
      toggled: isHovered ? '#1e293b' : '#334155' // Darker on hover
    }
    const biogenicColors = {
      base: isHovered ? '#15803d' : '#16a34a', // Darker on hover
      toggled: isHovered ? '#14532d' : '#166534' // Darker on hover
    }
    
    const colors = isExcBiogenic ? excBiogenicColors : biogenicColors
    
    return {
      bar: {
        height: `${height}px`,
        bottom: isNegative ? 'auto' : '50%',
        top: isNegative ? '50%' : 'auto',
        left: 0,
        width: `${barWidth}px`,
        position: 'absolute' as const,
        backgroundColor: colors.base,
        opacity: 0.3,
        border: '1px solid #94a3b8',
        transition: 'background-color 0.2s'
      },
      highlight: {
        height: `${(height * percentage) / 100}px`,
        bottom: isNegative ? 'auto' : '0',
        top: isNegative ? '0' : 'auto',
        left: 0,
        width: '100%',
        position: 'absolute' as const,
        backgroundColor: colors.toggled,
        opacity: 1,
        transition: 'background-color 0.2s'
      }
    }
  }

  const [hoveredBar, setHoveredBar] = useState<'exc' | 'bio' | null>(null)
  const excBiogenicStyles = getBarStyles(totalA1A3ExcBiogenic, toggledExcBiogenicPercentage, true, hoveredBar === 'exc')
  const biogenicStyles = getBarStyles(totalA1A3Biogenic, toggledBiogenicPercentage, false, hoveredBar === 'bio')

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <div className="relative" style={{ height: `${maxBarHeight}px`, width: `${barWidth * 3}px` }}>
        {/* Center line */}
        <div 
          className="absolute w-full border-t border-gray-300"
          style={{ top: `${centerLineY}px` }}
        />

        {/* Exc Biogenic Bar */}
        <div className="absolute" style={{ left: 0, width: `${barWidth}px`, height: '100%' }}>
          <div style={excBiogenicStyles.bar}>
            {toggledItems.size > 0 && <div style={excBiogenicStyles.highlight} />}
          </div>
          {/* Hover area for top half */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="absolute top-0 w-full cursor-help"
                  style={{ height: '50%' }}
                  onMouseEnter={() => setHoveredBar('exc')}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-2">
                <p className="font-medium">A1-A3, excluding biogenic</p>
                <p className="text-sm text-muted-foreground">
                  {totalA1A3ExcBiogenic.toFixed(3)} kgCO2e/kg
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {toggledItems.size > 0 && (
            <div 
              className="absolute text-sm font-medium"
              style={{ 
                top: '50%',
                transform: 'translateY(-50%)',
                right: `${barWidth + 8}px`,
                color: '#334155',
                whiteSpace: 'nowrap'
              }}
            >
              {Math.round(toggledExcBiogenicPercentage)}%
            </div>
          )}
        </div>

        {/* Biogenic Bar */}
        <div className="absolute" style={{ left: `${barWidth * 2}px`, width: `${barWidth}px`, height: '100%' }}>
          <div style={biogenicStyles.bar}>
            {toggledItems.size > 0 && <div style={biogenicStyles.highlight} />}
          </div>
          {/* Hover area for bottom half */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="absolute bottom-0 w-full cursor-help"
                  style={{ height: '50%' }}
                  onMouseEnter={() => setHoveredBar('bio')}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </TooltipTrigger>
              <TooltipContent side="left" className="flex flex-col gap-2">
                <p className="font-medium">A1-A3, biogenic</p>
                <p className="text-sm text-muted-foreground">
                  {totalA1A3Biogenic.toFixed(3)} kgCO2e/kg
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {toggledItems.size > 0 && (
            <div 
              className="absolute text-sm font-medium"
              style={{ 
                top: '50%',
                transform: 'translateY(-50%)',
                left: `${barWidth + 8}px`,
                color: '#166534',
                whiteSpace: 'nowrap'
              }}
            >
              {Math.round(toggledBiogenicPercentage)}%
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 