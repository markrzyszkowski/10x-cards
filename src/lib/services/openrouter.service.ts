// ============================================================================
// TypeScript Interfaces and Types
// ============================================================================

/**
 * Configuration options for OpenRouterService
 */
export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
}

/**
 * Options for completion generation
 */
export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * JSON Schema definition for structured output
 */
export interface ResponseSchema {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
}

/**
 * Result returned from OpenRouter completion
 */
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

/**
 * Custom error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
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

// ============================================================================
// Internal API Types
// ============================================================================

/**
 * OpenRouter API message format
 */
interface APIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * OpenRouter API request body
 */
interface APIRequestBody {
  model: string;
  messages: APIMessage[];
  response_format: {
    type: "json_schema";
    json_schema: {
      name: string;
      description?: string;
      strict: boolean;
      schema: Record<string, unknown>;
    };
  };
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * OpenRouter API response format
 */
interface APIResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter API error response format
 */
interface APIErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

// ============================================================================
// OpenRouterService Class
// ============================================================================

/**
 * Service for interacting with OpenRouter.ai API
 * Handles AI-powered flashcard generation with structured JSON responses
 */
class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;

  constructor(config?: OpenRouterConfig) {
    // Read API key from environment or config
    this.apiKey = config?.apiKey || import.meta.env.OPENROUTER_API_KEY;

    // Validate API key exists
    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or provide it in config."
      );
    }

    // Set default configuration
    this.baseUrl = config?.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config?.defaultModel || "meta-llama/llama-3.3-70b-instruct:free";
    this.timeout = config?.timeout || 60000; // 60 seconds default
  }

  /**
   * Generates a chat completion with structured JSON output
   *
   * @param systemMessage - Instructions for the AI model
   * @param userMessage - Content to process
   * @param responseSchema - JSON Schema for structured output
   * @param options - Optional parameters for model configuration
   * @returns Completion result with parsed content and metadata
   * @throws OpenRouterError on failure
   */
  async generateCompletion<TSchema>(
    systemMessage: string,
    userMessage: string,
    responseSchema: ResponseSchema,
    options?: CompletionOptions
  ): Promise<OpenRouterCompletionResult<TSchema>> {
    // Input validation
    if (!systemMessage || systemMessage.trim().length === 0) {
      throw new OpenRouterError(
        "INVALID_REQUEST",
        "System message cannot be empty",
        options?.model || this.defaultModel
      );
    }

    if (!userMessage || userMessage.trim().length === 0) {
      throw new OpenRouterError("INVALID_REQUEST", "User message cannot be empty", options?.model || this.defaultModel);
    }

    if (!responseSchema?.name || !responseSchema?.schema) {
      throw new OpenRouterError(
        "INVALID_REQUEST",
        "Response schema must have name and schema fields",
        options?.model || this.defaultModel
      );
    }

    const model = options?.model || this.defaultModel;
    const startTime = Date.now();

    try {
      // Build request payload
      const requestBody: APIRequestBody = {
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: responseSchema.name,
            description: responseSchema.description,
            strict: true,
            schema: responseSchema.schema,
          },
        },
      };

      // Add optional parameters only if defined
      if (options?.temperature !== undefined) {
        requestBody.temperature = options.temperature;
      }
      if (options?.maxTokens !== undefined) {
        requestBody.max_tokens = options.maxTokens;
      }
      if (options?.topP !== undefined) {
        requestBody.top_p = options.topP;
      }
      if (options?.frequencyPenalty !== undefined) {
        requestBody.frequency_penalty = options.frequencyPenalty;
      }
      if (options?.presencePenalty !== undefined) {
        requestBody.presence_penalty = options.presencePenalty;
      }

      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.timeout);

      try {
        // Execute API request
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
          let errorDetails: APIErrorResponse | undefined;
          try {
            errorDetails = await response.json();
          } catch {
            // Ignore JSON parse errors for error response
          }

          throw this.handleApiError(
            new Error(errorDetails?.error?.message || `HTTP ${response.status}: ${response.statusText}`),
            model,
            response.status,
            errorDetails
          );
        }

        // Parse response
        const responseData: APIResponse = await response.json();

        // Extract content from first choice
        const content = responseData.choices?.[0]?.message?.content;
        if (!content) {
          throw new OpenRouterError("INVALID_RESPONSE", "Response missing content field", model);
        }

        // Parse structured response
        const parsedContent = this.parseStructuredResponse<TSchema>(content);

        // Calculate duration
        const duration = Date.now() - startTime;

        // Extract usage data
        const usage = responseData.usage
          ? {
              promptTokens: responseData.usage.prompt_tokens,
              completionTokens: responseData.usage.completion_tokens,
              totalTokens: responseData.usage.total_tokens,
            }
          : undefined;

        return {
          content: parsedContent,
          model: responseData.model,
          duration,
          usage,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("TIMEOUT_ERROR", `Request timed out after ${this.timeout}ms`, model);
      }

      // Handle other errors
      throw this.handleApiError(error, model);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Builds HTTP headers for OpenRouter API requests
   *
   * @returns Headers object with authentication and metadata
   */
  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://10x-cards.app",
      "X-Title": "10x Cards",
    };
  }

  /**
   * Transforms errors into OpenRouterError instances
   *
   * @param error - The caught error
   * @param model - Model name being used
   * @param statusCode - HTTP status code if available
   * @param details - Additional error details
   * @returns OpenRouterError instance
   */
  private handleApiError(error: unknown, model: string, statusCode?: number, details?: unknown): OpenRouterError {
    // Handle existing OpenRouterError
    if (error instanceof OpenRouterError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // Map HTTP status codes to error codes
    if (statusCode) {
      switch (statusCode) {
        case 400:
          return new OpenRouterError("INVALID_REQUEST", `Bad request: ${errorMessage}`, model, statusCode, details);
        case 401:
          return new OpenRouterError("AUTHENTICATION_ERROR", "Invalid or expired API key", model, statusCode, details);
        case 429:
          return new OpenRouterError("RATE_LIMIT_ERROR", "Rate limit exceeded", model, statusCode, details);
        case 500:
        case 502:
        case 503:
        case 504:
          return new OpenRouterError(
            "API_ERROR",
            `OpenRouter service error: ${errorMessage}`,
            model,
            statusCode,
            details
          );
      }
    }

    // Handle network errors
    if (error instanceof TypeError && errorMessage.includes("fetch")) {
      return new OpenRouterError(
        "NETWORK_ERROR",
        "Network error: Failed to connect to OpenRouter API",
        model,
        undefined,
        details
      );
    }

    // Default error
    return new OpenRouterError("UNKNOWN_ERROR", errorMessage, model, statusCode, details);
  }

  /**
   * Parses and validates JSON content from API response
   *
   * @param content - JSON string from API
   * @returns Parsed and typed content
   * @throws OpenRouterError if parsing fails
   */
  private parseStructuredResponse<T>(content: string): T {
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new OpenRouterError(
        "INVALID_RESPONSE",
        `Failed to parse JSON response: ${error instanceof Error ? error.message : "Unknown error"}`,
        "unknown"
      );
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

/**
 * Singleton instance of OpenRouterService
 * Use this for all OpenRouter API interactions
 */
export const openRouterService = new OpenRouterService();
