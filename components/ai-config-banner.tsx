'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAIConfig } from '@/lib/storage'

const DEFAULT_BASE_URL = 'http://localhost:11434/v1'

export function AiConfigBanner() {
  // Show banner when using default Ollama URL — reminds user to verify Ollama is running
  const [visible] = useState(() => getAIConfig().baseUrl === DEFAULT_BASE_URL)
  const [dismissed, setDismissed] = useState(false)

  if (!visible || dismissed) return null

  return (
    <div className="flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Using local Ollama at <code className="font-mono">{DEFAULT_BASE_URL}</code>. Make sure
        Ollama is running and a model is pulled, or{' '}
        <Link href="/settings" className="font-medium underline">
          configure a different provider
        </Link>
        .
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-amber-800 hover:bg-amber-100"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
