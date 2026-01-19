# API Endpoint Implementation Plan: POST /api/generations

## 1. Endpoint Overview

This endpoint generates AI-powered flashcard proposals based on user-provided source text. It validates the input text, calls an AI service (via OpenRouter.ai) to generate flashcard suggestions, stores generation metadata in the database, and returns both the metadata and flashcard proposals to the user for review and acceptance.

The endpoint is authenticated and tracks all generation attempts, including failures, for monitoring and cost analysis purposes.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/generations`
- **Headers**:
  - `Authorization: Bearer {access_token}` (required)
  - `Content-Type: application/json` (required)
- **Parameters**:
  - **Required**: None (body-based endpoint)
  - **Optional**: None
- **Request Body**:
```typescript
{
  "source_text": string // 1000-10000 characters
}
```

**Validation Rules**:
- `source_text` must be a non-empty string
- `source_text` length must be between 1000 and 10000 characters (inclusive)
- Request must include valid Bearer token from Supabase Auth

## 3. Used Types

**Request Types**:
- `CreateGenerationRequestDTO` (from `src/types.ts`)

**Response Types**:
- `CreateGenerationResponseDTO` (from `src/types.ts`)
- `GenerationMetadataDTO` (from `src/types.ts`)
- `FlashcardProposalDTO` (from `src/types.ts`)

**Database Types**:
- `TablesInsert<"generations">` (for inserting generation record)
- `TablesInsert<"generation_error_logs">` (for error logging)

**Service Types** (to be created):
```typescript
interface AIGenerationResult {
  model: string;
  proposals: FlashcardProposalDTO[];
  generationDuration: number;
}

interface AIGenerationError {
  code: string;
  message: string;
  model: string;
}
```

## 4. Response Details

**Success Response (201 Created)**:
```json
{
  "generation": {
    "id": 42,
    "model": "openai/gpt-4",
    "generated_count": 10,
    "generation_duration": 3500
  },
  "proposals": [
    {
      "front": "Question text",
      "back": "Answer text"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing authentication token
  ```json
  { "error": "Unauthorized" }
  ```
- `400 Bad Request`: Input validation failure
  ```json
  { "error": "Source text must be between 1000 and 10000 characters" }
  ```
- `429 Too Many Requests`: Rate limit exceeded
  ```json
  { "error": "Rate limit exceeded. Please try again later." }
  ```
- `500 Internal Server Error`: AI API or database errors
  ```json
  { "error": "Failed to generate flashcards. Please try again." }
  ```

## 5. Data Flow

1. **Request Reception**:
   - Astro middleware validates authentication via Supabase
   - Extract user ID from `context.locals.supabase.auth.getUser()`

2. **Input Validation**:
   - Validate request body using Zod schema
   - Check source_text length constraints

3. **AI Generation** (via `generation.service`):
   - Calculate source_text_hash (e.g., SHA-256)
   - Measure source_text_length
   - Call OpenRouter.ai API with source text
   - Track generation start/end time for duration calculation
   - Parse AI response into `FlashcardProposalDTO[]`

4. **Success Path**:
   - Insert generation record into `generations` table:
     - `user_id`: from auth context
     - `model`: from AI response
     - `generated_count`: number of proposals
     - `source_text_hash`: calculated hash
     - `source_text_length`: character count
     - `generation_duration`: milliseconds elapsed
     - `accepted_unedited_count`: NULL (not yet known)
     - `accepted_edited_count`: NULL (not yet known)
   - Return generation metadata and proposals

5. **Error Path**:
   - Insert error record into `generation_error_logs` table:
     - `user_id`: from auth context
     - `model`: attempted model
     - `source_text_hash`: calculated hash
     - `source_text_length`: character count
     - `error_code`: from AI API or custom code
     - `error_message`: error description
   - Return 500 error to client

## 6. Security Considerations

1. **Authentication**:
   - Use Supabase Auth middleware to verify Bearer token
   - Extract user ID from authenticated session
   - Reject requests without valid tokens (401)

2. **Authorization**:
   - User can only create generations for themselves
   - User ID is server-side determined, never from client input

3. **Input Validation**:
   - Strict validation of source_text length (1000-10000 chars)
   - Sanitize/validate text before sending to AI API
   - Consider implementing content filtering for inappropriate text

4. **Rate Limiting**:
   - Implement rate limiting per user to prevent abuse
   - Suggested: 10 generations per hour per user
   - Track in memory
   - Return 429 when limit exceeded

5. **AI Prompt Injection**:
   - Use structured prompt format to minimize injection risks
   - Clearly delineate user input from system instructions
   - Consider input sanitization for special characters

6. **Data Protection**:
   - Don't log source_text in plain text (use hash only)
   - Ensure RLS policies are active on tables
   - Use HTTPS for all communications

## 7. Error Handling

**Error Categories and Handling**:

1. **Authentication Errors (401)**:
   - Missing Authorization header
   - Invalid or expired token
   - User not found
   - **Action**: Return 401, don't log to error table

2. **Validation Errors (400)**:
   - Missing source_text field
   - source_text too short (< 1000 chars)
   - source_text too long (> 10000 chars)
   - Invalid JSON format
   - **Action**: Return 400 with specific error message, don't log to error table

3. **Rate Limiting Errors (429)**:
   - User exceeded generation quota
   - **Action**: Return 429, don't log to error table

4. **AI API Errors (500)**:
   - OpenRouter.ai connection timeout
   - OpenRouter.ai returns error response
   - Invalid API key configuration
   - AI model unavailable
   - **Action**: Log to `generation_error_logs`, return 500

5. **Database Errors (500)**:
   - Failed to insert generation record
   - Failed to insert error log
   - Connection timeout
   - **Action**: Log to application logs, return 500

6. **Parsing Errors (500)**:
   - AI returns invalid JSON
   - AI response doesn't match expected schema
   - **Action**: Log to `generation_error_logs`, return 500

## 8. Performance Considerations

**Potential Bottlenecks**:
1. AI API response time (typically 2-10 seconds)
2. Database writes for generation records
3. Hash calculation for source text

**Optimization Strategies**:
1. **Async Operations**:
   - Use async/await properly throughout
   - Don't block on non-critical operations

2. **Caching**:
   - Cache rate limit counters in memory

3. **Database Optimization**:
   - Ensure indices exist on `generations.user_id` and `generation_error_logs.user_id`
   - Use database connection pooling (handled by Supabase)

4. **Timeout Handling**:
   - Set reasonable timeout for AI API (60 seconds)
   - Return timeout error rather than hanging indefinitely

## 9. Implementation Steps

1. **Create Zod Validation Schema**:
   - Create `src/lib/validation/generation.validation.ts`
   - Define schema for `CreateGenerationRequestDTO`
   - Export validation function

2. **Create Generation Service**:
   - Create `src/lib/services/generation.service.ts`
   - Implement `generateFlashcards()` method:
     - Accept source_text and user_id
     - Calculate source_text_hash using crypto
     - Mock OpenRouter.ai API call with structured prompt (mocks will be replaced later)
     - Parse and validate AI response
     - Return `AIGenerationResult`
   - Implement `logGenerationError()` method:
     - Insert into `generation_error_logs` table
     - Handle database errors gracefully

3. **Implement Rate Limiting**:
   - Create `src/lib/services/rate-limit.service.ts`
   - Implement check for user generation quota
   - Use in-memory storage for tracking
   - Return boolean indicating if request allowed

4. **Create API Endpoint Handler**:
   - Create `src/pages/api/generations.ts`
   - Add `export const prerender = false`
   - Implement POST handler:
     ```typescript
     export async function POST(context: APIContext) {
       // 1. Get authenticated user
       // 2. Validate request body
       // 3. Check rate limit
       // 4. Call generation service
       // 5. Insert generation record
       // 6. Return response
       // 7. Handle errors appropriately
     }
     ```

5. **Implement Authentication Check**:
   - Use `context.locals.supabase.auth.getUser()`
   - Return 401 if not authenticated
   - Extract user_id for subsequent operations

6. **Implement Request Validation**:
   - Parse request body as JSON
   - Validate using Zod schema
   - Return 400 with specific error on validation failure

7. **Implement Rate Limit Check**:
   - Call rate limit service
   - Return 429 if limit exceeded

8. **Implement AI Generation Flow**:
   - Call `generationService.generateFlashcards()`
   - Measure total generation duration
   - Handle success and error cases

9. **Implement Database Operations**:
   - On success: Insert into `generations` table using Supabase client
   - On error: Call `generationService.logGenerationError()`
   - Use `context.locals.supabase` for all database operations

10. **Implement Response Formatting**:
    - Format successful response as `CreateGenerationResponseDTO`
    - Return with 201 status code
    - Include appropriate headers

11. **Add Error Handling**:
    - Wrap operations in try-catch blocks
    - Map errors to appropriate status codes
    - Ensure errors are logged appropriately
    - Return user-friendly error messages
