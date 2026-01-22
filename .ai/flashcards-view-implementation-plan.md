# View Implementation Plan: Flashcards List View

## 1. Overview

The Flashcards List View is a primary interface for managing saved flashcards. It displays all flashcards owned by the authenticated user in a paginated, filterable, and sortable list. Users can edit flashcards through a modal dialog and delete flashcards with confirmation. The view supports three types of flashcards based on their source: AI-generated (ai-full), AI-generated and edited by user (ai-edited), and manually created (manual).

## 2. View Routing

- **Route:** `/flashcards`
- **Authentication:** Required (protected route)
- **Layout:** Main application layout with header and navigation

## 3. Component Structure

```
FlashcardsPage (Astro page: src/pages/flashcards.astro)
└── FlashcardsView (React component: src/components/FlashcardsView.tsx)
    ├── FlashcardsHeader (React component)
    │   ├── Title and description
    │   └── FilterControls (React component)
    │       ├── Source filter (dropdown)
    │       ├── Sort field selector (dropdown)
    │       └── Sort order toggle (button)
    ├── FlashcardsList (React component)
    │   └── FlashcardItem (React component) [repeated]
    │       ├── Card content (front/back preview)
    │       ├── Metadata (source badge, timestamps)
    │       ├── Edit button
    │       └── Delete button
    ├── PaginationControls (React component)
    │   ├── Previous page button
    │   ├── Page info display
    │   └── Next page button
    ├── EmptyState (React component)
    │   └── Message when no flashcards exist
    ├── EditFlashcardModal (React component)
    │   ├── Modal overlay and dialog
    │   ├── Form with Front and Back inputs
    │   ├── Validation error messages
    │   ├── Save button
    │   └── Cancel button
    └── DeleteConfirmationDialog (React component)
        ├── Dialog overlay
        ├── Warning message
        ├── Confirm button
        └── Cancel button
```

## 4. Component Details

### FlashcardsPage (Astro)

- **Component description:** Server-side rendered page component that handles authentication check and provides the React root component.
- **Main elements:**
  - Authentication check via middleware
  - Layout wrapper
  - `<FlashcardsView client:load />` React component
- **Handled interactions:** None (static page wrapper)
- **Handled validation:** Authentication status check (redirect to login if not authenticated)
- **Types:** None specific to this component
- **Props:** None

### FlashcardsView (React)

- **Component description:** Main container component managing the entire flashcard list view state, including fetching data, pagination, filtering, sorting, and modal states.
- **Main elements:**
  - `<FlashcardsHeader />` with filter controls
  - `<FlashcardsList />` displaying flashcard items
  - `<PaginationControls />` for navigation
  - `<EmptyState />` when no flashcards exist
  - `<EditFlashcardModal />` for editing
  - `<DeleteConfirmationDialog />` for delete confirmation
  - Loading spinner during data fetch
  - Error message display area
- **Handled interactions:**
  - Initial data fetch on mount
  - Filter changes (source, sort field, sort order)
  - Pagination (next/previous page)
  - Edit button click (opens modal)
  - Delete button click (opens confirmation dialog)
  - Modal save/cancel actions
  - Delete confirmation/cancellation
- **Handled validation:** None directly (delegates to child components)
- **Types:**
  - `FlashcardDTO` (API response type)
  - `PaginatedFlashcardsResponseDTO` (API response type)
  - `UpdateFlashcardDTO` (API request type)
  - `FlashcardsViewState` (ViewModel for component state)
- **Props:** None (root component)

### FlashcardsHeader (React)

- **Component description:** Header section displaying the page title and filter/sort controls.
- **Main elements:**
  - `<h1>` page title
  - `<p>` description text
  - `<FilterControls />` component
- **Handled interactions:** None (delegates to FilterControls)
- **Handled validation:** None
- **Types:**
  - `FilterControlsProps` (passed to child)
- **Props:**
  ```typescript
  interface FlashcardsHeaderProps {
    source: "ai-full" | "ai-edited" | "manual" | undefined;
    sortField: "created_at" | "updated_at" | "front";
    sortOrder: "asc" | "desc";
    onSourceChange: (source: "ai-full" | "ai-edited" | "manual" | undefined) => void;
    onSortFieldChange: (field: "created_at" | "updated_at" | "front") => void;
    onSortOrderChange: (order: "asc" | "desc") => void;
  }
  ```

### FilterControls (React)

- **Component description:** Control panel for filtering and sorting flashcards.
- **Main elements:**
  - Source filter `<Select>` component (shadcn/ui)
  - Sort field `<Select>` component (shadcn/ui)
  - Sort order toggle `<Button>` with ascending/descending icon
- **Handled interactions:**
  - Source filter change
  - Sort field change
  - Sort order toggle click
- **Handled validation:** None (all values are predefined)
- **Types:**
  - `SourceFilterOption` (ViewModel for source options)
  - `SortFieldOption` (ViewModel for sort field options)
- **Props:**
  ```typescript
  interface FilterControlsProps {
    source: "ai-full" | "ai-edited" | "manual" | undefined;
    sortField: "created_at" | "updated_at" | "front";
    sortOrder: "asc" | "desc";
    onSourceChange: (source: "ai-full" | "ai-edited" | "manual" | undefined) => void;
    onSortFieldChange: (field: "created_at" | "updated_at" | "front") => void;
    onSortOrderChange: (order: "asc" | "desc") => void;
  }
  ```

### FlashcardsList (React)

- **Component description:** Container component that renders a list of flashcard items or an empty state.
- **Main elements:**
  - `<div>` or `<ul>` container with grid/list layout
  - Multiple `<FlashcardItem />` components
  - Loading skeleton when fetching data
- **Handled interactions:** None (delegates to FlashcardItem)
- **Handled validation:** None
- **Types:**
  - `FlashcardDTO[]` (list of flashcards)
- **Props:**
  ```typescript
  interface FlashcardsListProps {
    flashcards: FlashcardDTO[];
    isLoading: boolean;
    onEdit: (flashcard: FlashcardDTO) => void;
    onDelete: (flashcard: FlashcardDTO) => void;
  }
  ```

### FlashcardItem (React)

- **Component description:** Individual flashcard card component displaying flashcard content and action buttons.
- **Main elements:**
  - `<Card>` component (shadcn/ui)
  - `<div>` for front text display
  - `<div>` for back text display (initially hidden, expandable)
  - Source badge `<Badge>` component (shadcn/ui)
  - Timestamp display (created/updated)
  - Edit `<Button>` component (shadcn/ui)
  - Delete `<Button>` component (shadcn/ui)
- **Handled interactions:**
  - Expand/collapse card to show back text
  - Edit button click
  - Delete button click
- **Handled validation:** None
- **Types:**
  - `FlashcardDTO` (single flashcard data)
- **Props:**
  ```typescript
  interface FlashcardItemProps {
    flashcard: FlashcardDTO;
    onEdit: (flashcard: FlashcardDTO) => void;
    onDelete: (flashcard: FlashcardDTO) => void;
  }
  ```

### PaginationControls (React)

- **Component description:** Pagination controls for navigating through flashcard pages.
- **Main elements:**
  - Previous `<Button>` component (shadcn/ui)
  - Page info text display (showing current range and total)
  - Next `<Button>` component (shadcn/ui)
- **Handled interactions:**
  - Previous page button click
  - Next page button click
- **Handled validation:** Disable previous button when on first page, disable next button when no more pages
- **Types:**
  - `PaginationDTO` (pagination metadata)
- **Props:**
  ```typescript
  interface PaginationControlsProps {
    pagination: PaginationDTO;
    onPreviousPage: () => void;
    onNextPage: () => void;
  }
  ```

### EmptyState (React)

- **Component description:** Display component shown when no flashcards match the current filters or user has no flashcards.
- **Main elements:**
  - Icon or illustration
  - Message text
  - Optional action button (e.g., "Create your first flashcard")
- **Handled interactions:**
  - Optional navigation to flashcard creation
- **Handled validation:** None
- **Types:** None specific
- **Props:**
  ```typescript
  interface EmptyStateProps {
    hasFilters: boolean; // Show different message if filters are active
  }
  ```

### EditFlashcardModal (React)

- **Component description:** Modal dialog for editing flashcard front and back text with validation.
- **Main elements:**
  - `<Dialog>` component (shadcn/ui)
  - `<DialogContent>` wrapper
  - `<DialogHeader>` with title
  - `<form>` element
  - Front text `<Textarea>` component (shadcn/ui)
  - Back text `<Textarea>` component (shadcn/ui)
  - Character count displays
  - Validation error messages
  - Save `<Button>` component
  - Cancel `<Button>` component
  - Loading state during save
- **Handled interactions:**
  - Form input changes
  - Form submission (save)
  - Cancel button click
  - Modal close (ESC key, overlay click)
- **Handled validation:**
  - **Front text:**
    - Required (cannot be empty)
    - Maximum 200 characters
  - **Back text:**
    - Required (cannot be empty)
    - Maximum 500 characters
  - At least one field must be different from original value
  - Display real-time character count
  - Show validation errors inline
- **Types:**
  - `FlashcardDTO` (original flashcard data)
  - `UpdateFlashcardDTO` (update payload)
  - `EditFlashcardFormState` (ViewModel for form state)
- **Props:**
  ```typescript
  interface EditFlashcardModalProps {
    flashcard: FlashcardDTO | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: number, updates: UpdateFlashcardDTO) => Promise<void>;
  }
  ```

### DeleteConfirmationDialog (React)

- **Component description:** Confirmation dialog for deleting a flashcard.
- **Main elements:**
  - `<AlertDialog>` component (shadcn/ui)
  - `<AlertDialogContent>` wrapper
  - Warning icon
  - Confirmation message with flashcard front text preview
  - Confirm (destructive) `<Button>` component
  - Cancel `<Button>` component
  - Loading state during deletion
- **Handled interactions:**
  - Confirm button click
  - Cancel button click
  - Dialog close (ESC key, overlay click)
- **Handled validation:** None (simple confirmation)
- **Types:**
  - `FlashcardDTO` (flashcard to delete)
- **Props:**
  ```typescript
  interface DeleteConfirmationDialogProps {
    flashcard: FlashcardDTO | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
  }
  ```

## 5. Types

### Existing DTOs (from src/types.ts)

```typescript
// Already defined in types.ts
type FlashcardDTO = Omit<Tables<"flashcards">, "user_id">;
// Fields: id, front, back, source, generation_id, created_at, updated_at

type UpdateFlashcardDTO = Pick<TablesUpdate<"flashcards">, "front" | "back">;
// Fields: front?, back?

interface PaginatedFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO;
}

interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface DeleteResponseDTO {
  message: string;
}
```

### New ViewModels (to be created in the view or separate types file)

```typescript
// View state for the main FlashcardsView component
interface FlashcardsViewState {
  // Data
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO | null;

  // Filters and sorting
  filters: {
    source: "ai-full" | "ai-edited" | "manual" | undefined;
    sortField: "created_at" | "updated_at" | "front";
    sortOrder: "asc" | "desc";
  };

  // Current page offset
  offset: number;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Modal states
  editingFlashcard: FlashcardDTO | null;
  isEditModalOpen: boolean;
  deletingFlashcard: FlashcardDTO | null;
  isDeleteDialogOpen: boolean;

  // Action states
  isSaving: boolean;
  isDeleting: boolean;
}

// Form state for edit modal
interface EditFlashcardFormState {
  front: string;
  back: string;
  errors: {
    front?: string;
    back?: string;
  };
  isDirty: boolean;
}

// Source filter options for dropdown
interface SourceFilterOption {
  value: "ai-full" | "ai-edited" | "manual" | "all";
  label: string;
}

// Sort field options for dropdown
interface SortFieldOption {
  value: "created_at" | "updated_at" | "front";
  label: string;
}

// API error response
interface ApiErrorResponse {
  error: string;
  message: string;
}
```

## 6. State Management

### Main State Management Strategy

The view uses **React hooks** for state management without external state management libraries. The main `FlashcardsView` component manages all state using `useState` and `useEffect` hooks.

### Custom Hook: useFlashcards

Create a custom hook `useFlashcards` to encapsulate flashcard fetching, filtering, and pagination logic:

```typescript
function useFlashcards() {
  const [state, setState] = useState<FlashcardsViewState>({
    flashcards: [],
    pagination: null,
    filters: {
      source: undefined,
      sortField: "created_at",
      sortOrder: "desc",
    },
    offset: 0,
    isLoading: false,
    error: null,
    editingFlashcard: null,
    isEditModalOpen: false,
    deletingFlashcard: null,
    isDeleteDialogOpen: false,
    isSaving: false,
    isDeleting: false,
  });

  // Fetch flashcards function
  const fetchFlashcards = async () => {
    // Implementation
  };

  // Effect to fetch on mount and filter/sort changes
  useEffect(() => {
    fetchFlashcards();
  }, [state.filters, state.offset]);

  // Return state and actions
  return {
    // State
    flashcards: state.flashcards,
    pagination: state.pagination,
    filters: state.filters,
    isLoading: state.isLoading,
    error: state.error,
    editingFlashcard: state.editingFlashcard,
    isEditModalOpen: state.isEditModalOpen,
    deletingFlashcard: state.deletingFlashcard,
    isDeleteDialogOpen: state.isDeleteDialogOpen,
    isSaving: state.isSaving,
    isDeleting: state.isDeleting,

    // Actions
    setSourceFilter: (source) => { /* ... */ },
    setSortField: (field) => { /* ... */ },
    setSortOrder: (order) => { /* ... */ },
    goToNextPage: () => { /* ... */ },
    goToPreviousPage: () => { /* ... */ },
    openEditModal: (flashcard) => { /* ... */ },
    closeEditModal: () => { /* ... */ },
    openDeleteDialog: (flashcard) => { /* ... */ },
    closeDeleteDialog: () => { /* ... */ },
    updateFlashcard: async (id, updates) => { /* ... */ },
    deleteFlashcard: async (id) => { /* ... */ },
    refetchFlashcards: () => { /* ... */ },
  };
}
```

### Form State Management in EditFlashcardModal

The modal manages its own form state using a separate `useState` hook:

```typescript
const [formState, setFormState] = useState<EditFlashcardFormState>({
  front: flashcard?.front || "",
  back: flashcard?.back || "",
  errors: {},
  isDirty: false,
});
```

## 7. API Integration

### GET /api/flashcards

**Purpose:** Fetch paginated, filtered, and sorted flashcards

**Request:**
- Method: GET
- Headers: `Authorization: Bearer {token}` (handled by Supabase client)
- Query Parameters:
  - `limit`: number (default 50, max 100)
  - `offset`: number (default 0)
  - `source`: "ai-full" | "ai-edited" | "manual" (optional)
  - `sort`: "created_at" | "updated_at" | "front" (default "created_at")
  - `order`: "asc" | "desc" (default "desc")

**Response Type:** `PaginatedFlashcardsResponseDTO`

**Implementation:**
```typescript
async function fetchFlashcards(params: {
  limit: number;
  offset: number;
  source?: "ai-full" | "ai-edited" | "manual";
  sort: "created_at" | "updated_at" | "front";
  order: "asc" | "desc";
}): Promise<PaginatedFlashcardsResponseDTO> {
  const queryParams = new URLSearchParams({
    limit: params.limit.toString(),
    offset: params.offset.toString(),
    sort: params.sort,
    order: params.order,
  });

  if (params.source) {
    queryParams.append("source", params.source);
  }

  const response = await fetch(`/api/flashcards?${queryParams}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

### PATCH /api/flashcards/{id}

**Purpose:** Update flashcard front and/or back text

**Request:**
- Method: PATCH
- Headers: `Authorization: Bearer {token}`
- URL: `/api/flashcards/{id}`
- Body Type: `UpdateFlashcardDTO`

**Response Type:** `FlashcardDTO`

**Implementation:**
```typescript
async function updateFlashcard(
  id: number,
  updates: UpdateFlashcardDTO
): Promise<FlashcardDTO> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

### DELETE /api/flashcards/{id}

**Purpose:** Delete a flashcard

**Request:**
- Method: DELETE
- Headers: `Authorization: Bearer {token}`
- URL: `/api/flashcards/{id}`

**Response Type:** `DeleteResponseDTO`

**Implementation:**
```typescript
async function deleteFlashcard(id: number): Promise<DeleteResponseDTO> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

## 8. User Interactions

### 1. Initial Page Load
- **Action:** User navigates to `/flashcards`
- **Flow:**
  1. Page checks authentication via middleware
  2. If not authenticated, redirect to login
  3. If authenticated, render FlashcardsView component
  4. Component fetches flashcards with default filters (no source filter, sort by created_at desc, offset 0)
  5. Display loading spinner while fetching
  6. On success, display flashcard list with pagination
  7. On error, display error message with retry option

### 2. Filter by Source
- **Action:** User selects a source filter from dropdown
- **Flow:**
  1. User clicks source filter dropdown
  2. User selects option: "All", "AI Generated", "AI Edited", or "Manual"
  3. Component updates filter state
  4. Reset offset to 0
  5. Fetch flashcards with new filter
  6. Display loading state
  7. Update list with filtered results

### 3. Sort Flashcards
- **Action:** User changes sort field or order
- **Flow:**
  1. User selects sort field from dropdown (Created Date, Updated Date, Question)
  2. User clicks sort order toggle (ascending/descending)
  3. Component updates sort state
  4. Reset offset to 0
  5. Fetch flashcards with new sort parameters
  6. Update list with sorted results

### 4. Navigate Pages
- **Action:** User clicks next/previous page button
- **Flow:**
  1. User clicks "Next" or "Previous" button
  2. Component calculates new offset (current ± limit)
  3. Fetch flashcards with new offset
  4. Display loading state
  5. Update list with new page results
  6. Scroll to top of list

### 5. Expand/Collapse Flashcard
- **Action:** User clicks on flashcard to view full back text
- **Flow:**
  1. User clicks on flashcard card
  2. Card expands to show full back text
  3. Click again to collapse
  4. Visual indication of expanded state

### 6. Edit Flashcard
- **Action:** User clicks edit button on flashcard
- **Flow:**
  1. User clicks "Edit" button on flashcard item
  2. Open EditFlashcardModal with flashcard data
  3. Modal displays with form pre-filled
  4. User modifies front and/or back text
  5. Real-time character count updates
  6. Real-time validation error display
  7. User clicks "Save" button
  8. Validate form data
  9. If invalid, show errors and prevent submission
  10. If valid, call PATCH API endpoint
  11. Show loading state on save button
  12. On success: close modal, show success toast, update flashcard in list
  13. On error: show error message in modal, keep modal open

### 7. Cancel Edit
- **Action:** User cancels editing
- **Flow:**
  1. User clicks "Cancel" button or ESC key or overlay
  2. If form is dirty (has changes), show confirmation dialog
  3. If confirmed or not dirty, close modal and discard changes
  4. Reset form state

### 8. Delete Flashcard
- **Action:** User deletes a flashcard
- **Flow:**
  1. User clicks "Delete" button on flashcard item
  2. Open DeleteConfirmationDialog
  3. Dialog shows warning with flashcard preview
  4. User clicks "Confirm" button
  5. Call DELETE API endpoint
  6. Show loading state on confirm button
  7. On success: close dialog, show success toast, remove flashcard from list
  8. On error: show error message in dialog, keep dialog open
  9. If list becomes empty and not on first page, go to previous page

### 9. Cancel Delete
- **Action:** User cancels deletion
- **Flow:**
  1. User clicks "Cancel" button or ESC key or overlay
  2. Close dialog without action
  3. Return focus to delete button

## 9. Conditions and Validation

### Component-Level Conditions

#### FlashcardsList Component
- **Condition:** No flashcards available
  - **Check:** `flashcards.length === 0 && !isLoading`
  - **Action:** Display EmptyState component instead of list
  - **Message:** Changes based on whether filters are active

#### PaginationControls Component
- **Condition:** First page
  - **Check:** `pagination.offset === 0`
  - **Action:** Disable "Previous" button
- **Condition:** Last page
  - **Check:** `!pagination.has_more`
  - **Action:** Disable "Next" button
- **Condition:** Single page
  - **Check:** `pagination.total <= pagination.limit`
  - **Action:** Hide entire pagination controls

#### EditFlashcardModal - Form Validation

##### Front Text Field
- **Required Validation:**
  - **Check:** `front.trim() === ""`
  - **Error Message:** "Front text is required"
  - **When:** On form submission, on blur after initial interaction
- **Max Length Validation:**
  - **Check:** `front.length > 200`
  - **Error Message:** "Front text must not exceed 200 characters"
  - **When:** Real-time as user types
- **Character Count Display:**
  - **Format:** `{front.length}/200`
  - **Color:** Green if < 180, yellow if 180-200, red if > 200

##### Back Text Field
- **Required Validation:**
  - **Check:** `back.trim() === ""`
  - **Error Message:** "Back text is required"
  - **When:** On form submission, on blur after initial interaction
- **Max Length Validation:**
  - **Check:** `back.length > 500`
  - **Error Message:** "Back text must not exceed 500 characters"
  - **When:** Real-time as user types
- **Character Count Display:**
  - **Format:** `{back.length}/500`
  - **Color:** Green if < 450, yellow if 450-500, red if > 500

##### Form-Level Validation
- **At Least One Change Required:**
  - **Check:** `front === originalFront && back === originalBack`
  - **Error Message:** "Please make at least one change"
  - **When:** On form submission
- **Save Button State:**
  - **Disabled When:**
    - Form has validation errors
    - Form is not dirty (no changes)
    - Save operation is in progress
  - **Enabled When:** Form is valid and has changes

#### API Response Validation
- **401 Unauthorized:**
  - **Action:** Redirect to login page
  - **Toast:** "Your session has expired. Please log in again."
- **404 Not Found (on edit/delete):**
  - **Action:** Close modal/dialog, remove from list
  - **Toast:** "This flashcard no longer exists"
- **400 Bad Request:**
  - **Action:** Display validation errors from API in modal
  - **Format:** Show field-specific errors inline

## 10. Error Handling

### Network Errors
- **Scenario:** Fetch request fails due to network issues
- **Detection:** Catch fetch errors or non-OK responses
- **Handling:**
  - Display error message: "Unable to load flashcards. Please check your connection."
  - Show retry button
  - Log error to console for debugging
  - Keep previous data visible if available

### Authentication Errors (401)
- **Scenario:** User's session has expired
- **Detection:** API returns 401 status
- **Handling:**
  - Clear local auth state
  - Redirect to login page
  - Display toast: "Your session has expired. Please log in again."
  - Preserve intended action for post-login redirect

### Not Found Errors (404)
- **Scenario:** Flashcard was deleted by another session or doesn't exist
- **Detection:** API returns 404 on PATCH or DELETE
- **Handling:**
  - Close modal/dialog
  - Remove flashcard from local list
  - Display toast: "This flashcard no longer exists"
  - Don't show error as failure (graceful handling)

### Validation Errors (400)
- **Scenario:** Client-side validation missed something or API has stricter rules
- **Detection:** API returns 400 with validation details
- **Handling:**
  - Parse error response
  - Display field-specific errors in modal
  - Keep modal open for user to correct
  - Focus first invalid field

### Server Errors (500)
- **Scenario:** Unexpected server error
- **Detection:** API returns 500 status
- **Handling:**
  - Display error message: "Something went wrong. Please try again."
  - Keep modal/dialog open
  - Log full error for debugging
  - Provide retry option

### Empty State Scenarios
- **No Flashcards at All:**
  - Message: "You don't have any flashcards yet"
  - CTA: Link to generation view with text "Generate your first flashcards"
- **No Flashcards Match Filter:**
  - Message: "No flashcards found with the selected filters"
  - CTA: Button to clear filters

### Edge Cases
- **Delete Last Flashcard on Page:**
  - After successful delete, if page becomes empty and offset > 0, navigate to previous page
  - If offset is 0, show empty state

- **Rapid Filter Changes:**
  - Debounce filter changes (300ms) to avoid excessive API calls
  - Cancel previous in-flight requests when new filter is applied

- **Modal Open During Data Refresh:**
  - If flashcard is deleted/updated elsewhere, detect on modal save
  - Handle 404 gracefully

- **Concurrent Edit Attempts:**
  - Last save wins (optimistic concurrency)
  - Show warning if flashcard was updated since modal opened (compare updated_at)

## 11. Implementation Steps

### Step 1: Setup Page and Route
1. Create `/src/pages/flashcards.astro` page file
2. Add authentication check in page (redirect if not logged in)
3. Import and render `FlashcardsView` client component with `client:load`
4. Apply main layout wrapper

### Step 2: Create Type Definitions
1. Review existing types in `src/types.ts` (FlashcardDTO, UpdateFlashcardDTO, etc.)
2. Create `src/components/flashcards/types.ts` for ViewModels
3. Define all ViewModel interfaces:
   - `FlashcardsViewState`
   - `EditFlashcardFormState`
   - `SourceFilterOption`
   - `SortFieldOption`
   - `ApiErrorResponse`

### Step 3: Implement Custom Hook
1. Create `src/components/flashcards/hooks/useFlashcards.ts`
2. Implement state management using useState
3. Implement fetchFlashcards function with query parameter building
4. Implement filter/sort/pagination actions
5. Implement modal state management
6. Implement API integration functions (update, delete)
7. Add error handling for all API calls
8. Export hook with state and actions

### Step 4: Build Component Structure
1. Create `src/components/flashcards/FlashcardsView.tsx` main component
2. Use useFlashcards hook to get state and actions
3. Create basic component skeleton with all child components
4. Setup loading and error states
5. Implement conditional rendering logic

### Step 5: Implement FlashcardsHeader Component
1. Create `src/components/flashcards/FlashcardsHeader.tsx`
2. Add title and description
3. Integrate FilterControls component
4. Pass filter props and handlers

### Step 6: Implement FilterControls Component
1. Create `src/components/flashcards/FilterControls.tsx`
2. Implement source filter Select component (shadcn/ui)
3. Define source options: All, AI Generated, AI Edited, Manual
4. Implement sort field Select component
5. Define sort options: Created Date, Updated Date, Question
6. Implement sort order toggle Button
7. Wire up all onChange handlers
8. Add icons for visual clarity

### Step 7: Implement FlashcardsList Component
1. Create `src/components/flashcards/FlashcardsList.tsx`
2. Implement list layout (grid or vertical list)
3. Map over flashcards and render FlashcardItem components
4. Add loading skeleton for loading state
5. Handle empty array case

### Step 8: Implement FlashcardItem Component
1. Create `src/components/flashcards/FlashcardItem.tsx`
2. Use Card component from shadcn/ui
3. Display front text with truncation
4. Display back text with expand/collapse functionality
5. Add source badge with appropriate styling per source type
6. Display formatted timestamps (created_at, updated_at)
7. Add Edit button with icon
8. Add Delete button with icon and destructive styling
9. Implement expand/collapse state
10. Wire up onEdit and onDelete handlers
11. Add keyboard accessibility (Enter/Space to expand)

### Step 9: Implement PaginationControls Component
1. Create `src/components/flashcards/PaginationControls.tsx`
2. Add Previous button (disabled when offset = 0)
3. Add Next button (disabled when !has_more)
4. Display page info: "Showing X-Y of Z flashcards"
5. Wire up pagination handlers
6. Add keyboard navigation support

### Step 10: Implement EmptyState Component
1. Create `src/components/flashcards/EmptyState.tsx`
2. Display appropriate icon/illustration
3. Show different messages based on hasFilters prop
4. Add CTA button linking to generation view when no flashcards exist
5. Add "Clear filters" button when filters are active

### Step 11: Implement EditFlashcardModal Component
1. Create `src/components/flashcards/EditFlashcardModal.tsx`
2. Use Dialog component from shadcn/ui
3. Initialize form state from flashcard prop
4. Implement front Textarea with character counter
5. Implement back Textarea with character counter
6. Add real-time validation for both fields
7. Display validation errors inline
8. Implement Save button with loading state
9. Implement Cancel button
10. Add form submission handler with validation
11. Call onSave prop with validated data
12. Handle success: close modal, show toast
13. Handle error: display in modal, keep open
14. Add unsaved changes warning on cancel

### Step 12: Implement DeleteConfirmationDialog Component
1. Create `src/components/flashcards/DeleteConfirmationDialog.tsx`
2. Use AlertDialog component from shadcn/ui
3. Display warning icon and message
4. Show flashcard front text preview
5. Add destructive Confirm button with loading state
6. Add Cancel button
7. Wire up onConfirm handler
8. Handle success: close dialog, show toast
9. Handle error: display in dialog, keep open

### Step 13: Add Toast Notifications
1. Install/configure toast notification library (shadcn/ui Toaster)
2. Add toast notifications for:
   - Successful flashcard update
   - Successful flashcard deletion
   - Error messages
   - Session expiration

### Step 14: Implement Accessibility Features
1. Add ARIA labels to all interactive elements
2. Implement keyboard navigation:
   - Tab order through flashcards
   - Enter/Space to expand/edit/delete
   - ESC to close modals
3. Add focus management:
   - Return focus after modal close
   - Focus first error on validation failure
4. Add screen reader announcements:
   - Loading states
   - Success/error messages
   - Page changes
5. Ensure color contrast meets WCAG AA standards
6. Add skip links if needed

### Step 15: Add Loading and Error States
1. Implement loading skeleton for initial load
2. Add loading spinners for buttons during actions
3. Create error boundary component
4. Add retry mechanisms for failed requests
5. Implement optimistic UI updates where appropriate

### Step 16: Style Components
1. Apply Tailwind classes for layout and spacing
2. Use shadcn/ui component theming
3. Ensure responsive design (mobile, tablet, desktop)
4. Add transitions and animations for modals
5. Style source badges with distinct colors:
   - ai-full: Blue badge
   - ai-edited: Purple badge
   - manual: Green badge
6. Add hover states for interactive elements