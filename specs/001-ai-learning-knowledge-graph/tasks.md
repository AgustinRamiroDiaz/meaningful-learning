---
description: 'Task list for AI-Powered Learning Knowledge Graph PoC'
---

# Tasks: AI-Powered Learning Knowledge Graph

**Input**: Design documents from `/specs/001-ai-learning-knowledge-graph/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: No dedicated test framework for this PoC. Quality gates are TypeScript
type-check (`tsc --noEmit`) and ESLint, enforced via husky pre-commit hooks.

**Organization**: Tasks grouped by user story enabling independent implementation
and delivery of each story as a working increment.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US4)

---

## Phase 1: Setup

**Purpose**: Install dependencies, configure quality gates, initialize ShadcnUI,
update root layout. This phase must be fully complete before any feature work.

- [x] T001 Install new npm dependencies: `npm install @xyflow/react @dagrejs/dagre openai` and `npm install -D husky lint-staged prettier`
- [x] T002 Initialize ShadcnUI and add required components: `npx shadcn@latest init` then `npx shadcn@latest add button card dialog input badge sheet` — generates into `components/ui/`
- [x] T003 [P] Initialize husky and create pre-commit hook — create `.husky/pre-commit` running `npx lint-staged`
- [x] T004 [P] Create husky pre-push hook — create `.husky/pre-push` running `npm run build`
- [x] T005 [P] Add lint-staged config to `package.json`: `{ "*.{ts,tsx}": ["eslint --fix", "prettier --write"], "*.{css,json,md}": ["prettier --write"] }`
- [x] T006 [P] Create `.prettierrc` at repo root: `{ "semi": false, "singleQuote": true, "trailingComma": "es5", "printWidth": 100 }`
- [x] T007 [P] Update `app/layout.tsx`: set title to "Meaningful Learning", description to "Learn any topic with AI-powered knowledge graphs", remove placeholder content from body

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript types, storage layer, and DAG state engine — shared
infrastructure required by every user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create `lib/types.ts` with all interfaces from data-model.md: `NodeState`, `ConceptNode`, `DependencyEdge`, `KnowledgeGraph`, `Course`, `CourseSummary`, `AIGraphResponse`, `AIConfig`, and `AIClientError` class
- [x] T009 [P] Create `lib/storage.ts` implementing the full storage contract: `getCourseIndex`, `saveCourseIndex`, `getCourse`, `saveCourse`, `deleteCourse`, `getAIConfig`, `saveAIConfig` — all reading/writing localStorage with error handling per contracts/storage.md
- [x] T010 [P] Create `lib/graph-engine.ts` with two exports: `computeNodeStates(nodes, edges, knownIds)` → `ConceptNode[]` applying the known/edge/future state machine from data-model.md; `buildKnowledgeGraph(response, prompt)` → `KnowledgeGraph` converting `AIGraphResponse` + assigning edge IDs + computing initial states

**Checkpoint**: Foundation ready — all user story phases can now begin.

---

## Phase 3: User Story 1 — Create a Learning Course (Priority: P1) 🎯 MVP

**Goal**: User can create named courses, see them listed on the home page, navigate
into a blank workspace, and have everything persist across browser sessions.

**Independent Test**: Open app → "New Course" → enter name → course appears in
list → click it → blank workspace opens → reload page → course still present.

- [x] T011 [US1] Create `hooks/use-courses.ts`: `useCourses()` hook returning `{ courses: CourseSummary[], createCourse(name), deleteCourse(id) }`, reading from and writing to storage.ts, using `useState` + `useEffect` for localStorage sync
- [x] T012 [P] [US1] Create `components/courses/course-card.tsx`: ShadcnUI Card showing course name, creation date, node count ("No graph yet" if 0), known/total progress — accepts `course: CourseSummary` and `onClick` prop
- [x] T013 [P] [US1] Create `components/courses/new-course-dialog.tsx`: ShadcnUI Dialog with Input (course name, 1–100 chars) and Create button — accepts `onCreateCourse(name: string)` prop, validates non-empty input
- [x] T014 [US1] Create `components/courses/course-list.tsx`: responsive grid of `CourseCard` components; empty state ("No courses yet — create your first one"); `NewCourseDialog` trigger button — uses `useCourses` hook
- [x] T015 [US1] Replace `app/page.tsx` with client component home page: `'use client'` directive, imports and renders `CourseList`, sets page heading "My Courses"
- [x] T016 [US1] Create `app/course/[id]/page.tsx`: client component course workspace shell — `await params` (Next.js 16 pattern), loads course via `getCourse(id)` from storage, shows course name in header with back-to-home link; renders "No graph yet — enter a prompt below" placeholder when `course.graph` is null; shows 404-style message if course not found

**Checkpoint**: User Story 1 fully functional — create, list, navigate, persist courses.

---

## Phase 4: User Story 2 — Generate a Knowledge Graph from a Prompt (Priority: P1)

**Goal**: User enters a topic prompt inside a course; AI generates and displays a
DAG knowledge graph with labelled concept nodes and dependency edges.

**Independent Test**: Open a course → type "I want to learn machine learning" →
click Generate → within 30s a DAG appears with labelled nodes and directed edges.

- [x] T017 [P] [US2] Create `app/settings/page.tsx`: AI settings form (ShadcnUI Card + Input fields for base URL, model, API key) — reads via `getAIConfig()`, saves via `saveAIConfig()`, shows defaults (`http://localhost:11434/v1`, `llama3.2`), links back to home
- [x] T018 [P] [US2] Create `lib/ai-client.ts`: `generateKnowledgeGraph(topic, config)` using `openai` SDK with `dangerouslyAllowBrowser: true`, `response_format: { type: 'json_object' }`, prompt from contracts/ai-client.md, post-processing validation (removes orphan edges, deduplicates nodes), throws `AIClientError` with typed `code` for auth/rate/network/parse/empty-graph errors
- [x] T019 [US2] Create `components/prompt-input.tsx`: ShadcnUI Input + Button form for topic entry; accepts `onSubmit(topic: string)` and `isLoading: boolean` props; disables input and shows spinner during generation; validates non-empty input
- [x] T020 [P] [US2] Create `components/ai-config-banner.tsx`: dismissible warning Banner (ShadcnUI Card with amber styling) shown when AI config is at default Ollama URL — prompts user to verify Ollama is running or go to settings
- [x] T021 [US2] Update `app/course/[id]/page.tsx` (replacing shell from T016): add `PromptInput` component, wire `handleGenerate` calling `getAIConfig()` + `generateKnowledgeGraph()` + `buildKnowledgeGraph()` + `saveCourse()`; show `AiConfigBanner` if config is default; add loading overlay during generation; add error toast/banner on `AIClientError` with retry option; persist generated graph to course in storage

**Checkpoint**: User Story 2 fully functional — prompt generates and displays a DAG.

---

## Phase 5: User Story 3 — Explore Knowledge State on the Graph (Priority: P2)

**Goal**: Graph nodes are visually differentiated as known (green), edge of knowledge
(amber), or future (grey). Toggling a node as known instantly re-evaluates and
updates all dependent nodes.

**Independent Test**: Mark a root node known → its direct dependents with all
prerequisites now met turn amber (edge) → mark one of those known → further
dependents update → all changes happen in <300ms without page reload.

- [x] T022 [US3] Create `hooks/use-graph.ts`: `useGraph(initialCourse)` hook — manages `course` state with `graph` and node states; exports `toggleNodeKnown(nodeId)` which calls `computeNodeStates()` from graph-engine, updates course state, and persists via `saveCourse()`; updates within a single synchronous state transition
- [x] T023 [P] [US3] Create `components/graph/concept-node.tsx`: custom React Flow node component (`NodeProps<ConceptNodeData>`) — renders concept label (2-line truncation), ShadcnUI `Badge` for state (green/Known, amber/Edge, grey/Future), "Mark as known" / "Unmark" button calling `data.onToggle()`; exports `conceptNodeTypes` record for React Flow
- [x] T024 [P] [US3] Create `components/graph/graph-legend.tsx`: horizontal row of three coloured pill labels (Known=green, Edge of Knowledge=amber, Future=grey) — purely presentational, renders below the graph canvas
- [x] T025 [US3] Create `components/graph/knowledge-graph.tsx`: React Flow canvas — imports `ReactFlow`, `Background`, `Controls` from `@xyflow/react`; runs dagre layout on `graph.nodes`/`graph.edges` on mount and graph prop change (`rankdir: 'TB'`); maps `ConceptNode[]` → `Node<ConceptNodeData>[]` passing `onToggle` via node data; uses `conceptNodeTypes`; wires `onNodeClick` and `onNodesChange`; renders `GraphLegend` below canvas; handles empty graph state
- [x] T026 [US3] Wire `KnowledgeGraph` into `app/course/[id]/page.tsx`: replace DAG placeholder with `<KnowledgeGraph graph={course.graph} ... />` connected to `useGraph` hook; pass `onNodeClick` (opens detail panel, implemented in US4) and `onNodeStateToggle` → `toggleNodeKnown`

**Checkpoint**: User Story 3 fully functional — tripartite visual state, instant
re-evaluation on toggle, persists across sessions.

---

## Phase 6: User Story 4 — Inspect and Navigate Individual Concepts (Priority: P3)

**Goal**: Clicking a node opens a slide-over detail panel showing the concept's
description, prerequisites (with state indicators), unlocked concepts, and a
toggle button. Clicking a linked concept highlights it on the graph.

**Independent Test**: Click any node → detail panel opens with concept name,
description, and linked nodes → click "Mark as known" in panel → graph updates →
click a prerequisite link in panel → graph highlights that node.

- [x] T027 [US4] Create `components/concept-detail-panel.tsx`: ShadcnUI `Sheet` slide-over — accepts `concept: ConceptNode | null`, `graph: KnowledgeGraph`, `onClose()`, `onToggleKnown(nodeId)`, `onNavigateToNode(nodeId)` props; renders concept name + description, prerequisites section (list of ConceptNode names with state badges, each clickable), "Unlocks" section (list of concepts this node enables), "Mark as Known" / "Unmark" button; shows nothing / Sheet closed when `concept` is null
- [x] T028 [US4] Wire `ConceptDetailPanel` into `app/course/[id]/page.tsx`: add `selectedNodeId` state; pass `onNodeClick` to `KnowledgeGraph` → sets `selectedNodeId`; render `ConceptDetailPanel` with derived `selectedConcept`; wire `onToggleKnown` → `toggleNodeKnown`; wire `onNavigateToNode` → updates `selectedNodeId` + uses React Flow `useReactFlow().fitView({ nodes: [nodeId] })` to pan/zoom to that node

**Checkpoint**: All four user stories independently functional and composable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Loading states, error boundaries, edge-case UX, final quality gate run.

- [x] T029 [P] Add `app/course/[id]/loading.tsx`: skeleton loading UI matching course workspace layout (header skeleton + graph canvas placeholder)
- [x] T030 [P] Add all-known congratulatory state in `components/graph/knowledge-graph.tsx`: when every node has `state === 'known'`, overlay a subtle congratulatory message ("You've mastered all concepts in this course! 🎓") inside the canvas
- [x] T031 [P] Add `app/course/[id]/error.tsx`: Next.js error boundary component showing friendly error message with "Try reloading" button
- [x] T032 [P] Add settings link in `app/page.tsx` header (gear icon using a Lucide icon or ShadcnUI iconButton) linking to `/settings`
- [x] T033 [P] Update `app/globals.css`: remove default Next.js placeholder CSS; import `@xyflow/react/dist/style.css`; add any ShadcnUI token overrides needed for React Flow node styling
- [x] T034 Run final quality gate pass: `npx tsc --noEmit` → fix all type errors; `npm run lint` → fix all lint errors; `npm run build` → fix all build errors; verify pre-commit and pre-push hooks fire correctly with a test commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 complete (types depend on deps installed)
- **Phase 3 (US1)**: Depends on Phase 2 complete (uses types + storage)
- **Phase 4 (US2)**: Depends on Phase 2 complete (uses types + storage + graph-engine)
- **Phase 5 (US3)**: Depends on Phase 2 + Phase 4 complete (graph exists after US2)
- **Phase 6 (US4)**: Depends on Phase 5 complete (panel needs graph + toggle from US3)
- **Phase 7 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on other stories
- **US2 (P1)**: Can start after Phase 2 — no dependency on US1 (app/course/[id]/page.tsx updated independently)
- **US3 (P2)**: Depends on US2 (needs a graph to exist before graph rendering is useful)
- **US4 (P3)**: Depends on US3 (detail panel builds on graph interactivity)

### Within Each Phase

- All [P] tasks within a phase can run in parallel
- Sequential tasks within a phase run in listed order
- T001 → T002 (ShadcnUI init requires deps); T008 → T009, T010 (storage/engine import from types.ts)

---

## Parallel Examples

### Phase 1 Parallel (after T001 + T002 complete)

```
Task T003: create .husky/pre-commit
Task T004: create .husky/pre-push
Task T005: add lint-staged to package.json
Task T006: create .prettierrc
Task T007: update app/layout.tsx
```

### Phase 3 (US1) Parallel Opportunities

```
# After T011 (hook):
Task T012: components/courses/course-card.tsx
Task T013: components/courses/new-course-dialog.tsx
# Then T014 → T015 → T016 (sequential)
```

### Phase 4 (US2) Parallel Opportunities

```
# Start in parallel:
Task T017: app/settings/page.tsx
Task T018: lib/ai-client.ts
Task T019: components/prompt-input.tsx
Task T020: components/ai-config-banner.tsx
# Then T021: wire everything into app/course/[id]/page.tsx
```

### Phase 5 (US3) Parallel Opportunities

```
# After T022 (hook):
Task T023: components/graph/concept-node.tsx
Task T024: components/graph/graph-legend.tsx
# Then T025 → T026 (sequential: canvas → wire)
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — Create courses
4. **VALIDATE**: Create a course, see it listed, navigate to workspace, reload — data persists
5. Complete Phase 4: US2 — Generate graphs
6. **VALIDATE**: Enter a prompt, receive a DAG with nodes/edges, see raw React Flow render

This MVP demonstrates the full data pipeline (AI → graph → storage → UI) without
the interactive state layer.

### Incremental Delivery

1. Setup + Foundational → infrastructure ready
2. - US1 → named course lifecycle works
3. - US2 → AI graph generation visible
4. - US3 → Meaningful Learning state model live 🎯 (core differentiator)
5. - US4 → Full detail/navigation experience
6. - Polish → production-ready PoC

### Parallel Team Strategy

With two developers after Phase 2 completes:

- **Dev A**: US1 (T011–T016) → US3 (T022–T026)
- **Dev B**: US2 (T017–T021) → US4 (T027–T028)
  Stories integrate at the `app/course/[id]/page.tsx` file — Dev A owns the file
  structure; Dev B's wiring tasks (T021, T028) build on Dev A's shell.

---

## Notes

- All interactive components MUST have `'use client'` directive
- `app/course/[id]/page.tsx` — params must be `await`ed (`Promise<{ id: string }>`, Next.js 16 breaking change)
- React Flow requires CSS import (`@xyflow/react/dist/style.css`) — add in T033
- `openai` SDK requires `dangerouslyAllowBrowser: true` for browser-direct calls (user-owned key, PoC)
- No `any` types permitted (TypeScript strict mode); use `unknown` + type guards where AI response shape is uncertain
- Commit after completing each phase checkpoint
