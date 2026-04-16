# Quickstart: AI-Powered Learning Knowledge Graph (PoC)

**Branch**: `001-ai-learning-knowledge-graph`
**Date**: 2026-04-16

---

## Prerequisites

- Node 20+
- Git
- **For local AI (recommended)**: [Ollama](https://ollama.com) installed and running
  (`ollama serve`), with at least one model pulled (e.g. `ollama pull llama3.2`)
- **For cloud AI (optional)**: An API key for an OpenAI-compatible provider
  (OpenAI, OpenRouter, etc.)

---

## 1. Install Dependencies

```bash
npm install
```

This installs all runtime and dev dependencies including `@xyflow/react`,
`@dagrejs/dagre`, `@anthropic-ai/sdk`, `husky`, `lint-staged`, and `prettier`.

---

## 2. Set Up Git Hooks

```bash
npx husky init
```

This creates `.husky/` with the pre-commit and pre-push hooks as defined in
the research document. Hooks enforce lint-staged (ESLint + Prettier) on commit
and `next build` on push.

---

## 3. Install ShadcnUI Components

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input badge sheet
```

Follow the prompts (select default styles, use CSS variables, Tailwind).

---

## 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000.

---

## 5. PoC Validation Walkthrough

### Step 1: Configure AI Provider
- Click the settings icon (top-right).
- **Ollama (default)**: Base URL is pre-filled as `http://localhost:11434/v1`;
  select your pulled model (e.g. `llama3.2`); leave API key blank → Save.
- **Cloud provider**: Set the base URL to your provider's `/v1` endpoint
  (e.g. `https://api.openai.com/v1`), enter model name and API key → Save.
- Settings are stored in localStorage (`ml_ai_base_url`, `ml_ai_model`, `ml_api_key`).

### Step 2: Create a Course
- Click "New Course" on the home page.
- Enter a name (e.g., "Machine Learning Basics") → Create.
- You are redirected to the course workspace.

### Step 3: Generate a Knowledge Graph
- In the prompt bar, type: "I want to learn machine learning from scratch"
- Click Generate. Wait up to 30 seconds.
- A DAG graph should appear with 8–30 concept nodes and dependency edges.

### Step 4: Explore Knowledge States
- Root nodes (no prerequisites) should be highlighted as **Edge of Knowledge**
  (amber/gold colour).
- Click a root node → Detail panel opens showing prerequisites (none) and
  unlocked concepts.
- Click "Mark as Known" → the node turns green; dependent nodes whose
  prerequisites are now all met transition to **Edge of Knowledge**.

### Step 5: Reload and Verify Persistence
- Close the browser tab and reopen http://localhost:3000.
- Navigate to your course — the graph and all node states should be intact.

---

## 6. Verify Quality Gates

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build (should complete with 0 errors)
npm run build
```

All three commands MUST pass before merging to main.

---

## Known PoC Limitations

- API key is stored unencrypted in localStorage — production would use a
  backend proxy.
- "Researches online" is fulfilled by Claude's training knowledge, not live
  web search — live search via tool use is a v2 feature.
- No graph merging across courses or incremental expansion of existing graphs.
- No account system or cross-device sync.
