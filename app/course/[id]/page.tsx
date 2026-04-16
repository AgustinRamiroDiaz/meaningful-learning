'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { AiConfigBanner } from '@/components/ai-config-banner'
import { ConceptDetailPanel } from '@/components/concept-detail-panel'
import { KnowledgeGraph } from '@/components/graph/knowledge-graph'
import { PromptInput } from '@/components/prompt-input'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { useGraph } from '@/hooks/use-graph'
import { generateKnowledgeGraph } from '@/lib/ai-client'
import { buildKnowledgeGraph } from '@/lib/graph-engine'
import { getAIConfig, getCourse, saveCourse } from '@/lib/storage'
import type { AIClientError, ConceptNode, Course } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''

  const [baseCourse, setBaseCourse] = useState<Course | null | 'not-found'>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  useEffect(() => {
    const found = getCourse(id)
    setBaseCourse(found ?? 'not-found')
  }, [id])

  const courseForHook = baseCourse === 'not-found' ? null : baseCourse
  const { currentCourse, toggleNodeKnown } = useGraph(courseForHook, setBaseCourse)

  const handleGenerate = async (topic: string) => {
    if (!currentCourse) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const config = getAIConfig()
      const response = await generateKnowledgeGraph(topic, config)
      const graph = buildKnowledgeGraph(response, topic)
      const updated: Course = {
        ...currentCourse,
        graph,
        updatedAt: new Date().toISOString(),
      }
      saveCourse(updated)
      setBaseCourse(updated)
    } catch (err) {
      const aiErr = err as AIClientError
      const messages: Record<string, string> = {
        AUTH_ERROR: 'Authentication failed. Check your API key in Settings.',
        RATE_LIMITED: 'Rate limit reached. Please wait a moment and try again.',
        NETWORK_ERROR:
          'Could not reach the AI service. Is Ollama running? Check base URL in Settings.',
        PARSE_ERROR: 'The AI returned an unexpected response. Please try again.',
        EMPTY_GRAPH: 'The AI returned an empty graph. Try a more specific topic.',
      }
      setGenerateError(messages[aiErr.code] ?? 'An unexpected error occurred. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (baseCourse === null) return null

  if (baseCourse === 'not-found') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Course not found.</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Back to courses
        </Button>
      </div>
    )
  }

  const selectedConcept: ConceptNode | null =
    selectedNodeId !== null
      ? (currentCourse?.graph?.nodes.find((n) => n.id === selectedNodeId) ?? null)
      : null

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Link
          href="/"
          aria-label="Back to courses"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 truncate text-base font-semibold">{currentCourse?.name ?? ''}</h1>
        <Link
          href="/settings"
          aria-label="Settings"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
        >
          <Settings className="h-4 w-4" />
        </Link>
      </header>

      {/* AI Config Banner */}
      <AiConfigBanner />

      {/* Prompt input */}
      <div className="shrink-0 border-b px-4 py-3">
        <PromptInput onSubmit={handleGenerate} isLoading={isGenerating} />
        {generateError && <p className="text-destructive mt-2 text-sm">{generateError}</p>}
      </div>

      {/* Graph area */}
      <div className="relative flex-1 overflow-hidden">
        {currentCourse?.graph ? (
          <KnowledgeGraph
            graph={currentCourse.graph}
            selectedNodeId={selectedNodeId}
            onNodeClick={setSelectedNodeId}
            onNodeStateToggle={toggleNodeKnown}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-center text-base">
              No graph yet — enter a topic prompt above to generate your knowledge graph.
            </p>
          </div>
        )}

        {/* Detail panel */}
        {currentCourse?.graph && (
          <ConceptDetailPanel
            concept={selectedConcept}
            graph={currentCourse.graph}
            onClose={() => setSelectedNodeId(null)}
            onToggleKnown={toggleNodeKnown}
            onNavigateToNode={setSelectedNodeId}
          />
        )}
      </div>
    </div>
  )
}
