# Video To Text Workflow

This document describes the live n8n workflow behind the portfolio's `Video to Text Transcriber` tool.

For app-to-webhook credential wiring, see [video-to-text-app-credentials.md](./video-to-text-app-credentials.md).

## Workflow

- Workflow name: `[Video to Text] - Multi-Source Transcription - v1`
- Workflow id: `51GKzBSTM3iGhJH1`
- Trigger: webhook `POST /webhook/video-to-text`
- Pattern: asynchronous callback workflow

The webhook responds immediately with a start acknowledgement. The finished result is sent back to the app through `callback_url`.

## Supported Sources

- `youtube`
  - Primary downloader: `youtube-mp36` via RapidAPI
  - Fallback downloader: `FastSaverAPI`
- `social`
  - Downloader: `FastSaverAPI`
- `upload`
  - Source: Supabase signed file URL or relay URL
  - No Google Drive branch remains in the workflow

## Supported Transcribers

- `whisper`
  - Uses the native OpenAI node: `@n8n/n8n-nodes-langchain.openAi`
  - Operation: `audio -> transcribe`
  - Important: upload sources must be downloaded to binary first so the node receives `data`
- `assemblyai`
  - Uploads binary to AssemblyAI
  - Creates transcript
  - Polls until `completed`
- `deepgram`
  - Current model path uses Deepgram with `whisper-large`

## Current Routing

### YouTube

1. Detect `source=youtube`
2. Route to the selected transcriber branch
3. Try RapidAPI MP3 extraction
4. If RapidAPI has no `link`, try FastSaver fallback
5. Continue into the selected transcription branch

### Social URLs

1. Detect `source=social`
2. Use FastSaver to extract a downloadable media URL
3. Continue into the selected transcription branch

### Uploads

1. Detect `source=upload`
2. Whisper uploads:
   - download file first
   - send binary `data` into the native OpenAI node
3. AssemblyAI and Deepgram uploads:
   - continue through the non-YouTube transcriber switch

## Whisper Notes

Whisper was previously stuck on uploaded files because the native OpenAI transcription node expects binary input. The upload branch now inserts a dedicated download step before `Whisper: Transcribe Audio`.

Working upload path:

```text
Set: Extract & Detect Source
-> IF: Upload Uses Whisper?
-> Download: Upload Source File
-> Whisper: Transcribe Audio
-> Set: Format Response
-> POST: Send Callback
```

## Callback Payload

Successful callbacks use this shape:

```json
{
  "success": true,
  "transcription": "Full text...",
  "source_url": "https://...",
  "source": "upload",
  "transcriber": "whisper",
  "word_count": 123,
  "error": "",
  "timestamp": "2026-04-28T00:00:00.000Z"
}
```

Failure callbacks use the same envelope with `success: false` and an `error` message.

## Known Limits

- Some YouTube URLs fail before transcription because downloader providers cannot extract media for that specific video.
- RapidAPI and FastSaver availability can vary by video, quota, or provider-side restriction.
- AssemblyAI is the only branch that uses polling.
