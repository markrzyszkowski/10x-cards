# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter service is responsible for managing communication with the OpenRouter.ai API to generate AI-powered flashcard content. This service encapsulates all LLM interaction logic, handles structured JSON responses via JSON Schema, manages model parameters, implements error handling, and provides a clean interface for the rest of the application.

### Key Responsibilities

- Initialize and configure OpenRouter API client with authentication
- Send chat completion requests with system and user messages
- Enforce structured JSON responses using `response_format` with JSON Schema
- Configure model selection and parameters (temperature, max_tokens, etc.)
- Handle API errors, rate limits, and network failures
- Parse and validate structured responses
- Track generation metadata (model used, duration, token usage)

### Location

The service will be implemented at: `src/lib/services/openrouter.service.ts`

## 2. Constructor Description

### Purpose

Initialize the OpenRouter service with required configuration, including API credentials and default model settings.

### Configuration Parameters

The constructor should accept an optional configuration object with:

- `apiKey`: OpenRouter API key (defaults to environment variable `OPENROUTER_API_KEY`)
- `baseUrl`: API base URL (defaults to `https://openrouter.ai/api/v1`)
- `defaultModel`: Default model identifier (`meta-llama/llama-3.3-70b-instruct:free`)
- `timeout`: Request timeout in milliseconds (defaults to 60000)

### Implementation Notes

- Use `import.meta.env` to access environment variables per Astro guidelines
- Validate that API key exists during construction
- Store configuration as private readonly fields
- Initialize HTTP client (native `fetch`) for API requests

## 3. Public Methods and Fields

### 3.1 `generateCompletion()`

#### Purpose

Generate a chat completion with structured JSON output for flashcard generation.

#### Method Signature

```typescript
async generateCompletion<TSchema>(
  systemMessage: string,
  userMessage: string,
  responseSchema: {
    name: string;
    description?: string;
    schema: Record<string, unknown>;
  },
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }
): Promise<OpenRouterCompletionResult<TSchema>>
```

#### Parameters

1. **systemMessage**: Instructions for the AI model defining its role and behavior
   - Example: `"You are an expert flashcard creator. Generate high-quality questions and answers from the provided text."`

2. **userMessage**: The actual content to process (source text for flashcard generation)
   - Example: The user's input text from which to generate flashcards

3. **responseSchema**: JSON Schema definition for structured output
   - **name**: Schema identifier (e.g., `"flashcard_proposals"`)
   - **description**: Optional schema description
   - **schema**: JSON Schema object defining the expected response structure
   - Example:
     ```typescript
     {
       name: "flashcard_proposals",
       description: "List of flashcard proposals",
       schema: {
         type: "object",
         properties: {
           proposals: {
             type: "array",
             items: {
               type: "object",
               properties: {
                 front: { type: "string" },
                 back: { type: "string" }
               },
               required: ["front", "back"],
               additionalProperties: false
             }
           }
         },
         required: ["proposals"],
         additionalProperties: false
       }
     }
     ```

4. **options**: Optional model parameters to override defaults
   - **model**: Model identifier (e.g., `"openai/gpt-4o"`, `"anthropic/claude-3.5-sonnet"`)
   - **temperature**: Controls randomness (0.0-2.0, default 1.0)
   - **maxTokens**: Maximum tokens in response
   - **topP**: Nucleus sampling parameter (0.0-1.0)
   - **frequencyPenalty**: Reduces repetition (-2.0 to 2.0)
   - **presencePenalty**: Encourages topic diversity (-2.0 to 2.0)

#### Return Type

```typescript
interface OpenRouterCompletionResult<T> {
  content: T;              // Parsed JSON matching the schema
  model: string;           // Actual model used
  duration: number;        // Generation time in milliseconds
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

#### Implementation Steps

1. Validate input parameters (non-empty messages, valid schema)
2. Build request payload with proper structure:
   ```typescript
   {
     model: options?.model || this.defaultModel,
     messages: [
       { role: "system", content: systemMessage },
       { role: "user", content: userMessage }
     ],
     response_format: {
       type: "json_schema",
       json_schema: {
         name: responseSchema.name,
         description: responseSchema.description,
         strict: true,
         schema: responseSchema.schema
       }
     },
     temperature: options?.temperature,
     max_tokens: options?.maxTokens,
     top_p: options?.topP,
     frequency_penalty: options?.frequencyPenalty,
     presence_penalty: options?.presencePenalty
   }
   ```
3. Record start time for duration tracking
4. Send POST request to `/chat/completions` endpoint
5. Handle HTTP errors and parse response
6. Extract and parse JSON content from `choices[0].message.content`
7. Validate parsed content against schema (using Zod if needed)
8. Calculate duration and extract usage data
9. Return structured result

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultModel: string;
private readonly timeout: number;
```

### 4.2 `buildHeaders()`

#### Purpose

Construct HTTP headers for OpenRouter API requests.

#### Method Signature

```typescript
private buildHeaders(): Record<string, string>
```

#### Return Value

```typescript
{
  "Authorization": `Bearer ${this.apiKey}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "https://10x-cards.app", // Your app URL
  "X-Title": "10x Cards" // Your app name
}
```

### 4.3 `handleApiError()`

#### Purpose

Transform OpenRouter API errors into application-specific error types.

#### Method Signature

```typescript
private handleApiError(error: unknown, model: string): OpenRouterError
```

#### Error Transformation Logic

1. **Network errors** (fetch failure): Map to `NETWORK_ERROR`
2. **400 Bad Request**: Map to `INVALID_REQUEST`
3. **401 Unauthorized**: Map to `AUTHENTICATION_ERROR`
4. **429 Too Many Requests**: Map to `RATE_LIMIT_ERROR`
5. **500+ Server errors**: Map to `API_ERROR`
6. **Timeout**: Map to `TIMEOUT_ERROR`
7. **JSON parsing error**: Map to `INVALID_RESPONSE`

#### Return Type

```typescript
interface OpenRouterError extends Error {
  code: string;
  statusCode?: number;
  model: string;
  details?: unknown;
}
```

### 4.4 `parseStructuredResponse()`

#### Purpose

Parse and validate the JSON content from the API response.

#### Method Signature

```typescript
private parseStructuredResponse<T>(content: string): T
```

#### Implementation

1. Parse JSON string to object
2. Handle JSON parsing errors
3. Optionally validate against schema (future enhancement with Zod)
4. Return typed result

## 5. Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing API key: Throw error during construction
   - Invalid base URL: Validate during construction

2. **Request Errors**
   - Invalid parameters: Throw `INVALID_REQUEST` before making API call
   - Empty messages: Validate and throw early
   - Invalid schema: Validate schema structure

3. **API Errors**
   - **Authentication (401)**: API key invalid or expired
     - Error code: `AUTHENTICATION_ERROR`
     - Message: "Invalid or expired API key"
     - Action: Check environment variable configuration

   - **Rate Limiting (429)**: Too many requests
     - Error code: `RATE_LIMIT_ERROR`
     - Message: "Rate limit exceeded"
     - Include: Retry-After header value if available
     - Action: Implement exponential backoff or queue

   - **Bad Request (400)**: Invalid request format
     - Error code: `INVALID_REQUEST`
     - Message: Extract from API response
     - Include: Validation errors from response body

   - **Server Error (500+)**: OpenRouter service issues
     - Error code: `API_ERROR`
     - Message: "OpenRouter service error"
     - Action: Retry with exponential backoff

4. **Response Errors**
   - Invalid JSON: `INVALID_RESPONSE`
   - Schema mismatch: `SCHEMA_VALIDATION_ERROR`
   - Missing expected fields: `INVALID_RESPONSE`

### Error Response Structure

All errors should be thrown as `OpenRouterError` instances:

```typescript
class OpenRouterError extends Error {
  constructor(
    public code: string,
    message: string,
    public model: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

### Error Logging Strategy

- Log all errors with full context (model, parameters, error details)
- Do not log sensitive data (API keys, user content)
- Include timestamp, request ID if available
- Use structured logging for easier debugging

## 6. Security Considerations

### 6.1 API Key Management

- **Never hardcode API keys** in source code
- Store API key in environment variable `OPENROUTER_API_KEY`
- Validate API key exists during service initialization
- Do not log or expose API key in error messages

### 6.2 Input Validation

- Sanitize user input before sending to API
- Validate message length limits (prevent excessive costs)
- Implement maximum token limits per request
- Validate schema structure before sending

### 6.3 Cost Control

- Set reasonable default `max_tokens` limits
- Monitor token usage per request
- Implement spending limits or alerts
- Log expensive requests for analysis

### 6.4 Error Information Disclosure

- Do not expose internal error details to end users
- Sanitize error messages before client display
- Log detailed errors server-side only
- Use generic error messages for client responses

## 7. Step-by-Step Implementation Plan

### Step 1: Create Service File Structure

1. Create file: `src/lib/services/openrouter.service.ts`
2. Import required dependencies:
   ```typescript
   import type { FlashcardProposalDTO } from "@/types.ts";
   ```

### Step 2: Define TypeScript Interfaces

1. Define `OpenRouterCompletionResult<T>` interface
2. Define `OpenRouterError` class extending `Error`
3. Define `OpenRouterConfig` interface for constructor
4. Define `CompletionOptions` interface for method parameters
5. Define `ResponseSchema` interface for JSON Schema structure
6. Define internal API request/response types

### Step 3: Implement Constructor and Configuration

1. Create `OpenRouterService` class
2. Implement constructor accepting optional config
3. Read `OPENROUTER_API_KEY` from `import.meta.env`
4. Validate API key existence, throw if missing
5. Set default values for baseUrl, model, timeout
6. Store configuration in private readonly fields

### Step 4: Implement Private Helper Methods

1. **Implement `buildHeaders()`**:
   - Return headers object with Authorization, Content-Type
   - Include HTTP-Referer and X-Title for OpenRouter tracking

2. **Implement `handleApiError()`**:
   - Accept error and model name
   - Check error type (network, HTTP, parse)
   - Map status codes to error codes
   - Extract error details from response body
   - Return structured `OpenRouterError`

3. **Implement `parseStructuredResponse<T>()`**:
   - Accept JSON string content
   - Parse to object with error handling
   - Return typed result
   - Future: Add Zod validation

### Step 5: Implement `generateCompletion()` Method

1. **Input Validation**:
   - Check systemMessage and userMessage are non-empty
   - Validate responseSchema has required fields
   - Validate options if provided

2. **Build Request Payload**:
   - Create messages array with system and user roles
   - Construct `response_format` object with `json_schema` type
   - Set `strict: true` in json_schema
   - Include model and optional parameters
   - Remove undefined values from payload

3. **Execute Request**:
   - Record start timestamp
   - Use `fetch()` with POST to `${baseUrl}/chat/completions`
   - Set headers using `buildHeaders()`
   - Set timeout using AbortSignal
   - Send JSON body

4. **Handle Response**:
   - Check response.ok, throw if not
   - Parse JSON response body
   - Extract `choices[0].message.content`
   - Parse structured content using `parseStructuredResponse()`
   - Extract usage data from `response.usage`
   - Calculate duration

5. **Error Handling**:
   - Wrap in try-catch
   - Use `handleApiError()` for error transformation
   - Re-throw as `OpenRouterError`

6. **Return Result**:
   - Return `OpenRouterCompletionResult` with content, model, duration, usage

### Step 6: Create Type Definitions in `src/lib/openrouter.service.ts`

Add OpenRouter-specific types if needed for broader use:

```typescript
export interface OpenRouterCompletionResult<T> {
  content: T;
  model: string;
  duration: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### Step 7: Export Service Instance

At the end of the file:

```typescript
// Export singleton instance
export const openRouterService = new OpenRouterService();
```

### Step 8: Update Generation Service

1. Open `src/lib/services/generation.service.ts`
2. Import `openRouterService`
3. Replace mock implementation in `generateFlashcards()`
4. Define flashcard proposal JSON schema
5. Call `openRouterService.generateCompletion()` with:
   - System message for flashcard generation instructions
   - User message with source text
   - Response schema for `FlashcardProposalDTO[]`
   - Optional parameters (temperature, maxTokens)
6. Update error handling to use `OpenRouterError`
7. Return result with actual model name and duration

## Example Usage

### Basic Flashcard Generation

```typescript
import { openRouterService } from "@/lib/services/openrouter.service.ts";
import type { FlashcardProposalDTO } from "@/types.ts";

// Define response schema
const flashcardSchema = {
  name: "flashcard_proposals",
  description: "List of flashcard question-answer pairs",
  schema: {
    type: "object",
    properties: {
      proposals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            front: { type: "string", description: "Question or prompt" },
            back: { type: "string", description: "Answer or explanation" }
          },
          required: ["front", "back"],
          additionalProperties: false
        }
      }
    },
    required: ["proposals"],
    additionalProperties: false
  }
};

// System message
const systemMessage = `You are an expert educational content creator specializing in flashcard generation.
Generate high-quality, focused flashcards from the provided text.
Each flashcard should test a single concept clearly and concisely.`;

// User message
const userMessage = `Generate flashcards from this text:\n\n${sourceText}`;

// Generate completion
try {
  const result = await openRouterService.generateCompletion<{
    proposals: FlashcardProposalDTO[]
  }>(
    systemMessage,
    userMessage,
    flashcardSchema,
    {
      model: "openai/gpt-4o",
      temperature: 0.7,
      maxTokens: 2000
    }
  );

  console.log(`Generated ${result.content.proposals.length} flashcards`);
  console.log(`Model: ${result.model}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Tokens used: ${result.usage?.totalTokens}`);

  return result.content.proposals;
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(`OpenRouter error [${error.code}]: ${error.message}`);
    // Handle specific error codes
    if (error.code === "RATE_LIMIT_ERROR") {
      // Wait and retry
    }
  }
  throw error;
}
```

## References

- [OpenRouter Structured Outputs Documentation](https://openrouter.ai/docs/guides/features/structured-outputs)
- [OpenRouter API Reference](https://openrouter.ai/docs/api/reference/overview)
- [OpenRouter API Parameters](https://openrouter.ai/docs/api/reference/parameters)
- [The Guide to the OpenRouter API in 2026](https://wisdom-gate.juheapi.com/blogs/the-guide-to-the-openrouter-api-2026)