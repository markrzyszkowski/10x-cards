# API Endpoint Implementation Plan: GET /api/flashcards/{id}

## 1. Endpoint Overview

This endpoint retrieves a single flashcard by its ID for the authenticated user. It enforces ownership validation to ensure users can only access their own flashcards. If the flashcard doesn't exist or belongs to another user, a 404 response is returned without revealing which case applies.

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/flashcards/{id}`
- **Authentication:** Required via Bearer token in Authorization header
- **Parameters:**
  - **Required:**
    - `id` (path parameter, number) - The unique identifier of the flashcard to retrieve
  - **Optional:** None
- **Request Body:** N/A

## 3. Used Types

### Existing DTOs (from `src/types.ts`):
- `FlashcardDTO` - Single flashcard object in response (excludes user_id)

### New Command Models (to create):
```typescript
// Path parameter validation schema
const GetFlashcardByIdParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

type GetFlashcardByIdParams = z.infer<typeof GetFlashcardByIdParamsSchema>;
```

## 4. Response Details

### Success Response (200 OK):
```json
{
  "id": 1,
  "front": "What is the capital of France?",
  "back": "Paris",
  "source": "ai-full",
  "generation_id": 42,
  "created_at": "2026-01-18T10:00:00Z",
  "updated_at": "2026-01-18T10:00:00Z"
}
```

**Note:** Response is a single object, not an array.

### Error Responses:
- **400 Bad Request** - Invalid ID format (non-numeric, negative, zero, or not an integer)
- **401 Unauthorized** - Missing, invalid, or expired authentication token
- **404 Not Found** - Flashcard not found or not owned by the authenticated user
- **500 Internal Server Error** - Database errors or unexpected server failures

## 5. Data Flow

1. **Route Handler** (`src/pages/api/flashcards/[id].ts`):
   - Extract `id` from path parameters (`context.params.id`)
   - Validate ID using Zod schema
   - Retrieve authenticated user from `context.locals.supabase`
   - Call flashcard service with validated ID
   - Return formatted response or appropriate error

2. **Service Layer** (`src/lib/services/flashcard.service.ts`):
   - Build Supabase query to fetch single flashcard by ID
   - RLS automatically filters by `user_id = auth.uid()`
   - Return flashcard if found, null otherwise
   - Service doesn't distinguish between "doesn't exist" and "not owned" - both return null

3. **Database Interaction:**
   - Query `flashcards` table with WHERE clause `id = $1`
   - RLS policy enforces `user_id = auth.uid()`
   - Single row lookup using primary key (fast)
   - Returns single row or null

## 6. Security Considerations

### Authentication & Authorization:
- Verify JWT token via Supabase client from `context.locals`
- Return 401 if user is not authenticated
- Rely on RLS policies to ensure users only access their own flashcards
- **IDOR Protection:** RLS prevents accessing other users' flashcards even with valid IDs

### Input Validation:
- Validate ID is a positive integer before querying database
- Reject negative numbers, zero, non-integers, and non-numeric values
- Return 400 for malformed IDs

### Information Disclosure Prevention:
- Return 404 for both "doesn't exist" and "not owned by user" scenarios
- Don't reveal in error messages whether the flashcard exists for another user
- This prevents user enumeration and information leakage

### Data Protection:
- Never include `user_id` in response (enforced by FlashcardDTO type)
- Use parameterized queries via Supabase (prevents SQL injection)

## 7. Error Handling

### Validation Errors (400):
- ID is not a number (e.g., "abc", "null", "undefined")
- ID is negative or zero
- ID is not an integer (e.g., 1.5)

**Response:**
```json
{
  "error": "Invalid flashcard ID",
  "message": "ID must be a positive integer"
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

**Note:** Both cases return identical 404 responses to prevent information disclosure.

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
- Query uses primary key lookup (id) - extremely fast O(1) operation
- Index on `id` column is automatic (primary key)
- RLS filter uses indexed `user_id` column
- Single row retrieval - minimal overhead

### Query Efficiency:
- `.single()` method in Supabase for single row retrieval
- No joins required for basic flashcard retrieval
- Minimal data transfer (single row)

### Response Size:
- Response size: ~500 bytes (single flashcard object)
- No pagination needed
- Negligible network overhead

## 9. Implementation Steps

1. **Create Path Parameter Validation Schema:**
   - Define `GetFlashcardByIdParamsSchema` using Zod in the route file
   - Validate ID is a positive integer using `z.coerce.number().int().positive()`

2. **Create or Extend Flashcard Service:**
   - Add method `getFlashcardById(supabase: SupabaseClient, userId: string, flashcardId: number)` to `src/lib/services/flashcard.service.ts`
   - Query flashcards table with `.eq('id', flashcardId)` and `.single()`
   - Return flashcard or null if not found
   - Let RLS handle ownership validation automatically

3. **Implement Route Handler:**
   - Create `src/pages/api/flashcards/[id].ts`
   - Add `export const prerender = false`
   - Implement GET handler:
     - Extract `id` from `context.params.id`
     - Validate with Zod schema, catch and return 400 on errors
     - Get Supabase client from `context.locals.supabase`
     - Get authenticated user, return 401 if not authenticated
     - Call flashcard service
     - Return 404 if result is null
     - Return 200 with flashcard if found

4. **Handle Errors:**
   - Wrap service call in try-catch
   - Return appropriate status codes (400, 401, 404, 500)
   - Use consistent error message format
   - Log server errors for debugging (not to generation_error_logs)

5. **Type Safety:**
   - Ensure response matches `FlashcardDTO` type
   - Verify `user_id` is excluded from response
   - Use TypeScript to catch type mismatches at compile time