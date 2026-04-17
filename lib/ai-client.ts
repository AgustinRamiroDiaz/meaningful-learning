import OpenAI from 'openai'
import type { ResponseFormatJSONSchema } from 'openai/resources/shared'
import { AIClientError } from './types'
import type { AIConfig, AIGraphResponse } from './types'

// ── Structured output schema ───────────────────────────────────────────────────
//
// Defines the exact JSON shape the model must produce.
// strict: true + additionalProperties: false on every object enforces the schema
// server-side, so no partial or hallucinated fields can appear in the output.

const KNOWLEDGE_GRAPH_SCHEMA: ResponseFormatJSONSchema = {
  type: 'json_schema',
  json_schema: {
    name: 'knowledge_graph',
    description:
      'A directed acyclic graph of concepts for the Meaningful Learning approach. ' +
      'Edges represent prerequisite relationships (source must be learned before target).',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique snake_case identifier, e.g. "linear_algebra"',
              },
              label: {
                type: 'string',
                description: 'Concise concept name, 2–5 words',
              },
              description: {
                type: 'string',
                description: '1-2 sentence explanation for a non-expert audience',
              },
            },
            required: ['id', 'label', 'description'],
            additionalProperties: false,
          },
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'ID of the prerequisite concept' },
              target: { type: 'string', description: 'ID of the concept that depends on source' },
            },
            required: ['source', 'target'],
            additionalProperties: false,
          },
        },
      },
      required: ['nodes', 'edges'],
      additionalProperties: false,
    },
  },
}

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

Topic: ${topic}`
}

// ── Validation ────────────────────────────────────────────────────────────────
//
// Structured outputs guarantee the schema is respected, but we still validate
// semantic constraints (non-empty graph, edges reference existing node IDs).

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
    const node = n as { id: string; label: string; description: string }
    if (!nodeIds.has(node.id)) {
      nodeIds.add(node.id)
      nodes.push(node)
    }
  }

  if (nodes.length === 0) {
    throw new AIClientError('AI returned no valid concept nodes', 'EMPTY_GRAPH')
  }

  // Drop edges that reference unknown node IDs (guards against hallucinated IDs)
  const edges: AIGraphResponse['edges'] = (
    obj.edges as { source: string; target: string }[]
  ).filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

  return { nodes, edges }
}

// ── Main Export ───────────────────────────────────────────────────────────────

export async function generateKnowledgeGraph(
  topic: string,
  config: AIConfig,
  onChunk?: (text: string) => void
): Promise<AIGraphResponse> {
  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey || 'ollama',
    dangerouslyAllowBrowser: true,
  })

  let content = ''

  try {
    const stream = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: buildPrompt(topic) }],
      response_format: KNOWLEDGE_GRAPH_SCHEMA,
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      if (delta) {
        content += delta
        onChunk?.(delta)
      }
    }
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

  // Strip markdown code fences — some providers ignore response_format and wrap output anyway
  const jsonContent = content
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonContent)
  } catch {
    throw new AIClientError('AI response is not valid JSON', 'PARSE_ERROR')
  }

  return validateAndCleanResponse(parsed)
}
