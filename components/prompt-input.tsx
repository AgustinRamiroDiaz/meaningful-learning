'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PromptInputProps {
  onSubmit: (topic: string) => void
  isLoading: boolean
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
  }

  return (
    <div className="flex gap-2">
      <Input
        className="flex-1"
        placeholder="e.g. I want to learn quantum computing from scratch"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        disabled={isLoading}
      />
      <Button onClick={handleSubmit} disabled={isLoading || !value.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          'Generate'
        )}
      </Button>
    </div>
  )
}
