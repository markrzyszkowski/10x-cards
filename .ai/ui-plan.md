# UI Architecture for 10xCards

## 1. UI structure overview

The user interface is built around the flashcard generation view, which is available after authentication. The structure includes authentication views, a flashcard generation view, a flashcard list with an edit modal, a user panel, and a review session view. The entire UI uses a responsive design based on Tailwind, ready-made components from shadcn/ui, and React.

## 2. List of views

* **Authentication screen**

    * **Route:** `/login` and `/register`
    * **Primary goal:** Allow users to log in and register.
    * **Key information:** Forms with email and password fields; authentication error messages.
    * **Key components:** Login/registration form, validation component, buttons, error messages.
    * **UX, accessibility, and security considerations:** Simple forms, clear error messages, keyboard support, JWT security.

* **Flashcard generation view**

    * **Route:** `/generate`
    * **Primary goal:** Allows users to generate AI-based flashcard suggestions and review them (accept, edit, or reject).
    * **Key information:** Text input field, list of AI-generated flashcard proposals, accept/edit/reject buttons for each flashcard.
    * **Key components:** Text input component, “Generate flashcards” button, flashcard list, action buttons (save all, save accepted), loading indicator (skeleton), error messages.
    * **UX, accessibility, and security considerations:** Intuitive form, text length validation (1000–10000 characters), responsiveness, clear messages and inline error handling.

* **Flashcard list view**

    * **Route:** `/flashcards`
    * **Primary goal:** Browse, edit, and delete saved flashcards.
    * **Key information:** List of saved flashcards with question and answer information.
    * **Key components:** List items, edit modal component, delete buttons (with confirmation).
    * **UX, accessibility, and security considerations:** Clear list layout, keyboard-accessible modifications, delete confirmations.

* **Flashcard edit modal**

    * **Route:** Displayed on top of the flashcard list view
    * **Primary goal:** Enable flashcard editing with data validation without real-time saving.
    * **Key information:** Flashcard edit form, “Front” and “Back” fields, validation messages.
    * **Key components:** Modal with form, “Save” and “Cancel” buttons.
    * **UX, accessibility, and security considerations:** Intuitive modal, screen reader accessibility, client-side data validation before submitting changes.

* **User panel**

    * **Route:** `/account`
    * **Primary goal:** Manage user account information and settings.
    * **Key information:** User data, account information edit options, logout button.
    * **Key components:** Account information edit form, action buttons.
    * **UX, accessibility, and security considerations:** Secure logout, easy access to settings, simple and clear interface.

* **Review session view**

    * **Route:** `/session`
    * **Primary goal:** Enable a learning session with flashcards according to the spaced repetition algorithm.
    * **Key information:** Displaying the front of the flashcard, a button to reveal the back, a rating mechanism.
    * **Key components:** Flashcard display component, interaction buttons (e.g., “Show answer”, “Rate”), session counter.
    * **UX, accessibility, and security considerations:** Minimalist, learning-focused interface, responsiveness, clear high-contrast buttons, intuitive navigation between flashcards.

## 3. User journey map

1. The user accesses the application and lands on the login/registration screen.
2. After successful authentication, the user is redirected to the flashcard generation view.
3. The user enters text for flashcard generation and initiates the generation process.
4. The API returns flashcard proposals, which are presented in the generation view.
5. The user reviews the proposals and decides which flashcards to accept, edit, or reject (optionally opening the edit modal).
6. The user approves selected flashcards and performs a bulk save via API interaction.
7. The user then navigates to the “My flashcards” view, where they can browse, edit, or delete flashcards.
8. The user uses navigation to visit the user panel and optionally start a review session.
9. In case of errors (e.g., validation or API issues), the user receives inline messages.

## 4. Navigation layout and structure

* **Main navigation:** Available as a top menu in the page layout after login.
* **Navigation elements:** Links to views: “Flashcard generation”, “My flashcards”, “Study session”, “Profile”, and a logout button.
* **Responsiveness:** On mobile, navigation transforms into a hamburger menu, allowing easy access to other views.
* **Flow:** Navigation enables seamless transitions between views while preserving user context and session data.

## 5. Key components

* **Authentication forms:** Login and registration components with validation support.
* **Flashcard generation component:** Text field and a button that triggers the generation process, with a loading indicator.
* **Flashcard list:** Interactive component displaying flashcards with edit and delete options.
* **Edit modal:** Component that allows flashcard editing with data validation before confirmation.
* **Toast notifications:** Component for displaying success and error messages.
* **Navigation menu:** Navigation elements that facilitate movement between views.
* **Review session component:** Interactive layout for displaying flashcards during a learning session, with a rating mechanism.
