# Video To Text App Credentials

This note explains the credentials and env values the Nuxt app uses to call the live n8n `Video to Text` workflow.

## Purpose

The app does not call Deepgram, AssemblyAI, or Whisper directly for this tool. It calls the n8n webhook first, and n8n handles the provider routing.

Flow:

```text
Nuxt app -> n8n webhook -> downloader / transcriber nodes -> callback -> Nuxt app
```

## Required App Env

The app server expects these values:

```env
NUXT_VIDEO_TO_TEXT_WEBHOOK_URL=https://your-n8n-instance/webhook/video-to-text
NUXT_VIDEO_TO_TEXT_API_KEY=replace_me
NUXT_VIDEO_TO_TEXT_CALLBACK_URL=https://your-public-app-domain/api/transcription-done
```

Runtime mapping:

- `NUXT_VIDEO_TO_TEXT_WEBHOOK_URL`
  - Used as the target webhook URL for starting URL and upload transcription jobs
- `NUXT_VIDEO_TO_TEXT_API_KEY`
  - Sent as the `X-API-Key` header from the Nuxt server to n8n
- `NUXT_VIDEO_TO_TEXT_CALLBACK_URL`
  - Optional callback override when the public app origin should be explicit

## n8n Side

Workflow:

- Name: `[Video to Text] - Multi-Source Transcription - v1`
- Workflow id: `51GKzBSTM3iGhJH1`
- Entry node: `Webhook: Video to Text API`

The app secret is owned by the webhook auth on that node.

Expected webhook auth setup:

- Authentication: `Header Auth`
- Header name: `X-API-Key`
- Header value: same value as `NUXT_VIDEO_TO_TEXT_API_KEY`

Important:

- The workflow JSON shows the webhook node, but not the raw credential secret
- The secret usually lives inside the attached n8n credential, not in the workflow export
- If the app returns `403`, the n8n credential value and `NUXT_VIDEO_TO_TEXT_API_KEY` do not match

## Where To Find The Secret

In n8n:

1. Open workflow `51GKzBSTM3iGhJH1`
2. Click `Webhook: Video to Text API`
3. Open `Authentication`
4. Open the attached `Header Auth` credential
5. Read or replace the `X-API-Key` value
6. Put that same value into the app env as `NUXT_VIDEO_TO_TEXT_API_KEY`

## Common Errors

### `Video to text webhook configuration is missing.`

The Nuxt app is missing one or both of:

- `NUXT_VIDEO_TO_TEXT_WEBHOOK_URL`
- `NUXT_VIDEO_TO_TEXT_API_KEY`

### `Video to text webhook returned 403.`

The app is reaching n8n, but the webhook is rejecting the secret.

Check:

- webhook auth is `Header Auth`
- header name is `X-API-Key`
- credential value exactly matches `NUXT_VIDEO_TO_TEXT_API_KEY`

### Upload saved but transcription did not start

This can happen when:

- the upload reaches Supabase
- the app creates the `transcription_files` record
- but the webhook auth/config is missing or rejected

In that case, the file can remain in `uploaded` status with an error message instead of entering `processing`.
