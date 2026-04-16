import OpenAI from 'openai'
import { AIClientError } from './types'
import type { AIConfig, AIGraphResponse } from './types'

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildPrompt(topic: string): string {
  return `You are an expert curriculum designer specialising in the Meaningful Learning approach. Given a learning topic, generate a comprehensive knowledge graph as a Directed Acyclic Graph (DAG).

Rules:
- Each node is a concept the learner needs to understand.
- Each edge represents a prerequisite: source must be understood before target.
- Generate between 8 and 30 nodes for most topics.
- Nodes must have unique string IDs (snake_case, e.g. "linear_algebra").
- Node labels must be concise (2-5 words max).
- Node descriptions must be 1-2 sentences for a non-expert audience.
- Edges must not create cycles.
- Root nodes (no prerequisites) represent foundational concepts.

Topic: ${topic}

Respond with valid JSON matching this exact schema:
{
  "nodes": [{ "id": "string", "label": "string", "description": "string" }],
  "edges": [{ "source": "string", "target": "string" }]
}`
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateAndCleanResponse(raw: unknown): AIGraphResponse {
  if (!raw || typeof raw !== 'object') {
    throw new AIClientError('Response is not an object', 'PARSE_ERROR')
  }

  const obj = raw as Record<string, unknown>

  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) {
    throw new AIClientError('Response missing nodes or edges arrays', 'PARSE_ERROR')
  }

  const nodeIds = new Set<string>()
  const nodes: AIGraphResponse['nodes'] = []

  for (const n of obj.nodes) {
    if (
      n &&
      typeof n === 'object' &&
      typeof (n as Record<string, unknown>).id === 'string' &&
      typeof (n as Record<string, unknown>).label === 'string' &&
      typeof (n as Record<string, unknown>).description === 'string'
    ) {
      const node = n as { id: string; label: string; description: string }
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id)
        nodes.push(node)
      }
    }
  }

  if (nodes.length === 0) {
    throw new AIClientError('AI returned no valid concept nodes', 'EMPTY_GRAPH')
  }

  const edges: AIGraphResponse['edges'] = []
  for (const e of obj.edges) {
    if (
      e &&
      typeof e === 'object' &&
      typeof (e as Record<string, unknown>).source === 'string' &&
      typeof (e as Record<string, unknown>).target === 'string'
    ) {
      const edge = e as { source: string; target: string }
      // Only keep edges where both source and target exist in the node set
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        edges.push(edge)
      }
    }
  }

  return { nodes, edges }
}

// ── Main Export ───────────────────────────────────────────────────────────────

export async function generateKnowledgeGraph(
  topic: string,
  config: AIConfig
): Promise<AIGraphResponse> {
  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey || 'ollama',
    dangerouslyAllowBrowser: true,
  })

  let content: string | null = null

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- openai type varies by provider
      response_format: { type: 'json_object' } as any,
      messages: [{ role: 'user', content: buildPrompt(topic) }],
    })
    content = response.choices[0]?.message?.content ?? null
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err) {
      const status = (err as { status: number }).status
      if (status === 401 || status === 403) {
        throw new AIClientError('Authentication failed', 'AUTH_ERROR')
      }
      if (status === 429) {
        throw new AIClientError('Rate limit exceeded', 'RATE_LIMITED')
      }
    }
    throw new AIClientError(
      `Network or connection error: ${err instanceof Error ? err.message : String(err)}`,
      'NETWORK_ERROR'
    )
  }

  if (!content) {
    throw new AIClientError('AI returned an empty response', 'PARSE_ERROR')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new AIClientError('AI response is not valid JSON', 'PARSE_ERROR')
  }

  return validateAndCleanResponse(parsed)
}
