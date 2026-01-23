# Test Plan: 10x Cards

## 1. Introduction and Testing Objectives

### 1.1 Purpose

This document outlines the comprehensive testing strategy for 10x Cards, an AI-powered flashcard application. The testing objectives are:

- Ensure the application functions correctly across all user workflows
- Verify security measures including authentication, authorization, and data protection
- Validate AI integration reliability and error handling
- Confirm data integrity and consistency across all operations
- Assess performance under various load conditions
- Ensure accessibility compliance and cross-browser compatibility

### 1.2 Quality Goals

- **Security**: Zero unauthorized access incidents, all RLS policies enforced
- **Reliability**: 99%+ uptime for critical user workflows
- **Data Integrity**: 100% accuracy in flashcard CRUD operations
- **AI Quality**: 95%+ success rate for AI flashcard generation
- **Performance**: Sub-second response times for standard operations
- **Accessibility**: WCAG 2.1 Level AA compliance

## 2. Test Scope

### 2.1 In Scope

#### Frontend Components

- Astro pages: index, login, register, generate, flashcards, profile, reset-password, update-password
- React components: GenerateView, FlashcardsView, ProfileView, and all UI components
- Custom React hooks: useFlashcardGeneration, useFlashcards
- Client-side routing and navigation
- Form validation and user feedback

#### Backend Services

- Authentication endpoints: /api/auth/login, /api/auth/register, /api/auth/logout, /api/auth/account
- Flashcard endpoints: /api/flashcards (GET, POST), /api/flashcards/[id] (PATCH, DELETE)
- Generation endpoint: /api/generations (POST)
- Middleware authentication and authorization
- Service layer: flashcard.service, generation.service, openrouter.service, rate-limit.service

#### Database Layer

- PostgreSQL schema: flashcards, generations, generation_error_logs tables
- Row Level Security (RLS) policies for all tables
- Database triggers and constraints
- Foreign key relationships and cascades
- Indexes for query performance

#### Integration Points

- Supabase authentication integration
- OpenRouter.ai API integration
- Supabase database operations
- Cookie-based session management

### 2.2 Out of Scope

- Infrastructure and DevOps configuration (CI/CD pipelines, Docker setup)
- Third-party service internal testing (Supabase, OpenRouter)
- Browser-specific bug fixes for unsupported browsers
- Mobile app development (web-only focus)

## 3. Types of Tests

### 3.1 Unit Tests

**Purpose**: Validate individual functions and components in isolation

**Coverage Areas**:

- Service layer methods (flashcard.service, generation.service, openrouter.service, rate-limit.service)
- Utility functions (lib/utils.ts)
- React hooks (useFlashcardGeneration, useFlashcards)
- Validation schemas (Zod schemas in API routes)
- Pure functions and data transformations

**Acceptance Criteria**: Minimum 80% code coverage for service layer and utilities

### 3.2 Integration Tests

**Purpose**: Verify interactions between components and external services

**Coverage Areas**:

- API endpoint workflows (request → validation → service → database → response)
- Authentication flow (middleware → Supabase Auth → session management)
- OpenRouter API integration (request → response → error handling)
- Database operations with RLS policies
- React component integration with API endpoints

**Acceptance Criteria**: All critical workflows covered, successful data flow verification

### 3.3 End-to-End (E2E) Tests

**Purpose**: Validate complete user workflows from UI to database

**Coverage Areas**:

- User registration and login flow
- Password reset and update flow
- AI flashcard generation workflow (input → API → review → save)
- Flashcard management workflow (create → read → update → delete)
- Filtering, sorting, and pagination of flashcards
- Profile management
- Logout and session termination

**Acceptance Criteria**: All primary user journeys validated in production-like environment

### 3.4 Security Tests

**Purpose**: Identify and prevent security vulnerabilities

**Coverage Areas**:

- Authentication bypass attempts
- Authorization validation (RLS policy enforcement)
- SQL injection prevention (Supabase parameterized queries)
- XSS prevention (input sanitization, React escaping)
- CSRF protection (Supabase CSRF tokens)
- Rate limiting enforcement and bypass attempts
- Session management and token security
- Password strength and storage validation
- API key exposure prevention

**Acceptance Criteria**: Zero critical/high severity vulnerabilities, OWASP Top 10 mitigation verified

### 3.5 Performance Tests

**Purpose**: Ensure application meets performance requirements under load

**Coverage Areas**:

- API endpoint response times (target: <500ms for standard operations)
- Database query performance (target: <100ms for indexed queries)
- AI generation latency (baseline: OpenRouter API response time + 200ms overhead)
- Concurrent user handling (target: 100 simultaneous users)
- Rate limiting under concurrent requests
- Page load times (target: <2s for initial load, <500ms for subsequent navigations)
- Memory leaks in React components

**Acceptance Criteria**: All performance targets met under simulated production load

### 3.6 Accessibility Tests

**Purpose**: Ensure application is usable by people with disabilities

**Coverage Areas**:

- ARIA attributes and landmarks
- Keyboard navigation (tab order, focus management)
- Screen reader compatibility
- Color contrast ratios (WCAG AA: 4.5:1 for text)
- Form labels and error messaging
- Focus indicators
- Semantic HTML structure

**Acceptance Criteria**: WCAG 2.1 Level AA compliance, axe DevTools audit passes

### 3.7 Compatibility Tests

**Purpose**: Verify application works across browsers and devices

**Coverage Areas**:

- Desktop browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browsers: Safari iOS, Chrome Android
- Responsive design breakpoints (sm, md, lg, xl)
- Touch interactions on mobile devices
- Browser feature detection and graceful degradation

**Acceptance Criteria**: Full functionality on all supported browsers, graceful degradation on older versions

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication and Authorization

#### Test Scenario: User Registration

**Preconditions**: User is not registered

**Steps**:

1. Navigate to /register
2. Enter valid email and password (min 8 characters)
3. Submit registration form
4. Verify email confirmation sent
5. Confirm email address
6. Verify user can log in

**Expected Results**: User account created, confirmation email sent, login successful

**Variations**:

- Invalid email format → validation error displayed
- Weak password → validation error displayed
- Existing email → error message "Email already registered"

#### Test Scenario: User Login

**Preconditions**: User is registered and confirmed

**Steps**:

1. Navigate to /login
2. Enter valid credentials
3. Submit login form
4. Verify redirect to /flashcards or /generate

**Expected Results**: User authenticated, session cookie set, redirect to protected page

**Variations**:

- Invalid credentials → error message "Invalid email or password"
- Unconfirmed email → error message "Please confirm your email"
- Protected page access without login → redirect to /login

#### Test Scenario: Password Reset

**Preconditions**: User is registered

**Steps**:

1. Navigate to /login
2. Click "Forgot password" link
3. Enter registered email
4. Submit reset request
5. Check email for reset link
6. Click reset link
7. Enter new password
8. Submit new password
9. Verify login with new password

**Expected Results**: Reset email sent, password updated, login successful with new password

#### Test Scenario: Middleware Authorization

**Preconditions**: User is not authenticated

**Steps**:

1. Attempt to access /flashcards directly
2. Verify redirect to /login
3. Attempt to call /api/flashcards directly
4. Verify 401 Unauthorized response

**Expected Results**: Unauthorized access prevented, appropriate redirects/errors returned

### 4.2 AI Flashcard Generation

#### Test Scenario: Successful Generation

**Preconditions**: User is authenticated, has not exceeded rate limit

**Steps**:

1. Navigate to /generate
2. Enter source text (1000-10000 characters)
3. Click "Generate" button
4. Wait for AI processing
5. Verify flashcard proposals displayed
6. Verify generation metadata (model, count, duration) displayed

**Expected Results**: AI generates 3-10 flashcards, proposals displayed with front/back content, metadata shown

**Variations**:

- Source text too short (<1000 chars) → validation error
- Source text too long (>10000 chars) → validation error
- OpenRouter API timeout → error message with retry option
- OpenRouter API error → error logged, user-friendly message displayed

#### Test Scenario: Proposal Review and Editing

**Preconditions**: Flashcard proposals generated

**Steps**:

1. Review first proposal
2. Click "Accept" on first proposal
3. Click "Edit" on second proposal
4. Modify front and back text
5. Save edited proposal
6. Click "Reject" on third proposal
7. Click "Save flashcards" button
8. Verify redirect to /flashcards
9. Verify flashcards saved with correct sources (ai-full, ai-edited)

**Expected Results**: Accepted proposals saved with source "ai-full", edited proposals saved with source "ai-edited", rejected proposals not saved

#### Test Scenario: Rate Limiting

**Preconditions**: User is authenticated

**Steps**:

1. Make 10 generation requests within 1 hour
2. Attempt 11th generation request
3. Verify 429 Rate Limit error
4. Wait for rate limit window to expire
5. Attempt generation request again
6. Verify request succeeds

**Expected Results**: 10 requests allowed per hour, 11th request blocked with 429 status, requests allowed after window reset

### 4.3 Flashcard Management

#### Test Scenario: View Flashcards

**Preconditions**: User has created flashcards

**Steps**:

1. Navigate to /flashcards
2. Verify flashcards displayed in list
3. Verify pagination controls (if >50 flashcards)
4. Click "Next page"
5. Verify second page of flashcards loaded

**Expected Results**: Flashcards displayed with front text visible, pagination works correctly

**Variations**:

- No flashcards → empty state displayed
- Sort by "created_at" → flashcards ordered by creation time
- Filter by source "ai-full" → only AI-generated flashcards shown
- Filter by source "manual" → only manually created flashcards shown

#### Test Scenario: Edit Flashcard

**Preconditions**: User has flashcards

**Steps**:

1. Navigate to /flashcards
2. Click "Edit" on a flashcard
3. Modify front and back text
4. Click "Save"
5. Verify flashcard updated
6. Verify source changed from "ai-full" to "ai-edited" (if applicable)
7. Verify updated_at timestamp changed

**Expected Results**: Flashcard content updated, source automatically changed to "ai-edited" for AI flashcards, timestamp updated

**Variations**:

- Front text exceeds 200 chars → validation error
- Back text exceeds 500 chars → validation error
- Edit manual flashcard → source remains "manual"

#### Test Scenario: Delete Flashcard

**Preconditions**: User has flashcards

**Steps**:

1. Navigate to /flashcards
2. Click "Delete" on a flashcard
3. Confirm deletion in dialog
4. Verify flashcard removed from list
5. Refresh page
6. Verify flashcard still not present

**Expected Results**: Flashcard permanently deleted, removed from database

**Variations**:

- Cancel deletion → flashcard not deleted
- Delete last flashcard on page → redirect to previous page or empty state

### 4.4 Data Validation and Integrity

#### Test Scenario: Input Validation

**Test Cases**:

- Empty source text for generation → 400 Bad Request
- Source text with 999 characters → 400 Bad Request
- Source text with 10001 characters → 400 Bad Request
- Empty flashcard front → 400 Bad Request
- Empty flashcard back → 400 Bad Request
- Flashcard front with 201 characters → 400 Bad Request
- Flashcard back with 501 characters → 400 Bad Request
- Invalid source value ("invalid") → 400 Bad Request
- Manual flashcard with generation_id → 400 Bad Request
- AI flashcard without generation_id → 400 Bad Request

**Expected Results**: All invalid inputs rejected with appropriate error messages

#### Test Scenario: Foreign Key Constraints

**Test Cases**:

- Create flashcard with non-existent generation_id → 400 Bad Request
- Create flashcard with another user's generation_id → 400 Bad Request
- Delete generation with associated flashcards → flashcards.generation_id set to null
- Delete user → all associated flashcards, generations, error logs deleted

**Expected Results**: Database constraints enforced, cascade behaviors work correctly

### 4.5 Row Level Security (RLS)

#### Test Scenario: User Data Isolation

**Test Cases**:

- User A cannot SELECT User B's flashcards → empty result set
- User A cannot UPDATE User B's flashcard → 0 rows affected
- User A cannot DELETE User B's flashcard → 0 rows affected
- User A cannot INSERT flashcard with User B's user_id → error
- User A cannot SELECT User B's generations → empty result set
- User A cannot SELECT User B's error logs → empty result set

**Expected Results**: All RLS policies enforced at database level, cross-user access prevented

#### Test Scenario: Unauthenticated Access

**Test Cases**:

- Unauthenticated user queries flashcards table → error or empty result
- Unauthenticated user queries generations table → error or empty result
- Unauthenticated user queries generation_error_logs table → error or empty result

**Expected Results**: Unauthenticated access denied by RLS policies

### 4.6 OpenRouter Integration

#### Test Scenario: Successful AI Generation

**Preconditions**: OPENROUTER_API_KEY configured

**Steps**:

1. Call openRouterService.generateCompletion with valid inputs
2. Verify request includes required headers (Authorization, Content-Type)
3. Verify response parsed correctly
4. Verify structured JSON output matches schema

**Expected Results**: API call successful, response contains proposals array with front/back fields

#### Test Scenario: Error Handling

**Test Cases**:

- Invalid API key → OpenRouterError with code "AUTHENTICATION_ERROR"
- Rate limit exceeded (429) → OpenRouterError with code "RATE_LIMIT_ERROR"
- Timeout → OpenRouterError with code "TIMEOUT_ERROR"
- Network error → OpenRouterError with code "NETWORK_ERROR"
- Invalid response JSON → OpenRouterError with code "INVALID_RESPONSE"
- HTTP 500 from API → OpenRouterError with code "API_ERROR"

**Expected Results**: All error types handled gracefully, error logged to generation_error_logs

### 4.7 Session Management

#### Test Scenario: Session Persistence

**Steps**:

1. Login as user
2. Verify session cookie set
3. Navigate to protected page
4. Close browser
5. Reopen browser
6. Navigate to protected page
7. Verify user still authenticated (or redirected to login based on cookie expiry)

**Expected Results**: Session persists across browser restarts until expiry or logout

#### Test Scenario: Logout

**Steps**:

1. Login as user
2. Navigate to /profile
3. Click "Logout" button
4. Verify redirect to /login
5. Attempt to access /flashcards
6. Verify redirect to /login

**Expected Results**: Session terminated, cookies cleared, authentication required for protected pages

## 5. Test Environment

### 5.1 Development Environment

**Purpose**: Rapid testing during feature development

**Configuration**:

- Local development server (`astro dev`)
- Local Supabase instance or development project
- Mock OpenRouter API responses (optional for offline development)
- Browser DevTools for debugging

**Data**: Seeded test data with known user accounts and flashcards

### 5.2 Staging Environment

**Purpose**: Pre-production validation with production-like configuration

**Configuration**:

- Deployed Astro application (preview build)
- Staging Supabase project (isolated from production)
- Real OpenRouter API with test API key
- Monitoring and logging enabled

**Data**: Anonymized production data or realistic test data sets

### 5.3 Production Environment

**Purpose**: Smoke testing and monitoring after deployment

**Configuration**:

- Production Astro application
- Production Supabase project
- Production OpenRouter API key with spending limits
- Full monitoring, error tracking, and analytics

**Data**: Real user data (testing limited to smoke tests with dedicated test account)

## 6. Testing Tools

### 6.1 Unit and Integration Testing

**Primary Framework**: Vitest

- **Rationale**: Native Vite integration, fast execution, TypeScript support
- **Use Cases**: Service layer tests, utility function tests, hook tests

**Supporting Libraries**:

- `@testing-library/react`: React component testing
- `@testing-library/user-event`: User interaction simulation
- `msw` (Mock Service Worker): API mocking for integration tests
- `@supabase/supabase-js`: Supabase client mocking

**Example Test Structure**:

```typescript
// src/lib/services/__tests__/flashcard.service.test.ts
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {flashcardService} from '../flashcard.service';
```

### 6.2 End-to-End Testing

**Primary Framework**: Playwright

- **Rationale**: Cross-browser support, reliable auto-wait, parallel execution
- **Use Cases**: Full user workflow validation, visual regression testing

**Configuration**:

- Browsers: Chromium, Firefox, WebKit
- Viewport sizes: Desktop (1280x720), Tablet (768x1024), Mobile (375x667)
- Base URL: Configurable per environment

**Example Test Structure**:

```typescript
// tests/e2e/flashcard-generation.spec.ts
import {test, expect} from '@playwright/test';

test('generates flashcards from source text', async ({page}) => {
    // Test implementation
});
```

### 6.3 API Testing

**Primary Tool**: Vitest with supertest-like API testing

- **Rationale**: Integration with existing test suite, TypeScript support
- **Use Cases**: API endpoint validation, authentication testing

**Alternative**: Bruno or Postman for manual API exploration

### 6.4 Security Testing

**Tools**:

- **OWASP ZAP**: Automated security scanning
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Continuous security monitoring
- **Manual testing**: Custom scripts for authentication bypass, SQL injection attempts

### 6.5 Performance Testing

**Tools**:

- **Lighthouse**: Page performance, accessibility, SEO audits
- **Web Vitals**: Core Web Vitals monitoring (LCP, FID, CLS)
- **k6**: Load testing for API endpoints
- **PostgreSQL EXPLAIN ANALYZE**: Query performance analysis

### 6.6 Accessibility Testing

**Tools**:

- **axe DevTools**: Automated accessibility scanning
- **WAVE**: Web accessibility evaluation
- **Screen readers**: NVDA (Windows), VoiceOver (macOS)
- **Keyboard-only navigation**: Manual testing without mouse

### 6.7 Code Quality and Coverage

**Tools**:

- **ESLint**: Linting with airbnb-typescript config + accessibility plugin
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Vitest Coverage**: Code coverage reporting (using c8)

**Coverage Targets**:

- Service layer: 80%+
- API endpoints: 90%+
- Utilities: 80%+
- React components: 70%+

## 7. Test Schedule

### 7.1 Development Phase (Sprint-based)

**Week 1-2: Initial Development**

- [ ] Set up testing infrastructure (Vitest, Playwright)
- [ ] Write unit tests for service layer (ongoing)
- [ ] Manual testing of new features

**Week 3-4: Feature Completion**

- [ ] Complete unit test coverage for all services
- [ ] Write integration tests for API endpoints
- [ ] Implement E2E tests for critical workflows
- [ ] Run accessibility audits

**Week 5: Pre-Release Testing**

- [ ] Execute full test suite
- [ ] Perform security testing (OWASP ZAP, manual)
- [ ] Conduct performance testing and optimization
- [ ] Cross-browser compatibility testing

**Week 6: Hardening and Release**

- [ ] Fix all critical and high priority bugs
- [ ] Re-run full test suite
- [ ] Smoke testing in production
- [ ] Post-deployment monitoring

### 7.2 Continuous Testing (Post-Release)

**Daily**:

- Automated unit and integration tests on every commit
- Linting and type checking in pre-commit hooks

**Weekly**:

- Full E2E test suite execution
- Dependency vulnerability scanning
- Performance regression testing

**Monthly**:

- Comprehensive security audit
- Accessibility compliance review
- Load testing and capacity planning

## 8. Test Acceptance Criteria

### 8.1 Critical Acceptance Criteria

All of the following must be met before production release:

1. **Functional Completeness**
    - ✓ All critical user workflows (registration, login, generation, CRUD) pass E2E tests
    - ✓ All API endpoints return correct responses for valid and invalid inputs
    - ✓ Zero critical or high severity bugs in production

2. **Security**
    - ✓ No critical or high severity vulnerabilities in OWASP ZAP scan
    - ✓ All RLS policies verified and enforced
    - ✓ Authentication and authorization mechanisms validated
    - ✓ Rate limiting prevents abuse
    - ✓ No API keys or secrets exposed in client code

3. **Data Integrity**
    - ✓ All database constraints enforced
    - ✓ Data validation prevents invalid states
    - ✓ Cascade behaviors work correctly
    - ✓ No data loss during CRUD operations

4. **Performance**
    - ✓ Page load times <2 seconds (Lighthouse score >90)
    - ✓ API response times <500ms for standard operations
    - ✓ Application handles 100 concurrent users without degradation

5. **Accessibility**
    - ✓ WCAG 2.1 Level AA compliance
    - ✓ axe DevTools audit passes with zero violations
    - ✓ Keyboard navigation functional
    - ✓ Screen reader compatible

6. **Test Coverage**
    - ✓ Service layer coverage ≥80%
    - ✓ API endpoint coverage ≥90%
    - ✓ All critical E2E workflows automated

### 8.2 Nice-to-Have Acceptance Criteria

The following are desired but not blocking for release:

- Component test coverage ≥70%
- Lighthouse Performance score ≥95
- Cross-browser compatibility on 5+ browsers
- Visual regression testing coverage
- Load testing validated up to 500 concurrent users

### 8.3 Regression Testing Criteria

For each release after v1.0:

- ✓ All existing automated tests pass
- ✓ No new critical or high severity bugs introduced
- ✓ Performance metrics maintained or improved
- ✓ Code coverage maintained or improved

## 9. Roles and Responsibilities

### 9.1 Development Team

**Responsibilities**:

- Write unit tests for new service layer code (during feature development)
- Fix bugs identified during testing
- Perform code reviews with test coverage in mind
- Ensure all new API endpoints have validation and error handling
- Run local test suite before committing code

**Acceptance Criteria**: All code merged to main branch has accompanying tests

### 9.2 QA Engineer / Tester

**Responsibilities**:

- Design and execute test plans
- Write and maintain E2E test suite
- Perform manual exploratory testing
- Conduct security and accessibility testing
- Report and track bugs in issue tracker
- Validate bug fixes before release
- Maintain test documentation

**Acceptance Criteria**: Test plan executed, results documented, release sign-off provided

### 9.3 DevOps / Infrastructure

**Responsibilities**:

- Set up CI/CD pipelines for automated testing
- Configure test environments (staging, production)
- Integrate automated tests into deployment workflow
- Monitor test execution and report failures
- Maintain test infrastructure and tools

**Acceptance Criteria**: CI/CD pipeline runs full test suite on every pull request

### 9.4 Product Owner

**Responsibilities**:

- Define acceptance criteria for user stories
- Prioritize bug fixes based on severity and impact
- Review test results and approve releases
- Validate that testing aligns with business requirements

**Acceptance Criteria**: Release approved based on test results and acceptance criteria

## 10. Bug Reporting Procedures

### 10.1 Bug Report Template

Each bug report must include:

**Title**: Concise description of the issue

- Example: "Rate limiting allows 11th request within 1 hour window"

**Environment**:

- Browser: Chrome 120.0.6099
- OS: macOS 14.1
- Environment: Staging
- User role: Authenticated user

**Severity**:

- **Critical**: Application crash, data loss, security vulnerability
- **High**: Core functionality broken, no workaround
- **Medium**: Feature partially broken, workaround available
- **Low**: Cosmetic issue, typo, minor UX issue

**Steps to Reproduce**:

1. Navigate to /generate
2. Enter 1500 characters of text
3. Click "Generate" 11 times within 1 hour
4. Observe that 11th request succeeds

**Expected Result**:
11th request should be rejected with 429 Rate Limit Exceeded

**Actual Result**:
11th request succeeds and generates flashcards

**Screenshots/Logs**:

- Attach relevant screenshots
- Include browser console errors
- Include server logs if available

**Additional Context**:

- First occurred after recent rate limiting changes
- Only reproducible when requests are rapid (<1s apart)

### 10.2 Bug Workflow

1. **Reported**: Bug entered into issue tracker (GitHub Issues)
2. **Triaged**: Team reviews, assigns severity and priority
3. **Assigned**: Developer assigned to investigate
4. **In Progress**: Developer working on fix
5. **Code Review**: Pull request submitted for review
6. **Testing**: QA validates fix in staging environment
7. **Verified**: QA confirms fix works, no regression
8. **Closed**: Bug resolved and deployed to production

### 10.3 Bug Tracking

**Tool**: GitHub Issues

**Labels**:

- `bug`: Confirmed defect
- `security`: Security vulnerability
- `critical`, `high`, `medium`, `low`: Severity levels
- `regression`: Previously working functionality now broken
- `needs-reproduction`: Cannot reproduce, needs more information
- `wontfix`: Intentional behavior, not a bug

**Milestones**: Bugs assigned to release milestones (v1.0, v1.1, etc.)

### 10.4 Critical Bug Process

For critical bugs (security vulnerabilities, data loss, application crash):

1. **Immediate notification**: Alert team via Slack/email
2. **Impact assessment**: Determine affected users and data
3. **Hotfix branch**: Create emergency fix branch from production
4. **Expedited review**: Fast-track code review and testing
5. **Emergency deployment**: Deploy to production ASAP
6. **Post-mortem**: Document root cause and prevention measures

---

## Appendix A: Risk Assessment

### High-Risk Areas

1. **OpenRouter API Integration**
    - **Risk**: API failures, timeouts, or rate limits
    - **Mitigation**: Comprehensive error handling, retry logic, error logging to database
    - **Testing**: Mock API responses, simulate timeouts and errors

2. **Row Level Security (RLS)**
    - **Risk**: Data leakage between users
    - **Mitigation**: Database-level RLS policies, no application-level authorization
    - **Testing**: Direct database queries as different users, verify isolation

3. **Rate Limiting**
    - **Risk**: Memory-based rate limiting lost on server restart, bypass via concurrent requests
    - **Mitigation**: Consider Redis for persistent rate limiting in future
    - **Testing**: Concurrent request testing, server restart scenarios

4. **Authentication**
    - **Risk**: Session hijacking, token theft, weak password storage
    - **Mitigation**: Supabase handles auth with industry best practices
    - **Testing**: Session expiry testing, logout testing, password strength validation

5. **Input Validation**
    - **Risk**: XSS, SQL injection, malformed data causing crashes
    - **Mitigation**: Zod validation schemas, React escaping, Supabase parameterized queries
    - **Testing**: Fuzzing inputs, boundary value testing, injection attempt testing

### Medium-Risk Areas

1. **AI Generation Quality**
    - **Risk**: Low-quality or irrelevant flashcards generated
    - **Mitigation**: Prompt engineering, user review workflow before saving
    - **Testing**: Manual review of generated flashcards, user acceptance testing

2. **Pagination and Filtering**
    - **Risk**: Incorrect page counts, filter logic bugs
    - **Mitigation**: Offset/limit validation, comprehensive query testing
    - **Testing**: Edge cases (empty results, single item, exact page boundary)

3. **Concurrent Operations**
    - **Risk**: Race conditions in flashcard edits, rate limiting state
    - **Mitigation**: Database ACID properties, optimistic concurrency control
    - **Testing**: Concurrent user simulation, parallel request testing

## Appendix B: Test Data Requirements

### Test Users

- **admin@test.com**: Admin user for testing (if admin features exist)
- **user1@test.com**: Standard user with extensive flashcards
- **user2@test.com**: Standard user with minimal flashcards
- **newuser@test.com**: Newly registered user with no data

### Test Flashcards

- Minimum: 0 flashcards (empty state)
- Small dataset: 10 flashcards (single page)
- Large dataset: 150 flashcards (multiple pages)
- Edge cases: Flashcards with max length front/back, special characters, unicode

### Test Generations

- Successful generation with 3 proposals
- Successful generation with 10 proposals
- Failed generation with error log
- Generation with mixed acceptance (accepted, edited, rejected)

## Appendix C: Performance Benchmarks

### Target Response Times

| Operation                   | Target | Acceptable | Unacceptable |
|-----------------------------|--------|------------|--------------|
| Page Load (Initial)         | <1.5s  | <2.5s      | >3s          |
| Page Load (Cached)          | <500ms | <1s        | >1.5s        |
| API - GET /api/flashcards   | <200ms | <500ms     | >1s          |
| API - POST /api/flashcards  | <300ms | <600ms     | >1s          |
| API - POST /api/generations | 5-15s* | <30s       | >30s         |
| Database Query (indexed)    | <50ms  | <150ms     | >300ms       |

*Depends on OpenRouter API response time, outside of application control

### Lighthouse Score Targets

- Performance: ≥90
- Accessibility: ≥95
- Best Practices: ≥95
- SEO: ≥90

## Appendix D: Browser and Device Support Matrix

### Desktop Browsers

| Browser | Versions | Priority | Notes                             |
|---------|----------|----------|-----------------------------------|
| Chrome  | Latest 2 | High     | Primary development browser       |
| Firefox | Latest 2 | High     | Full feature support              |
| Safari  | Latest 2 | High     | WebKit engine testing             |
| Edge    | Latest 2 | Medium   | Chromium-based, similar to Chrome |

### Mobile Browsers

| Browser        | Versions | Priority | Notes             |
|----------------|----------|----------|-------------------|
| Safari iOS     | iOS 15+  | High     | iPhone and iPad   |
| Chrome Android | Latest   | High     | Android devices   |
| Firefox Mobile | Latest   | Low      | Limited user base |

### Viewport Sizes

- Desktop: 1920x1080, 1366x768, 1280x720
- Tablet: 1024x768, 768x1024
- Mobile: 414x896 (iPhone), 360x640 (Android), 375x667

### Unsupported

- Internet Explorer (deprecated)
- Browsers older than 2 versions from latest
- Opera, Samsung Internet (best-effort, no dedicated testing)
