# Research: AI-Powered Learning Knowledge Graph

**Feature**: 001-ai-learning-knowledge-graph
**Date**: 2026-04-16

---

## 1. Graph Visualisation Library

**Decision**: `@xyflow/react` v12 (React Flow) + `@dagrejs/dagre`

**Rationale**:
- React Flow v12 is purpose-built for interactive node graphs in React. It ships
  full TypeScript types, first-class React 19 support (v12.10.2, March 2026), and
  works as a plain Client Component with `'use client'`. Bundle is ~45KB minified.
- `@dagrejs/dagre` provides automatic DAG layout (Sugiyama-style hierarchical
  layout) that computes x/y positions for nodes given edges. It is the officially
  recommended pairing in the React Flow docs.
- Together they give: zoom/pan, click handlers, animated edges, custom node
  rendering, and auto-layout — all required by the spec.

**Alternatives considered**:
- **D3.js / d3-dag** (~30KB): Smaller but requires hand-rolling React integration
  for interactivity (drag, zoom, click). Significantly higher implementation cost
  for the same result.
- **Cytoscape.js** (~650KB): Best for 1000+ node graphs, overkill for 5–50 nodes.
  Harder to integrate with React.
- **vis-network**: Less actively maintained; React integration requires wrappers.
- **dagre-d3**: Unmaintained (last update 2019) — rejected.
- **Sigma.js / @react-sigma**: Force-directed layouts, not designed for DAGs.
- **elkjs** (~500KB): Superior layout quality but very heavy; not justified for
  5–50 nodes.

---

## 2. AI Integration

**Decision**: `openai` npm package (OpenAI-compatible client) with configurable
base URL — defaults to local Ollama (`http://localhost:11434/v1`)

**Rationale**:
- The `openai` npm package supports any OpenAI-compatible API by accepting a
  custom `baseURL`. This covers Ollama (local, no API key needed), OpenAI,
  OpenRouter, LM Studio, and any other compatible endpoint with a single
  dependency.
- Ollama is the primary target for development: it runs entirely locally with no
  API key, no usage costs, and no CORS restrictions (Ollama's default config
  allows browser requests from localhost).
- For non-local endpoints (e.g. OpenAI, OpenRouter), the user provides an API
  key via the settings page; it is stored in localStorage. This is a PoC
  trade-off — a backend proxy would hold keys in production.
- The "researches topic online" requirement is handled via the model's training
  knowledge + structured prompt engineering (see AI contract). Live web search
  via tool use is a v2 feature.
- The AI is prompted to return a JSON object with `nodes` (concepts) and `edges`
  (dependencies) using `response_format: { type: "json_object" }` for
  guaranteed parseable responses.

**Settings stored in localStorage**:
- `ml_ai_base_url` — e.g. `http://localhost:11434/v1` (default) or
  `https://api.openai.com/v1`
- `ml_ai_model` — e.g. `llama3.2`, `gpt-4o`, `mistral` (user-configurable)
- `ml_api_key` — optional; empty string for local Ollama

**Alternatives considered**:
- **`@anthropic-ai/sdk`**: Anthropic-only; switching to OpenAI-compatible gives
  broader model support (local + cloud) without adding a second SDK.
- **Vercel AI SDK (useChat)**: Adds a streaming abstraction but requires a Route
  Handler API endpoint (backend), contradicting the client-side-only constraint.
- **LangChain.js**: Adds unnecessary complexity for a single structured-output
  call.

---

## 3. UI Component Library

**Decision**: ShadcnUI (user-specified)

**Rationale**:
- ShadcnUI generates components directly into the codebase (no runtime library
  overhead). Components use Tailwind CSS v4 tokens — fully compliant with
  Constitution Principle II (UX Consistency).
- Pre-built accessible components (Dialog, Sheet, Button, Input, Badge, Card)
  cover all required UI patterns without custom implementation.
- Tailwind v4 is already installed.

**Components needed**:
- `Button`, `Card` — course list and actions
- `Dialog` — new course creation modal
- `Sheet` — slide-over concept detail panel
- `Input` — course name input + topic prompt
- `Badge` — node state label (Known / Edge / Future)

---

## 4. State Persistence

**Decision**: `localStorage` with JSON serialisation

**Rationale**:
- The spec requires client-side persistence with no backend. localStorage is
  universally available, synchronous (simple to wrap), and sufficient for graphs
  of 5–50 nodes per course.
- Storage structure: one key per course (`ml_course_<id>`) containing the full
  `Course` object (graph + node states). A separate `ml_course_index` key holds
  the ordered list of course IDs.

**Alternatives considered**:
- **IndexedDB**: More capable for large datasets but adds async complexity for
  the PoC. Can be migrated to in v2 if storage limits become an issue.
- **sessionStorage**: Does not persist across browser close — rejected (spec
  requires persistence).
- **Zustand + persist middleware**: Would abstract storage nicely but adds a
  dependency. Deferred to v2.

---

## 5. Pre-commit Quality Tooling (Constitution Principle IV)

**Decision**: `husky` v9 + `lint-staged` v15 + `prettier` v3

**Rationale**:
- Constitution mandates automated pre-commit hooks. `husky` v9 uses a lean
  `.husky/` directory model (no `prepare` script required in newer versions,
  uses `husky init`).
- `lint-staged` runs ESLint + Prettier only on staged files for fast feedback.
- `prettier` for formatting; config at `.prettierrc`.

**Pre-commit hook** (`.husky/pre-commit`):
```sh
npx lint-staged
```

**Pre-push hook** (`.husky/pre-push`):
```sh
npm run build
```

**`lint-staged` config** (in `package.json`):
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,json,md}": ["prettier --write"]
}
```

---

## 6. Next.js 16 Breaking Change: Dynamic Route Params as Promise

**Decision**: Always `await params` in dynamic route page components

**Rationale**: In Next.js 16, dynamic route `params` prop is typed as
`Promise<{ id: string }>` and MUST be awaited. Pages that destructure `params`
synchronously will fail.

```tsx
// app/course/[id]/page.tsx — CORRECT
export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}
```

This applies to all dynamic route pages in this feature.

---

## 7. Dependency Justification Summary (Constitution Principle V)

| Package | Type | Justification | Maintained? | License |
|---------|------|---------------|-------------|---------|
| `@xyflow/react` | prod | Interactive DAG graph — no native alternative | ✅ Active | MIT |
| `@dagrejs/dagre` | prod | DAG auto-layout algorithm for React Flow | ✅ Active | MIT |
| `openai` | prod | OpenAI-compatible client — supports Ollama, OpenAI, OpenRouter, LM Studio | ✅ Active | MIT |
| `husky` | dev | Git hook lifecycle (constitution mandate) | ✅ Active | MIT |
| `lint-staged` | dev | Staged-file linting (constitution mandate) | ✅ Active | MIT |
| `prettier` | dev | Code formatting (constitution mandate) | ✅ Active | MIT |

ShadcnUI is a CLI code generator, not a runtime dependency — no entry in
`package.json` beyond the already-present `tailwindcss`.
