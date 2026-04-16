import type { AIConfig, Course, CourseSummary } from './types'

// ── Storage Keys ──────────────────────────────────────────────────────────────

const KEY_COURSE_INDEX = 'ml_course_index'
const KEY_COURSE_PREFIX = 'ml_course_'
const KEY_AI_BASE_URL = 'ml_ai_base_url'
const KEY_AI_MODEL = 'ml_ai_model'
const KEY_API_KEY = 'ml_api_key'

const DEFAULT_AI_CONFIG: AIConfig = {
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3.2',
  apiKey: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    throw new Error(`Storage quota exceeded or localStorage unavailable: ${String(e)}`)
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // no-op
  }
}

// ── Course Index ──────────────────────────────────────────────────────────────

export function getCourseIndex(): string[] {
  const raw = safeGet(KEY_COURSE_INDEX)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCourseIndex(ids: string[]): void {
  safeSet(KEY_COURSE_INDEX, JSON.stringify(ids))
}

// ── Course CRUD ───────────────────────────────────────────────────────────────

export function getCourse(id: string): Course | null {
  const raw = safeGet(`${KEY_COURSE_PREFIX}${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Course
  } catch {
    return null
  }
}

export function saveCourse(course: Course): void {
  const index = getCourseIndex()
  if (!index.includes(course.id)) {
    saveCourseIndex([...index, course.id])
  }
  safeSet(`${KEY_COURSE_PREFIX}${course.id}`, JSON.stringify(course))
}

export function deleteCourse(id: string): void {
  safeRemove(`${KEY_COURSE_PREFIX}${id}`)
  const index = getCourseIndex().filter((i) => i !== id)
  saveCourseIndex(index)
}

export function getAllCourses(): CourseSummary[] {
  const index = getCourseIndex()
  return index
    .map((id) => {
      const course = getCourse(id)
      if (!course) return null
      const summary: CourseSummary = {
        id: course.id,
        name: course.name,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        nodeCount: course.graph?.nodes.length ?? 0,
        knownCount: course.graph?.nodes.filter((n) => n.state === 'known').length ?? 0,
      }
      return summary
    })
    .filter((s): s is CourseSummary => s !== null)
}

// ── AI Config ─────────────────────────────────────────────────────────────────

export function getAIConfig(): AIConfig {
  return {
    baseUrl: safeGet(KEY_AI_BASE_URL) ?? DEFAULT_AI_CONFIG.baseUrl,
    model: safeGet(KEY_AI_MODEL) ?? DEFAULT_AI_CONFIG.model,
    apiKey: safeGet(KEY_API_KEY) ?? '',
  }
}

export function saveAIConfig(config: AIConfig): void {
  safeSet(KEY_AI_BASE_URL, config.baseUrl)
  safeSet(KEY_AI_MODEL, config.model)
  safeSet(KEY_API_KEY, config.apiKey ?? '')
}
