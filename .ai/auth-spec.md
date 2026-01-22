# Authentication System Architecture Specification

## Executive Summary

This document outlines the detailed architecture for implementing user authentication in the 10x Cards application, including registration, login, logout, and password recovery functionality. The solution leverages Supabase Auth for secure authentication while maintaining compatibility with the existing Astro-based application structure.

## 1. User Interface Architecture

### 1.1 Page Structure

#### 1.1.1 New Pages (Public - No Authentication Required)

**`/login` - Login Page**
- **File**: `src/pages/login.astro`
- **Purpose**: User authentication entry point
- **Layout**: Uses `Layout.astro` with simplified structure (no navigation for authenticated users)
- **Components**:
  - `LoginForm` (React component with `client:load` directive)
  - Error message display area
  - Link to registration page
  - Link to password recovery page
- **Server-side Logic**:
  - Check if user is already authenticated (redirect to `/generate` if logged in)
  - No authentication guard required
- **Pre-render**: `export const prerender = false` (SSR required for session checking)

**`/register` - Registration Page**
- **File**: `src/pages/register.astro`
- **Purpose**: New user account creation
- **Layout**: Uses `Layout.astro` with simplified structure
- **Components**:
  - `RegisterForm` (React component with `client:load` directive)
  - Link to login page
- **Server-side Logic**:
  - Check if user is already authenticated (redirect to `/generate` if logged in)
  - No authentication guard required
- **Pre-render**: `export const prerender = false`

**`/reset-password` - Password Reset Request Page**
- **File**: `src/pages/reset-password.astro`
- **Purpose**: Initiate password recovery process
- **Layout**: Uses `Layout.astro` with simplified structure
- **Components**:
  - `ResetPasswordForm` (React component with `client:load` directive)
  - Success message display
  - Link back to login page
- **Server-side Logic**:
  - No authentication required
  - Email validation only
- **Pre-render**: `export const prerender = false`

**`/update-password` - Password Update Page**
- **File**: `src/pages/update-password.astro`
- **Purpose**: Complete password reset with token from email
- **Layout**: Uses `Layout.astro` with simplified structure
- **Components**:
  - `UpdatePasswordForm` (React component with `client:load` directive)
  - Token validation feedback
- **Server-side Logic**:
  - Validate reset token from URL query parameters
  - Handle Supabase Auth callback
- **Pre-render**: `export const prerender = false`

#### 1.1.2 Modified Pages (Protected - Authentication Required)

**`/generate` - Flashcard Generation Page** (EXISTING - REQUIRES MODIFICATION)
- **File**: `src/pages/generate.astro` (lines 5-9 contain TODO for auth implementation)
- **Current State**: Contains commented-out authentication check
- **Required Changes**:
  - Uncomment and activate authentication guard
  - Add user context passing to `GenerateView` component
  - Redirect unauthenticated users to `/login`
- **Server-side Logic**:
  ```typescript
  const { data: { user }, error } = await context.locals.supabase.auth.getUser();
  if (error || !user) {
    return Astro.redirect("/login");
  }
  ```

**`/` - Index/Home Page** (EXISTING - REQUIRES MODIFICATION)
- **File**: `src/pages/index.astro` (currently redirects to `/generate`)
- **Current State**: Simple redirect to `/generate`
- **Required Changes**:
  - Add authentication check
  - Redirect authenticated users to `/generate`
  - Redirect unauthenticated users to `/login`

**`/profile` - User Profile and Account Management Page** (REQUIRED FOR MVP - GDPR)
- **File**: `src/pages/profile.astro`
- **Purpose**: User account management including account deletion (PRD Section 3.3 - GDPR requirement)
- **Layout**: Uses `Layout.astro` with header
- **Components**:
  - `ProfileView` (React component with `client:load` directive)
  - Account information display
  - Account deletion section with confirmation
- **Server-side Logic**:
  - Requires authentication (redirect to `/login` if not authenticated)
  - Pass user data to component
- **Pre-render**: `export const prerender = false`

**Future Protected Pages** (Not yet implemented, but planned for later iterations):
- `/flashcards` - Flashcard management view (US-005, US-006, US-007)
- `/study` - Study session view (US-008)

### 1.2 Component Architecture

#### 1.2.1 Authentication Forms (New React Components)

**`LoginForm` Component**
- **File**: `src/components/LoginForm.tsx`
- **Type**: Interactive React component
- **Responsibilities**:
  - Email and password input fields (using `Input` from `src/components/ui/input.tsx`)
  - Client-side validation
  - Form submission handling
  - Error state management and display
  - Loading state during authentication
  - Integration with Supabase Auth via `signInWithPassword`
  - Redirect to `/generate` on successful login
- **State Management**:
  - `email: string`
  - `password: string`
  - `error: string | null`
  - `isLoading: boolean`
- **Validation Rules**:
  - Email: Required, valid email format
  - Password: Required, minimum 8 characters
- **Error Scenarios**:
  - Invalid credentials: "Invalid email or password"
  - Account not confirmed: "Please confirm your email address"
  - Too many attempts: "Too many login attempts. Please try again later"
  - Server error: "An unexpected error occurred. Please try again"
- **UI Components Used**:
  - `Input` (email, password types)
  - `Button` (submit, loading state)
  - `Alert` (error display)
  - `Card` (form container)

**`RegisterForm` Component**
- **File**: `src/components/RegisterForm.tsx`
- **Type**: Interactive React component
- **Responsibilities**:
  - Email and password input fields
  - Password confirmation field
  - Client-side validation
  - Form submission handling
  - Error and success state management
  - Integration with Supabase Auth via `signUp`
  - Display confirmation message (email verification required)
- **State Management**:
  - `email: string`
  - `password: string`
  - `confirmPassword: string`
  - `error: string | null`
  - `isLoading: boolean`
  - `registrationSuccess: boolean`
- **Validation Rules**:
  - Email: Required, valid email format, max 255 characters
  - Password: Required, minimum 8 characters, must contain uppercase, lowercase, number
  - Confirm Password: Must match password
- **Error Scenarios**:
  - Email already registered: "An account with this email already exists"
  - Weak password: "Password must contain uppercase, lowercase, and number"
  - Passwords don't match: "Passwords do not match"
  - Server error: "Registration failed. Please try again"
- **Success Flow**:
  - Show success message: "Registration successful! Please check your email to confirm your account"
  - Disable form inputs
  - Provide link to login page
- **UI Components Used**:
  - `Input` (email, password types)
  - `Button` (submit, loading state)
  - `Alert` (error/success display)
  - `Card` (form container)

**`ResetPasswordForm` Component**
- **File**: `src/components/ResetPasswordForm.tsx`
- **Type**: Interactive React component
- **Responsibilities**:
  - Email input field
  - Form submission handling
  - Integration with Supabase Auth via `resetPasswordForEmail`
  - Success message display
  - Error handling
- **State Management**:
  - `email: string`
  - `error: string | null`
  - `isLoading: boolean`
  - `emailSent: boolean`
- **Validation Rules**:
  - Email: Required, valid email format
- **Error Scenarios**:
  - Invalid email: "Please enter a valid email address"
  - Server error: "Unable to send reset email. Please try again"
- **Success Flow**:
  - Show success message: "Password reset instructions have been sent to your email"
  - Keep form visible (allow re-submission if needed)
  - Provide link back to login
- **Configuration**:
  - Redirect URL: `{APP_URL}/update-password` (set in Supabase config)
- **UI Components Used**:
  - `Input` (email type)
  - `Button` (submit, loading state)
  - `Alert` (error/success display)
  - `Card` (form container)

**`UpdatePasswordForm` Component**
- **File**: `src/components/UpdatePasswordForm.tsx`
- **Type**: Interactive React component
- **Responsibilities**:
  - New password input field
  - Password confirmation field
  - Token validation (from URL)
  - Form submission handling
  - Integration with Supabase Auth via `updateUser`
  - Success redirect to login
- **State Management**:
  - `password: string`
  - `confirmPassword: string`
  - `error: string | null`
  - `isLoading: boolean`
  - `tokenValid: boolean`
- **Validation Rules**:
  - Password: Required, minimum 8 characters, must contain uppercase, lowercase, number
  - Confirm Password: Must match password
- **Error Scenarios**:
  - Invalid/expired token: "This password reset link is invalid or has expired"
  - Weak password: "Password must contain uppercase, lowercase, and number"
  - Passwords don't match: "Passwords do not match"
  - Server error: "Failed to update password. Please try again"
- **Success Flow**:
  - Show success message: "Password updated successfully"
  - Redirect to `/login` after 2 seconds
- **UI Components Used**:
  - `Input` (password type)
  - `Button` (submit, loading state)
  - `Alert` (error/success display)
  - `Card` (form container)

#### 1.2.2 Navigation Components (New/Modified)

**`Header` Component** (NEW)
- **File**: `src/components/Header.tsx`
- **Type**: React component (interactive)
- **Purpose**: Application header with navigation and user menu
- **Visibility**: Shown only on authenticated pages
- **Responsibilities**:
  - Display application logo/name
  - Navigation links to main sections
  - User menu dropdown
  - Logout functionality
- **Props**:
  - `user: { email: string }` - Current authenticated user
- **Navigation Items** (authenticated):
  - Generate (link to `/generate`)
  - My Flashcards (link to `/flashcards` - future)
  - Study (link to `/study` - future)
- **User Menu Items**:
  - Display user email
  - Profile (link to `/profile` - for account management and deletion)
  - Logout button
- **Logout Flow**:
  - Call `supabase.auth.signOut()`
  - Clear local state
  - Redirect to `/login`
- **UI Components Used**:
  - Dropdown menu (from shadcn/ui)
  - `Button`

**`ProfileView` Component** (NEW - REQUIRED FOR MVP)
- **File**: `src/components/ProfileView.tsx`
- **Type**: Interactive React component
- **Purpose**: User account management and deletion (GDPR requirement from PRD Section 3.3)
- **Responsibilities**:
  - Display user account information (email, registration date)
  - Provide account deletion functionality with confirmation
  - Handle cascade deletion of user data
  - Integration with Supabase for account deletion
- **Props**:
  - `user: { id: string; email: string; created_at: string }`
- **State Management**:
  - `showDeleteConfirmation: boolean`
  - `deleteConfirmationText: string`
  - `isDeleting: boolean`
  - `error: string | null`
- **Account Deletion Flow**:
  1. User clicks "Delete Account" button
  2. Show confirmation dialog with warning message
  3. Require user to type their email to confirm
  4. On confirmation, call `DELETE /api/auth/account` endpoint
  5. Backend cascades deletion of all user data (flashcards, generations, logs)
  6. Sign out user and redirect to `/register` with success message
- **Confirmation Requirements**:
  - User must type their email address exactly to enable delete button
  - Clear warning about data loss and irreversibility
  - "This action cannot be undone" message
- **UI Components Used**:
  - `Card` (profile information container)
  - `Button` (delete button with destructive variant)
  - `Dialog` (confirmation modal from shadcn/ui)
  - `Input` (email confirmation field)
  - `Alert` (warning and error messages)

**Layout Modifications**
- **File**: `src/layouts/Layout.astro`
- **Current State**: Simple HTML structure with slot
- **Required Changes**:
  - Accept optional `user` prop for authenticated state
  - Conditionally render `Header` component when user is present
  - Add wrapper for proper page structure with header
- **Props**:
  ```typescript
  interface Props {
    title?: string;
    user?: { email: string } | null;
  }
  ```

#### 1.2.3 Validation and Error Handling

**Client-side Validation Strategy**
- Use native HTML5 validation attributes where possible
- Implement custom validation logic for complex rules
- Real-time validation feedback (on blur)
- Display validation errors inline below each field
- Disable submit button until form is valid (optional, UX consideration)

**Error Message Component** (EXISTING)
- **File**: `src/components/ErrorMessage.tsx` (already exists)
- **Usage**: Reuse for authentication error displays
- **Modifications**: May need minor adjustments for auth-specific styling

**Success Message Component** (EXISTING)
- **File**: `src/components/SuccessMessage.tsx` (already exists)
- **Usage**: Reuse for registration/password reset confirmations

### 1.3 User Flow Diagrams

#### 1.3.1 Registration Flow
```
User visits /register
    ↓
Fills registration form (email, password, confirm password)
    ↓
Client-side validation
    ↓ (validation passes)
Submit to Supabase Auth signUp()
    ↓
[Success] → Display: "Check your email to confirm account"
           → Show link to login
    ↓
[Error] → Display specific error message
         → Allow retry
```

#### 1.3.2 Login Flow
```
User visits /login
    ↓
Fills login form (email, password)
    ↓
Client-side validation
    ↓ (validation passes)
Submit to Supabase Auth signInWithPassword()
    ↓
[Success] → Set session cookie
           → Redirect to /generate
    ↓
[Error - Invalid Credentials] → Display error
                                → Allow retry
    ↓
[Error - Email Not Confirmed] → Display message with resend link
```

#### 1.3.3 Password Reset Flow
```
User visits /reset-password
    ↓
Enters email address
    ↓
Submit to Supabase Auth resetPasswordForEmail()
    ↓
[Success] → Display: "Check your email for reset link"
           → Email sent with link to /update-password?token=xxx
    ↓
User clicks link in email
    ↓
Redirected to /update-password with token
    ↓
Enters new password + confirmation
    ↓
Submit to Supabase Auth updateUser()
    ↓
[Success] → Display: "Password updated"
           → Redirect to /login
    ↓
[Error] → Display error message
         → Allow retry
```

#### 1.3.4 Protected Page Access Flow
```
User navigates to protected page (e.g., /generate)
    ↓
Server-side auth check in page component
    ↓
[Authenticated] → Render page with user context
    ↓
[Not Authenticated] → Redirect to /login
```

## 2. Backend Logic Architecture

### 2.1 Middleware Layer

#### 2.1.1 Authentication Middleware

**File**: `src/middleware/index.ts` (REQUIRES MODIFICATION)

**Current Implementation**:
- Simply attaches `supabaseClient` to `context.locals.supabase`

**Required Changes**:
- Add session management
- Create server-side Supabase client with cookie handling
- Extract and validate session from cookies
- Attach user information to context
- Handle session refresh

**New Implementation Pattern**:
```typescript
// Middleware will:
// 1. Create Supabase client with request/response for cookie handling
// 2. Get session from cookies
// 3. Attach both client and session to context.locals
// 4. Continue to next middleware/route handler

export const onRequest = defineMiddleware(async (context, next) => {
  // Create server-side Supabase client with cookie handling
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => context.cookies.get(key)?.value,
        set: (key, value, options) => context.cookies.set(key, value, options),
        remove: (key, options) => context.cookies.delete(key, options),
      }
    }
  );

  // Attach to context
  context.locals.supabase = supabase;

  // Get session (will be null if not authenticated)
  const { data: { session } } = await supabase.auth.getSession();
  context.locals.session = session;

  return next();
});
```

**Context Type Extension**:
- **File**: `src/env.d.ts` (needs creation or modification)
- Define `App.Locals` interface:
  ```typescript
  declare namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
    }
  }
  ```

### 2.2 API Endpoints

#### 2.2.1 Modified Existing Endpoints

**All existing API endpoints** (`/api/flashcards`, `/api/generations`) require modification:

**Current State** (example from `src/pages/api/flashcards.ts:44-64`):
- Contains commented-out authentication code
- Uses hardcoded test user ID

**Required Changes**:
1. Uncomment authentication logic
2. Remove hardcoded user ID
3. Add proper error handling for authentication failures
4. Use `context.locals.session` for user identification

**Pattern for All API Endpoints**:
```typescript
export async function POST(context: APIContext) {
  try {
    // Step 1: Authenticate user
    const { data: { user }, error: authError } =
      await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Step 2: Continue with existing logic...
    // ...
  } catch (error) {
    // Error handling...
  }
}
```

**Affected Files**:
- `src/pages/api/flashcards.ts` (lines 44-64 need updating)
- `src/pages/api/generations.ts` (similar authentication section)

#### 2.2.2 New API Endpoints

**Note**: Most authentication operations will use Supabase Auth SDK directly from client components, so dedicated backend API endpoints are not required for:
- Registration (handled by Supabase)
- Login (handled by Supabase)
- Logout (handled by Supabase)
- Password reset (handled by Supabase)

**Required for MVP**:

**`DELETE /api/auth/account` - Delete User Account** (GDPR requirement from PRD Section 3.3)
- **File**: `src/pages/api/auth/account.ts`
- **Purpose**: Permanent account and data deletion for GDPR compliance
- **Authentication**: Required (user can only delete their own account)
- **Method**: DELETE
- **Request Body**: None (user ID from session)
- **Process**:
  1. Authenticate user from session
  2. Begin transaction for cascade deletion
  3. Delete user data in order:
     - `generation_error_logs` where `user_id = user.id`
     - `generations` where `user_id = user.id`
     - `flashcards` where `user_id = user.id`
  4. Delete Supabase Auth user via `supabase.auth.admin.deleteUser(user.id)`
  5. Sign out user session
- **Success Response** (200):
  ```json
  {
    "message": "Account and all associated data have been permanently deleted"
  }
  ```
- **Error Responses**:
  - 401: User not authenticated
  - 500: Deletion failed (with rollback)
- **RLS Note**: Deletion will be handled via authenticated Supabase client with RLS, ensuring users can only delete their own data
- **Implementation Notes**:
  - Use Supabase client from `context.locals.supabase`
  - Cascade deletion handled by RLS policies and foreign key constraints
  - Log account deletion for audit trail (before deletion)
  - Clear all cookies and session data after deletion


### 2.3 Service Layer

#### 2.3.1 Authentication Service (NEW)

**File**: `src/lib/services/auth.service.ts`

**Purpose**: Centralize authentication-related business logic

**Responsibilities**:
- Helper functions for common auth operations
- Session validation
- User data transformation
- Error handling and normalization

**Key Functions**:

```typescript
/**
 * Get authenticated user from session
 * Returns user or null if not authenticated
 */
async function getAuthenticatedUser(
  supabase: SupabaseClient
): Promise<User | null>

/**
 * Check if user is authenticated
 * Throws error if not authenticated
 */
async function requireAuth(
  supabase: SupabaseClient
): Promise<User>

/**
 * Normalize Supabase Auth errors to user-friendly messages
 */
function normalizeAuthError(error: AuthError): string

/**
 * Validate password strength
 * Returns validation result with specific messages
 */
function validatePasswordStrength(
  password: string
): { valid: boolean; message?: string }
```

**Error Message Mapping**:
- Map Supabase error codes to user-friendly messages
- Handle common scenarios:
  - Invalid credentials
  - Email already exists
  - Weak password
  - Email not confirmed
  - Invalid reset token
  - Session expired
  - Rate limiting

### 2.4 Type Definitions

#### 2.4.1 Authentication DTOs (NEW)

**File**: `src/types.ts` (ADD to existing file)

**New Type Definitions**:

```typescript
// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * User DTO - represents authenticated user in API responses
 * Excludes sensitive information
 */
export interface UserDTO {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
}

/**
 * Login Request DTO
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Register Request DTO
 */
export interface RegisterRequestDTO {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Reset Password Request DTO
 */
export interface ResetPasswordRequestDTO {
  email: string;
}

/**
 * Update Password Request DTO
 */
export interface UpdatePasswordRequestDTO {
  password: string;
  confirmPassword: string;
}

/**
 * Auth Error Response DTO
 */
export interface AuthErrorResponseDTO {
  error: string;
  code?: string;
}
```

### 2.5 Database Considerations

#### 2.5.1 Supabase Auth Schema

Supabase Auth uses its own `auth` schema (separate from `public` schema), which includes:
- `auth.users` table - user credentials and metadata
- Built-in session management
- Email confirmation tokens
- Password reset tokens

**No custom tables needed** for basic authentication.

### 2.6 Configuration and Environment Variables

#### 2.6.1 Environment Variables

**File**: `.env` (not in repository, documented in `.env.example`)

**Required Variables**:
```env
# Existing variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx (anon/public key)

# New variables for auth
PUBLIC_APP_URL=http://localhost:3000  # Used for redirect URLs in emails
```

**Supabase Dashboard Configuration**:
- Email templates (confirmation, password reset)
- Redirect URLs whitelist
- Email provider settings
- Password requirements

### 2.7 Server-Side Rendering Updates

#### 2.7.1 Astro Configuration

**File**: `astro.config.mjs`

**Current Configuration**:
- `output: "server"` - Already configured for SSR ✓
- `adapter: node({ mode: "standalone" })` - Already configured ✓

**No changes required** - existing configuration supports authentication needs.

#### 2.7.2 Page Rendering Strategy

**Public Pages** (login, register, reset-password, update-password):
- `export const prerender = false` - SSR to check existing session
- Redirect authenticated users to `/generate`

**Protected Pages** (generate, flashcards, study):
- `export const prerender = false` - SSR required for auth check
- Redirect unauthenticated users to `/login`
- Pass user data to client components via props

## 3. Authentication System Integration

### 3.1 Supabase Auth Integration

#### 3.1.1 Authentication Methods

**Primary Method**: Email/Password
- Native Supabase Auth implementation
- Email confirmation required (configurable)
- Password requirements enforced

**Not Implemented in MVP**:
- OAuth providers (Google, GitHub, etc.)
- Magic link authentication
- Phone number authentication

#### 3.1.2 Supabase Client Configuration

**Two Types of Clients**:

1. **Client-side Client** (for React components)
   - **File**: `src/db/supabase.client.ts` (EXISTING - May need modification)
   - **Current Implementation**: Basic client without auth persistence
   - **Required Changes**: Add auth state persistence
   - **Usage**: Auth operations in React components (login, register, etc.)
   - **Configuration**:
     ```typescript
     export const supabaseClient = createClient<Database>(
       supabaseUrl,
       supabaseAnonKey,
       {
         auth: {
           persistSession: true,
           autoRefreshToken: true,
           detectSessionInUrl: true,
           flowType: 'pkce'  // More secure than implicit flow
         }
       }
     );
     ```

2. **Server-side Client** (for API routes and pages)
   - **File**: `src/db/supabase.server.ts` (NEW)
   - **Purpose**: Cookie-based session management
   - **Usage**: Created per-request in middleware with cookie handlers
   - **Configuration**: Handles cookies for session persistence
   - **Implementation**:
     ```typescript
     import { createServerClient } from '@supabase/ssr';

     export function createSupabaseServerClient(
       cookies: AstroCookies
     ) {
       return createServerClient<Database>(
         import.meta.env.SUPABASE_URL,
         import.meta.env.SUPABASE_KEY,
         {
           cookies: {
             get: (key) => cookies.get(key)?.value,
             set: (key, value, options) => cookies.set(key, value, options),
             remove: (key, options) => cookies.delete(key, options),
           }
         }
       );
     }
     ```

#### 3.1.3 Session Management

**Session Storage**: HTTP-only cookies (managed by Supabase)
- More secure than localStorage
- Prevents XSS attacks
- Automatic session refresh

**Session Lifecycle**:
1. User logs in → Session created → Cookies set
2. Middleware checks session on each request
3. Session auto-refreshes before expiration
4. User logs out → Session destroyed → Cookies cleared

**Session Expiration**:
- Default: 1 hour access token, 7 days refresh token (Supabase defaults)
- Configurable in Supabase dashboard

### 3.2 Security Considerations

#### 3.2.1 Password Security

**Password Requirements** (enforced in client validation + Supabase config):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended but not required

**Password Storage**:
- Handled by Supabase (bcrypt hashing)
- Never stored in plain text
- Never exposed in API responses

#### 3.2.2 CSRF Protection

**Strategy**:
- Supabase handles CSRF protection for auth operations
- Cookie-based sessions include CSRF tokens
- No additional implementation required for MVP

#### 3.2.3 Rate Limiting

**Supabase Built-in Rate Limiting**:
- Login attempts limited (prevents brute force)
- Password reset requests limited (prevents abuse)
- Configurable in Supabase dashboard

**Application-level Rate Limiting** (future enhancement):
- Use existing `rate-limit.service.ts` for API endpoints
- Apply to authentication-related operations if needed

#### 3.2.4 Email Security

**Email Confirmation**:
- Required for new accounts (prevents fake registrations)
- Configurable in Supabase dashboard

**Password Reset**:
- One-time use tokens
- Time-limited validity (default 1 hour)
- Tokens invalidated after use

#### 3.2.5 GDPR Compliance (MVP REQUIREMENT - PRD Section 3.3)

**User Data Access**:
- Users can view their account data via `/profile` page (MVP)
- Display email, registration date, and account status
- API endpoint to export all user data (future enhancement)

**Account Deletion** (REQUIRED FOR MVP):
- User-initiated account deletion feature via `/profile` page
- Implemented with `DELETE /api/auth/account` endpoint
- Cascade delete all related data:
  - `flashcards` table records
  - `generations` table records
  - `generation_error_logs` table records
  - Supabase Auth user account
- Process:
  1. User confirms deletion by typing email address
  2. Backend authenticates user
  3. Delete all user data in transaction
  4. Delete Supabase Auth user via admin API
  5. Sign out and redirect to `/register` with confirmation
- RLS policies ensure users can only delete their own data
- Irreversible operation with clear warning to user

### 3.3 Error Handling Strategy

#### 3.3.1 Authentication Errors

**Error Categories**:
1. **Validation Errors** (400)
   - Invalid email format
   - Password too weak
   - Missing required fields
   - Passwords don't match

2. **Authentication Errors** (401)
   - Invalid credentials
   - Email not confirmed
   - Session expired
   - Invalid token

3. **Authorization Errors** (403)
   - Access to protected resource denied

4. **Server Errors** (500)
   - Supabase connection issues
   - Unexpected errors

**Error Response Format**:
```typescript
{
  error: "User-friendly error message",
  code?: "ERROR_CODE"  // Optional error code for programmatic handling
}
```

#### 3.3.2 User-Facing Error Messages

**Principles**:
- Clear and actionable
- Don't expose sensitive system information
- Guide user to resolution
- Consistent tone and format

**Examples**:
- "Invalid email or password" (not "Email not found" - security)
- "Please confirm your email address to log in"
- "This password reset link has expired. Please request a new one"
- "An account with this email already exists. Try logging in instead"

### 3.4 Testing Considerations

#### 3.4.1 Manual Testing Checklist

**Registration Flow**:
- [ ] Valid registration creates account
- [ ] Duplicate email shows error
- [ ] Weak password rejected
- [ ] Confirmation email sent
- [ ] Email link activates account

**Login Flow**:
- [ ] Valid credentials grant access
- [ ] Invalid credentials show error
- [ ] Unconfirmed email blocked
- [ ] Session persists across page reloads
- [ ] Remember me functionality (if implemented)

**Password Reset Flow**:
- [ ] Reset email sent to valid address
- [ ] Reset link redirects correctly
- [ ] Token validation works
- [ ] Password update succeeds
- [ ] Old password no longer works
- [ ] Expired token rejected

**Protected Routes**:
- [ ] Authenticated users access protected pages
- [ ] Unauthenticated users redirected to login
- [ ] Session expiration triggers re-login
- [ ] Logout clears session

**Security**:
- [ ] Passwords never visible in network requests
- [ ] Cookies have httpOnly flag
- [ ] HTTPS enforced in production
- [ ] Rate limiting prevents brute force

## 4. Implementation Modules and Components Summary

### 4.1 New Files to Create

**Pages**:
- `src/pages/login.astro` - Login page
- `src/pages/register.astro` - Registration page
- `src/pages/reset-password.astro` - Password reset request page
- `src/pages/update-password.astro` - Password update page
- `src/pages/profile.astro` - User profile and account management page (GDPR requirement)

**Components**:
- `src/components/LoginForm.tsx` - Login form component
- `src/components/RegisterForm.tsx` - Registration form component
- `src/components/ResetPasswordForm.tsx` - Password reset form component
- `src/components/UpdatePasswordForm.tsx` - Password update form component
- `src/components/Header.tsx` - Application header with navigation and user menu
- `src/components/ProfileView.tsx` - User profile view with account deletion (GDPR requirement)

**API Endpoints**:
- `src/pages/api/auth/account.ts` - Account deletion endpoint (GDPR requirement)

**Services**:
- `src/lib/services/auth.service.ts` - Authentication service layer
- `src/db/supabase.server.ts` - Server-side Supabase client factory

**Types**:
- Extend `src/types.ts` with authentication DTOs
- Create/modify `src/env.d.ts` for App.Locals interface

### 4.2 Files to Modify

**Middleware**:
- `src/middleware/index.ts` - Add session management and server-side client creation

**Pages**:
- `src/pages/index.astro` - Add authentication check and conditional redirect
- `src/pages/generate.astro` - Uncomment and activate auth guard (lines 5-9)

**Layouts**:
- `src/layouts/Layout.astro` - Add user prop and conditional header rendering

**Database Client**:
- `src/db/supabase.client.ts` - Add auth configuration for client-side usage

**API Endpoints**:
- `src/pages/api/flashcards.ts` - Uncomment auth code (lines 44-64), remove hardcoded user ID
- `src/pages/api/generations.ts` - Add authentication check

**Configuration**:
- `.env.example` - Document required environment variables
- Update documentation if necessary

### 4.3 Supabase Configuration (Dashboard)

**Email Templates**:
- Customize confirmation email template
- Customize password reset email template
- Configure sender email address

**Auth Settings**:
- Enable email confirmation
- Set password requirements
- Configure redirect URLs:
  - Password reset: `{APP_URL}/update-password`
  - Email confirmation: `{APP_URL}/login`
- Enable email authentication
- Disable other auth methods (for MVP)

**RLS Policies**:
- Create policies for `flashcards` table
- Create policies for `generations` table
- Create policies for `generation_error_logs` table

### 4.4 Contracts and Interfaces

#### 4.4.1 Component Props Contracts

**LoginForm**:
- No props (self-contained)
- Handles navigation internally

**RegisterForm**:
- No props (self-contained)
- Handles navigation internally

**ResetPasswordForm**:
- No props (self-contained)

**UpdatePasswordForm**:
- No props (gets token from URL)

**Header**:
```typescript
interface HeaderProps {
  user: {
    email: string;
  };
}
```

#### 4.4.2 Service Layer Contracts

**auth.service.ts**:
```typescript
// Get authenticated user or null
getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null>

// Get authenticated user or throw error
requireAuth(supabase: SupabaseClient): Promise<User>

// Normalize auth errors
normalizeAuthError(error: AuthError): string

// Validate password
validatePasswordStrength(password: string): { valid: boolean; message?: string }
```

#### 4.4.3 API Response Contracts

All API endpoints return consistent JSON responses:

**Success Response**:
```typescript
{
  // Resource-specific data
  flashcards: FlashcardDTO[],
  // or
  generation: GenerationDTO,
  // etc.
}
```

**Error Response**:
```typescript
{
  error: string,
  code?: string
}
```

#### 4.4.4 Middleware Contract

**Context.locals** (available in all pages and API routes):
```typescript
interface Locals {
  supabase: SupabaseClient;  // Server-side client with cookie handling
  session: Session | null;   // Current user session (null if not authenticated)
}
```

## 5. Migration and Deployment Considerations

### 5.1 Database Migrations

**RLS Policies Deployment**:
- Execute SQL scripts in Supabase dashboard or via CLI
- Test policies in development environment first
- Apply to production after verification

**No Schema Changes Required**:
- Existing tables already have `user_id` column
- Supabase Auth schema managed automatically

### 5.2 Deployment Checklist

**Pre-deployment**:
- [ ] Configure Supabase Auth settings in dashboard
- [ ] Set up email templates and sender
- [ ] Create RLS policies
- [ ] Set environment variables in hosting platform
- [ ] Update allowed redirect URLs for production domain
- [ ] Test all authentication flows in staging

**Post-deployment**:
- [ ] Verify email delivery works
- [ ] Test registration → confirmation → login flow
- [ ] Test password reset flow
- [ ] Verify protected routes redirect correctly
- [ ] Check session persistence
- [ ] Monitor error logs for auth issues

### 5.3 Rollback Strategy

**If Issues Occur**:
1. Revert middleware changes (fall back to no auth check)
2. Comment out auth guards in pages
3. Use hardcoded user ID temporarily
4. Investigate and fix issues
5. Redeploy with fixes

**Data Safety**:
- No data loss risk (RLS policies only restrict access)
- Existing data remains intact
- Can disable RLS policies temporarily if needed

## 6. Future Enhancements (Post-MVP)

### 6.1 Additional Authentication Features

- OAuth providers (Google, GitHub)
- Magic link login (passwordless)
- Two-factor authentication (2FA)
- Email change functionality
- Account deletion UI

### 6.2 User Profile Features

- User profile page
- Profile picture upload
- Display name
- Preferences and settings
- Learning statistics dashboard

### 6.3 Advanced Security

- IP-based rate limiting
- Session device tracking
- Suspicious activity alerts
- Password history (prevent reuse)

## 7. Dependencies and Package Requirements

### 7.1 New NPM Packages

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.0.10"  // For server-side auth with cookies
  }
}
```

**Existing Packages** (already installed):
- `@supabase/supabase-js` - Supabase client
- `zod` - Validation
- React, Astro, etc.

### 7.2 Package Installation Command

```bash
npm install @supabase/ssr
```

## 8. Documentation Updates Required

### 8.1 Developer Documentation

- Update README with authentication setup instructions
- Document environment variables
- Add Supabase configuration guide
- Document RLS policy setup

### 8.2 User Documentation

- Create user guide for registration
- Document password requirements
- Explain password reset process
- GDPR data privacy notice

## 9. Conclusion

This authentication architecture provides a comprehensive, secure, and scalable solution for the 10x Cards application. Key strengths include:

1. **Supabase Auth Integration**: Leverages battle-tested authentication service
2. **Security First**: Implements industry best practices (password hashing, CSRF protection, RLS)
3. **GDPR Compliant**: Supports user data access and deletion requirements
4. **Minimal Complexity**: Uses managed service to avoid reinventing authentication
5. **Seamless Integration**: Works naturally with existing Astro SSR architecture
6. **Clear Separation**: Well-defined boundaries between client, server, and auth service
7. **Extensible**: Easy to add OAuth, 2FA, and other features in future

The implementation follows existing codebase patterns, maintains compatibility with current features, and sets a solid foundation for future enhancements.
