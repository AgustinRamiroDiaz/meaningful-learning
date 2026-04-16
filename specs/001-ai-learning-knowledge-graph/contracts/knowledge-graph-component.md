# Contract: KnowledgeGraph Component

**File**: `components/graph/knowledge-graph.tsx`
**Type**: React Client Component (`'use client'`)

---

## Props

```typescript
interface KnowledgeGraphProps {
  graph: KnowledgeGraph
  onNodeClick: (nodeId: string) => void
  onNodeStateToggle: (nodeId: string) => void
  selectedNodeId?: string | null
}
```

| Prop | Required | Description |
|------|----------|-------------|
| `graph` | ✅ | Full KnowledgeGraph with node states pre-computed |
| `onNodeClick` | ✅ | Called when a node is clicked; receives node ID |
| `onNodeStateToggle` | ✅ | Called when user toggles a node's known/unknown state |
| `selectedNodeId` | optional | If set, that node is visually highlighted as selected |

---

## Behaviour Contract

1. **Layout**: On mount and whenever `graph.nodes` or `graph.edges` change, the
   component re-runs the dagre layout algorithm and updates node positions.
2. **Node colours**: Each node's `state` determines its visual style:
   - `'known'` → green fill (`bg-green-500` token)
   - `'edge'` → amber/gold fill with glow (`bg-amber-400` + ring)
   - `'future'` → muted grey fill (`bg-zinc-300`)
3. **Interactivity**: Zoom, pan, and node drag are enabled. Clicking a node fires
   `onNodeClick`. A "mark known / unknown" button inside the custom node fires
   `onNodeStateToggle`.
4. **Animation**: Node state colour transitions use a 200ms CSS transition.
5. **Empty state**: If `graph.nodes.length === 0`, renders a centred empty-state
   message: "No concepts yet — enter a prompt above."
6. **Re-layout triggers**: Layout runs on initial render only. Node positional
   changes from drag are preserved until the graph prop changes structurally
   (different nodes/edges).

---

## Sub-components

### ConceptNode (`components/graph/concept-node.tsx`)

Custom React Flow node. Renders:
- Concept label (bold, truncated at 2 lines)
- State badge (`Known` / `Edge` / `Future`)
- "Mark as known" / "Unmark" button (triggers `onNodeStateToggle` via React Flow
  node data callback)

Props passed via React Flow `data` field:
```typescript
interface ConceptNodeData {
  label: string
  state: NodeState
  onToggle: () => void
  isSelected: boolean
}
```
