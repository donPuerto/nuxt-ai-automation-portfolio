# Supabase Chat Schema Plan

## Goal

Create the first Supabase schema for the Nuxt AI portfolio chat experience in a way that is:

- small enough to ship safely
- compatible with Supabase Auth
- secure by default with RLS
- flexible enough for future saved prompts, attachments, and chat history

This plan is intentionally focused on the first app data model, not the entire backend.

## Scope For First Migration

The first migration should only cover the core chat data model:

- `profiles`
- `chats`
- `messages`
- `saved_prompts`

Do not mix in unrelated concerns yet:

- file storage tables
- analytics tables
- billing tables
- lead forms
- project catalogs

Those can be added in later migrations once the chat flow is stable.

## Assumptions

- Supabase Auth will be used for user identity
- authenticated users should only access their own data
- chat history should be persisted per user
- saved prompts should be user-owned
- messages belong to a chat and should be ordered by creation time

## Recommended Tables

### `profiles`

Purpose:
Store app-level user profile data tied to `auth.users`.

Columns:

- `id uuid primary key`
- `email text`
- `full_name text`
- `avatar_url text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- `id` should match `auth.users.id`
- keep authorization data out of editable profile fields

### `chats`

Purpose:
Store each conversation container for a user.

Columns:

- `id uuid primary key`
- `user_id uuid not null`
- `title text`
- `model text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- `user_id` references `profiles.id`
- `title` can start nullable and be generated later
- `model` helps keep track of which assistant/model was used

### `messages`

Purpose:
Store chat messages inside a conversation.

Columns:

- `id uuid primary key`
- `chat_id uuid not null`
- `role text not null`
- `content text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Notes:

- `role` should be constrained to `user`, `assistant`, or `system`
- `metadata` can later hold tool-call, source, or UI-specific state

### `saved_prompts`

Purpose:
Store reusable prompts for each user.

Columns:

- `id uuid primary key`
- `user_id uuid not null`
- `label text not null`
- `prompt text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- useful for the sidebar “Recent Prompts” and reusable starter prompts

## Relationships

- `profiles.id` -> mapped to `auth.users.id`
- `chats.user_id` -> `profiles.id`
- `messages.chat_id` -> `chats.id`
- `saved_prompts.user_id` -> `profiles.id`

## Indexes

Add these in the first migration:

- index on `chats(user_id, created_at desc)`
- index on `messages(chat_id, created_at asc)`
- index on `saved_prompts(user_id, created_at desc)`

These support the most likely first queries:

- list user chats
- load messages for one chat in order
- list a user’s saved prompts

## RLS Plan

Enable RLS immediately on every public table.

### `profiles`

Policies should allow a user to:

- read their own profile
- insert their own profile
- update their own profile

### `chats`

Policies should allow a user to:

- read their own chats
- insert chats where `user_id = auth.uid()`
- update their own chats
- delete their own chats

### `messages`

Policies should allow a user to:

- read messages only when the parent chat belongs to them
- insert messages only into chats they own
- update messages only inside chats they own
- delete messages only inside chats they own

### `saved_prompts`

Policies should allow a user to:

- read their own prompts
- insert prompts where `user_id = auth.uid()`
- update their own prompts
- delete their own prompts

## Important Security Notes

- do not use editable user metadata for authorization
- do not leave public tables without RLS
- if updates do not work under RLS, check that the required `select` policy also exists
- keep privileged logic out of exposed schemas unless intentionally designed for it

## Migration Order

Create objects in this order:

1. `profiles`
2. `chats`
3. `messages`
4. `saved_prompts`
5. indexes
6. RLS enablement
7. policies

## Out Of Scope For This First Pass

These should wait until after the core chat flow is working:

- attachments table
- storage bucket policies
- tool-call audit tables
- usage analytics tables
- project/content syncing tables
- admin roles

## Suggested Next Step

Once this plan is approved, the next deliverable should be:

- one SQL migration creating the four tables
- foreign keys
- indexes
- RLS
- owner-based policies

After that, we can wire the Nuxt app to:

- create chats
- fetch chat history
- save messages
- save reusable prompts
