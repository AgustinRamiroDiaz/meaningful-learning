'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAIConfig, saveAIConfig } from '@/lib/storage'
import type { AIConfig } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [config, setConfig] = useState<AIConfig>(() => getAIConfig())
  const [saved, setSaved] = useState(false)

  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const fetchModels = useCallback(async (baseUrl: string) => {
    setLoadingModels(true)
    setModelsError(null)
    try {
      const res = await fetch(`${baseUrl}/models`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const ids: string[] = (json.data as { id: string }[])?.map((m) => m.id).sort() ?? []
      setModels(ids)
    } catch {
      setModels([])
      setModelsError('Could not fetch models. Make sure the server is running.')
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    fetchModels(config.baseUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = () => {
    saveAIConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            href="/"
            aria-label="Back"
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>AI Provider</CardTitle>
            <CardDescription>
              Configure the AI endpoint used to generate knowledge graphs. Defaults to a local
              Ollama instance. Set the base URL to any OpenAI-compatible API endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="base-url">
                Base URL
              </label>
              <Input
                id="base-url"
                value={config.baseUrl}
                onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
                placeholder="http://localhost:11434/v1"
              />
              <p className="text-muted-foreground text-xs">
                Ollama default: <code>http://localhost:11434/v1</code>. OpenAI:{' '}
                <code>https://api.openai.com/v1</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="model">
                  Model
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1.5 px-2 text-xs"
                  onClick={() => fetchModels(config.baseUrl)}
                  disabled={loadingModels}
                >
                  <RefreshCw className={cn('h-3 w-3', loadingModels && 'animate-spin')} />
                  {loadingModels ? 'Loading…' : 'Refresh'}
                </Button>
              </div>

              {models.length > 0 ? (
                <Select
                  value={config.model}
                  onValueChange={(value) => value && setConfig((c) => ({ ...c, model: value }))}
                >
                  <SelectTrigger id="model" className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="model"
                  value={config.model}
                  onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
                  placeholder="llama3.2"
                />
              )}

              {modelsError ? (
                <p className="text-muted-foreground text-xs">
                  {modelsError} Showing text input as fallback.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  e.g. <code>llama3.2</code>, <code>mistral</code>, <code>gpt-4o</code>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="api-key">
                API Key <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                id="api-key"
                type="password"
                value={config.apiKey ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                placeholder="Leave blank for local Ollama"
              />
              <p className="text-muted-foreground text-xs">
                Not required for local Ollama. Stored in browser localStorage.
              </p>
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              {saved ? 'Saved!' : 'Save settings'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
