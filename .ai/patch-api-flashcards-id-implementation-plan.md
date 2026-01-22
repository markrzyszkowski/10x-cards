# API Endpoint Implementation Plan: PATCH /api/flashcards/{id}

## 1. Endpoint Overview

This endpoint updates an existing flashcard by ID for the authenticated user. It supports partial updates, allowing modification of the front and/or back fields. The endpoint includes special business logic that automatically converts the source from 'ai-full' to 'ai-edited' when a flashcard is edited, tracking user modifications to AI-generated content.

## 2. Request Details

- **HTTP Method:** PATCH
- **URL Structure:** `/api/flashcards/{id}`
- **Authentication:** Required via Bearer token in Authorization header
- **Parameters:**
  - **Required (path):**
    - `id` (number) - The unique identifier of the flashcard to update
  - **Required (body):**
    - At least one of: `front` or `back` (cannot send empty request body)
  - **Optional (body):**
    - `front` (string, max 200 chars) - Updated front text
    - `back` (string, max 500 chars) - Updated back text
- **Request Body Example:**
```json
{
  "front": "What is TypeScript used for?",
  "back": "Building type-safe JavaScript applications"
}
```

## 3. Used Types

### Existing DTOs (from `src/types.ts`):
- `UpdateFlashcardDTO` - Request body type (Pick<TablesUpdate<"flashcards">, "front" | "back">)
- `FlashcardDTO` - Response type (excludes user_id)

### New Command Models (to create):
```typescript
// Path parameter validation schema
const PatchFlashcardByIdParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

// Request body validation schema
const UpdateFlashcardRequestSchema = z.object({
  front: z.string().max(200, "Front text must not exceed 200 characters").optional(),
  back: z.string().max(500, "Back text must not exceed 500 characters").optional()
}).refine(
  (data) => data.front !== undefined || data.back !== undefined,
  {
    message: "At least one field (front or back) must be provided"
  }
);
```

## 4. Response Details

### Success Response (200 OK):
```json
{
  "id": 1,
  "front": "What is TypeScript used for?",
  "back": "Building type-safe JavaScript applications",
  "source": "ai-edited",
  "generation_id": 42,
  "created_at": "2026-01-18T10:00:00Z",
  "updated_at": "2026-01-18T10:15:00Z"
}
```

**Note:** The `source` field may be automatically changed from 'ai-full' to 'ai-edited' if the flashcard was originally AI-generated without edits. The `updated_at` timestamp is automatically updated by a database trigger.

### Error Responses:
- **400 Bad Request** - Invalid ID format, validation errors (field too long, empty body)
- **401 Unauthorized** - Missing, invalid, or expired authentication token
- **404 Not Found** - Flashcard not found or not owned by the authenticated user
- **500 Internal Server Error** - Database errors or unexpected server failures

## 5. Data Flow

1. **Route Handler** (`src/pages/api/flashcards/[id].ts`):
   - Extract `id` from path parameters
   - Validate ID using Zod schema
   - Parse and validate request body
   - Retrieve authenticated user from `context.locals.supabase`
   - Call flashcard service with validated data
   - Return formatted response or appropriate error

2. **Service Layer** (`src/lib/services/flashcard.service.ts`):
   - Fetch current flashcard to verify ownership and get current source
   - Return 404 if flashcard not found or not owned by user
   - Determine if source needs to be updated:
     - If current source is 'ai-full' → set source to 'ai-edited'
     - If current source is 'ai-edited' or 'manual' → keep unchanged
   - Build update object with provided fields and computed source (if changed)
   - Execute update query with RLS enforcing ownership
   - Return updated flashcard

3. **Database Interaction:**
   - First query: SELECT to fetch current flashcard and verify ownership
   - Second query: UPDATE with new values and computed source
   - Database trigger automatically updates `updated_at` timestamp
   - RLS policies enforce `user_id = auth.uid()` on both queries

## 6. Security Considerations

### Authentication & Authorization:
- Verify JWT token via Supabase client from `context.locals`
- Return 401 if user is not authenticated
- Rely on RLS policies to ensure users only update their own flashcards
- **IDOR Protection:** Service fetches flashcard first to verify ownership before updating

### Input Validation:
- Validate ID is a positive integer before querying database
- Validate request body has at least one field
- Enforce maximum field lengths (front: 200, back: 500)
- Return 400 for validation failures

### Information Disclosure Prevention:
- Return 404 for both "doesn't exist" and "not owned by user" scenarios
- Don't reveal in error messages whether flashcard exists for another user

### Data Protection:
- Never include `user_id` in response (enforced by FlashcardDTO type)
- Use parameterized queries via Supabase (prevents SQL injection)
- Don't allow modification of id, source, generation_id, created_at, or user_id

## 7. Error Handling

### Validation Errors (400):
- ID is not a positive integer
- Front text exceeds 200 characters
- Back text exceeds 500 characters
- Request body is empty (no fields provided)
- Request body contains only undefined/null values

**Response:**
```json
{
  "error": "Validation failed",
  "message": "Front text must not exceed 200 characters"
}
```

### Authentication Errors (401):
- Missing Authorization header
- Invalid or malformed token
- Expired token

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

### Not Found Errors (404):
- Flashcard with given ID doesn't exist
- Flashcard exists but belongs to another user

**Response:**
```json
{
  "error": "Not found",
  "message": "Flashcard not found"
}
```

### Server Errors (500):
- Database connection failures
- Unexpected Supabase errors
- Unhandled exceptions

**Response:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 8. Performance Considerations

### Database Optimization:
- Two queries required: SELECT (verify) + UPDATE
- Both use primary key lookup (id) - fast O(1) operations
- RLS filter uses indexed `user_id` column
- Consider using single UPDATE with RETURNING to reduce round trips (future optimization)

### Query Efficiency:
- `.single()` method for SELECT query
- `.eq()` filters on indexed columns
- Minimal data transfer (single row)

### Potential Optimization:
- Could potentially use a single UPDATE query with RETURNING clause
- Would need to check affected rows to determine 404 vs success
- Current two-query approach is clearer for business logic (source conversion)

### Response Size:
- Response size: ~500 bytes (single flashcard object)
- Negligible network overhead

## 9. Implementation Steps

1. **Create Validation Schemas:**
   - Define `PatchFlashcardByIdParamsSchema` for path parameter validation
   - Define `UpdateFlashcardRequestSchema` for request body validation with refinement to ensure at least one field is provided

2. **Add updateFlashcard Method to Service:**
   - Add method `updateFlashcard(userId: string, flashcardId: number, updates: UpdateFlashcardDTO, supabase: SupabaseClient)` to `src/lib/services/flashcard.service.ts`
   - Fetch current flashcard with ownership check
   - Return null if not found or not owned
   - Implement source conversion logic:
     ```typescript
     const updatedSource = currentFlashcard.source === 'ai-full' ? 'ai-edited' : currentFlashcard.source;
     ```
   - Build update payload including computed source if changed
   - Execute update query
   - Return updated flashcard

3. **Implement PATCH Handler:**
   - Add PATCH handler to `src/pages/api/flashcards/[id].ts`
   - Add `export const prerender = false` if not already present
   - Implement handler:
     - Extract and validate path parameter (id)
     - Get authenticated user, return 401 if not authenticated
     - Parse and validate request body, return 400 on errors
     - Call flashcard service
     - Return 404 if service returns null
     - Return 200 with updated flashcard on success

4. **Handle Errors:**
   - Wrap service call in try-catch
   - Return appropriate status codes (400, 401, 404, 500)
   - Use consistent error message format
   - Log server errors for debugging

5. **Type Safety:**
   - Ensure request body matches `UpdateFlashcardDTO` type
   - Ensure response matches `FlashcardDTO` type
   - Verify `user_id` is excluded from response