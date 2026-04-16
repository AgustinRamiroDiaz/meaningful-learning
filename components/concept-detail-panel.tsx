'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getPrerequisites, getUnlocked } from '@/lib/graph-engine'
import type { ConceptNode, KnowledgeGraph, NodeState } from '@/lib/types'

const STATE_BADGE: Record<NodeState, { label: string; className: string }> = {
  known: { label: 'Known', className: 'bg-green-100 text-green-800 border-green-200' },
  edge: { label: 'Next up', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  future: { label: 'Future', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
}

interface ConceptDetailPanelProps {
  concept: ConceptNode | null
  graph: KnowledgeGraph
  onClose: () => void
  onToggleKnown: (nodeId: string) => void
  onNavigateToNode: (nodeId: string) => void
}

export function ConceptDetailPanel({
  concept,
  graph,
  onClose,
  onToggleKnown,
  onNavigateToNode,
}: ConceptDetailPanelProps) {
  const prerequisites = concept ? getPrerequisites(concept.id, graph.nodes, graph.edges) : []
  const unlocked = concept ? getUnlocked(concept.id, graph.nodes, graph.edges) : []

  const badge = concept ? STATE_BADGE[concept.state] : null

  return (
    <Sheet open={concept !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-sm" side="right">
        {concept && badge && (
          <>
            <SheetHeader className="space-y-2 pb-4">
              <div className="flex items-start gap-2">
                <SheetTitle className="flex-1 leading-snug">{concept.label}</SheetTitle>
                <Badge variant="outline" className={`shrink-0 text-xs ${badge.className}`}>
                  {badge.label}
                </Badge>
              </div>
              <SheetDescription className="text-sm leading-relaxed">
                {concept.description}
              </SheetDescription>
            </SheetHeader>

            {/* Toggle button */}
            <div className="mb-6">
              <Button
                className="w-full"
                variant={concept.state === 'known' ? 'outline' : 'default'}
                disabled={concept.state === 'future'}
                onClick={() => onToggleKnown(concept.id)}
              >
                {concept.state === 'known' ? 'Mark as not known' : 'Mark as known'}
              </Button>
              {concept.state === 'future' && (
                <p className="text-muted-foreground mt-1.5 text-center text-xs">
                  Learn prerequisites first to unlock this concept.
                </p>
              )}
            </div>

            {/* Prerequisites */}
            <section className="mb-4">
              <h3 className="mb-2 text-sm font-semibold">
                Prerequisites{' '}
                <span className="text-muted-foreground font-normal">({prerequisites.length})</span>
              </h3>
              {prerequisites.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No prerequisites — this is a foundational concept.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {prerequisites.map((pre) => {
                    const preBadge = STATE_BADGE[pre.state]
                    return (
                      <li key={pre.id}>
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-100"
                          onClick={() => onNavigateToNode(pre.id)}
                        >
                          <span className="flex-1 truncate">{pre.label}</span>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${preBadge.className}`}
                          >
                            {preBadge.label}
                          </Badge>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* Unlocks */}
            <section>
              <h3 className="mb-2 text-sm font-semibold">
                Unlocks{' '}
                <span className="text-muted-foreground font-normal">({unlocked.length})</span>
              </h3>
              {unlocked.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  This is a terminal concept — it doesn&apos;t unlock anything further.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {unlocked.map((dep) => {
                    const depBadge = STATE_BADGE[dep.state]
                    return (
                      <li key={dep.id}>
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-zinc-100"
                          onClick={() => onNavigateToNode(dep.id)}
                        >
                          <span className="flex-1 truncate">{dep.label}</span>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${depBadge.className}`}
                          >
                            {depBadge.label}
                          </Badge>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
