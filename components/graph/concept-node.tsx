'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { NodeState } from '@/lib/types'

export interface ConceptNodeData extends Record<string, unknown> {
  label: string
  description: string
  state: NodeState
  isSelected: boolean
  onToggle: () => void
}

// React Flow node type that wraps the domain data
export type ConceptFlowNode = Node<ConceptNodeData, 'concept'>

const STATE_STYLES: Record<NodeState, string> = {
  known: 'border-green-500 bg-green-50 shadow-green-100',
  edge: 'border-amber-400 bg-amber-50 shadow-amber-100 ring-2 ring-amber-300',
  future: 'border-zinc-300 bg-zinc-50',
}

const BADGE_STYLES: Record<NodeState, string> = {
  known: 'bg-green-100 text-green-800 border-green-200',
  edge: 'bg-amber-100 text-amber-800 border-amber-200',
  future: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

const STATE_LABELS: Record<NodeState, string> = {
  known: 'Known',
  edge: 'Next up',
  future: 'Future',
}

function ConceptNodeComponent({ data, selected }: NodeProps<ConceptFlowNode>) {
  const { label, state, isSelected, onToggle } = data

  return (
    <div
      className={`rounded-lg border-2 p-3 shadow-sm transition-all duration-200 ${STATE_STYLES[state]} ${selected || isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''} min-w-[140px] max-w-[180px]`}
    >
      <Handle type="target" position={Position.Top} className="!border-zinc-400 !bg-zinc-300" />

      <div className="mb-2 space-y-1">
        <p className="line-clamp-2 text-sm font-semibold leading-tight">{label}</p>
        <Badge variant="outline" className={`text-xs ${BADGE_STYLES[state]}`}>
          {STATE_LABELS[state]}
        </Badge>
      </div>

      <Button
        size="sm"
        variant={state === 'known' ? 'outline' : 'default'}
        className="h-7 w-full text-xs"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        disabled={state === 'future'}
      >
        {state === 'known' ? 'Unmark' : 'Mark as known'}
      </Button>

      <Handle type="source" position={Position.Bottom} className="!border-zinc-400 !bg-zinc-300" />
    </div>
  )
}

export const ConceptNodeMemo = memo(ConceptNodeComponent)

// Cast to satisfy React Flow's NodeTypes generic constraint
export const conceptNodeTypes = {
  concept: ConceptNodeMemo,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React Flow requires base Node type
} as any
