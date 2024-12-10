"use client"

import { useSearchParams, usePathname } from 'next/navigation'
import { BuildUpForm } from "./components/build-up-form"
import { useState, useEffect } from 'react'
import { SavedBuildUp } from './types'

export default function BuildUpsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const buildUpId = searchParams.get('id')
  const isCreating = pathname.endsWith('/create')
  const shouldStartEditing = searchParams.get('edit') === 'true'
  const [mounted, setMounted] = useState(false)
  const [selectedBuildUp, setSelectedBuildUp] = useState<SavedBuildUp | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Separate effect for handling build-up selection
  useEffect(() => {
    if (!mounted) return

    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    if (!isCreating && buildUpId) {
      const buildUp = savedBuildUps.find((b: SavedBuildUp) => b.id === buildUpId)
      if (buildUp) {
        setSelectedBuildUp(buildUp)
      } else {
        setSelectedBuildUp(null)
        // If build-up not found, redirect to main buildups page
        if (buildUpId) {
          window.location.href = '/library/buildups'
        }
      }
    } else {
      setSelectedBuildUp(null)
    }
  }, [mounted, buildUpId, isCreating])

  if (!mounted) {
    return null
  }

  return (
    <div className="h-full">
      <BuildUpForm 
        key={`${buildUpId || 'new'}-${shouldStartEditing}`}
        initialData={selectedBuildUp}
        isEditing={isCreating || shouldStartEditing}
      />
    </div>
  )
} 