# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Endpoint Overview

This endpoint retrieves a paginated, filterable, and sortable list of flashcards for the authenticated user. It supports filtering by source type (AI-generated, AI-edited, or manually created), sorting by various fields, and standard limit/offset pagination.

## 2. Request Details

- **HTTP Method:** GET
- **URL Structure:** `/api/flashcards`
- **Authentication:** Required via Bearer token in Authorization header
- **Parameters:**
  - **Required:** None
  - **Optional:**
    - `limit` (number, default: 50, max: 100) - Number of flashcards to return per page
    - `offset` (number, default: 0, min: 0) - Starting position for pagination
    - `source` (string) - Filter by flashcard source: 'ai-full', 'ai-edited', or 'manual'
    - `sort` (string, default: 'created_at') - Sort field: 'created_at', 'updated_at', or 'front'
    - `order` (string, default: 'desc') - Sort order: 'asc' or 'desc'

## 3. Used Types

### Existing DTOs (from `src/types.ts`):
- `FlashcardDTO` - Flashcard object in response (excludes user_id)
- `PaginatedFlashcardsResponseDTO` - Complete response structure
- `PaginationDTO` - Pagination metadata

### New Command Models (to create):
```typescript
// Query parameters validation schema
const GetFlashcardsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  source: z.enum(['ai-full', 'ai-edited', 'manual']).optional(),
  sort: z.enum(['created_at', 'updated_at', 'front']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
});

type GetFlashcardsQuery = z.infer<typeof GetFlashcardsQuerySchema>;
```

## 4. Response Details

### Success Response (200 OK):
```json
{
  "flashcards": [
    {
      "id": 1,
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "ai-full",
      "generation_id": 42,
      "created_at": "2026-01-18T10:00:00Z",
      "updated_at": "2026-01-18T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Error Responses:
- **400 Bad Request** - Invalid query parameters (e.g., limit > 100, negative offset, invalid source/sort/order)
- **401 Unauthorized** - Missing, invalid, or expired authentication token
- **500 Internal Server Error** - Database errors or unexpected server failures

## 5. Data Flow

1. **Route Handler** (`src/pages/api/flashcards/index.ts`):
   - Extract and validate query parameters using Zod schema
   - Retrieve authenticated user from `context.locals.supabase`
   - Call flashcard service with validated parameters
   - Return formatted response

2. **Service Layer** (`src/lib/services/flashcard.service.ts`):
   - Build Supabase query with filters (source), sorting, and pagination
   - Execute count query for total records (filtered)
   - Execute data query for flashcards
   - Calculate `has_more` based on total, limit, and offset
   - Return flashcards and pagination metadata

3. **Database Interaction:**
   - Query `flashcards` table with RLS enforcing `user_id = auth.uid()`
   - Apply optional WHERE clause for source filter
   - Apply ORDER BY clause based on sort and order parameters
   - Apply LIMIT and OFFSET for pagination
   - Separate COUNT query to get total filtered records

## 6. Security Considerations

### Authentication & Authorization:
- Verify JWT token via Supabase client from `context.locals`
- Return 401 if user is not authenticated
- Rely on RLS policies to ensure users only access their own flashcards

### Input Validation:
- Validate all query parameters with Zod schema before processing
- Whitelist sort fields to prevent arbitrary column access
- Cap limit at 100 to prevent excessive data retrieval
- Ensure offset is non-negative

### Data Protection:
- Never include `user_id` in response (enforced by FlashcardDTO type)
- Use parameterized queries via Supabase (prevents SQL injection)

## 7. Error Handling

### Validation Errors (400):
- Invalid `limit` (< 1 or > 100)
- Invalid `offset` (< 0)
- Invalid `source` value (not in enum)
- Invalid `sort` field (not in allowed list)
- Invalid `order` value (not 'asc' or 'desc')

**Response:**
```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "message": "Must be between 1 and 100"
    }
  ]
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
- Leverage existing index on `user_id` column (from db-plan.md)
- Ensure sorting by indexed columns when possible (created_at, updated_at have defaults)
- Consider adding composite index on `(user_id, source, created_at)` if filtering by source becomes common

### Query Efficiency:
- Use single query for data retrieval with LIMIT/OFFSET
- Use separate COUNT query only when necessary (cache if possible)
- Consider using `range()` method in Supabase for efficiency

### Pagination Strategy:
- Limit/offset is acceptable for moderate datasets
- For very large datasets, consider cursor-based pagination in future iterations
- Document maximum practical limit (100) to prevent performance degradation

### Response Size:
- Maximum response size: ~100 flashcards * ~1KB each = ~100KB (acceptable)
- Consider compression for larger responses

## 9. Implementation Steps

1. **Create Query Validation Schema:**
   - Define `GetFlashcardsQuerySchema` using Zod in the route file or separate validation file
   - Include all query parameters with appropriate constraints and defaults

2. **Create Flashcard Service:**
   - Create `src/lib/services/flashcard.service.ts` if it doesn't exist
   - Implement `getFlashcards(supabase: SupabaseClient, userId: string, params: GetFlashcardsQuery)` method
   - Build Supabase query with dynamic filters and sorting
   - Execute count and data queries
   - Return typed response matching `PaginatedFlashcardsResponseDTO`

3. **Implement Route Handler:**
   - Use `src/pages/api/flashcards.ts`
   - Add `export const prerender = false`
   - Implement GET handler:
     - Extract query parameters from URL
     - Validate with Zod schema, catch and return 400 on errors
     - Get Supabase client from `context.locals.supabase`
     - Get authenticated user, return 401 if not authenticated
     - Call flashcard service
     - Return 200 with formatted response

4. **Handle Errors:**
   - Wrap service call in try-catch
   - Return appropriate status codes (400, 401, 500)
   - Include helpful error messages
   - Log server errors for debugging
