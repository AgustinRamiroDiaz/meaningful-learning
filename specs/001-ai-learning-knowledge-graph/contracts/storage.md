# Contract: Storage — localStorage Persistence

**File**: `lib/storage.ts`
**Type**: Synchronous client-side module (browser only)

---

## Functions

### `getCourseIndex(): string[]`

Returns the ordered list of course IDs. Returns `[]` if not found.

### `saveCourseIndex(ids: string[]): void`

Persists the ordered course ID list.

### `getCourse(id: string): Course | null`

Returns a `Course` by ID, or `null` if not found or invalid JSON.

### `saveCourse(course: Course): void`

Persists a full `Course` object. Also updates the index if the course is new.

### `deleteCourse(id: string): void`

Removes the course from localStorage and from the course index.

### `getAIConfig(): AIConfig`

Returns the stored AI configuration, falling back to defaults:
```typescript
{ baseUrl: 'http://localhost:11434/v1', model: 'llama3.2', apiKey: '' }
```

### `saveAIConfig(config: AIConfig): void`

Persists the AI configuration (base URL, model, and optional API key).

---

## Storage Keys

| Key | Value |
|-----|-------|
| `ml_course_index` | JSON array of course ID strings |
| `ml_course_<id>` | JSON-serialised `Course` object |
| `ml_ai_base_url` | OpenAI-compatible endpoint (default: `http://localhost:11434/v1`) |
| `ml_ai_model` | Model identifier (default: `llama3.2`) |
| `ml_api_key` | Optional API key (empty string for local Ollama) |

---

## Error Handling

- All read functions catch `JSON.parse` errors and return `null` / `[]` rather
  than throwing.
- All write functions catch `localStorage` quota errors and rethrow as
  `StorageError` with a user-readable message.
- If `localStorage` is unavailable (private browsing restrictions), functions
  degrade gracefully: reads return defaults, writes are no-ops (with a console
  warning — acceptable for PoC).
