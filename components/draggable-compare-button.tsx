"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeftRight } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ComparisonModal } from "./comparison-modal"

export function DraggableCompareButton() {
  const [position, setPosition] = useState({ y: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ y: 0 })
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const dragThreshold = 5
  const timeThreshold = 200 // milliseconds
  const dragDistanceRef = useRef(0)
  const mouseDownTimeRef = useRef(0)
  const isMouseDownRef = useRef(false)
  const hasMovedRef = useRef(false)

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return

      dragDistanceRef.current = Math.abs(e.clientY - dragStart.y)
      
      // If we've moved beyond the threshold, start dragging
      if (dragDistanceRef.current > dragThreshold) {
        hasMovedRef.current = true
        setIsDragging(true)
        const newY = Math.max(100, Math.min(window.innerHeight - 100, position.y + (e.clientY - dragStart.y)))
        setPosition({ y: newY })
        setDragStart({ y: e.clientY })
        
        // Save position to localStorage
        localStorage.setItem('compareButtonPosition', JSON.stringify({ y: newY }))
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const timeDiff = Date.now() - mouseDownTimeRef.current

      // Consider it a click if:
      // 1. The mouse was down for less than timeThreshold
      // 2. The mouse hasn't moved beyond dragThreshold
      // 3. We haven't started dragging
      if (isMouseDownRef.current && 
          timeDiff < timeThreshold && 
          dragDistanceRef.current <= dragThreshold &&
          !hasMovedRef.current) {
        setShowModal(true)
      }

      isMouseDownRef.current = false
      hasMovedRef.current = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragStart.y, position.y])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isMouseDownRef.current = true
    hasMovedRef.current = false
    setIsDragging(false)
    setDragStart({ y: e.clientY })
    dragDistanceRef.current = 0
    mouseDownTimeRef.current = Date.now()
  }

  if (!mounted) return null

  return (
    <>
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

      <ComparisonModal 
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  )
} 