# Ask Don AI Agent Setup

This is the target architecture for the public `ask-don` workflow.

Goal:
- prompt answers come from AI, not local code-authored replies
- the native n8n AI Agent node owns the system prompt
- Supabase RAG chunks are appended as verified context
- Nuxt receives strict JSON with a stable response shape

## Recommended flow

1. `Webhook`
2. `Code` or `Set` to normalize the incoming request body
3. `Supabase` to load active model settings from `ai_settings`
4. `HTTP Request` for embeddings, or native embedding node if available
5. `HTTP Request` or `Supabase` RPC to retrieve matching `document_chunks`
6. `Code` or `Set` to build compact retrieval context text
7. `AI Agent` node
8. `Structured Output Parser` or final formatter node
9. `Respond to Webhook`

## Incoming request contract

The Nuxt app already sends these fields to `/webhook/ask-don`:

```json
{
  "source": "ai-portfolio-prompt",
  "prompt": "Tell me about Don Puerto's automation background.",
  "intent": "prompt",
  "categoryId": null,
  "agentId": "openrouter:nvidia/nemotron-3-super-120b-a12b:free",
  "attachments": [],
  "portfolioContext": {
    "role": "string",
    "shortBio": "string",
    "intro": "string",
    "background": ["..."],
    "whatIDo": ["..."],
    "education": ["..."],
    "workExperience": ["..."],
    "trainings": ["..."],
    "techStack": ["..."],
    "differentiators": ["..."],
    "availability": ["..."],
    "contact": ["..."],
    "responseRules": ["..."]
  },
  "knowledgeContext": {
    "available": true,
    "indexedDocumentCount": 1,
    "chunkCount": 8,
    "indexedDocuments": [
      {
        "id": "uuid",
        "name": "Resume.pdf",
        "sourceType": "file",
        "updatedAt": "2026-04-17T00:00:00.000Z"
      }
    ]
  },
  "systemPrompt": "string",
  "path": "/",
  "triggeredAt": "2026-04-17T00:00:00.000Z",
  "userAgent": "string"
}
```

## AI Agent system prompt

Use this as the native AI Agent system instruction. Keep it in the workflow setting row if you want model-specific overrides, but this is the baseline:

```text
You are Don Puerto AI Assistant.

You represent Don Puerto inside a public portfolio chat experience.
Answer naturally, warmly, clearly, and concisely.

Source-of-truth rules:
- Use only these inputs as your source of truth:
  1. systemPrompt
  2. portfolioContext
  3. knowledgeContext
  4. retrieved RAG context
- Do not use outside facts, assumptions, hidden model knowledge, or inferred personal details.
- If a fact is not explicitly present in the provided context, say that it is not recorded in the knowledge base.

Grounding rules:
- Prefer retrieved RAG context for specific factual answers.
- Use portfolioContext for Don Puerto's identity, background, education, work experience, stack, services, and positioning.
- Use knowledgeContext as live proof of whether indexed knowledge exists.
- If knowledgeContext.available is true, never say there is no indexed knowledge available.
- If the retrieved context is weak, answer honestly and stay within the verified context you do have.
- Do not estimate age, birthday, or birth year from graduation years, work duration, or other indirect hints.

Behavior rules:
- For greetings like hi, hello, or hey, answer briefly and warmly without oversharing.
- Do not mention uploads, indexing, or the knowledge base unless the user is asking about documents, sources, or missing information.
- Do not output markdown tables.
- Do not wrap your answer in code fences.

Output rules:
- Return valid JSON only.
- Use this exact shape:
  {"answer":"string","sections":[]}
- Keep sections as an empty array unless there is a strong reason to include compact structured sections.
```

## AI Agent user input

Pass one composed user message into the AI Agent node:

```text
User question:
{{ $json.prompt }}

Resolved intent:
{{ $json.intent }}

Portfolio context:
{{ JSON.stringify($json.portfolioContext, null, 2) }}

Knowledge context:
{{ JSON.stringify($json.knowledgeContext, null, 2) }}

Retrieved RAG context:
{{ $json.contextText || 'No retrieved context.' }}
```

## Retrieval guidance

The retrieval stage should produce:
- `hasContext`
- `retrievedChunkCount`
- `sourceCount`
- `sources`
- `contextText`

Keep `contextText` compact and readable, for example:

```text
[Source 1]
Title: Resume
Summary: Career overview and background
Excerpt: ...

---

[Source 2]
Title: Portfolio note
Summary: Services and stack
Excerpt: ...
```

Do not dump raw chunk arrays directly into the AI Agent node.

## Output contract back to Nuxt

Return this shape from the workflow:

```json
{
  "ok": true,
  "message": "Portfolio assistant response ready.",
  "response": {
    "answer": "string",
    "sections": [],
    "displayBlocksText": "",
    "sources": []
  },
  "meta": {
    "source": "ai-portfolio-prompt",
    "path": "/",
    "intent": "prompt",
    "provider": "openrouter",
    "transport": "agent",
    "model": "string",
    "agentId": "string",
    "attachmentCount": 0,
    "promptPreview": "string",
    "retrievedChunkCount": 0,
    "sourceCount": 0,
    "usage": {}
  }
}
```

## Important cleanup from the old workflow

Replace these old patterns:
- provider-specific `Build OpenRouter Request (...)` Code nodes
- raw chat completion HTTP request branching
- no-context instruction that tells users to upload files even when `portfolioContext` already contains valid profile knowledge

With these new patterns:
- one AI Agent node
- one structured output path
- one formatter path back to Nuxt

## General instruction for future workflow work

For `ask-don` and similar portfolio assistant flows:
- prefer native n8n AI Agent nodes over manual prompt assembly in Code nodes
- keep retrieval and formatting outside the agent, but keep reasoning inside the agent
- let the app provide context, and let the workflow ground and answer
- never let local app code produce the semantic answer when the request is meant for the assistant
