"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { ArrowLeftRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function DraggableCompareButton() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ y: 0 })
  const [dragStart, setDragStart] = useState({ y: 0 })
  const buttonRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved position from localStorage or set to middle of screen
    const savedPosition = localStorage.getItem('compareButtonPosition')
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition))
    } else {
      setPosition({ y: window.innerHeight / 2 })
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY - position.y
    let hasMoved = false

    const handleMouseMove = (e: MouseEvent) => {
      const newY = e.clientY - startY
      // If mouse has moved more than 5px, consider it a drag
      if (!hasMoved && Math.abs(e.clientY - (startY + position.y)) > 5) {
        hasMoved = true
        setIsDragging(true)
      }

      if (hasMoved) {
        // Constrain vertical movement within viewport
        const maxY = window.innerHeight - (buttonRef.current?.offsetHeight || 0)
        const constrainedY = Math.max(0, Math.min(newY, maxY))
        setPosition({ y: constrainedY })
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      if (!hasMoved) {
        router.push('/compare')
      } else {
        // Save position to localStorage only if dragged
        localStorage.setItem('compareButtonPosition', JSON.stringify(position))
      }
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  if (!mounted) return null

  return (
    <div
      ref={buttonRef}
      className={cn(
        "fixed right-6 z-50 cursor-move select-none",
        isDragging && "pointer-events-none"
      )}
      style={{ top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Compare</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
} 