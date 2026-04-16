// ── Node States ──────────────────────────────────────────────────────────────

export type NodeState = 'known' | 'edge' | 'future'

// ── Graph Entities ────────────────────────────────────────────────────────────

export interface ConceptNode {
  id: string
  label: string
  description: string
  state: NodeState
}

export interface DependencyEdge {
  id: string
  source: string
  target: string
}

export interface KnowledgeGraph {
  nodes: ConceptNode[]
  edges: DependencyEdge[]
  generatedAt: string
  prompt: string
}

// ── Course ────────────────────────────────────────────────────────────────────

export interface Course {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  graph: KnowledgeGraph | null
}

export interface CourseSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  nodeCount: number
  knownCount: number
}

// ── AI Client ─────────────────────────────────────────────────────────────────

export interface AIConfig {
  baseUrl: string
  model: string
  apiKey?: string
}

export interface AIGraphResponse {
  nodes: Array<{
    id: string
    label: string
    description: string
  }>
  edges: Array<{
    source: string
    target: string
  }>
}

export type AIClientErrorCode =
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'EMPTY_GRAPH'

export class AIClientError extends Error {
  code: AIClientErrorCode

  constructor(message: string, code: AIClientErrorCode) {
    super(message)
    this.name = 'AIClientError'
    this.code = code
  }
}
