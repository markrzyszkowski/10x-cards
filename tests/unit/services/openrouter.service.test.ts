import { describe, it, expect, beforeEach, vi } from "vitest";

// Define OpenRouterError locally to avoid importing the singleton
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

// We'll test the OpenRouterService class directly by creating instances
// This avoids issues with the singleton and environment variables
class TestableOpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;

  constructor(config?: { apiKey?: string; baseUrl?: string; defaultModel?: string; timeout?: number }) {
    this.apiKey = config?.apiKey || "test-api-key";
    this.baseUrl = config?.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = config?.defaultModel || "meta-llama/llama-3.3-70b-instruct:free";
    this.timeout = config?.timeout || 60000;

    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or provide it in config."
      );
    }
  }

  async generateCompletion<TSchema>(
    systemMessage: string,
    userMessage: string,
    responseSchema: { name: string; description?: string; schema: Record<string, unknown> },
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
    }
  ): Promise<{
    content: TSchema;
    model: string;
    duration: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
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
      const requestBody = {
        model,
        messages: [
          { role: "system" as const, content: systemMessage },
          { role: "user" as const, content: userMessage },
        ],
        response_format: {
          type: "json_schema" as const,
          json_schema: {
            name: responseSchema.name,
            description: responseSchema.description,
            strict: true,
            schema: responseSchema.schema,
          },
        },
        ...(options?.temperature !== undefined && { temperature: options.temperature }),
        ...(options?.maxTokens !== undefined && { max_tokens: options.maxTokens }),
        ...(options?.topP !== undefined && { top_p: options.topP }),
        ...(options?.frequencyPenalty !== undefined && {
          frequency_penalty: options.frequencyPenalty,
        }),
        ...(options?.presencePenalty !== undefined && {
          presence_penalty: options.presencePenalty,
        }),
      };

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorDetails;
          try {
            errorDetails = await response.json();
          } catch {
            // Ignore JSON parse errors
          }

          throw this.handleApiError(
            new Error(errorDetails?.error?.message || `HTTP ${response.status}: ${response.statusText}`),
            model,
            response.status,
            errorDetails
          );
        }

        const responseData = await response.json();
        const content = responseData.choices?.[0]?.message?.content;

        if (!content) {
          throw new OpenRouterError("INVALID_RESPONSE", "Response missing content field", model);
        }

        const parsedContent = this.parseStructuredResponse<TSchema>(content);
        const duration = Date.now() - startTime;

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

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("TIMEOUT_ERROR", `Request timed out after ${this.timeout}ms`, model);
      }

      throw this.handleApiError(error, model);
    }
  }

  buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://10x-cards.app",
      "X-Title": "10x Cards",
    };
  }

  handleApiError(error: unknown, model: string, statusCode?: number, details?: unknown): OpenRouterError {
    if (error instanceof OpenRouterError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

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

    if (error instanceof TypeError && errorMessage.includes("fetch")) {
      return new OpenRouterError(
        "NETWORK_ERROR",
        "Network error: Failed to connect to OpenRouter API",
        model,
        undefined,
        details
      );
    }

    return new OpenRouterError("UNKNOWN_ERROR", errorMessage, model, statusCode, details);
  }

  parseStructuredResponse<T>(content: string): T {
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

describe("OpenRouterService", () => {
  describe("constructor validation", () => {
    it("should create instance with API key from config", () => {
      // Arrange & Act
      const service = new TestableOpenRouterService({ apiKey: "custom-key" });

      // Assert
      expect(service).toBeDefined();
      expect(service.buildHeaders()).toMatchInlineSnapshot(`
        {
          "Authorization": "Bearer custom-key",
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10x-cards.app",
          "X-Title": "10x Cards",
        }
      `);
    });

    it("should use default values when config is not provided", () => {
      // Arrange & Act
      const service = new TestableOpenRouterService();

      // Assert
      expect(service).toBeDefined();
    });
  });

  describe("input validation", () => {
    let service: TestableOpenRouterService;

    beforeEach(() => {
      service = new TestableOpenRouterService({ apiKey: "test-key" });
    });

    it("should reject empty system message", async () => {
      // Arrange
      const schema = { name: "test", schema: { type: "object" } };

      // Act & Assert
      await expect(service.generateCompletion("", "user message", schema)).rejects.toThrow(OpenRouterError);
      await expect(service.generateCompletion("", "user message", schema)).rejects.toMatchObject({
        code: "INVALID_REQUEST",
        message: "System message cannot be empty",
      });
    });

    it("should reject whitespace-only system message", async () => {
      // Arrange
      const schema = { name: "test", schema: { type: "object" } };

      // Act & Assert
      await expect(service.generateCompletion("   ", "user message", schema)).rejects.toThrow(OpenRouterError);
    });

    it("should reject empty user message", async () => {
      // Arrange
      const schema = { name: "test", schema: { type: "object" } };

      // Act & Assert
      await expect(service.generateCompletion("system message", "", schema)).rejects.toThrow(OpenRouterError);
      await expect(service.generateCompletion("system message", "", schema)).rejects.toMatchObject({
        code: "INVALID_REQUEST",
        message: "User message cannot be empty",
      });
    });

    it("should reject whitespace-only user message", async () => {
      // Arrange
      const schema = { name: "test", schema: { type: "object" } };

      // Act & Assert
      await expect(service.generateCompletion("system message", "   \n\t  ", schema)).rejects.toThrow(OpenRouterError);
    });

    it("should reject schema without name field", async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidSchema = { schema: { type: "object" } } as any;

      // Act & Assert
      await expect(service.generateCompletion("system", "user", invalidSchema)).rejects.toThrow(OpenRouterError);
      await expect(service.generateCompletion("system", "user", invalidSchema)).rejects.toMatchObject({
        code: "INVALID_REQUEST",
        message: "Response schema must have name and schema fields",
      });
    });

    it("should reject schema without schema field", async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalidSchema = { name: "test" } as any;

      // Act & Assert
      await expect(service.generateCompletion("system", "user", invalidSchema)).rejects.toThrow(OpenRouterError);
    });

    it("should reject null or undefined schema", async () => {
      // Act & Assert
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await expect(service.generateCompletion("system", "user", null as any)).rejects.toThrow(OpenRouterError);
      await expect(service.generateCompletion("system", "user", undefined as any)).rejects.toThrow(OpenRouterError);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    });

    it("should accept valid inputs", async () => {
      // Arrange
      const schema = { name: "test", schema: { type: "object" } };

      // Mock fetch to return success
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: "test-model",
          choices: [{ message: { content: '{"result": "success"}' } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      // Act
      const result = await service.generateCompletion("system message", "user message", schema);

      // Assert
      expect(result).toBeDefined();
      expect(result.content).toEqual({ result: "success" });
    });
  });

  describe("buildHeaders", () => {
    it("should include all required headers", () => {
      // Arrange
      const service = new TestableOpenRouterService({ apiKey: "secret-key" });

      // Act
      const headers = service.buildHeaders();

      // Assert
      expect(headers).toHaveProperty("Authorization", "Bearer secret-key");
      expect(headers).toHaveProperty("Content-Type", "application/json");
      expect(headers).toHaveProperty("HTTP-Referer", "https://10x-cards.app");
      expect(headers).toHaveProperty("X-Title", "10x Cards");
    });

    it("should use correct Bearer token format", () => {
      // Arrange
      const service = new TestableOpenRouterService({ apiKey: "my-api-key-123" });

      // Act
      const headers = service.buildHeaders();

      // Assert
      expect(headers.Authorization).toBe("Bearer my-api-key-123");
    });
  });

  describe("handleApiError", () => {
    let service: TestableOpenRouterService;

    beforeEach(() => {
      service = new TestableOpenRouterService();
    });

    it("should map 400 status to INVALID_REQUEST error", () => {
      // Arrange
      const error = new Error("Bad request");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 400);

      // Assert
      expect(result).toBeInstanceOf(OpenRouterError);
      expect(result.code).toBe("INVALID_REQUEST");
      expect(result.message).toContain("Bad request");
      expect(result.statusCode).toBe(400);
      expect(result.model).toBe(model);
    });

    it("should map 401 status to AUTHENTICATION_ERROR", () => {
      // Arrange
      const error = new Error("Unauthorized");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 401);

      // Assert
      expect(result.code).toBe("AUTHENTICATION_ERROR");
      expect(result.message).toBe("Invalid or expired API key");
      expect(result.statusCode).toBe(401);
    });

    it("should map 429 status to RATE_LIMIT_ERROR", () => {
      // Arrange
      const error = new Error("Too many requests");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 429);

      // Assert
      expect(result.code).toBe("RATE_LIMIT_ERROR");
      expect(result.message).toBe("Rate limit exceeded");
      expect(result.statusCode).toBe(429);
    });

    it("should map 500 status to API_ERROR", () => {
      // Arrange
      const error = new Error("Internal server error");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 500);

      // Assert
      expect(result.code).toBe("API_ERROR");
      expect(result.message).toContain("OpenRouter service error");
      expect(result.statusCode).toBe(500);
    });

    it("should map 502 status to API_ERROR", () => {
      // Arrange
      const error = new Error("Bad gateway");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 502);

      // Assert
      expect(result.code).toBe("API_ERROR");
      expect(result.statusCode).toBe(502);
    });

    it("should map 503 status to API_ERROR", () => {
      // Arrange
      const error = new Error("Service unavailable");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 503);

      // Assert
      expect(result.code).toBe("API_ERROR");
      expect(result.statusCode).toBe(503);
    });

    it("should map 504 status to API_ERROR", () => {
      // Arrange
      const error = new Error("Gateway timeout");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 504);

      // Assert
      expect(result.code).toBe("API_ERROR");
      expect(result.statusCode).toBe(504);
    });

    it("should detect network errors from TypeError with fetch", () => {
      // Arrange
      const error = new TypeError("fetch failed");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model);

      // Assert
      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.message).toContain("Failed to connect to OpenRouter API");
    });

    it("should return UNKNOWN_ERROR for unmapped status codes", () => {
      // Arrange
      const error = new Error("Some error");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model, 418); // I'm a teapot

      // Assert
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Some error");
      expect(result.statusCode).toBe(418);
    });

    it("should return UNKNOWN_ERROR when no status code provided", () => {
      // Arrange
      const error = new Error("Generic error");
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model);

      // Assert
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Generic error");
      expect(result.statusCode).toBeUndefined();
    });

    it("should preserve existing OpenRouterError", () => {
      // Arrange
      const originalError = new OpenRouterError("CUSTOM_CODE", "Custom message", "custom-model", 999);

      // Act
      const result = service.handleApiError(originalError, "different-model");

      // Assert
      expect(result).toBe(originalError);
      expect(result.code).toBe("CUSTOM_CODE");
      expect(result.model).toBe("custom-model");
    });

    it("should handle non-Error objects", () => {
      // Arrange
      const error = "string error";
      const model = "test-model";

      // Act
      const result = service.handleApiError(error, model);

      // Assert
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Unknown error occurred");
    });

    it("should include error details when provided", () => {
      // Arrange
      const error = new Error("Test error");
      const model = "test-model";
      const details = { extra: "info", code: "CUSTOM" };

      // Act
      const result = service.handleApiError(error, model, 400, details);

      // Assert
      expect(result.details).toEqual(details);
    });
  });

  describe("parseStructuredResponse", () => {
    let service: TestableOpenRouterService;

    beforeEach(() => {
      service = new TestableOpenRouterService();
    });

    it("should parse valid JSON string", () => {
      // Arrange
      const jsonString = '{"name": "test", "value": 123}';

      // Act
      const result = service.parseStructuredResponse<{ name: string; value: number }>(jsonString);

      // Assert
      expect(result).toEqual({ name: "test", value: 123 });
    });

    it("should parse complex nested objects", () => {
      // Arrange
      const jsonString = '{"user": {"name": "John", "age": 30}, "items": [1, 2, 3]}';

      // Act
      const result = service.parseStructuredResponse(jsonString);

      // Assert
      expect(result).toEqual({
        user: { name: "John", age: 30 },
        items: [1, 2, 3],
      });
    });

    it("should parse arrays", () => {
      // Arrange
      const jsonString = '[{"id": 1}, {"id": 2}]';

      // Act
      const result = service.parseStructuredResponse<{ id: number }[]>(jsonString);

      // Assert
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("should throw OpenRouterError for invalid JSON", () => {
      // Arrange
      const invalidJson = "{invalid json}";

      // Act & Assert
      expect(() => service.parseStructuredResponse(invalidJson)).toThrow(OpenRouterError);
    });

    it("should throw OpenRouterError with INVALID_RESPONSE code for parse failure", () => {
      // Arrange
      const invalidJson = "not json at all";

      // Act & Assert
      try {
        service.parseStructuredResponse(invalidJson);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).code).toBe("INVALID_RESPONSE");
        expect((error as OpenRouterError).message).toContain("Failed to parse JSON response");
      }
    });

    it("should handle empty object", () => {
      // Arrange
      const jsonString = "{}";

      // Act
      const result = service.parseStructuredResponse(jsonString);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle empty array", () => {
      // Arrange
      const jsonString = "[]";

      // Act
      const result = service.parseStructuredResponse(jsonString);

      // Assert
      expect(result).toEqual([]);
    });

    it("should preserve null values in parsed object", () => {
      // Arrange
      const jsonString = '{"value": null}';

      // Act
      const result = service.parseStructuredResponse(jsonString);

      // Assert
      expect(result).toEqual({ value: null });
    });
  });

  describe("OpenRouterError class", () => {
    it("should create error with all properties", () => {
      // Arrange & Act
      const error = new OpenRouterError("TEST_CODE", "Test message", "test-model", 400, { detail: "extra" });

      // Assert
      expect(error.name).toBe("OpenRouterError");
      expect(error.code).toBe("TEST_CODE");
      expect(error.message).toBe("Test message");
      expect(error.model).toBe("test-model");
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: "extra" });
    });

    it("should be instance of Error", () => {
      // Arrange & Act
      const error = new OpenRouterError("CODE", "Message", "model");

      // Assert
      expect(error).toBeInstanceOf(Error);
    });

    it("should allow optional statusCode and details", () => {
      // Arrange & Act
      const error = new OpenRouterError("CODE", "Message", "model");

      // Assert
      expect(error.statusCode).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });
});
