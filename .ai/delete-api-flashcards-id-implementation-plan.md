# API Endpoint Implementation Plan: DELETE /api/flashcards/{id}

## 1. Endpoint Overview

This endpoint permanently deletes a flashcard by ID for the authenticated user. The deletion is irreversible and ensures that users can only delete their own flashcards through authentication and Row-Level Security policies. The endpoint returns the same 404 response whether the flashcard doesn't exist or belongs to another user, preventing information disclosure.

## 2. Request Details

- **HTTP Method:** DELETE
- **URL Structure:** `/api/flashcards/{id}`
- **Authentication:** Required via Bearer token in Authorization header
- **Parameters:**
  - **Required (path):**
    - `id` (number) - The unique identifier of the flashcard to delete
  - **Optional:** None
- **Request Body:** None

## 3. Used Types

### Existing DTOs (from `src/types.ts`):
- `DeleteResponseDTO` - Success response type with message field

### New Command Models (to create):
```typescript
// Path parameter validation schema
const DeleteFlashcardByIdParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});
```

## 4. Response Details

### Success Response (200 OK):
```json
{
  "message": "Flashcard successfully deleted"
}
```

**Note:** HTTP 200 is used instead of 204 (No Content) because we return a confirmation message in the response body.

### Error Responses:
- **400 Bad Request** - Invalid ID format (non-numeric, negative, zero, or not an integer)
- **401 Unauthorized** - Missing, invalid, or expired authentication token
- **404 Not Found** - Flashcard not found or not owned by the authenticated user
- **500 Internal Server Error** - Database errors or unexpected server failures

## 5. Data Flow

1. **Route Handler** (`src/pages/api/flashcards/[id].ts`):
   - Extract `id` from path parameters
   - Validate ID using Zod schema
   - Retrieve authenticated user from `context.locals.supabase`
   - Call flashcard service to delete the flashcard
   - Return success message or appropriate error

2. **Service Layer** (`src/lib/services/flashcard.service.ts`):
   - Execute DELETE query with user_id and id filters
   - RLS automatically enforces ownership (`user_id = auth.uid()`)
   - Check affected row count to determine if deletion succeeded
   - Return true if deleted, false if not found/not owned

3. **Database Interaction:**
   - Single DELETE query with WHERE clauses: `id = $1 AND user_id = $2`
   - RLS policy enforces `user_id = auth.uid()` as additional safety layer
   - Foreign key constraint on generations.generation_id uses ON DELETE SET NULL
   - This means if a flashcard is deleted, any generations referencing it will have generation_id set to NULL (safe deletion)

## 6. Security Considerations

### Authentication & Authorization:
- Verify JWT token via Supabase client from `context.locals`
- Return 401 if user is not authenticated
- Rely on RLS policies to ensure users only delete their own flashcards
- **IDOR Protection:** RLS prevents deleting other users' flashcards

### Input Validation:
- Validate ID is a positive integer before querying database
- Reject negative numbers, zero, non-integers, and non-numeric values
- Return 400 for malformed IDs

### Information Disclosure Prevention:
- Return 404 for both "doesn't exist" and "not owned by user" scenarios
- Don't reveal in error messages whether flashcard exists for another user
- Prevents user enumeration and information leakage

### Referential Integrity:
- Database foreign key on generations table uses ON DELETE SET NULL
- Deleting a flashcard won't break referential integrity
- Generations referencing the deleted flashcard will have generation_id set to NULL

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
- Foreign key constraint violations (unexpected, should not occur with ON DELETE SET NULL)
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
- Single DELETE query using primary key lookup (id) - fast O(1) operation
- Index on `id` column is automatic (primary key)
- RLS filter uses indexed `user_id` column
- Minimal database overhead for single row deletion

### Query Efficiency:
- `.delete()` method in Supabase
- `.eq()` filters on indexed columns (id, user_id)
- No data transfer needed (deletion operation)
- Check affected rows count to verify success

### Cascade Handling:
- Foreign key with ON DELETE SET NULL is handled efficiently by PostgreSQL
- No application-level cascade logic needed
- Database handles referential integrity automatically

### Response Size:
- Response size: ~50 bytes (simple JSON message)
- Negligible network overhead

## 9. Implementation Steps

1. **Create Path Parameter Validation Schema:**
   - Define `DeleteFlashcardByIdParamsSchema` using Zod
   - Validate ID is a positive integer using `z.coerce.number().int().positive()`
   - Reuse pattern from GET and PATCH endpoints

2. **Add deleteFlashcard Method to Service:**
   - Add method `deleteFlashcard(userId: string, flashcardId: number, supabase: SupabaseClient): Promise<boolean>` to `src/lib/services/flashcard.service.ts`
   - Execute DELETE query:
     ```typescript
     const { error, count } = await supabase
       .from("flashcards")
       .delete({ count: "exact" })
       .eq("id", flashcardId)
       .eq("user_id", userId);
     ```
   - Return `count > 0` if successful deletion
   - Return `false` if no rows affected (not found or not owned)
   - Throw error for unexpected database errors

3. **Implement DELETE Handler:**
   - Add DELETE handler to `src/pages/api/flashcards/[id].ts`
   - Handler should:
     - Extract `id` from `context.params.id`
     - Validate with Zod schema, return 400 on errors
     - Get Supabase client from `context.locals.supabase`
     - Get authenticated user, return 401 if not authenticated
     - Call flashcard service
     - Return 404 if service returns false
     - Return 200 with success message if deleted

4. **Handle Errors:**
   - Wrap service call in try-catch
   - Return appropriate status codes (400, 401, 404, 500)
   - Use consistent error message format matching other endpoints
   - Log server errors for debugging

5. **Type Safety:**
   - Ensure response matches `DeleteResponseDTO` type
   - Use TypeScript to catch type mismatches at compile time
   - Validate response structure matches API specification