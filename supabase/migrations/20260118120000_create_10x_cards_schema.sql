-- migration: create 10x-cards schema
-- description: creates the core tables for flashcards application including flashcards, generations, and generation_error_logs
-- affected tables: flashcards, generations, generation_error_logs
-- dependencies: supabase auth users table (auth.users)
-- notes:
--   - users table is managed by supabase auth and already exists
--   - all tables have rls enabled with user-specific access policies
--   - flashcards table has an auto-update trigger for updated_at column
--   - foreign keys to auth.users cascade on delete for automatic cleanup

-- =============================================================================
-- table: generations
-- description: tracks ai generation sessions for flashcards
-- purpose: stores metadata about each flashcard generation attempt including
--          model used, counts of generated/accepted cards, and performance metrics
-- =============================================================================

create table if not exists public.generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security
-- rationale: prevent unauthorized access to generation metadata
alter table public.generations enable row level security;

-- =============================================================================
-- table: flashcards
-- description: stores user flashcards with front/back content and metadata
-- purpose: main table for flashcard content, tracking source (ai/manual) and
--          optionally linking to the generation session that created it
-- =============================================================================

create table if not exists public.flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  generation_id bigint references public.generations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade
);

-- enable row level security
-- rationale: ensure users can only access their own flashcards
alter table public.flashcards enable row level security;

-- =============================================================================
-- table: generation_error_logs
-- description: logs errors that occur during flashcard generation attempts
-- purpose: track failed generation attempts for debugging and analytics,
--          storing error details and source text metadata
-- =============================================================================

create table if not exists public.generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- enable row level security
-- rationale: prevent users from viewing other users' error logs
alter table public.generation_error_logs enable row level security;

-- =============================================================================
-- indices
-- description: performance optimization indices for common query patterns
-- rationale: these indices support the most frequent query patterns:
--            - filtering records by user_id (user-specific data access)
--            - joining flashcards with their generation metadata
-- =============================================================================

-- index for filtering flashcards by user
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);

-- index for joining flashcards with their generation
create index if not exists idx_flashcards_generation_id on public.flashcards(generation_id);

-- index for filtering generations by user
create index if not exists idx_generations_user_id on public.generations(user_id);

-- index for filtering error logs by user
create index if not exists idx_generation_error_logs_user_id on public.generation_error_logs(user_id);

-- =============================================================================
-- rls policies: flashcards
-- description: users can only access their own flashcards
-- rationale: each policy is granular (one per operation) to allow fine-grained
--            control and easier auditing of access patterns
-- =============================================================================

-- policy: authenticated users can select their own flashcards
-- rationale: allows users to view all their flashcards for study sessions
create policy "authenticated_users_select_own_flashcards"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can insert their own flashcards
-- rationale: allows users to create new flashcards (manual or ai-generated)
-- security: with check ensures user_id matches authenticated user
create policy "authenticated_users_insert_own_flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: authenticated users can update their own flashcards
-- rationale: allows users to edit flashcard content or metadata
-- security: using + with check ensures both read and write access restricted to owner
create policy "authenticated_users_update_own_flashcards"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own flashcards
-- rationale: allows users to remove unwanted flashcards
create policy "authenticated_users_delete_own_flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- rls policies: generations
-- description: users can only access their own generation records
-- rationale: generation metadata is user-specific and should not be shared
-- =============================================================================

-- policy: authenticated users can select their own generations
-- rationale: allows users to view history and analytics of their generations
create policy "authenticated_users_select_own_generations"
  on public.generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can insert their own generations
-- rationale: allows system to record new generation sessions for the user
-- security: with check ensures user_id matches authenticated user
create policy "authenticated_users_insert_own_generations"
  on public.generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: authenticated users can update their own generations
-- rationale: allows updating acceptance counts after user reviews generated cards
-- security: using + with check ensures both read and write access restricted to owner
create policy "authenticated_users_update_own_generations"
  on public.generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own generations
-- rationale: allows users to clean up generation history
create policy "authenticated_users_delete_own_generations"
  on public.generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- rls policies: generation_error_logs
-- description: users can only access their own error logs
-- rationale: error logs may contain sensitive information from source text
-- =============================================================================

-- policy: authenticated users can select their own error logs
-- rationale: allows users to view errors for troubleshooting
create policy "authenticated_users_select_own_error_logs"
  on public.generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can insert their own error logs
-- rationale: allows system to record errors during generation attempts
-- security: with check ensures user_id matches authenticated user
create policy "authenticated_users_insert_own_error_logs"
  on public.generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: authenticated users can update their own error logs
-- rationale: allows updating error logs if additional context is discovered
-- security: using + with check ensures both read and write access restricted to owner
create policy "authenticated_users_update_own_error_logs"
  on public.generation_error_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own error logs
-- rationale: allows users to clean up old error logs
create policy "authenticated_users_delete_own_error_logs"
  on public.generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- trigger: auto-update updated_at on flashcards
-- description: automatically sets updated_at to current timestamp on row updates
-- rationale: ensures updated_at always reflects the last modification time
--            without requiring application code to set it manually
-- =============================================================================

-- function to update the updated_at timestamp
-- rationale: reusable function that can be applied to multiple tables if needed
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger to call the function before each update
-- rationale: before update trigger ensures updated_at is set before row is written
create trigger update_flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();
