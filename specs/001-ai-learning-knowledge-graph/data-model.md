# Data Model: AI-Powered Learning Knowledge Graph

**Feature**: 001-ai-learning-knowledge-graph
**Date**: 2026-04-16

All types live in `lib/types.ts`.

---

## Core Types

### NodeState

The three mutually-exclusive states a concept node can be in:

```typescript
type NodeState = 'known' | 'edge' | 'future'
```

| Value | Meaning | Condition |
|-------|---------|-----------|
| `'known'` | User has marked this concept as learned | User explicitly toggled it |
| `'edge'` | All prerequisites met, not yet learned | All parent nodes are `'known'`; this node is not |
| `'future'` | Prerequisites not fully met yet | One or more parent nodes are not `'known'` |

---

### ConceptNode

A single learnable concept within a knowledge graph:

```typescript
interface ConceptNode {
  id: string              // UUID — stable identifier
  label: string           // Human-readable concept name (e.g., "Linear Algebra")
  description: string     // AI-generated 1-3 sentence explanation
  state: NodeState        // Computed by graph-engine.ts; persisted per course
}
```

- `id` is assigned by the AI response and treated as stable after generation.
- `state` is **computed** from the graph structure + which nodes the user has
  marked `known`, but is also **persisted** to localStorage for instant load.
  On load, the engine re-validates the persisted state.

---

### DependencyEdge

A directed prerequisite relationship between two concepts:

```typescript
interface DependencyEdge {
  id: string    // UUID — e.g., `${source}->${target}`
  source: string  // ConceptNode.id of the prerequisite concept
  target: string  // ConceptNode.id of the dependent concept
}
```

Direction: `source → target` means "you must know `source` before learning `target`".

---

### KnowledgeGraph

The complete DAG for a course:

```typescript
interface KnowledgeGraph {
  nodes: ConceptNode[]
  edges: DependencyEdge[]
  generatedAt: string  // ISO 8601 timestamp of AI generation
  prompt: string       // The original user prompt that generated this graph
}
```

---

### Course

Top-level container for user's learning journey:

```typescript
interface Course {
  id: string            // UUID — used as route param and localStorage key
  name: string          // User-provided course name (1-100 chars)
  createdAt: string     // ISO 8601
  updatedAt: string     // ISO 8601 — updated on any graph or node state change
  graph: KnowledgeGraph | null  // null until first AI generation
}
```

---

### CourseSummary

Lightweight version stored in the course index (avoids loading full graphs
for the course list view):

```typescript
interface CourseSummary {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  nodeCount: number    // 0 if no graph generated yet
  knownCount: number   // Number of nodes with state 'known'
}
```

---

### AIGraphResponse

The expected JSON shape returned by the AI (validated before use):

```typescript
interface AIGraphResponse {
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
```

- The AI does not assign `state` — that is always computed by `graph-engine.ts`.
- Edge `id` values are auto-generated as `${source}->${target}` after validation.

---

## State Machine: NodeState Transitions

```
                   User marks known
  future ────────────────────────────────────> known
    ↑                                            │
    │ prerequisite               User un-marks   │
    │ not met                    (mark not known) │
    │                                            ▼
  edge <──────────────────────────────────── edge
         all prerequisites met
```

**Formal rules** (implemented in `lib/graph-engine.ts`):

1. A node is `'known'` if and only if the user has explicitly marked it as known
   AND that state has not been reverted.
2. A node is `'edge'` if and only if:
   - It is NOT `'known'`, AND
   - Every node in its direct prerequisite set (`source` nodes of incoming edges)
     is `'known'` (recursively: if a node has no prerequisites, it is always
     eligible for `'edge'`).
3. A node is `'future'` if and only if it is NOT `'known'` AND NOT `'edge'`.

**Initial state on graph generation**: All root nodes (no incoming edges) start
as `'edge'`. All other nodes start as `'future'`.

---

## localStorage Schema

```
ml_course_index          → string[]          (ordered array of course IDs)
ml_course_<id>           → Course (JSON)     (full course object incl. graph)
ml_ai_base_url           → string            (OpenAI-compatible endpoint; default: http://localhost:11434/v1)
ml_ai_model              → string            (model identifier; default: llama3.2)
ml_api_key               → string            (optional API key; empty for local Ollama)
```

- All values are JSON-stringified.
- Maximum localStorage usage estimate: 50 courses × ~50 nodes × ~500 bytes/node
  ≈ 1.25MB — well within the 5MB browser limit.
