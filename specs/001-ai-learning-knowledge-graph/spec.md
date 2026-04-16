# Feature Specification: AI-Powered Learning Knowledge Graph

**Feature Branch**: `001-ai-learning-knowledge-graph`
**Created**: 2026-04-16
**Status**: Draft
**Input**: User description: "Build a client side only application for users to learn any topic with AI-generated knowledge graphs using meaningful learning approach"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Learning Course (Priority: P1)

A user opens the app for the first time and creates a new blank "Learning Course"
to begin exploring a topic. The course acts as a container for the knowledge graph
that will be built over time.

**Why this priority**: This is the entry point to the entire application. Without
it, no other story is reachable. It delivers the minimum scaffold needed to start
learning.

**Independent Test**: Can be fully tested by opening the app, clicking "New Course",
entering a course name, and confirming a blank course workspace appears — delivers
a named, persistent course the user can return to.

**Acceptance Scenarios**:

1. **Given** the app is open with no existing courses, **When** the user clicks
   "New Course" and enters a name, **Then** a new blank course is created, named
   correctly, and listed on the home screen.
2. **Given** one or more existing courses, **When** the user creates another course,
   **Then** both courses appear in the course list independently.
3. **Given** a course was created and the user closes and reopens the app,
   **When** the app loads, **Then** the previously created course is still present
   (persisted locally).

---

### User Story 2 - Generate a Knowledge Graph from a Prompt (Priority: P1)

Inside a course, the user types a topic or question (e.g., "I want to learn quantum
computing"). The AI researches the topic online and generates a Knowledge Graph —
a Directed Acyclic Graph (DAG) where each node is a concept and each directed edge
represents a prerequisite dependency. The graph reflects a Meaningful Learning
approach: concepts are structured so learners can connect new knowledge to
existing knowledge.

**Why this priority**: This is the core value proposition of the application.
Without it, the app is just an empty shell.

**Independent Test**: Can be fully tested by entering a prompt within a course,
waiting for the AI to respond, and confirming a populated DAG appears with labelled
nodes and directed edges.

**Acceptance Scenarios**:

1. **Given** an open course, **When** the user submits a topic prompt, **Then** the
   AI generates and displays a knowledge graph with at least 5 concept nodes and
   meaningful dependency edges within 30 seconds.
2. **Given** a topic prompt is submitted, **When** the graph is generated, **Then**
   each node has a human-readable concept name and a short description.
3. **Given** a generated graph, **When** the user inspects edges, **Then** each
   directed edge points from a prerequisite concept to a dependent concept
   (dependency direction is explicit and correct).
4. **Given** the AI encounters an ambiguous topic, **When** the graph is generated,
   **Then** a sensible set of concepts is still returned; the user is not shown a
   blank or broken state.

---

### User Story 3 - Explore Knowledge State on the Graph (Priority: P2)

The user can see their current knowledge visually differentiated on the graph:
- **Known** nodes: concepts the user has marked as learned.
- **Edge of knowledge** nodes: concepts where all prerequisites are met (known)
  but the concept itself has not yet been learned — the ideal next-step candidates.
- **Future** nodes: concepts whose prerequisites are not yet fully met.

This tripartite view enables the user to always know where they are and what to
study next.

**Why this priority**: This is the Meaningful Learning differentiator. It transforms
a static concept map into a dynamic, personalised learning path.

**Independent Test**: Can be fully tested by marking a subset of foundational nodes
as "known" and confirming that dependent nodes correctly transition to "edge of
knowledge" status, while deeper nodes remain "future".

**Acceptance Scenarios**:

1. **Given** a generated graph, **When** the user marks a concept as "known",
   **Then** that node is visually updated and any dependent concepts whose
   prerequisites are now all met transition to "edge of knowledge" status
   automatically.
2. **Given** nodes in "edge of knowledge" state, **When** the user views the graph,
   **Then** those nodes are visually distinct from both "known" and "future" nodes
   (e.g., different colour, glow, or icon).
3. **Given** no concepts have been marked known, **When** the user first views the
   graph, **Then** all root nodes (concepts with no prerequisites) are shown as
   "edge of knowledge" automatically.
4. **Given** a concept in "edge of knowledge" state, **When** the user marks it as
   "known", **Then** the graph immediately re-evaluates and updates all affected
   nodes without a page reload.

---

### User Story 4 - Inspect and Navigate Individual Concepts (Priority: P3)

The user can click on any concept node to open a detail view with:
- The concept name and AI-generated description.
- A list of prerequisite concepts (with their current knowledge state).
- A list of concepts this node unlocks.
- A "Mark as known" / "Mark as not known" toggle.

**Why this priority**: Enriches the learning experience and makes the graph
actionable, but the graph is still valuable without deep-dive detail.

**Independent Test**: Can be fully tested by clicking any node on the graph and
confirming the detail panel opens with correct metadata and functional toggle.

**Acceptance Scenarios**:

1. **Given** a generated graph, **When** the user clicks a concept node,
   **Then** a detail panel opens showing the concept name, description, its
   prerequisites, and the concepts it unlocks.
2. **Given** the detail panel is open, **When** the user clicks "Mark as known",
   **Then** the concept state updates and the graph re-evaluates edge-of-knowledge
   nodes instantly.
3. **Given** the detail panel is open, **When** the user clicks a linked
   prerequisite or unlocked concept, **Then** the graph navigates to and highlights
   that node.

---

### Edge Cases

- What happens when the AI returns a graph with no edges (isolated nodes)?
  All isolated nodes with no prerequisites should be treated as "edge of knowledge"
  from the start.
- What happens when a user submits a completely nonsensical prompt?
  The system should display a graceful error message and allow the user to retry.
- What happens if the user marks every node as "known"?
  The graph should show all nodes as "known" with no "edge" nodes; a congratulatory
  message may be shown.
- What happens if two prompts generate overlapping concepts?
  Each course maintains its own independent graph; there is no cross-course merging.
- What happens if the AI service is unavailable or rate-limited?
  The user sees a clear error state with a retry option; previously saved graphs
  remain accessible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to create multiple named Learning Courses,
  each stored independently in local browser storage.
- **FR-002**: Within a course, the user MUST be able to submit a free-text topic
  prompt to trigger AI-powered knowledge graph generation.
- **FR-003**: The AI MUST generate a Directed Acyclic Graph (DAG) where nodes
  represent concepts and directed edges represent prerequisite dependencies.
- **FR-004**: Each concept node MUST include a name and a short AI-generated
  description.
- **FR-005**: The system MUST classify every node in one of three states:
  **known**, **edge of knowledge** (all prerequisites met, not yet learned),
  or **future** (prerequisites not fully met).
- **FR-006**: The system MUST automatically promote nodes to "edge of knowledge"
  when all their prerequisite nodes are marked as "known".
- **FR-007**: Users MUST be able to toggle individual concept nodes between
  "known" and "not known".
- **FR-008**: The knowledge graph MUST be rendered as an interactive visual DAG
  with nodes, directed edges, and clear visual differentiation of the three
  knowledge states.
- **FR-009**: All course data (graph structure, node states) MUST persist across
  browser sessions without requiring a server or user account.
- **FR-010**: The application MUST function entirely client-side with no server
  infrastructure required beyond static file hosting.
- **FR-011**: Users MUST be able to view a detail panel for any node showing its
  description, prerequisites, and unlocked concepts.

### Key Entities

- **Learning Course**: Named container for a knowledge graph; has an ID, name,
  creation date, and associated graph. Multiple courses can coexist.
- **Concept Node**: A single learnable concept within a graph; has an ID, name,
  description, and knowledge state (known / edge / future).
- **Dependency Edge**: A directed relationship from a prerequisite concept to a
  dependent concept; defines the DAG structure.
- **Knowledge Graph**: The complete DAG for a course; composed of concept nodes
  and dependency edges; derived from an AI prompt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a new course, enter a topic prompt, and view a
  populated knowledge graph in under 60 seconds end-to-end (excluding network
  latency to the AI service).
- **SC-002**: After marking a concept as known, the graph re-evaluates and updates
  node states within 300 milliseconds with no page reload.
- **SC-003**: All course and graph data persists across browser close/reopen with
  100% fidelity (no data loss on reload).
- **SC-004**: Users can identify their "edge of knowledge" nodes at a glance
  without reading tooltips or instructions — validated by first-use observation
  where 80% of new users correctly identify their next recommended concept.
- **SC-005**: The application loads and is interactive on a standard broadband
  connection within 3 seconds (initial load, empty state).
- **SC-006**: The graph accurately represents dependency relationships: for any
  concept node, all prerequisite nodes MUST be marked known before the concept
  can reach "edge of knowledge" state — verified by automated state-machine tests.

## Assumptions

- The AI service is accessed via a client-callable API (e.g., a third-party LLM
  API with a browser-compatible SDK or CORS-enabled endpoint); no custom backend
  is required.
- The application targets modern evergreen browsers (Chrome, Firefox, Safari,
  Edge — latest two major versions); legacy browser support is out of scope.
- Local browser storage (IndexedDB or localStorage) is sufficient for data
  persistence; cloud sync and multi-device access are out of scope for v1.
- User authentication and accounts are out of scope; all data is local to the
  device and browser.
- The AI is expected to produce well-structured knowledge graph data (nodes +
  edges) via prompt engineering; the UI trusts the AI output structure and
  performs basic validation only.
- Initial graph generation produces a complete graph for the topic; incremental
  expansion (adding new AI-generated subgraphs to an existing graph) is out of
  scope for v1.
- Graphs may contain between 5 and 50 concept nodes for typical topics; very
  large graphs (100+ nodes) may have degraded visual performance but are not
  a primary concern for v1.
