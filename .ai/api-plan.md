# REST API Plan

## 1. Resources

The API manages the following resources, mapped to database tables:

- **Users** - User authentication and account management (users table, managed by Supabase Auth)
- **Flashcards** - Educational flashcards (flashcards table)
- **Generations** - AI flashcard generation sessions (generations table)
- **Generation Error Logs** - Logs of failed AI generation attempts (generation_error_logs table)

## 2. Endpoints

### 2.2. Flashcard Endpoints

#### GET /api/flashcards

Retrieve all flashcards for the authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (optional, default: 50, max: 100) - Number of flashcards per page
- `offset` (optional, default: 0) - Offset for pagination
- `source` (optional) - Filter by source: 'ai-full', 'ai-edited', 'manual'
- `sort` (optional, default: 'created_at') - Sort field: 'created_at', 'updated_at', 'front'
- `order` (optional, default: 'desc') - Sort order: 'asc' or 'desc'

**Response (200 OK):**
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

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `400 Bad Request` - Invalid query parameters

---

#### GET /api/flashcards/{id}

Retrieve a specific flashcard by ID.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
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

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Flashcard not found or not owned by user

---

#### POST /api/flashcards

Create one or more flashcards.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**

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

**Response (201 Created):**

```json
{
  "flashcards": [
    {
      "id": 2,
      "front": "What is TypeScript?",
      "back": "A typed superset of JavaScript that compiles to plain JavaScript",
      "source": "manual",
      "generation_id": null
    },
    {
      "id": 3,
      "front": "What is Java?",
      "back": "A high-level, class-based, object-oriented programming language",
      "source": "ai-edited",
      "generation_id": 13
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `400 Bad Request` - Validation errors for any of the flashcards in the array

- **Validations:**
- `front`: maximum length of 200 characters.
- `back`: maximum length of 500 characters.
- `source`: must be one of `ai-full`, `ai-edited`, or `manual`.
- `generation_id`: required for `ai-full` and `ai-edited` sources, must be `null` for `manual` source.

---

#### PATCH /api/flashcards/{id}

Update an existing flashcard (partial update).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "front": "What is TypeScript used for?",
  "back": "Building type-safe JavaScript applications"
}
```

**Response (200 OK):**
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

**Business Logic:**
- If the original source was 'ai-full', it is automatically changed to 'ai-edited'
- The updated_at timestamp is automatically updated via database trigger

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Flashcard not found or not owned by user
- `400 Bad Request` - Validation errors

- **Validations:**
- `front`: maximum length of 200 characters.
- `back`: maximum length of 500 characters.

---

#### DELETE /api/flashcards/{id}

Delete a flashcard.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "Flashcard successfully deleted"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Flashcard not found or not owned by user

---

### 2.3. Generation Endpoints

#### POST /api/generations

Generate flashcard proposals using AI based on provided source text.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "source_text": "Long text content here (1000-10000 characters)..."
}
```

**Response (201 Created):**
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
      "front": "What is the main topic?",
      "back": "The main topic is..."
    },
    {
      "front": "Define key term X",
      "back": "Key term X means..."
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `400 Bad Request` - Text length outside 1000-10000 range, invalid model
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - AI API error (also logs to generation_error_logs)

---

#### GET /api/generations

Retrieve generation history for the authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (optional, default: 20, max: 100) - Number of generations per page
- `offset` (optional, default: 0) - Offset for pagination
- `sort` (optional, default: 'created_at') - Sort field
- `order` (optional, default: 'desc') - Sort order: 'asc' or 'desc'

**Response (200 OK):**
```json
{
  "generations": [
    {
      "id": 42,
      "model": "openai/gpt-4",
      "generated_count": 10,
      "accepted_unedited_count": 7,
      "accepted_edited_count": 2,
      "source_text_hash": "sha256_hash",
      "source_text_length": 5000,
      "generation_duration": 3500,
      "created_at": "2026-01-18T10:20:00Z",
      "updated_at": "2026-01-18T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

---

#### GET /api/generations/{id}

Retrieve details of a specific generation.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": 42,
  "model": "openai/gpt-4",
  "generated_count": 10,
  "accepted_unedited_count": 7,
  "accepted_edited_count": 2,
  "source_text_hash": "sha256_hash",
  "source_text_length": 5000,
  "generation_duration": 3500,
  "created_at": "2026-01-18T10:20:00Z",
  "updated_at": "2026-01-18T10:30:00Z",
  "flashcards": [
    {
      "id": 1,
      "front": "What is the main topic?",
      "back": "The main topic is...",
      "source": "ai-full"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Generation not found or not owned by user

---

### 2.4. Generation Error Logs Endpoints

#### GET /api/generation-error-logs

Retrieve generation error logs for the authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (optional, default: 20, max: 100) - Number of error logs per page
- `offset` (optional, default: 0) - Offset for pagination
- `sort` (optional, default: 'created_at') - Sort field
- `order` (optional, default: 'desc') - Sort order: 'asc' or 'desc'

**Response (200 OK):**
```json
{
  "error_logs": [
    {
      "id": 123,
      "error_code": "500",
      "error_message": "Rate limit exceeded",
      "model": "openai/gpt-4",
      "source_text_hash": "sha256_hash",
      "source_text_length": 5000,
      "created_at": "2026-01-18T10:25:00Z"
    },
    {
      "id": 122,
      "error_code": "400",
      "error_message": "Invalid model identifier",
      "model": "invalid/model",
      "source_text_hash": "sha256_hash",
      "source_text_length": 3500,
      "created_at": "2026-01-18T09:15:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The API uses **Supabase Auth** with JWT (JSON Web Tokens) for authentication:

1. **Registration/Login**: Users register or log in through Supabase Auth endpoints (`/api/auth/register`, `/api/auth/login`)
2. **Token Issuance**: Upon successful authentication, Supabase issues:
   - `access_token`: Short-lived JWT (default 1 hour) for API requests
   - `refresh_token`: Long-lived token for obtaining new access tokens
3. **Token Usage**: Clients include the access token in the Authorization header:
   ```
   Authorization: Bearer {access_token}
   ```
4. **Token Refresh**: When access token expires, clients use the refresh token to obtain a new access token via Supabase Auth
5. **Token Validation**: All protected endpoints validate the JWT using Supabase's built-in middleware

### 3.2. Authorization

Authorization is implemented using **Row-Level Security (RLS)** in PostgreSQL via Supabase:

1. **User Identification**: The authenticated user's ID is extracted from the JWT (`auth.uid()`)
2. **RLS Policies**: Database-level policies ensure:
   - Users can only read/write flashcards where `user_id = auth.uid()`
   - Users can only read/write generations where `user_id = auth.uid()`
   - Users can only read/write generation_error_logs where `user_id = auth.uid()`
3. **Automatic Enforcement**: RLS policies are enforced at the database level, preventing unauthorized access even if application code has bugs

**Rate Limiting:**
- Implemented for `/api/generations` endpoint to prevent abuse

---

## 4. Validation and Business Logic

### 4.1. Validation Rules

#### Flashcards
- **front**:
  - Required
  - Maximum 200 characters
  - Cannot be empty string
- **back**:
  - Required
  - Maximum 500 characters
  - Cannot be empty string
- **source**:
  - Required
  - Must be one of: 'ai-full', 'ai-edited', 'manual'
  - Automatically set
- **generation_id**:
  - Optional (nullable)
  - Must reference existing generation owned by user
  - Must be null for manual flashcards

#### Generations
- **source_text**:
  - Required
  - Minimum 1000 characters
  - Maximum 10000 characters

### 4.2. Business Logic Implementation

#### AI Generation:
  - Validate inputs and call the AI service upon POST /api/generations.
  - Record generation metadata (model, generated_count, duration) and send generated flashcards proposals to the user.
  - Log any errors in generation_error_logs for auditing and debugging.

#### Flashcard Management:
  - Automatic update of the updated_at field via database triggers when flashcards are modified.
  - Source update algorithm when flashcards are edited:
    - If current source is `ai-full` → change to `ai-edited`
    - If current source is `ai-edited` → remain `ai-edited`
    - If current source is `manual` → remain `manual`
