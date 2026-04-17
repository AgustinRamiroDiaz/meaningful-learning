import { test, expect, type Route } from '@playwright/test'

// ── Mock data ──────────────────────────────────────────────────────────────────
//
// A small 4-node Python DAG:
//   python_basics → variables → functions → oop_concepts
//
// python_basics has no prerequisites, so it starts as "edge" (ready to learn).
// All others start as "future" until their prerequisite is marked known.

const MOCK_GRAPH = {
  nodes: [
    {
      id: 'python_basics',
      label: 'Python Basics',
      description: 'Core Python syntax and environment setup.',
    },
    {
      id: 'variables',
      label: 'Variables',
      description: 'Storing and using data in named slots.',
    },
    {
      id: 'functions',
      label: 'Functions',
      description: 'Defining reusable blocks of logic.',
    },
    {
      id: 'oop_concepts',
      label: 'OOP Concepts',
      description: 'Classes, objects, and inheritance.',
    },
  ],
  edges: [
    { source: 'python_basics', target: 'variables' },
    { source: 'variables', target: 'functions' },
    { source: 'functions', target: 'oop_concepts' },
  ],
}

// ── SSE helpers ────────────────────────────────────────────────────────────────

function sseChunk(content: string): string {
  return `data: ${JSON.stringify({
    id: 'chatcmpl-test',
    object: 'chat.completion.chunk',
    created: 1_700_000_000,
    model: 'llama3.2',
    choices: [{ index: 0, delta: { content }, finish_reason: null }],
  })}\n\n`
}

/** Build a minimal streaming SSE body that delivers `payload` in one chunk. */
function buildSseBody(payload: string): string {
  return (
    // opening role chunk
    `data: ${JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion.chunk',
      created: 1_700_000_000,
      model: 'llama3.2',
      choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }],
    })}\n\n` +
    // content
    sseChunk(payload) +
    // stop
    `data: ${JSON.stringify({
      id: 'chatcmpl-test',
      object: 'chat.completion.chunk',
      created: 1_700_000_000,
      model: 'llama3.2',
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    })}\n\n` +
    'data: [DONE]\n\n'
  )
}

async function mockOllama(route: Route) {
  await route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
    body: buildSseBody(JSON.stringify(MOCK_GRAPH)),
  })
}

// ── Selectors ──────────────────────────────────────────────────────────────────

/** Find the React Flow concept node card by its visible label. */
function nodeCard(page: import('@playwright/test').Page, label: string) {
  // Concept nodes render as `div.rounded-lg` containing a <p> with the label
  return page.locator('div.rounded-lg').filter({ has: page.getByText(label, { exact: true }) })
}

// ── Test ───────────────────────────────────────────────────────────────────────

test('create course → generate graph (mocked) → acknowledge concepts', async ({ page }) => {
  // ── 1. Intercept Ollama chat completions ──────────────────────────────────
  await page.route('**/v1/chat/completions', mockOllama)

  // ── 2. Home page — create a new course ───────────────────────────────────
  await page.goto('/')

  await page.getByRole('button', { name: 'New Course' }).click()

  const nameInput = page.getByPlaceholder('e.g. Machine Learning Basics')
  await nameInput.fill('Python Programming')
  await page.getByRole('button', { name: 'Create' }).click()

  // ── 3. Course page loads with the correct name ────────────────────────────
  await expect(page).toHaveURL(/\/course\?id=/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Python Programming')

  // ── 4. Submit a topic prompt ──────────────────────────────────────────────
  await page
    .getByPlaceholder('e.g. I want to learn quantum computing from scratch')
    .fill('Python basics for beginners')

  await page.getByRole('button', { name: 'Generate' }).click()

  // ── 6. Graph renders after streaming completes ────────────────────────────
  // "Python Basics" has no prerequisites → it starts as "Next up" (edge state)
  const pythonBasicsCard = nodeCard(page, 'Python Basics')
  await expect(pythonBasicsCard).toBeVisible({ timeout: 10_000 })
  await expect(pythonBasicsCard.getByText('Next up')).toBeVisible()

  // Other nodes start as "Future" (prerequisites not yet met)
  await expect(nodeCard(page, 'Variables').getByText('Future')).toBeVisible()
  await expect(nodeCard(page, 'Functions').getByText('Future')).toBeVisible()
  await expect(nodeCard(page, 'OOP Concepts').getByText('Future')).toBeVisible()

  // ── 7. Mark "Python Basics" as known ─────────────────────────────────────
  await pythonBasicsCard.getByRole('button', { name: 'Mark as known' }).click()

  await expect(pythonBasicsCard.getByText('Known')).toBeVisible()

  // Marking python_basics unlocks variables → it should become "Next up"
  const variablesCard = nodeCard(page, 'Variables')
  await expect(variablesCard.getByText('Next up')).toBeVisible()
  // functions is still blocked
  await expect(nodeCard(page, 'Functions').getByText('Future')).toBeVisible()

  // ── 8. Open detail panel for "Variables" ─────────────────────────────────
  await variablesCard.click()

  const detailPanel = page.getByRole('dialog')
  await expect(detailPanel).toBeVisible()
  await expect(detailPanel.getByText('Variables')).toBeVisible()
  // Prerequisites section should list "Python Basics"
  await expect(detailPanel.getByText('Python Basics')).toBeVisible()

  // ── 9. Mark "Variables" as known from the detail panel ───────────────────
  await detailPanel.getByRole('button', { name: 'Mark as known' }).click()

  await expect(variablesCard.getByText('Known')).toBeVisible()

  // functions is now unlocked
  await expect(nodeCard(page, 'Functions').getByText('Next up')).toBeVisible()
  // oop_concepts is still blocked
  await expect(nodeCard(page, 'OOP Concepts').getByText('Future')).toBeVisible()
})
