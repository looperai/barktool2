"use client"

import { useSearchParams, usePathname } from 'next/navigation'
import { BuildUpForm } from "./components/build-up-form"
import { useState, useEffect } from 'react'
import { SavedBuildUp } from './types'
import { useRouter } from 'next/navigation'

export default function BuildUpsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const buildUpId = searchParams.get('id')
  const isCreating = pathname.endsWith('/create')
  const shouldStartEditing = searchParams.get('edit') === 'true'
  const [mounted, setMounted] = useState(false)
  const [selectedBuildUp, setSelectedBuildUp] = useState<SavedBuildUp | null>(null)
  const [buildUps, setBuildUps] = useState<SavedBuildUp[]>([])
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load all build-ups
  useEffect(() => {
    if (!mounted) return
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)

    // If we have a buildUpId, find and select that specific build-up
    if (buildUpId) {
      const buildUp = savedBuildUps.find((b: SavedBuildUp) => b.id === buildUpId)
      if (buildUp) {
        setSelectedBuildUp(buildUp)
      }
    }
  }, [mounted, buildUpId])

  const handleSave = async (savedBuildUp: SavedBuildUp) => {
    // Update the buildUps state with the new/updated build-up
    const updatedBuildUps = [...buildUps]
    const existingIndex = updatedBuildUps.findIndex(b => b.id === savedBuildUp.id)
    
    if (existingIndex >= 0) {
      updatedBuildUps[existingIndex] = savedBuildUp
    } else {
      updatedBuildUps.push(savedBuildUp)
    }

    // Save to localStorage
    localStorage.setItem('buildUps', JSON.stringify(updatedBuildUps))
    
    // Update state
    setBuildUps(updatedBuildUps)
    setSelectedBuildUp(savedBuildUp)

    // Navigate to the saved build-up in view mode
    router.push(`/library/buildups?id=${savedBuildUp.id}`)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="h-full">
      <BuildUpForm 
        key={`${buildUpId || 'new'}-${shouldStartEditing}`}
        initialData={selectedBuildUp}
        isEditing={isCreating || shouldStartEditing}
        onSave={handleSave}
      />
    </div>
  )
} 