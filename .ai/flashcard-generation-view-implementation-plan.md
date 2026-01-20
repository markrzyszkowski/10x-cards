# View Implementation Plan: Flashcard Generation

## 1. Overview

The Flashcard Generation view enables authenticated users to generate AI-powered flashcard suggestions from source text. Users paste text (1000-10000 characters), click a generate button to receive AI-generated flashcard proposals, and then review each proposal to accept it as-is, edit it before accepting, or reject it entirely. Accepted flashcards (both edited and unedited) can then be batch-saved to the user's flashcard collection.

## 2. View Routing

**Route:** `/generate`

This route should be protected and require user authentication. Unauthenticated users should be redirected to the login page.

## 3. Component Structure

```
GeneratePage (Astro page - src/pages/generate.astro)
└── GenerateView (React component - src/components/GenerateView.tsx)
    ├── GenerationForm (React component)
    │   ├── Textarea (shadcn/ui)
    │   ├── CharacterCounter (custom component)
    │   └── Button (shadcn/ui)
    ├── ProposalsList (React component)
    │   ├── ProposalCard[] (React component)
    │   │   ├── ProposalDisplay (React component)
    │   │   │   ├── Card (shadcn/ui)
    │   │   │   └── Badge (shadcn/ui)
    │   │   └── ProposalEdit (React component)
    │   │       ├── Input (shadcn/ui)
    │   │       ├── Textarea (shadcn/ui)
    │   │       └── Button (shadcn/ui)
    │   └── SaveActionsBar (React component)
    │       └── Button[] (shadcn/ui)
    ├── LoadingState (React component)
    │   └── Skeleton[] (shadcn/ui)
    └── ErrorMessage (React component)
        └── Alert (shadcn/ui)
```

## 4. Component Details

### GeneratePage (Astro)

- **Component description:** The top-level Astro page component that handles SSR concerns, authentication checks, and wraps the React interactive component.
- **Main elements:**
  - Layout wrapper from `src/layouts`
  - Authentication check via middleware
  - `<GenerateView client:load />` for client-side interactivity
- **Handled events:** None (server-rendered)
- **Validation conditions:** Authentication status validation (server-side)
- **Types:** None specific (uses Astro's built-in types)
- **Props:** None

### GenerateView (React)

- **Component description:** The main interactive React component that orchestrates the entire flashcard generation flow. It manages state for source text, generation status, proposals, and errors. It coordinates communication between the generation form and the proposals list.
- **Main elements:**
  - `<GenerationForm />` component
  - Conditional rendering: `<LoadingState />` OR `<ProposalsList />` OR `<ErrorMessage />`
  - Container div with responsive grid layout
- **Handled events:**
  - `onGenerate` from GenerationForm - triggers API call to POST /api/generations
  - `onAccept`, `onEdit`, `onReject` from ProposalCard - updates proposal state
  - `onSaveAll`, `onSaveAccepted` from SaveActionsBar - triggers API call to POST /api/flashcards
- **Validation conditions:**
  - Source text length must be 1000-10000 characters before generation
  - At least one proposal must be accepted before saving
- **Types:**
  - `GenerationViewState` (ViewModel)
  - `ProposalWithStatus` (ViewModel)
  - `CreateGenerationRequestDTO` (DTO)
  - `CreateGenerationResponseDTO` (DTO)
  - `CreateFlashcardsRequestDTO` (DTO)
  - `CreateFlashcardsResponseDTO` (DTO)
- **Props:** None

### GenerationForm (React)

- **Component description:** Form component containing the textarea for source text input, character counter, validation feedback, and the generate button. Manages local form state and validation.
- **Main elements:**
  - `<label>` for accessibility
  - `<Textarea>` from shadcn/ui for text input
  - `<CharacterCounter />` displaying current count and limits
  - Validation error message (conditional)
  - `<Button>` to trigger generation
- **Handled events:**
  - `onChange` on textarea - updates local state and validates length
  - `onClick` on button - calls `onGenerate` callback with source text
- **Validation conditions:**
  - Source text must be at least 1000 characters (minimum validation)
  - Source text must not exceed 10000 characters (maximum validation)
  - Cannot be empty string
  - Button is disabled if text length is outside valid range or if generation is in progress
- **Types:**
  - `GenerationFormProps` (component interface)
  - `sourceText: string` (local state)
  - `validationError: string | null` (local state)
- **Props:**
  - `onGenerate: (sourceText: string) => void` - callback to parent component
  - `isGenerating: boolean` - disables form during API call
  - `disabled?: boolean` - additional disable condition

### CharacterCounter (React)

- **Component description:** Small display component showing character count with color-coded feedback based on validation status.
- **Main elements:**
  - `<span>` with dynamic className based on validation state
  - Text displaying "X / 10000 characters (min: 1000)"
- **Handled events:** None
- **Validation conditions:**
  - Visual feedback: red if < 1000, yellow if 1000-1500, green if > 1500, red if > 10000
- **Types:**
  - `CharacterCounterProps` (component interface)
- **Props:**
  - `count: number` - current character count
  - `min: number` - minimum required (1000)
  - `max: number` - maximum allowed (10000)

### ProposalsList (React)

- **Component description:** Container component that displays the list of generated flashcard proposals and the action bar for saving. Manages the collection of proposals and their statuses.
- **Main elements:**
  - Header with count of accepted proposals
  - List/grid of `<ProposalCard />` components
  - `<SaveActionsBar />` at the bottom (sticky or fixed)
- **Handled events:**
  - Forwards events from child ProposalCard components to parent
- **Validation conditions:**
  - Shows count of accepted proposals
  - Disables save buttons if no proposals are accepted
- **Types:**
  - `ProposalsListProps` (component interface)
  - `ProposalWithStatus[]` (array of proposals)
- **Props:**
  - `proposals: ProposalWithStatus[]` - list of proposals with their statuses
  - `onAccept: (index: number) => void`
  - `onEdit: (index: number, front: string, back: string) => void`
  - `onReject: (index: number) => void`
  - `onSaveAll: () => void`
  - `onSaveAccepted: () => void`
  - `isSaving: boolean`
  - `generationId: number` - ID from generation response

### ProposalCard (React)

- **Component description:** Individual flashcard proposal card that can switch between display mode and edit mode. Shows the proposal content with action buttons.
- **Main elements:**
  - Conditional rendering: `<ProposalDisplay />` OR `<ProposalEdit />`
  - State toggle between display and edit modes
- **Handled events:**
  - "Accept" button click - calls `onAccept(index)`
  - "Edit" button click - switches to edit mode
  - "Reject" button click - calls `onReject(index)`
  - "Save" button click from edit mode - calls `onEdit(index, front, back)` and switches back to display
  - "Cancel" button click from edit mode - switches back to display without saving
- **Validation conditions:**
  - In edit mode: front text max 200 characters
  - In edit mode: back text max 500 characters
  - Both fields must not be empty
- **Types:**
  - `ProposalCardProps` (component interface)
  - `ProposalWithStatus` (ViewModel)
  - `isEditing: boolean` (local state)
  - `editedFront: string` (local state in edit mode)
  - `editedBack: string` (local state in edit mode)
- **Props:**
  - `proposal: ProposalWithStatus`
  - `index: number`
  - `onAccept: (index: number) => void`
  - `onEdit: (index: number, front: string, back: string) => void`
  - `onReject: (index: number) => void`

### ProposalDisplay (React)

- **Component description:** Read-only display of a flashcard proposal showing front and back content with a status badge.
- **Main elements:**
  - `<Card>` from shadcn/ui as container
  - `<Badge>` showing status (accepted/rejected/pending)
  - Front text display (styled as question)
  - Back text display (styled as answer)
  - Action buttons row
- **Handled events:** Button clicks (forwarded to parent)
- **Validation conditions:** None (display only)
- **Types:**
  - `ProposalDisplayProps` (component interface)
- **Props:**
  - `front: string`
  - `back: string`
  - `status: 'accepted' | 'rejected' | 'pending' | 'edited'`
  - `onAccept: () => void`
  - `onEdit: () => void`
  - `onReject: () => void`

### ProposalEdit (React)

- **Component description:** Edit mode form for a flashcard proposal, allowing users to modify front and back text before accepting.
- **Main elements:**
  - `<Card>` from shadcn/ui as container
  - `<Input>` for front text (labeled "Front")
  - `<Textarea>` for back text (labeled "Back")
  - Character counter for each field
  - Validation error messages (conditional)
  - Action buttons (Save, Cancel)
- **Handled events:**
  - `onChange` on inputs - updates local state and validates
  - "Save" button click - validates and calls `onSave(front, back)`
  - "Cancel" button click - calls `onCancel()`
- **Validation conditions:**
  - Front text: required, max 200 characters
  - Back text: required, max 500 characters
  - Save button disabled if validation fails
- **Types:**
  - `ProposalEditProps` (component interface)
  - `front: string` (local state)
  - `back: string` (local state)
  - `frontError: string | null` (local state)
  - `backError: string | null` (local state)
- **Props:**
  - `initialFront: string`
  - `initialBack: string`
  - `onSave: (front: string, back: string) => void`
  - `onCancel: () => void`

### SaveActionsBar (React)

- **Component description:** Action bar with buttons to save all accepted flashcards or save only the proposals accepted without editing.
- **Main elements:**
  - Container (sticky/fixed to bottom or inline)
  - Summary text showing count of accepted flashcards
  - `<Button>` "Save All Accepted" (primary action)
  - Optional: `<Button>` "Save Unedited Only" (secondary action)
- **Handled events:**
  - "Save All Accepted" click - calls `onSaveAll()`
  - "Save Unedited Only" click - calls `onSaveUnedited()` (optional)
- **Validation conditions:**
  - Buttons disabled if `acceptedCount === 0`
  - Buttons disabled if `isSaving === true`
- **Types:**
  - `SaveActionsBarProps` (component interface)
- **Props:**
  - `acceptedCount: number`
  - `onSaveAll: () => void`
  - `isSaving: boolean`

### LoadingState (React)

- **Component description:** Skeleton loading state displayed while AI generates flashcard proposals.
- **Main elements:**
  - Multiple `<Skeleton>` components from shadcn/ui
  - Mimics the layout of ProposalCard components
  - Loading message text
- **Handled events:** None
- **Validation conditions:** None
- **Types:** None
- **Props:** None

### ErrorMessage (React)

- **Component description:** Error display component showing user-friendly error messages when generation or saving fails.
- **Main elements:**
  - `<Alert>` from shadcn/ui (variant: destructive)
  - Error title
  - Error message text
  - Optional retry button
- **Handled events:**
  - Optional retry button click - calls `onRetry()`
- **Validation conditions:** None
- **Types:**
  - `ErrorMessageProps` (component interface)
- **Props:**
  - `error: string` - error message to display
  - `onRetry?: () => void` - optional retry callback

## 5. Types

### DTO Types (from src/types.ts)

All DTO types are already defined in `src/types.ts`:

- **`CreateGenerationRequestDTO`**: Request body for POST /api/generations
  - `source_text: string` - the input text for AI generation

- **`CreateGenerationResponseDTO`**: Response from POST /api/generations
  - `generation: GenerationMetadataDTO` - metadata about the generation
    - `id: number` - generation ID (needed for saving flashcards)
    - `model: string` - AI model used
    - `generated_count: number` - number of proposals generated
    - `generation_duration: number` - time taken in milliseconds
  - `proposals: FlashcardProposalDTO[]` - array of generated proposals
    - `front: string` - question text
    - `back: string` - answer text

- **`CreateFlashcardsRequestDTO`**: Request body for POST /api/flashcards
  - `flashcards: CreateFlashcardDTO[]` - array of flashcards to create
    - `front: string` - question text (max 200 chars)
    - `back: string` - answer text (max 500 chars)
    - `source: 'ai-full' | 'ai-edited' | 'manual'` - flashcard source type
    - `generation_id: number | null` - reference to generation (required for AI sources)

- **`CreateFlashcardsResponseDTO`**: Response from POST /api/flashcards
  - `flashcards: FlashcardDTO[]` - array of created flashcards with IDs and timestamps

### ViewModel Types (new types needed for view)

These types should be added to a new file `src/components/GenerateView.types.ts`:

```typescript
import type { FlashcardProposalDTO, GenerationMetadataDTO } from '@/types';

/**
 * Status of a flashcard proposal in the UI
 */
export type ProposalStatus = 'pending' | 'accepted' | 'edited' | 'rejected';

/**
 * Flashcard proposal with UI state
 * Extends the DTO with status tracking and edited content
 */
export interface ProposalWithStatus {
  /** Original proposal from AI */
  original: FlashcardProposalDTO;
  /** Current status in UI workflow */
  status: ProposalStatus;
  /** Edited front text (only if status is 'edited') */
  editedFront?: string;
  /** Edited back text (only if status is 'edited') */
  editedBack?: string;
}

/**
 * Overall state of the generation view
 */
export type GenerationViewState =
  | { type: 'idle' }
  | { type: 'generating' }
  | { type: 'generated'; proposals: ProposalWithStatus[]; generationMetadata: GenerationMetadataDTO }
  | { type: 'saving' }
  | { type: 'error'; error: string };

/**
 * Component Props Interfaces
 */

export interface GenerationFormProps {
  onGenerate: (sourceText: string) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export interface CharacterCounterProps {
  count: number;
  min: number;
  max: number;
}

export interface ProposalsListProps {
  proposals: ProposalWithStatus[];
  generationId: number;
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
  onSaveAll: () => void;
  isSaving: boolean;
}

export interface ProposalCardProps {
  proposal: ProposalWithStatus;
  index: number;
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export interface ProposalDisplayProps {
  front: string;
  back: string;
  status: ProposalStatus;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export interface ProposalEditProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
}

export interface SaveActionsBarProps {
  acceptedCount: number;
  onSaveAll: () => void;
  isSaving: boolean;
}

export interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
}
```

## 6. State Management

State management will be handled within the `GenerateView` component using React hooks (useState, useCallback). No global state management is required for this view.

### Primary State Variables

**`viewState: GenerationViewState`**
- Manages the overall state machine of the view (idle → generating → generated → saving → error)
- Initialized as `{ type: 'idle' }`
- Updated via state transitions:
  - User clicks "Generate" → `{ type: 'generating' }`
  - API returns proposals → `{ type: 'generated', proposals, generationMetadata }`
  - User clicks "Save" → `{ type: 'saving' }`
  - Error occurs → `{ type: 'error', error: string }`
  - Save completes → back to `{ type: 'idle' }` (or navigate away)

**`proposals: ProposalWithStatus[]`** (when in 'generated' state)
- Array of flashcard proposals with their UI status
- Updated when user accepts/edits/rejects individual proposals
- Initially all proposals have `status: 'pending'`

### Custom Hook (Optional but Recommended)

Create a custom hook `useFlashcardGeneration` in `src/components/hooks/useFlashcardGeneration.ts`:

```typescript
export function useFlashcardGeneration() {
  const [viewState, setViewState] = useState<GenerationViewState>({ type: 'idle' });

  const generateFlashcards = useCallback(async (sourceText: string) => {
    // Handle POST /api/generations
  }, []);

  const updateProposal = useCallback((index: number, updates: Partial<ProposalWithStatus>) => {
    // Update specific proposal in state
  }, [viewState]);

  const saveFlashcards = useCallback(async () => {
    // Handle POST /api/flashcards with accepted proposals
  }, [viewState]);

  return {
    viewState,
    generateFlashcards,
    updateProposal,
    saveFlashcards,
  };
}
```

This hook encapsulates:
- State management for the view
- API calls to /api/generations and /api/flashcards
- Proposal status updates
- Error handling

## 7. API Integration

### POST /api/generations

**Purpose:** Generate AI flashcard proposals from source text

**Request:**
- Type: `CreateGenerationRequestDTO`
- Validation: `source_text` must be 1000-10000 characters
- Example:
  ```json
  {
    "source_text": "Long educational text here..."
  }
  ```

**Response:**
- Success (201): `CreateGenerationResponseDTO`
  ```json
  {
    "generation": {
      "id": 42,
      "model": "openai/gpt-4",
      "generated_count": 10,
      "generation_duration": 3500
    },
    "proposals": [
      { "front": "Question?", "back": "Answer." }
    ]
  }
  ```
- Error responses:
  - 400: Invalid text length or format
  - 401: Unauthorized (redirect to login)
  - 429: Rate limit exceeded
  - 500: AI generation failed

**Integration:**
- Called from `GenerateView` when user submits the generation form
- Set state to `generating` before call
- On success: transform proposals to `ProposalWithStatus[]` with `status: 'pending'`, set state to `generated`
- On error: set state to `error` with user-friendly message
- Store `generation.id` for later use when saving flashcards

### POST /api/flashcards

**Purpose:** Save accepted flashcard proposals to user's collection

**Request:**
- Type: `CreateFlashcardsRequestDTO`
- Must include only accepted proposals (status: 'accepted' or 'edited')
- Set `source: 'ai-full'` for accepted unedited proposals
- Set `source: 'ai-edited'` for edited proposals
- Set `generation_id` to the ID from the generation response
- Example:
  ```json
  {
    "flashcards": [
      {
        "front": "Question?",
        "back": "Answer.",
        "source": "ai-full",
        "generation_id": 42
      },
      {
        "front": "Edited question?",
        "back": "Edited answer.",
        "source": "ai-edited",
        "generation_id": 42
      }
    ]
  }
  ```

**Response:**
- Success (201): `CreateFlashcardsResponseDTO`
  ```json
  {
    "flashcards": [
      {
        "id": 1,
        "front": "Question?",
        "back": "Answer.",
        "source": "ai-full",
        "generation_id": 42,
        "created_at": "2026-01-20T10:00:00Z",
        "updated_at": "2026-01-20T10:00:00Z"
      }
    ]
  }
  ```
- Error responses:
  - 400: Validation errors (text too long, invalid source, etc.)
  - 401: Unauthorized
  - 500: Database error

**Integration:**
- Called from `GenerateView` when user clicks "Save All Accepted"
- Filter proposals to include only those with `status: 'accepted' | 'edited'`
- Map to `CreateFlashcardDTO[]` with correct source type
- Set state to `saving` before call
- On success: show success message and optionally redirect to flashcard list or reset view
- On error: set state to `error` with message, keep proposals for retry

## 8. User Interactions

### 1. Initial Page Load
- **Interaction:** User navigates to `/generate`
- **Expected outcome:**
  - View renders in `idle` state
  - GenerationForm is displayed and enabled
  - Empty textarea with placeholder text
  - Character counter shows "0 / 10000 (min: 1000)" in red
  - Generate button is disabled

### 2. Typing Source Text
- **Interaction:** User types or pastes text into textarea
- **Expected outcome:**
  - Character counter updates in real-time
  - Color changes based on character count:
    - Red: < 1000 or > 10000
    - Yellow: 1000-1500
    - Green: > 1500 and ≤ 10000
  - Generate button enables when count is 1000-10000
  - Validation error appears if count exceeds 10000

### 3. Generating Flashcards
- **Interaction:** User clicks "Generate Flashcards" button
- **Expected outcome:**
  - State changes to `generating`
  - Form becomes disabled
  - LoadingState component appears with skeleton cards
  - API call to POST /api/generations initiated
  - On success:
    - State changes to `generated`
    - ProposalsList renders with all proposals in `pending` status
    - LoadingState is replaced by proposal cards
  - On error:
    - State changes to `error`
    - ErrorMessage component displays with retry option
    - User can retry or go back to edit source text

### 4. Reviewing Proposals - Accept
- **Interaction:** User clicks "Accept" on a proposal card
- **Expected outcome:**
  - Proposal status changes to `accepted`
  - Visual feedback: badge changes to green "Accepted"
  - Accept button becomes disabled or changes to "Accepted"
  - Accepted count in SaveActionsBar increments
  - Save buttons become enabled if this is the first accepted proposal

### 5. Reviewing Proposals - Edit
- **Interaction:** User clicks "Edit" on a proposal card
- **Expected outcome:**
  - ProposalCard switches to edit mode
  - Input fields populate with current front/back text
  - Character counters display for both fields
  - "Save" and "Cancel" buttons appear
  - User can modify text within constraints:
    - Front: max 200 characters
    - Back: max 500 characters
  - Validation errors appear if limits exceeded
  - "Save" button disabled if validation fails

### 6. Reviewing Proposals - Save Edit
- **Interaction:** User clicks "Save" in edit mode
- **Expected outcome:**
  - Validation runs on both fields
  - If valid:
    - Proposal status changes to `edited`
    - `editedFront` and `editedBack` are stored in proposal state
    - Card switches back to display mode showing edited content
    - Badge shows "Edited" in blue
    - Accepted count increments if not previously accepted
  - If invalid:
    - Error messages display
    - Edit mode remains active

### 7. Reviewing Proposals - Cancel Edit
- **Interaction:** User clicks "Cancel" in edit mode
- **Expected outcome:**
  - Local edits are discarded
  - Card switches back to display mode
  - Original content is displayed
  - Previous status is maintained

### 8. Reviewing Proposals - Reject
- **Interaction:** User clicks "Reject" on a proposal card
- **Expected outcome:**
  - Proposal status changes to `rejected`
  - Visual feedback: card becomes greyed out or removed from view
  - Badge shows "Rejected" in grey
  - If proposal was previously accepted, accepted count decrements
  - Card may optionally fade out or move to bottom of list

### 9. Saving Accepted Flashcards
- **Interaction:** User clicks "Save All Accepted" button
- **Expected outcome:**
  - State changes to `saving`
  - All buttons become disabled
  - Loading indicator appears on save button
  - API call to POST /api/flashcards with accepted/edited proposals
  - Request body correctly maps:
    - `status: 'accepted'` → `source: 'ai-full'`
    - `status: 'edited'` → `source: 'ai-edited'`
    - `generation_id` set to stored generation ID
  - On success:
    - Success message displays
    - Options:
      - Reset view to idle state for new generation
      - Redirect to flashcard list to view saved cards
  - On error:
    - State changes to `error`
    - Error message displays
    - Proposals remain available for retry
    - User can fix issues and retry save

### 10. Error Recovery
- **Interaction:** Error occurs during generation or saving
- **Expected outcome:**
  - ErrorMessage component displays user-friendly message
  - For generation errors: "Retry" button allows re-attempting with same text
  - For save errors: Proposals remain in current state for retry
  - For rate limit errors: Clear message about waiting period
  - For validation errors: Specific field-level feedback

### 11. Keyboard Navigation
- **Interaction:** User navigates using keyboard
- **Expected outcome:**
  - Tab order follows logical flow: textarea → generate button → proposal cards → save buttons
  - Enter key in textarea can optionally trigger generation (if valid)
  - Escape key in edit mode cancels editing
  - Focus indicators are clearly visible on all interactive elements

## 9. Conditions and Validation

### Client-Side Validation

**Generation Form:**
1. **Source text length - minimum**
   - Condition: `sourceText.length >= 1000`
   - Component: GenerationForm
   - Effect: Generate button disabled if false
   - Error message: "Text must be at least 1000 characters (current: X)"
   - Visual: Character counter displays in red

2. **Source text length - maximum**
   - Condition: `sourceText.length <= 10000`
   - Component: GenerationForm
   - Effect: Generate button disabled if false
   - Error message: "Text must not exceed 10000 characters (current: X)"
   - Visual: Character counter displays in red

3. **Source text not empty**
   - Condition: `sourceText.trim().length > 0`
   - Component: GenerationForm
   - Effect: Generate button disabled if false

**Proposal Editing:**
4. **Front text - maximum length**
   - Condition: `front.length <= 200`
   - Component: ProposalEdit
   - Effect: Save button disabled if false
   - Error message: "Front text must not exceed 200 characters (current: X)"
   - Visual: Character counter displays in red

5. **Back text - maximum length**
   - Condition: `back.length <= 500`
   - Component: ProposalEdit
   - Effect: Save button disabled if false
   - Error message: "Back text must not exceed 500 characters (current: X)"
   - Visual: Character counter displays in red

6. **Front text not empty**
   - Condition: `front.trim().length > 0`
   - Component: ProposalEdit
   - Effect: Save button disabled if false
   - Error message: "Front text is required"

7. **Back text not empty**
   - Condition: `back.trim().length > 0`
   - Component: ProposalEdit
   - Effect: Save button disabled if false
   - Error message: "Back text is required"

**Saving Flashcards:**
8. **At least one proposal accepted**
   - Condition: `proposals.filter(p => p.status === 'accepted' || p.status === 'edited').length > 0`
   - Component: SaveActionsBar
   - Effect: Save buttons disabled if false
   - Visual: Buttons greyed out, count shows "0 accepted"

9. **Generation ID exists**
   - Condition: `generationMetadata.id !== null && generationMetadata.id !== undefined`
   - Component: GenerateView (before save)
   - Effect: Save operation blocked if false
   - Error: "Generation data missing. Please regenerate flashcards."

### Server-Side Validation (handled by API)

These validations are performed by the API and should be reflected in the UI through error messages:

**POST /api/generations:**
- Source text length 1000-10000 characters (matches client-side)
- Request body format validation (Zod schema)

**POST /api/flashcards:**
- Front text max 200 characters (matches client-side)
- Back text max 500 characters (matches client-side)
- Source must be 'ai-full', 'ai-edited', or 'manual'
- generation_id must reference valid generation owned by user
- generation_id must be non-null for AI sources

### Conditional UI States

**Generate button enabled when:**
- `!isGenerating && sourceText.length >= 1000 && sourceText.length <= 10000`

**Save button enabled when:**
- `!isSaving && acceptedCount > 0`

**ProposalCard edit mode Save button enabled when:**
- `front.trim().length > 0 && front.length <= 200 && back.trim().length > 0 && back.length <= 500`

## 10. Error Handling

### Error Categories and Handling

**1. Generation Errors (POST /api/generations)**

**401 Unauthorized:**
- Cause: User session expired or invalid
- Handling: Redirect to login page with return URL
- Message: Not shown (automatic redirect)

**400 Bad Request:**
- Cause: Source text length outside 1000-10000 range
- Handling: Display error in ErrorMessage component
- Message: Extract from API response or "Invalid text length. Please use 1000-10000 characters."
- Recovery: User can edit text and retry

**429 Rate Limit Exceeded:**
- Cause: Too many generation requests in short time
- Handling: Display specific error with retry guidance
- Message: "You've made too many requests. Please wait a few minutes and try again."
- Recovery: Disable generate button temporarily, show countdown timer (optional)

**500 Internal Server Error:**
- Cause: AI service failure or database error
- Handling: Display generic error with retry option
- Message: "Failed to generate flashcards. Please try again."
- Recovery: Retry button calls generation API again with same text

**2. Save Errors (POST /api/flashcards)**

**401 Unauthorized:**
- Cause: User session expired
- Handling: Redirect to login with state preservation (optional)
- Message: Not shown (automatic redirect)
- Note: Consider saving proposals to localStorage before redirect

**400 Bad Request - Validation:**
- Cause: Flashcard data fails validation (text too long, invalid source)
- Handling: Display specific error, highlight affected proposals
- Message: Extract validation error from API response
- Recovery: User can edit affected proposals and retry save

**400 Bad Request - Invalid generation_id:**
- Cause: Referenced generation doesn't exist or doesn't belong to user
- Handling: Display error requiring regeneration
- Message: "Generation reference invalid. Please generate flashcards again."
- Recovery: Reset view to idle state, user must regenerate

**500 Internal Server Error:**
- Cause: Database error during flashcard creation
- Handling: Display error with retry option
- Message: "Failed to save flashcards. Please try again."
- Recovery: Retry button calls save API again with same data (proposals preserved)

**3. Client-Side Validation Errors**

**Text length validation:**
- Handling: Inline error messages below textarea
- Prevention: Disable submit button, show character counter in red
- Message: Dynamic based on count

**Edit validation:**
- Handling: Inline error messages in edit form
- Prevention: Disable save button
- Message: Field-specific error below each input

**4. Unexpected Errors**

**React component errors:**
- Handling: Error boundary component (implement if not exists)
- Message: "Something went wrong. Please refresh the page."
- Recovery: Page refresh button

**State corruption:**
- Handling: Detect invalid state transitions
- Message: "An unexpected error occurred. Resetting..."
- Recovery: Reset to idle state automatically

### Error Message Presentation

All errors should be displayed using the ErrorMessage component with:
- Clear, user-friendly language (no technical jargon)
- Specific recovery actions when available
- Appropriate visual styling (Alert component with destructive variant)
- Optional retry mechanism
- Preservation of user work when possible (don't lose typed text or accepted proposals)

### Error Logging

Consider implementing error tracking:
- Log client-side errors to console in development
- Send error events to analytics/monitoring in production
- Include context: user ID, timestamp, error type, API endpoint

## 11. Implementation Steps

### Step 1: Set up the Astro page

1. Create `/src/pages/generate.astro`
2. Add authentication check using Astro middleware
3. Import and render a placeholder for `GenerateView` component
4. Apply appropriate layout wrapper
5. Add client:load directive to GenerateView for hydration

### Step 2: Create type definitions

1. Create `/src/components/GenerateView.types.ts`
2. Define all ViewModel types:
   - `ProposalStatus`
   - `ProposalWithStatus`
   - `GenerationViewState`
3. Define all component prop interfaces:
   - `GenerationFormProps`
   - `CharacterCounterProps`
   - `ProposalsListProps`
   - `ProposalCardProps`
   - `ProposalDisplayProps`
   - `ProposalEditProps`
   - `SaveActionsBarProps`
   - `ErrorMessageProps`

### Step 3: Create utility components

1. Create `/src/components/CharacterCounter.tsx`
   - Implement character count display
   - Add color-coded styling based on validation
   - Export component

2. Create `/src/components/LoadingState.tsx`
   - Import Skeleton from shadcn/ui
   - Create skeleton cards mimicking ProposalCard layout
   - Export component

3. Create `/src/components/ErrorMessage.tsx`
   - Import Alert from shadcn/ui
   - Implement error display with retry button
   - Export component

### Step 4: Create form components

1. Create `/src/components/GenerationForm.tsx`
   - Import Textarea and Button from shadcn/ui
   - Implement local state for sourceText
   - Add character count validation logic
   - Implement onChange handler with validation
   - Implement submit handler calling onGenerate prop
   - Add CharacterCounter component
   - Export component

### Step 5: Create proposal display components

1. Create `/src/components/ProposalDisplay.tsx`
   - Import Card and Badge from shadcn/ui
   - Implement front/back text display
   - Add status badge with color coding
   - Add action buttons (Accept, Edit, Reject)
   - Export component

2. Create `/src/components/ProposalEdit.tsx`
   - Import Input, Textarea, Button from shadcn/ui
   - Implement local state for front and back text
   - Add validation logic for both fields
   - Implement Save and Cancel handlers
   - Add character counters for both fields
   - Export component

### Step 6: Create proposal card component

1. Create `/src/components/ProposalCard.tsx`
   - Implement mode switching state (display vs edit)
   - Conditionally render ProposalDisplay or ProposalEdit
   - Implement event handlers for accept, edit, reject
   - Handle edit mode save and cancel
   - Export component

### Step 7: Create proposals list components

1. Create `/src/components/SaveActionsBar.tsx`
   - Import Button from shadcn/ui
   - Display accepted count
   - Implement save buttons with disabled states
   - Export component

2. Create `/src/components/ProposalsList.tsx`
   - Import ProposalCard and SaveActionsBar
   - Implement list/grid layout for proposal cards
   - Map proposals to ProposalCard components
   - Forward event handlers to parent
   - Render SaveActionsBar at bottom
   - Export component

### Step 8: Create custom hook (optional but recommended)

1. Create `/src/components/hooks/useFlashcardGeneration.ts`
2. Implement state management:
   - `viewState: GenerationViewState`
   - State transition functions
3. Implement `generateFlashcards` function:
   - Validation
   - API call to POST /api/generations
   - Error handling
   - State updates
4. Implement `updateProposal` function:
   - Accept logic
   - Edit logic
   - Reject logic
5. Implement `saveFlashcards` function:
   - Filter accepted proposals
   - Map to CreateFlashcardDTO with correct source
   - API call to POST /api/flashcards
   - Error handling
   - Success navigation/reset
6. Export hook

### Step 9: Create main GenerateView component

1. Create `/src/components/GenerateView.tsx`
2. Import all child components
3. Import or implement state management (useFlashcardGeneration hook)
4. Set up viewState with initial value `{ type: 'idle' }`
5. Implement generateFlashcards handler:
   - Call API
   - Transform response to ProposalWithStatus[]
   - Update state
6. Implement proposal update handlers:
   - onAccept: update proposal status to 'accepted'
   - onEdit: update proposal status to 'edited' with new content
   - onReject: update proposal status to 'rejected'
7. Implement saveFlashcards handler:
   - Filter accepted/edited proposals
   - Map to API request format
   - Call API
   - Handle success/error
8. Implement conditional rendering based on viewState:
   - idle: show GenerationForm only
   - generating: show LoadingState
   - generated: show GenerationForm + ProposalsList
   - error: show ErrorMessage
   - saving: show ProposalsList with loading state
9. Export component

### Step 10: Integrate with Astro page

1. Update `/src/pages/generate.astro`
2. Import GenerateView
3. Render with client:load directive
4. Test authentication flow
5. Add any necessary meta tags or SEO elements

### Step 11: Style components

1. Apply Tailwind classes to all components for layout
2. Ensure responsive design (mobile, tablet, desktop)
3. Implement dark mode support if required
4. Add focus states for accessibility
5. Test color contrast for WCAG compliance
6. Add transitions/animations for state changes (optional)

### Step 12: Add accessibility features

1. Add ARIA labels to all interactive elements
2. Ensure keyboard navigation works correctly
3. Add aria-live regions for dynamic content updates
4. Test with screen reader
5. Ensure focus management in edit mode
6. Add skip links if needed

### Step 13: Optimize and refine

1. Add React.memo() to components that re-render frequently
2. Use useCallback for event handlers passed to children
3. Implement code splitting if bundle size is large
4. Add loading states and skeleton screens
5. Optimize API calls (debounce if needed)
6. Review and refactor code for clarity