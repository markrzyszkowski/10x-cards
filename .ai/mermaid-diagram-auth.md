# Authentication System Architecture Diagram

## Main Authentication Flow Diagram

```mermaid
flowchart TB
    subgraph "Client Layer"
        User([User])

        subgraph "Public Pages"
            Login["/login<br/>LoginForm"]
            Register["/register<br/>RegisterForm"]
            ResetPwd["/reset-password<br/>ResetPasswordForm"]
            UpdatePwd["/update-password<br/>UpdatePasswordForm"]
        end

        subgraph "Protected Pages"
            Index["/index<br/>Redirect Logic"]
            Generate["/generate<br/>GenerateView"]
            Profile["/profile<br/>ProfileView"]
            Future["Future: /flashcards, /study"]
        end

        subgraph "Components"
            Header["Header<br/>(Navigation & User Menu)"]
        end
    end

    subgraph "Middleware Layer"
        Middleware["middleware/index.ts<br/>- Create Supabase server client<br/>- Extract session from cookies<br/>- Attach to context.locals"]
    end

    subgraph "Backend Layer"
        subgraph "API Endpoints"
            FlashcardsAPI["/api/flashcards<br/>Auth Required"]
            GenerationsAPI["/api/generations<br/>Auth Required"]
            DeleteAccount["/api/auth/account<br/>DELETE - GDPR"]
        end

        subgraph "Services"
            AuthService["auth.service.ts<br/>- getAuthenticatedUser()<br/>- requireAuth()<br/>- normalizeAuthError()<br/>- validatePasswordStrength()"]
        end

        subgraph "Database Clients"
            ClientSupabase["supabase.client.ts<br/>Client-side Supabase<br/>- persistSession: true<br/>- autoRefreshToken: true"]
            ServerSupabase["supabase.server.ts<br/>Server-side Supabase<br/>- Cookie handling<br/>- SSR support"]
        end
    end

    subgraph "Supabase Services"
        SupabaseAuth["Supabase Auth<br/>- auth.users table<br/>- Session management<br/>- Email confirmation<br/>- Password reset tokens"]
        SupabaseDB["Supabase Database<br/>- flashcards table (RLS)<br/>- generations table (RLS)<br/>- generation_error_logs table (RLS)"]
    end

    %% User Interactions
    User -->|1. Access app| Index
    User -->|2. Not authenticated| Login
    User -->|3. Register| Register
    User -->|4. Forgot password| ResetPwd

    %% Registration Flow
    Register -->|signUp| ClientSupabase
    ClientSupabase -->|Create account| SupabaseAuth
    SupabaseAuth -->|Send confirmation email| User

    %% Login Flow
    Login -->|signInWithPassword| ClientSupabase
    ClientSupabase -->|Authenticate| SupabaseAuth
    SupabaseAuth -->|Set session cookies| Login
    Login -->|Success: redirect| Generate

    %% Password Reset Flow
    ResetPwd -->|resetPasswordForEmail| ClientSupabase
    ClientSupabase -->|Send reset link| SupabaseAuth
    SupabaseAuth -->|Email with token| User
    User -->|Click link| UpdatePwd
    UpdatePwd -->|updateUser| ClientSupabase
    ClientSupabase -->|Update password| SupabaseAuth
    UpdatePwd -->|Success: redirect| Login

    %% Middleware Processing
    Index --> Middleware
    Generate --> Middleware
    Profile --> Middleware
    FlashcardsAPI --> Middleware
    GenerationsAPI --> Middleware
    DeleteAccount --> Middleware

    Middleware -->|Attach supabase client| ServerSupabase
    Middleware -->|Get session| SupabaseAuth
    Middleware -->|context.locals.session| Index
    Middleware -->|context.locals.supabase| Generate

    %% Protected Page Logic
    Generate -->|Check auth| AuthService
    AuthService -->|Not authenticated| Login
    AuthService -->|Authenticated| Header

    Profile -->|Check auth| AuthService
    Profile -->|Delete account| DeleteAccount
    DeleteAccount -->|Cascade delete| SupabaseDB
    DeleteAccount -->|Delete user| SupabaseAuth
    DeleteAccount -->|Sign out & redirect| Register

    %% API Protection
    FlashcardsAPI -->|getUser| AuthService
    GenerationsAPI -->|getUser| AuthService
    AuthService -->|user.id| SupabaseDB

    %% Header/Logout
    Header -->|signOut| ClientSupabase
    ClientSupabase -->|Clear session| SupabaseAuth
    Header -->|Redirect| Login

    %% Styling
    classDef publicPage fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef protectedPage fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef component fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef middleware fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef api fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef service fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef db fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef external fill:#efebe9,stroke:#3e2723,stroke-width:2px

    class Login,Register,ResetPwd,UpdatePwd publicPage
    class Index,Generate,Profile,Future protectedPage
    class Header component
    class Middleware middleware
    class FlashcardsAPI,GenerationsAPI,DeleteAccount api
    class AuthService service
    class ClientSupabase,ServerSupabase db
    class SupabaseAuth,SupabaseDB external
```

## Component Interaction Diagram

```mermaid
sequenceDiagram
    autonumber

    participant User
    participant Browser
    participant LoginForm
    participant Middleware
    participant SupabaseAuth
    participant GeneratePage

    Note over User,GeneratePage: Login Flow

    User->>Browser: Navigate to /login
    Browser->>Middleware: Request /login page
    Middleware->>SupabaseAuth: Check existing session
    SupabaseAuth-->>Middleware: No active session
    Middleware->>LoginForm: Render login page

    User->>LoginForm: Enter credentials
    LoginForm->>SupabaseAuth: signInWithPassword()
    SupabaseAuth-->>LoginForm: Session token + user data
    LoginForm->>Browser: Set session cookies
    LoginForm->>Browser: Redirect to /generate

    Browser->>Middleware: Request /generate page
    Middleware->>SupabaseAuth: Validate session from cookies
    SupabaseAuth-->>Middleware: Valid session + user
    Middleware->>GeneratePage: Attach user to context.locals
    GeneratePage-->>Browser: Render protected page
    Browser-->>User: Display Generate view
```

## Account Deletion Flow

```mermaid
sequenceDiagram
    autonumber

    participant User
    participant ProfileView
    participant DeleteAPI as /api/auth/account
    participant SupabaseDB
    participant SupabaseAuth
    participant Browser

    Note over User,Browser: Account Deletion Flow (PRD Section 3.3)

    User->>ProfileView: Navigate to /profile
    ProfileView->>User: Display account info
    User->>ProfileView: Click "Delete Account"
    ProfileView->>User: Show confirmation dialog
    User->>ProfileView: Type email to confirm
    ProfileView->>DeleteAPI: DELETE request

    Note over DeleteAPI,SupabaseAuth: Cascade Deletion Process

    DeleteAPI->>DeleteAPI: Authenticate user
    DeleteAPI->>SupabaseDB: Delete generation_error_logs
    SupabaseDB-->>DeleteAPI: Deleted
    DeleteAPI->>SupabaseDB: Delete generations
    SupabaseDB-->>DeleteAPI: Deleted
    DeleteAPI->>SupabaseDB: Delete flashcards
    SupabaseDB-->>DeleteAPI: Deleted
    DeleteAPI->>SupabaseAuth: admin.deleteUser(user.id)
    SupabaseAuth-->>DeleteAPI: User deleted
    DeleteAPI->>Browser: Clear cookies & session
    DeleteAPI-->>ProfileView: Success response
    ProfileView->>Browser: Redirect to /register
    Browser-->>User: Show "Account deleted" message
```

## Middleware Request Flow

```mermaid
flowchart LR
    Request[Incoming Request] --> Middleware{Middleware}

    Middleware -->|1. Create server client| CreateClient[Create Supabase<br/>server client with<br/>cookie handlers]

    CreateClient -->|2. Extract session| GetSession[Get session<br/>from cookies]

    GetSession -->|3. Attach to context| AttachLocals["context.locals.supabase<br/>context.locals.session"]

    AttachLocals -->|4. Continue| RouteHandler{Route Type}

    RouteHandler -->|Public route| PublicPage[Render page<br/>Check if already logged in]
    RouteHandler -->|Protected route| ProtectedPage[Check authentication<br/>Redirect if not authenticated]
    RouteHandler -->|API endpoint| APIEndpoint[Require authentication<br/>Return 401 if not authenticated]

    PublicPage --> Response[Response]
    ProtectedPage --> Response
    APIEndpoint --> Response

    style Middleware fill:#e8f5e9,stroke:#1b5e20,stroke-width:3px
    style CreateClient fill:#bbdefb,stroke:#0d47a1
    style GetSession fill:#bbdefb,stroke:#0d47a1
    style AttachLocals fill:#bbdefb,stroke:#0d47a1
    style ProtectedPage fill:#fff3e0,stroke:#e65100
    style PublicPage fill:#e1f5ff,stroke:#01579b
    style APIEndpoint fill:#fff9c4,stroke:#f57f17
```

## File Structure Overview

```mermaid
graph TB
    subgraph "New Files to Create"
        NP1["src/pages/login.astro"]
        NP2["src/pages/register.astro"]
        NP3["src/pages/reset-password.astro"]
        NP4["src/pages/update-password.astro"]
        NP5["src/pages/profile.astro"]

        NC1["src/components/LoginForm.tsx"]
        NC2["src/components/RegisterForm.tsx"]
        NC3["src/components/ResetPasswordForm.tsx"]
        NC4["src/components/UpdatePasswordForm.tsx"]
        NC5["src/components/Header.tsx"]
        NC6["src/components/ProfileView.tsx"]

        NA1["src/pages/api/auth/account.ts"]

        NS1["src/lib/services/auth.service.ts"]
        NS2["src/db/supabase.server.ts"]
    end

    subgraph "Files to Modify"
        MP1["src/middleware/index.ts"]
        MP2["src/pages/index.astro"]
        MP3["src/pages/generate.astro"]
        MP4["src/layouts/Layout.astro"]

        MD1["src/db/supabase.client.ts"]

        MA1["src/pages/api/flashcards.ts"]
        MA2["src/pages/api/generations.ts"]

        MT1["src/types.ts"]
        MT2["src/env.d.ts"]
    end

    subgraph "Existing Components (Reuse)"
        EC1["src/components/ui/input.tsx"]
        EC2["src/components/ui/button.tsx"]
        EC3["src/components/ui/card.tsx"]
        EC4["src/components/ui/alert.tsx"]
        EC5["src/components/ErrorMessage.tsx"]
        EC6["src/components/SuccessMessage.tsx"]
    end

    NP1 -.->|uses| NC1
    NP2 -.->|uses| NC2
    NP3 -.->|uses| NC3
    NP4 -.->|uses| NC4
    NP5 -.->|uses| NC6

    NC1 -.->|uses| EC1
    NC1 -.->|uses| EC2
    NC1 -.->|uses| EC3
    NC2 -.->|uses| EC1
    NC2 -.->|uses| EC2
    NC6 -.->|uses| EC4

    MP1 -.->|uses| NS2
    MP3 -.->|uses| NC5

    NC1 -.->|calls| MD1
    NC2 -.->|calls| MD1
    NC6 -.->|calls| NA1

    MA1 -.->|uses| NS1
    MA2 -.->|uses| NS1
    NA1 -.->|uses| NS1

    style NP1 fill:#e1f5ff,stroke:#01579b
    style NP2 fill:#e1f5ff,stroke:#01579b
    style NP3 fill:#e1f5ff,stroke:#01579b
    style NP4 fill:#e1f5ff,stroke:#01579b
    style NP5 fill:#fff3e0,stroke:#e65100

    style NC1 fill:#f3e5f5,stroke:#4a148c
    style NC2 fill:#f3e5f5,stroke:#4a148c
    style NC3 fill:#f3e5f5,stroke:#4a148c
    style NC4 fill:#f3e5f5,stroke:#4a148c
    style NC5 fill:#f3e5f5,stroke:#4a148c
    style NC6 fill:#f3e5f5,stroke:#4a148c

    style NA1 fill:#fff9c4,stroke:#f57f17
    style NS1 fill:#fce4ec,stroke:#880e4f
    style NS2 fill:#e0f2f1,stroke:#004d40

    style MP1 fill:#ffe0b2,stroke:#e65100
    style MP2 fill:#ffe0b2,stroke:#e65100
    style MP3 fill:#ffe0b2,stroke:#e65100
```

## Security & Data Flow

```mermaid
flowchart TB
    subgraph "Security Layers"
        subgraph "Client-Side Security"
            CS1["Input Validation<br/>(Zod schemas)"]
            CS2["Password Strength<br/>Requirements"]
            CS3["HTTPS Only<br/>(Production)"]
        end

        subgraph "Authentication Layer"
            A1["Supabase Auth<br/>Email/Password"]
            A2["Session Management<br/>(HTTP-only cookies)"]
            A3["Email Confirmation<br/>Required"]
            A4["Password Reset<br/>Tokens (1-hour)"]
        end

        subgraph "Authorization Layer"
            AU1["RLS Policies<br/>(Row Level Security)"]
            AU2["User ID Validation<br/>(context.locals.session)"]
            AU3["API Auth Guards<br/>(401 if not authenticated)"]
        end

        subgraph "Data Protection"
            DP1["GDPR Compliance<br/>Account Deletion"]
            DP2["Bcrypt Password<br/>Hashing"]
            DP3["CSRF Protection<br/>(Supabase built-in)"]
            DP4["Rate Limiting<br/>(Supabase built-in)"]
        end
    end

    User([User]) -->|Submits credentials| CS1
    CS1 --> CS2
    CS2 --> CS3
    CS3 --> A1
    A1 --> A2
    A2 --> A3
    A3 --> AU1
    AU1 --> AU2
    AU2 --> AU3
    AU3 --> DP1

    A1 -.->|Uses| DP2
    A1 -.->|Implements| DP3
    A1 -.->|Enforces| DP4
    A4 -.->|Part of| A1

    style CS1 fill:#e1f5ff,stroke:#01579b
    style CS2 fill:#e1f5ff,stroke:#01579b
    style CS3 fill:#e1f5ff,stroke:#01579b

    style A1 fill:#fff3e0,stroke:#e65100
    style A2 fill:#fff3e0,stroke:#e65100
    style A3 fill:#fff3e0,stroke:#e65100
    style A4 fill:#fff3e0,stroke:#e65100

    style AU1 fill:#e8f5e9,stroke:#1b5e20
    style AU2 fill:#e8f5e9,stroke:#1b5e20
    style AU3 fill:#e8f5e9,stroke:#1b5e20

    style DP1 fill:#fce4ec,stroke:#880e4f
    style DP2 fill:#fce4ec,stroke:#880e4f
    style DP3 fill:#fce4ec,stroke:#880e4f
    style DP4 fill:#fce4ec,stroke:#880e4f
```
