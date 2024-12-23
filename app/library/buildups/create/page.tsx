"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BuildUpForm } from "../components/build-up-form"
import { BuildUpNameModal } from "../components/build-up-name-modal"
import { SavedBuildUp } from "../types"

export default function Page() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(true)
  const [buildUpName, setBuildUpName] = useState("")
  const [initialBuildUp, setInitialBuildUp] = useState<SavedBuildUp | null>(null)

  const handleModalClose = () => {
    router.push('/library/buildups')
  }

  const getUniqueNameWithSuffix = (baseName: string, existingBuildUps: SavedBuildUp[]) => {
    let name = baseName
    let counter = 1
    while (existingBuildUps.some(buildUp => buildUp.name === name)) {
      name = `${baseName} (${counter})`
      counter++
    }
    return name
  }

  const handleModalSubmit = (name: string) => {
    const existingBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    
    // Get a unique name with suffix if needed
    const uniqueName = getUniqueNameWithSuffix(name, existingBuildUps)

    // Create a new build-up with the unique name and empty data
    const newBuildUp: SavedBuildUp = {
      id: "", // Set empty ID to indicate this is a new build-up
      name: uniqueName,
      totalThickness: 0,
      totalMass: 0,
      totalA1A3IncBiogenic: 0,
      totalA1A3Biogenic: 0,
      items: [],
      nrmElements: []
    }

    setBuildUpName(uniqueName)
    setInitialBuildUp(newBuildUp)
    setShowModal(false)
  }

  const handleSave = (savedBuildUp: SavedBuildUp) => {
    // Navigate to the saved build-up in view mode
    router.push(`/library/buildups?id=${savedBuildUp.id}`)
  }

  if (showModal) {
    return (
      <BuildUpNameModal
        open={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    )
  }

  return <BuildUpForm isEditing={true} initialData={initialBuildUp} initialName={buildUpName} onSave={handleSave} />
} 