"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BuildUpForm } from "../components/build-up-form"
import { BuildUpNameModal } from "../components/build-up-name-modal"
import { SavedBuildUp } from "../types"

export default function Page() {
  const [showModal, setShowModal] = useState(true)
  const [buildUpName, setBuildUpName] = useState("")
  const router = useRouter()

  const handleModalClose = () => {
    setShowModal(false)
    router.push("/library/buildups")
  }

  const getUniqueNameWithSuffix = (baseName: string, existingBuildUps: SavedBuildUp[]): string => {
    // If no build-up with this name exists, return the base name
    if (!existingBuildUps.some(buildUp => buildUp.name === baseName)) {
      return baseName
    }

    // Find all build-ups that start with the base name and have a number suffix
    const regex = new RegExp(`^${baseName}\\s*\\((\\d+)\\)$`)
    const suffixNumbers = existingBuildUps
      .map(buildUp => {
        const match = buildUp.name.match(regex)
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => num > 0)

    // If no numbered suffixes exist, use (2)
    if (suffixNumbers.length === 0) {
      return `${baseName} (2)`
    }

    // Find the highest number and add 1
    const nextNumber = Math.max(...suffixNumbers) + 1
    return `${baseName} (${nextNumber})`
  }

  const handleModalSubmit = (name: string) => {
    const existingBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    
    // Get a unique name with suffix if needed
    const uniqueName = getUniqueNameWithSuffix(name, existingBuildUps)

    // Create a new build-up with the unique name
    const newBuildUp: SavedBuildUp = {
      id: Math.random().toString(),
      name: uniqueName,
      totalThickness: 0,
      totalMass: 0,
      totalA1A3IncBiogenic: 0,
      totalA1A3Biogenic: 0,
      items: []
    }

    // Save to localStorage
    localStorage.setItem('buildUps', JSON.stringify([...existingBuildUps, newBuildUp]))

    setBuildUpName(uniqueName)
    setShowModal(false)
    
    // Navigate to the new build-up with edit mode
    router.push(`/library/buildups?id=${newBuildUp.id}&edit=true`)

    // Scroll the detail panel to the bottom after a short delay
    setTimeout(() => {
      const detailPanel = document.querySelector('.overflow-y-auto')
      if (detailPanel) {
        detailPanel.scrollTop = detailPanel.scrollHeight
      }
    }, 100)
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

  return <BuildUpForm isEditing={true} initialName={buildUpName} />
} 