# Supabase Profile And Settings Schema Plan

## Goal

Create the first user-owned tables for account profile data and app settings in Supabase.

This phase is focused on:

- profile identity and contact fields
- general settings data
- notification preferences
- appearance preferences

This phase does not yet include chat history tables.

## Tables

### `profiles`

Purpose:
Store the editable profile information for the signed-in user.

Columns:

- `id uuid primary key` mapped to `auth.users.id`
- `first_name text`
- `last_name text`
- `nickname text`
- `email text`
- `mobile_number text`
- `phone_number text`
- `work_description text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

App mapping:

- Full Name = `first_name + last_name`
- What should I call you? = `nickname`
- What best describes your work? = `work_description`

### `user_settings`

Purpose:
Store one-to-one user preferences that are not part of the identity profile itself.

Columns:

- `user_id uuid primary key`
- `notify_response_completions boolean`
- `notify_web_app_emails boolean`
- `notify_dispatch_messages boolean`
- `color_mode text`
- `font_family text`
- `created_at timestamptz`
- `updated_at timestamptz`

App mapping:

- Notifications
  - Response completions
  - Emails from Claude Code on the web
  - Dispatch messages
- Appearance
  - Color Mode
  - Font

## Why Split Into Two Tables

`profiles` and `user_settings` change for different reasons:

- profile fields represent user identity and contact information
- settings fields represent UI and notification preferences

Keeping them separate makes it easier to:

- query only the settings needed by the app shell
- keep profile editing independent from appearance changes
- evolve notifications later without bloating the profile row

## Security Model

Both tables are user-owned and protected by RLS.

Policies allow authenticated users to:

- select their own row
- insert their own row
- update their own row

No cross-user access is allowed.

## Defaults

Recommended defaults:

- `notify_response_completions = true`
- `notify_claude_code_emails = false`
- `notify_dispatch_messages = false`
- `color_mode = 'system'`
- `font_family = 'sans'`

## Notes

- `full_name` is not stored separately because the app can derive it from first and last name
- `email` is stored in the profile for easy app reads, even though Auth also stores email
- `mobile_number` and `phone_number` are separate because you explicitly asked for both
- `updated_at` is maintained with a shared trigger function

## Deliverables In This Step

- SQL migration file in the repo
- live tables created in Supabase
- RLS enabled
- owner-based policies created
