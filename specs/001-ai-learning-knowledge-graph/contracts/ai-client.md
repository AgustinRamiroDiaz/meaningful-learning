# Contract: AI Client — generateKnowledgeGraph

**File**: `lib/ai-client.ts`
**Type**: Client-side async function (browser only)

---

## Signature

```typescript
async function generateKnowledgeGraph(
  topic: string,
  config: AIConfig
): Promise<AIGraphResponse>

interface AIConfig {
  baseUrl: string   // e.g. "http://localhost:11434/v1" or "https://api.openai.com/v1"
  model: string     // e.g. "llama3.2", "gpt-4o", "mistral"
  apiKey?: string   // optional; empty string or omit for local Ollama
}
```

---

## Parameters

| Parameter | Type | Constraints |
|-----------|------|-------------|
| `topic` | `string` | 1–500 characters; the user's raw prompt |
| `config.baseUrl` | `string` | Non-empty URL pointing to an OpenAI-compatible `/v1` endpoint |
| `config.model` | `string` | Non-empty model identifier supported by the endpoint |
| `config.apiKey` | `string?` | Optional; omit or use empty string for local Ollama |

---

## Client Initialisation

Uses the `openai` npm package with a custom `baseURL` and `dangerouslyAllowBrowser: true`
(required for direct browser calls; acceptable for the PoC, as the key is user-owned):

```typescript
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: config.baseUrl,
  apiKey: config.apiKey || 'ollama',  // Ollama ignores the key value
  dangerouslyAllowBrowser: true,
})
```

---

## Return Value

Returns a validated `AIGraphResponse`:

```typescript
interface AIGraphResponse {
  nodes: Array<{ id: string; label: string; description: string }>
  edges: Array<{ source: string; target: string }>
}
```

---

## Error Behaviour

| Condition | Thrown |
|-----------|--------|
| Invalid API key (401) | `AIClientError` with `code: 'AUTH_ERROR'` |
| Rate limited (429) | `AIClientError` with `code: 'RATE_LIMITED'` |
| Network failure / endpoint unreachable | `AIClientError` with `code: 'NETWORK_ERROR'` |
| Malformed AI response (unparseable JSON) | `AIClientError` with `code: 'PARSE_ERROR'` |
| Graph with 0 nodes returned | `AIClientError` with `code: 'EMPTY_GRAPH'` |

```typescript
class AIClientError extends Error {
  code: 'AUTH_ERROR' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'EMPTY_GRAPH'
}
```

---

## API Call Contract

The function calls `client.chat.completions.create` with:
- `model`: from `config.model`
- `response_format: { type: "json_object" }` for guaranteed JSON output
  (supported by Ollama and OpenAI; falls back to prompt-enforced JSON on
  endpoints that don't support the parameter)
- A single user message containing the structured prompt below

```typescript
const response = await client.chat.completions.create({
  model: config.model,
  response_format: { type: 'json_object' },
  messages: [{ role: 'user', content: buildPrompt(topic) }],
})
```

---

## Prompt Contract

```
You are an expert curriculum designer specialising in the Meaningful Learning
approach. Given a learning topic, generate a comprehensive knowledge graph as a
Directed Acyclic Graph (DAG).

Rules:
- Each node is a concept the learner needs to understand.
- Each edge represents a prerequisite: source must be understood before target.
- Generate between 8 and 30 nodes for most topics.
- Nodes must have unique string IDs (snake_case, e.g. "linear_algebra").
- Node labels must be concise (2–5 words max).
- Node descriptions must be 1–2 sentences for a non-expert audience.
- Edges must not create cycles.
- Root nodes (no prerequisites) represent foundational concepts.

Topic: {topic}

Respond with valid JSON matching this exact schema:
{
  "nodes": [{ "id": string, "label": string, "description": string }],
  "edges": [{ "source": string, "target": string }]
}
```

---

## Post-processing

After receiving the AI response, the function:
1. Parses `response.choices[0].message.content` as JSON.
2. Validates all `edge.source` and `edge.target` values reference existing node IDs.
3. Removes any edges that reference non-existent nodes (defensive).
4. Deduplicates nodes by ID.
5. Returns the cleaned `AIGraphResponse`.

Edge `id` values are **not** assigned here — they are assigned in `lib/graph-engine.ts`
when the response is converted into a full `KnowledgeGraph`.

---

## Default Configuration (localStorage keys)

| Key | Default | Description |
|-----|---------|-------------|
| `ml_ai_base_url` | `http://localhost:11434/v1` | Ollama local endpoint |
| `ml_ai_model` | `llama3.2` | Default Ollama model |
| `ml_api_key` | `""` | Empty = no key (Ollama) |
