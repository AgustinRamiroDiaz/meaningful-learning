'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface NewCourseDialogProps {
  onCreateCourse: (name: string) => void
}

export function NewCourseDialog({ onCreateCourse }: NewCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Course name cannot be empty.')
      return
    }
    if (trimmed.length > 100) {
      setError('Course name must be 100 characters or fewer.')
      return
    }
    onCreateCourse(trimmed)
    setName('')
    setError('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @base-ui DialogTrigger renders as a button; use render prop to style as Button */}
      <DialogTrigger
        render={
          <Button variant="default" onClick={() => setOpen(true)}>
            New Course
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new course</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="e.g. Machine Learning Basics"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            autoFocus
          />
          {error && <p className="text-destructive mt-1.5 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
