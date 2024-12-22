"use client"

import { BuildUpItem } from "../types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { materials } from "@/lib/database"

interface BuildUpChartProps {
  items: BuildUpItem[]
  toggledItems: Set<string>
}

export function BuildUpChart({ items, toggledItems }: BuildUpChartProps) {
  // Calculate product stage carbon and biogenic carbon
  const calculateValues = () => {
    let totalProductStageCarbon = 0;
    let totalBiogenicCarbon = 0;
    let toggledProductStageCarbon = 0;
    let toggledBiogenicCarbon = 0;

    items.forEach(item => {
      const material = materials.find(m => m.iceDbName === item.material);
      if (material) {
        const mass = (material.density * (item.thickness / 1000)); // Result in kg/m²
        const productStageCarbon = mass * (item.a1a3IncBiogenic - item.a1a3Biogenic); // Result in kgCO2e/m²
        const biogenicCarbon = mass * item.a1a3Biogenic; // Result in kgCO2e/m²

        totalProductStageCarbon += productStageCarbon;
        totalBiogenicCarbon += biogenicCarbon;

        if (toggledItems.has(item.id)) {
          toggledProductStageCarbon += productStageCarbon;
          toggledBiogenicCarbon += biogenicCarbon;
        }
      }
    });

    return {
      totalProductStageCarbon,
      totalBiogenicCarbon,
      toggledProductStageCarbon,
      toggledBiogenicCarbon
    };
  };

  const values = calculateValues();

  // Calculate percentages
  const toggledProductStagePercentage = Math.abs(values.totalProductStageCarbon) ? 
    (Math.abs(values.toggledProductStageCarbon) / Math.abs(values.totalProductStageCarbon)) * 100 : 0;
  const toggledBiogenicPercentage = Math.abs(values.totalBiogenicCarbon) ? 
    (Math.abs(values.toggledBiogenicCarbon) / Math.abs(values.totalBiogenicCarbon)) * 100 : 0;

  // Constants for visualization
  const barWidth = 60 // pixels
  const maxBarHeight = 200 // pixels
  const centerLineY = maxBarHeight / 2
  
  // Helper function to calculate bar height and position
  const getBarStyles = (value: number, percentage: number, isProductStage: boolean, isHovered: boolean = false) => {
    // Find the maximum absolute value among all values for scaling
    const allValues = [
      values.totalProductStageCarbon,
      values.totalBiogenicCarbon,
      values.toggledProductStageCarbon,
      values.toggledBiogenicCarbon
    ]
    const maxAbsValue = Math.max(...allValues.map(Math.abs))
    
    // Calculate height as a proportion of maxBarHeight/2 (since we split above/below)
    const heightScale = (maxBarHeight / 2) / maxAbsValue
    const height = Math.abs(value) * heightScale
    const isNegative = value < 0

    // Define color pairs (base and toggled) for each type
    const productStageColors = {
      base: isHovered ? '#64748b' : '#94a3b8', // Darker on hover
      toggled: isHovered ? '#1e293b' : '#334155' // Darker on hover
    }
    const biogenicColors = {
      base: isHovered ? '#15803d' : '#16a34a', // Darker on hover
      toggled: isHovered ? '#14532d' : '#166534' // Darker on hover
    }
    
    const colors = isProductStage ? productStageColors : biogenicColors
    
    return {
      bar: {
        height: `${height}px`,
        bottom: isNegative ? 'auto' : '50%',
        top: isNegative ? '50%' : 'auto',
        left: 0,
        width: `${barWidth}px`,
        position: 'absolute' as const,
        backgroundColor: colors.base,
        opacity: isHovered ? 0.5 : 0.3,
        border: '1px solid #94a3b8',
        transition: 'all 0.2s'
      },
      highlight: {
        height: `${(height * percentage) / 100}px`,
        bottom: isNegative ? 'auto' : '0',
        top: isNegative ? '0' : 'auto',
        left: 0,
        width: '100%',
        position: 'absolute' as const,
        backgroundColor: colors.toggled,
        opacity: isHovered ? 1 : 0.8,
        transition: 'all 0.2s'
      }
    }
  }

  const [hoveredBar, setHoveredBar] = useState<'product' | 'bio' | null>(null)
  const productStageStyles = getBarStyles(values.totalProductStageCarbon, toggledProductStagePercentage, true, hoveredBar === 'product')
  const biogenicStyles = getBarStyles(values.totalBiogenicCarbon, toggledBiogenicPercentage, false, hoveredBar === 'bio')

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <div className="relative" style={{ height: `${maxBarHeight}px`, width: `${barWidth}px` }}>
        {/* Center line */}
        <div 
          className="absolute w-full border-t border-gray-300"
          style={{ top: `${centerLineY}px` }}
        />

        {/* Product Stage Carbon Bar */}
        <div className="absolute" style={{ left: 0, width: `${barWidth}px`, height: '100%' }}>
          <div style={productStageStyles.bar}>
            {toggledItems.size > 0 && <div style={productStageStyles.highlight} />}
          </div>
          {/* Hover area for top half */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="absolute top-0 w-full cursor-help z-10"
                  style={{ height: '50%' }}
                  onMouseEnter={() => setHoveredBar('product')}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-2">
                <p className="font-medium">Product stage carbon</p>
                <p className="text-sm text-muted-foreground">
                  {values.totalProductStageCarbon.toFixed(3)} kgCO2e/m²
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {toggledItems.size > 0 && (
            <div 
              className="absolute text-sm font-medium"
              style={{ 
                top: '25%',
                transform: 'translateY(-50%)',
                right: `${barWidth + 8}px`,
                color: '#334155',
                whiteSpace: 'nowrap'
              }}
            >
              {Math.round(toggledProductStagePercentage)}%
            </div>
          )}
        </div>

        {/* Biogenic Carbon Bar */}
        <div className="absolute" style={{ left: 0, width: `${barWidth}px`, height: '100%' }}>
          <div style={biogenicStyles.bar}>
            {toggledItems.size > 0 && <div style={biogenicStyles.highlight} />}
          </div>
          {/* Hover area for bottom half */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="absolute bottom-0 w-full cursor-help z-10"
                  style={{ height: '50%' }}
                  onMouseEnter={() => setHoveredBar('bio')}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-2">
                <p className="font-medium">Biogenic carbon</p>
                <p className="text-sm text-muted-foreground">
                  {values.totalBiogenicCarbon.toFixed(3)} kgCO2e/m²
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {toggledItems.size > 0 && (
            <div 
              className="absolute text-sm font-medium"
              style={{ 
                top: '75%',
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