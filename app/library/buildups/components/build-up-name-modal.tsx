import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BuildUpNameModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
}

export function BuildUpNameModal({ open, onClose, onSubmit }: BuildUpNameModalProps) {
  const [name, setName] = useState("")

  const handleSubmit = () => {
    if (!name.trim()) {
      return
    }
    onSubmit(name)
    setName("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Build-up</DialogTitle>
          <DialogDescription>
            Enter a name for your new build-up.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Build-up Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 