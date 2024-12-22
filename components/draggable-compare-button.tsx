"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ComparisonModal } from "./comparison-modal"

export function DraggableCompareButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="default"
          size="lg"
          onClick={() => setShowModal(true)}
          className="shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground font-medium rounded-full px-6"
        >
          Compare
        </Button>
      </div>

      <ComparisonModal 
        open={showModal}
        onOpenChange={setShowModal}
      />
    </>
  )
} 