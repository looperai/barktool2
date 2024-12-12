"use client"

import { useState, useMemo, useEffect } from "react"
import { materials } from "@/lib/database"
import { useSearchParams } from 'next/navigation'
import { MaterialDetails } from "@/components/material-details"

export default function MaterialsPage() {
  const searchParams = useSearchParams()
  const selectedMaterialName = searchParams.get('material')
  
  // Find the selected material
  const selectedMaterial = useMemo(() => 
    materials.find(material => material.iceDbName === selectedMaterialName),
    [selectedMaterialName]
  )

  return (
    <div className="h-full flex flex-col">
      <MaterialDetails material={selectedMaterial || null} />
    </div>
  )
} 