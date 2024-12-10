"use client"

import { BuildUpItem } from "../types"

interface BuildUpChartProps {
  items: BuildUpItem[]
  toggledItems: Set<string>
}

export function BuildUpChart({ items, toggledItems }: BuildUpChartProps) {
  // Calculate totals
  const totalA1A3IncBiogenic = items.reduce((sum, item) => sum + item.a1a3IncBiogenic, 0)
  const totalA1A3Biogenic = items.reduce((sum, item) => sum + item.a1a3Biogenic, 0)

  // Calculate toggled totals using absolute values
  const toggledA1A3IncBiogenic = items
    .filter(item => toggledItems.has(item.id))
    .reduce((sum, item) => sum + Math.abs(item.a1a3IncBiogenic), 0)
  const toggledA1A3Biogenic = items
    .filter(item => toggledItems.has(item.id))
    .reduce((sum, item) => sum + Math.abs(item.a1a3Biogenic), 0)

  // Calculate percentages using absolute values
  const toggledIncBiogenicPercentage = Math.abs(totalA1A3IncBiogenic) ? 
    (toggledA1A3IncBiogenic / Math.abs(totalA1A3IncBiogenic)) * 100 : 0
  const toggledBiogenicPercentage = Math.abs(totalA1A3Biogenic) ? 
    (toggledA1A3Biogenic / Math.abs(totalA1A3Biogenic)) * 100 : 0

  // Constants for visualization
  const barWidth = 60 // pixels
  const maxBarHeight = 200 // pixels
  const centerLineY = maxBarHeight / 2
  
  // Helper function to calculate bar height and position
  const getBarStyles = (value: number, percentage: number, isIncBiogenic: boolean) => {
    // Use absolute values for height calculation
    const absValue = Math.abs(value)
    const maxAbsValue = Math.max(Math.abs(totalA1A3IncBiogenic), Math.abs(totalA1A3Biogenic))
    const height = (absValue / maxAbsValue) * (maxBarHeight / 2)
    const isNegative = value < 0
    
    return {
      bar: {
        height: `${height}px`,
        bottom: isNegative ? 'auto' : '50%',
        top: isNegative ? '50%' : 'auto',
        left: 0,
        width: `${barWidth}px`,
        position: 'absolute' as const,
        backgroundColor: isIncBiogenic ? 'hsl(var(--muted-foreground))' : '#16a34a', // text-muted-foreground for left, green-600 for right
        opacity: isIncBiogenic ? 0.2 : 0.15,
        border: '1px solid #94a3b8'
      },
      highlight: {
        height: `${(height * percentage) / 100}px`,
        bottom: isNegative ? 'auto' : '0',
        top: isNegative ? '0' : 'auto',
        left: 0,
        width: '100%',
        position: 'absolute' as const,
        backgroundColor: isIncBiogenic ? 'hsl(var(--muted-foreground))' : '#16a34a', // Same colors but full opacity
        opacity: 0.4,
        transition: 'height 0.3s ease'
      }
    }
  }

  const incBiogenicStyles = getBarStyles(totalA1A3IncBiogenic, toggledIncBiogenicPercentage, true)
  const biogenicStyles = getBarStyles(totalA1A3Biogenic, toggledBiogenicPercentage, false)

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <div className="relative" style={{ height: `${maxBarHeight}px`, width: `${barWidth * 3}px` }}>
        {/* Center line */}
        <div 
          className="absolute w-full border-t border-gray-300"
          style={{ top: `${centerLineY}px` }}
        />

        {/* Inc Biogenic Bar */}
        <div className="absolute" style={{ left: 0, width: `${barWidth}px`, height: '100%' }}>
          <div style={incBiogenicStyles.bar}>
            {toggledItems.size > 0 && <div style={incBiogenicStyles.highlight} />}
          </div>
          {toggledItems.size > 0 && (
            <div 
              className="absolute text-sm text-muted-foreground"
              style={{ 
                top: totalA1A3IncBiogenic >= 0 ? '0' : 'auto',
                bottom: totalA1A3IncBiogenic >= 0 ? 'auto' : '0',
                left: `${barWidth + 4}px`
              }}
            >
              {Math.round(toggledIncBiogenicPercentage)}%
            </div>
          )}
        </div>

        {/* Biogenic Bar */}
        <div className="absolute" style={{ left: `${barWidth * 2}px`, width: `${barWidth}px`, height: '100%' }}>
          <div style={biogenicStyles.bar}>
            {toggledItems.size > 0 && <div style={biogenicStyles.highlight} />}
          </div>
          {toggledItems.size > 0 && (
            <div 
              className="absolute text-sm text-green-600"
              style={{ 
                top: 'auto',
                bottom: '0',
                left: `${barWidth + 4}px`
              }}
            >
              {Math.round(toggledBiogenicPercentage)}%
            </div>
          )}
        </div>
      </div>

      {toggledItems.size > 0 && (
        <div className="text-sm text-orange-500 mt-2">
          toggled materials
        </div>
      )}
    </div>
  )
} 