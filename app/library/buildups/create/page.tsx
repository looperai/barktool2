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

  const handleModalSubmit = (name: string) => {
    // Create a new build-up with the entered name
    const newBuildUp: SavedBuildUp = {
      id: Math.random().toString(),
      name: name,
      totalThickness: 0,
      totalMass: 0,
      totalA1A3IncBiogenic: 0,
      totalA1A3Biogenic: 0,
      items: []
    }

    // Save to localStorage
    const existingBuildUps = JSON.parse(localStorage.getItem('buildUps') || '[]')
    localStorage.setItem('buildUps', JSON.stringify([...existingBuildUps, newBuildUp]))

    setBuildUpName(name)
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