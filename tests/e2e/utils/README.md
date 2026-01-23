# Database Cleanup Utilities

Utility functions for cleaning up test data after E2E tests.

## Overview

These utilities provide safe, isolated cleanup of test data created during E2E test execution.

## Files

- **`database-cleanup.ts`** - Core cleanup functions and Supabase client

## Functions

### `cleanupTestData()`

Deletes all test data (flashcards and generations) for the test user.

```typescript
import { cleanupTestData } from './database-cleanup';

await cleanupTestData();
```

**Safety:** Only deletes data for the user specified in `E2E_TEST_EMAIL`.

### `deleteTestFlashcards(userId?)`

Deletes flashcards for a specific user.

```typescript
import { deleteTestFlashcards } from './database-cleanup';

// Auto-detect test user
await deleteTestFlashcards();

// Or specify user ID
await deleteTestFlashcards('user-id-123');
```

### `deleteTestGenerations(userId?)`

Deletes generations for a specific user.

```typescript
import { deleteTestGenerations } from './database-cleanup';

await deleteTestGenerations();
```

### `getTestDataCounts()`

Returns count of flashcards and generations for test user.

```typescript
import { getTestDataCounts } from './database-cleanup';

const counts = await getTestDataCounts();
console.log(counts);
// { flashcards: 5, generations: 2 }
```

### `verifyTestUser()`

Checks if test user exists in the database.

```typescript
import { verifyTestUser } from './database-cleanup';

const exists = await verifyTestUser();
if (!exists) {
  console.error('Test user not found!');
}
```

## Environment Variables

Required in `.env.test`:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `E2E_TEST_EMAIL` - Test user email

## Usage in Tests

### Global Setup/Teardown

```typescript
// global-setup.ts
import { cleanupTestData, verifyTestUser } from './utils/database-cleanup';

async function globalSetup() {
  await verifyTestUser(); // Ensure user exists
  await cleanupTestData(); // Clean before tests
}
```

### Per-Test Cleanup

```typescript
// cleanup-fixture.ts
import { test as base } from '@playwright/test';
import { cleanupTestData } from './utils/database-cleanup';

export const test = base.extend({
  cleanup: [async ({}, use) => {
    await use();
    await cleanupTestData(); // Clean after each test
  }, { auto: true }]
});
```

### Manual Scripts

```typescript
// scripts/cleanup.ts
import { cleanupTestData, getTestDataCounts } from '../utils/database-cleanup';

const before = await getTestDataCounts();
console.log('Before:', before);

await cleanupTestData();

const after = await getTestDataCounts();
console.log('After:', after);
```

## Implementation Details

### Supabase Client

Uses service role key for admin operations:

```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

This bypasses Row Level Security (RLS) policies to ensure complete cleanup.

### Cleanup Order

1. **Flashcards first** - May have foreign key references to generations
2. **Generations second** - No dependencies

### Error Handling

All functions handle errors gracefully:
- Log errors to console
- Throw errors for critical failures
- Return null/empty for non-critical failures

## Safety Considerations

### User Isolation

All operations filter by `user_id`:

```typescript
await supabase
  .from('flashcards')
  .delete()
  .eq('user_id', testUserId);
```

Only test user data is affected.

### Database Separation

**Critical:** Always use a separate test database!

```env
# .env.test
SUPABASE_URL=https://test-project.supabase.co  # NOT production!
```

### Service Role Protection

Service role key should:
- Only be used in test environment
- Never be committed to git
- Be stored in environment variables
- Have separate key for test database

## Testing the Utilities

You can test the utilities directly:

```bash
# Check status
npm run test:e2e:status

# Run cleanup
npm run test:e2e:cleanup
```

## Troubleshooting

### "Missing required environment variables"

Ensure `.env.test` has all required variables:
```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
E2E_TEST_EMAIL=...
```

### "Test user not found"

Create the test user in Supabase:
- Dashboard → Authentication → Users → Invite User
- Or use SQL to create user manually

### "Error deleting flashcards"

Check:
1. Service role key has correct permissions
2. Table names are correct (`flashcards`, `generations`)
3. Foreign key constraints are handled (delete flashcards before generations)

### "Permission denied"

Service role key should bypass RLS. If you see permission errors:
1. Verify you're using `SUPABASE_SERVICE_ROLE_KEY` not `SUPABASE_ANON_KEY`
2. Check key is valid and hasn't been rotated
3. Ensure tables exist and service role has access

## Best Practices

1. **Always verify user first** - Check user exists before cleanup
2. **Log operations** - Include console.log for visibility
3. **Verify cleanup** - Count data before and after
4. **Handle errors** - Don't fail silently
5. **Isolate by user** - Never clean all data, only test user

## Example: Custom Cleanup

If you need to clean up additional tables:

```typescript
import { createClient } from '@supabase/supabase-js';

async function deleteCustomTestData(userId: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete from custom table
  const { error } = await supabase
    .from('my_custom_table')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

// Use in cleanup
import { cleanupTestData } from './database-cleanup';

await cleanupTestData(); // Standard cleanup
await deleteCustomTestData(testUserId); // Custom cleanup
```

## Contributing

When adding new tables that need cleanup:

1. Add delete function to `database-cleanup.ts`
2. Add to `cleanupTestData()` function
3. Update `getTestDataCounts()` if needed
4. Test with `npm run test:e2e:cleanup`
5. Update this README

## Resources

- [Supabase Admin API](https://supabase.com/docs/reference/javascript/admin-api)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Service Role Key](https://supabase.com/docs/guides/api/api-keys)
