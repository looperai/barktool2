"use client"

import { useSearchParams, usePathname } from 'next/navigation'
import { BuildUpComponent } from "./create/page"

export default function BuildUpsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const buildUpId = searchParams.get('id')
  const isCreating = pathname.endsWith('/create')

  // Only load existing build-up data if we have an ID and we're not creating
  const savedBuildUps = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('buildUps') || '[]') : []
  const selectedBuildUp = !isCreating && buildUpId ? savedBuildUps.find((b: any) => b.id === buildUpId) : null

  return (
    <div className="h-full">
      <BuildUpComponent 
        key={buildUpId || 'new'} 
        initialData={selectedBuildUp}
        isEditing={!!buildUpId && !isCreating}
      />
    </div>
  )
} 