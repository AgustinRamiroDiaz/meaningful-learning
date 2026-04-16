'use client'

import { useCallback, useEffect, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import { isGraphComplete } from '@/lib/graph-engine'
import type { KnowledgeGraph as KnowledgeGraphType } from '@/lib/types'
import { conceptNodeTypes } from './concept-node'
import type { ConceptNodeData } from './concept-node'
import { GraphLegend } from './graph-legend'

// ── Dagre Layout ──────────────────────────────────────────────────────────────

const NODE_WIDTH = 180
const NODE_HEIGHT = 110

function applyDagreLayout(
  rfNodes: Node<ConceptNodeData>[],
  rfEdges: Edge[]
): Node<ConceptNodeData>[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  rfNodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  rfEdges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return rfNodes.map((n) => {
    const pos = g.node(n.id)
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    }
  })
}

// ── Inner Component (has access to ReactFlow context) ─────────────────────────

interface KnowledgeGraphInnerProps {
  graph: KnowledgeGraphType
  selectedNodeId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeStateToggle: (nodeId: string) => void
}

function KnowledgeGraphInner({
  graph,
  selectedNodeId,
  onNodeClick,
  onNodeStateToggle,
}: KnowledgeGraphInnerProps) {
  const { fitView } = useReactFlow()

  const rfEdges: Edge[] = useMemo(
    () =>
      graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: { strokeWidth: 1.5 },
      })),
    [graph.edges]
  )

  const rfNodesRaw: Node<ConceptNodeData>[] = useMemo(
    () =>
      graph.nodes.map((n) => ({
        id: n.id,
        type: 'concept',
        position: { x: 0, y: 0 },
        data: {
          label: n.label,
          description: n.description,
          state: n.state,
          isSelected: n.id === selectedNodeId,
          onToggle: () => onNodeStateToggle(n.id),
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph.nodes, selectedNodeId]
  )

  const layoutedNodes = useMemo(
    () => applyDagreLayout(rfNodesRaw, rfEdges),
    // Only re-layout when graph structure changes (not node states / selection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph.nodes.length, graph.edges.length, graph.generatedAt]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(rfEdges)

  // Sync node data (states, selection) without re-running layout
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => {
        const graphNode = graph.nodes.find((gn) => gn.id === n.id)
        if (!graphNode) return n
        return {
          ...n,
          data: {
            ...n.data,
            state: graphNode.state,
            isSelected: n.id === selectedNodeId,
            onToggle: () => onNodeStateToggle(n.id),
          },
        }
      })
    )
  }, [graph.nodes, selectedNodeId, onNodeStateToggle, setNodes])

  // Re-layout when graph structure changes
  useEffect(() => {
    setNodes(applyDagreLayout(rfNodesRaw, rfEdges))
    setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.nodes.length, graph.edges.length, graph.generatedAt])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.id)
    },
    [onNodeClick]
  )

  const allComplete = isGraphComplete(graph.nodes)

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={conceptNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        className="bg-zinc-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <Controls />
      </ReactFlow>

      {/* Legend at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-white/90 backdrop-blur-sm">
        <GraphLegend />
      </div>

      {/* Completion overlay */}
      {allComplete && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-green-200 bg-green-50/95 px-8 py-6 text-center shadow-lg backdrop-blur-sm">
            <p className="text-2xl">🎓</p>
            <p className="mt-1 text-lg font-semibold text-green-800">Course complete!</p>
            <p className="mt-0.5 text-sm text-green-700">
              You&apos;ve mastered all concepts in this course.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Public Component (wraps with Provider) ────────────────────────────────────

interface KnowledgeGraphProps {
  graph: KnowledgeGraphType
  selectedNodeId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeStateToggle: (nodeId: string) => void
}

export function KnowledgeGraph(props: KnowledgeGraphProps) {
  if (props.graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No concepts in this graph yet.
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner {...props} />
    </ReactFlowProvider>
  )
}
