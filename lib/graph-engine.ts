import type {
  AIGraphResponse,
  ConceptNode,
  DependencyEdge,
  KnowledgeGraph,
  NodeState,
} from './types'

// ── State Computation ─────────────────────────────────────────────────────────

/**
 * Given the graph structure and the set of known node IDs, compute the NodeState
 * for every node.
 *
 * Rules:
 *   known  — nodeId is in knownIds
 *   edge   — not known AND every direct prerequisite (incoming edge source) is known
 *   future — not known AND at least one prerequisite is not known
 *
 * Root nodes (no incoming edges) are always 'edge' until marked known.
 */
export function computeNodeStates(
  nodes: ConceptNode[],
  edges: DependencyEdge[],
  knownIds: Set<string>
): ConceptNode[] {
  // Build prerequisite map: nodeId → Set of prerequisite node IDs
  const prerequisites = new Map<string, Set<string>>()
  for (const node of nodes) {
    prerequisites.set(node.id, new Set())
  }
  for (const edge of edges) {
    prerequisites.get(edge.target)?.add(edge.source)
  }

  return nodes.map((node) => {
    let state: NodeState
    if (knownIds.has(node.id)) {
      state = 'known'
    } else {
      const prereqs = prerequisites.get(node.id) ?? new Set()
      const allPrereqsKnown = [...prereqs].every((prereqId) => knownIds.has(prereqId))
      state = allPrereqsKnown ? 'edge' : 'future'
    }
    return { ...node, state }
  })
}

// ── AI Response → KnowledgeGraph ──────────────────────────────────────────────

/**
 * Convert a validated AIGraphResponse into a full KnowledgeGraph with
 * assigned edge IDs and computed initial node states.
 *
 * On initial generation, no nodes are known, so all root nodes start as 'edge'
 * and all others as 'future'.
 */
export function buildKnowledgeGraph(response: AIGraphResponse, prompt: string): KnowledgeGraph {
  const edges: DependencyEdge[] = response.edges.map((e) => ({
    id: `${e.source}->${e.target}`,
    source: e.source,
    target: e.target,
  }))

  const rawNodes: ConceptNode[] = response.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    description: n.description,
    state: 'future' as NodeState,
  }))

  const nodes = computeNodeStates(rawNodes, edges, new Set())

  return {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
    prompt,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a Set of all nodeIds that are currently marked 'known'. */
export function getKnownIds(nodes: ConceptNode[]): Set<string> {
  return new Set(nodes.filter((n) => n.state === 'known').map((n) => n.id))
}

/** Returns true when every node in the graph is in the 'known' state. */
export function isGraphComplete(nodes: ConceptNode[]): boolean {
  return nodes.length > 0 && nodes.every((n) => n.state === 'known')
}

/**
 * Returns the direct prerequisite ConceptNodes for a given node ID.
 */
export function getPrerequisites(
  nodeId: string,
  nodes: ConceptNode[],
  edges: DependencyEdge[]
): ConceptNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => nodeMap.get(e.source))
    .filter((n): n is ConceptNode => n !== undefined)
}

/**
 * Returns the ConceptNodes that the given node directly unlocks (its dependents).
 */
export function getUnlocked(
  nodeId: string,
  nodes: ConceptNode[],
  edges: DependencyEdge[]
): ConceptNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  return edges
    .filter((e) => e.source === nodeId)
    .map((e) => nodeMap.get(e.target))
    .filter((n): n is ConceptNode => n !== undefined)
}
