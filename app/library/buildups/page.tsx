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
  const [buildUps, setBuildUps] = useState<SavedBuildUp[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load all build-ups
  useEffect(() => {
    if (!mounted) return
    const savedBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    setBuildUps(savedBuildUps)
  }, [mounted])

  // Handle build-up selection
  useEffect(() => {
    if (!mounted || !buildUps.length) return

    if (!isCreating && buildUpId) {
      const buildUp = buildUps.find((b: SavedBuildUp) => b.id === buildUpId)
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
  }, [mounted, buildUpId, isCreating, buildUps])

  const handleSave = (savedBuildUp: SavedBuildUp) => {
    // Update the buildUps state with the new/updated build-up
    setBuildUps(prevBuildUps => {
      const updatedBuildUps = prevBuildUps.map(buildUp =>
        buildUp.id === savedBuildUp.id ? savedBuildUp : buildUp
      )
      if (!prevBuildUps.find(buildUp => buildUp.id === savedBuildUp.id)) {
        updatedBuildUps.push(savedBuildUp)
      }
      return updatedBuildUps
    })
    setSelectedBuildUp(savedBuildUp)
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