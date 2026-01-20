# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Endpoint Overview

This endpoint enables authenticated users to create one or more flashcards in a single batch operation. Flashcards can originate from three sources: AI-generated and accepted without edits (`ai-full`), AI-generated but edited by the user (`ai-edited`), or manually created by the user (`manual`). When flashcards are AI-generated, they must reference the generation record via `generation_id`.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/flashcards`
- **Authentication**: Required via Bearer token in Authorization header
- **Content-Type**: `application/json`

### Parameters

**Required:**
- `flashcards` (array): Array of flashcard objects to create (must contain at least one item)
  - `front` (string): Question or front side content
  - `back` (string): Answer or back side content
  - `source` (enum): Must be one of `'ai-full'`, `'ai-edited'`, or `'manual'`
  - `generation_id` (number | null): Reference to generation record

**Optional:**
- None

### Request Body Example

```json
{
  "flashcards": [
    {
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript that compiles to plain JavaScript",
      "source": "manual",
      "generation_id": null
    },
    {
      "front": "What is Java?",
      "back": "A high-level, class-based, object-oriented programming language",
      "source": "ai-edited",
      "generation_id": 13
    }
  ]
}
```

## 3. Used Types

All necessary types are already defined in `src/types.ts`:

### Request Types
- `CreateFlashcardsRequestDTO`: Request body structure containing array of flashcards
- `CreateFlashcardDTO`: Individual flashcard creation data (front, back, source, generation_id)

### Response Types
- `CreateFlashcardsResponseDTO`: Response structure containing array of created flashcards
- `FlashcardDTO`: Individual flashcard data with all fields except user_id

### Database Types
- `TablesInsert<"flashcards">`: Supabase insert type for flashcards table

## 4. Response Details

### Success Response (201 Created)

```json
{
  "flashcards": [
    {
      "id": 2,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript that compiles to plain JavaScript",
      "source": "manual",
      "generation_id": null,
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T10:30:00Z"
    },
    {
      "id": 3,
      "front": "What is Java?",
      "back": "A high-level, class-based, object-oriented programming language",
      "source": "ai-edited",
      "generation_id": 13,
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T10:30:00Z"
    }
  ]
}
```

### Error Responses

- **401 Unauthorized**: Missing or invalid authentication token
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

- **400 Bad Request**: Validation errors
  ```json
  {
    "error": "Bad Request",
    "message": "Validation error description"
  }
  ```

- **500 Internal Server Error**: Server-side errors
  ```json
  {
    "error": "Internal Server Error",
    "message": "An unexpected error occurred"
  }
  ```

## 5. Data Flow

1. **Request Reception**: Astro API route receives POST request
2. **Authentication**: Middleware extracts and validates Bearer token via Supabase Auth
3. **User Context**: Extract `user_id` from authenticated session in `context.locals`
4. **Request Validation**: Validate request body against Zod schema
5. **Generation Verification** (if applicable): For flashcards with `generation_id`, verify the generation exists and belongs to the authenticated user
6. **Service Call**: Call flashcard service to perform batch insert with user_id
7. **Database Insert**: Supabase inserts flashcards into `flashcards` table with RLS enforced
8. **Response Formation**: Format created flashcards (excluding user_id) and return with 201 status

## 6. Security Considerations

### Authentication & Authorization
- Verify Bearer token via Supabase Auth middleware
- Extract user_id from authenticated session
- Never trust user_id from request body; always use authenticated session
- Rely on Supabase RLS policies to ensure users can only create flashcards for themselves

### Input Validation
- Validate all inputs using Zod schema before database operations
- Enforce maximum length constraints (front: 200 chars, back: 500 chars)
- Validate `source` enum against allowed values
- Validate conditional `generation_id` requirements based on source type

### Cross-User Data Protection
- When `generation_id` is provided, verify it belongs to the authenticated user
- Perform this check via Supabase query filtering by both id and user_id

### Data Sanitization
- While Supabase prevents SQL injection, be aware that front/back content may be rendered as HTML
- Consider XSS risks if content is displayed without proper escaping in the frontend

## 7. Error Handling

### Validation Errors (400 Bad Request)

| Scenario | Error Message |
|----------|---------------|
| Empty flashcards array | "At least one flashcard is required" |
| Missing required fields | "Missing required field: {field_name}" |
| `front` exceeds 200 characters | "Front text must not exceed 200 characters" |
| `back` exceeds 500 characters | "Back text must not exceed 500 characters" |
| Invalid `source` value | "Source must be one of: ai-full, ai-edited, manual" |
| `generation_id` provided for manual source | "generation_id must be null for manual source" |
| `generation_id` missing for AI sources | "generation_id is required for ai-full and ai-edited sources" |
| `generation_id` doesn't exist | "Invalid generation_id: generation not found" |
| `generation_id` belongs to different user | "Invalid generation_id: generation not found" |

### Authentication Errors (401 Unauthorized)

| Scenario | Error Message |
|----------|---------------|
| Missing Authorization header | "Authentication required" |
| Invalid token format | "Invalid authentication token" |
| Expired token | "Authentication token expired" |
| Token doesn't match valid user | "Invalid authentication credentials" |

### Database Errors (500 Internal Server Error)

| Scenario | Handling |
|----------|----------|
| Database connection failure | Log error, return generic 500 message |
| Supabase service unavailable | Log error, return generic 500 message |
| Unexpected database constraint violation | Log error, return generic 500 message |

## 8. Performance Considerations

### Optimization Strategies
- Use batch insert operation for all flashcards in single database round-trip
- Leverage Supabase's built-in connection pooling
- Ensure database indices exist on `user_id` and `generation_id` columns (per db-plan.md)

### Potential Bottlenecks
- Large batch sizes: Consider limiting array size (e.g., max 50 flashcards per request)
- Generation verification queries: For large batches with many different generation_ids, multiple verification queries may be needed

### Database Considerations
- The `updated_at` trigger will fire for each inserted row
- RLS policies will be evaluated for each row
- Index on `user_id` will optimize RLS policy checks
- Index on `generation_id` will optimize foreign key verification

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
Create validation schema in the API route file:
```typescript
const createFlashcardSchema = z.object({
  front: z.string().max(200, "Front text must not exceed 200 characters"),
  back: z.string().max(500, "Back text must not exceed 500 characters"),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
  generation_id: z.number().nullable(),
}).refine(
  (data) => {
    if (data.source === "manual") {
      return data.generation_id === null;
    }
    return data.generation_id !== null;
  },
  {
    message: "generation_id must be null for manual source and required for AI sources",
  }
);

const createFlashcardsRequestSchema = z.object({
  flashcards: z.array(createFlashcardSchema).min(1, "At least one flashcard is required"),
});
```

### Step 2: Create/Update Flashcard Service
File: `src/lib/services/flashcard.service.ts`

Implement `createFlashcards` function:
- Accept parameters: `userId: string`, `flashcards: CreateFlashcardDTO[]`, `supabase: SupabaseClient`
- Extract unique generation_ids from flashcards array
- Verify all generation_ids belong to the user (single query filtering by user_id and id IN array)
- If any generation_id is invalid, throw error
- Map flashcards to insert data with user_id added
- Perform batch insert using Supabase
- Return created flashcards with all fields

### Step 3: Create API Route Handler
File: `src/pages/api/flashcards.ts`

Add `export const prerender = false` at the top.

Implement POST handler:
- Extract `supabase` from `context.locals`
- Get authenticated user from session
- If no user, return 401 Unauthorized
- Parse and validate request body using Zod schema
- Handle validation errors with 400 status
- Call flashcard service with user_id, flashcards array, and supabase client
- Handle service errors appropriately (400 for business logic errors, 500 for unexpected errors)
- Return 201 Created with `CreateFlashcardsResponseDTO`

### Step 4: Error Handling Implementation
- Implement try-catch blocks for validation and database operations
- Map Zod validation errors to user-friendly messages
- Map service layer errors to appropriate HTTP status codes
- Log unexpected errors for debugging
- Return consistent error response format

### Step 5: Integration Points
- Ensure middleware properly sets up `context.locals.supabase`
- Verify RLS policies are enabled on flashcards table
- Confirm indices exist on `user_id` and `generation_id` columns