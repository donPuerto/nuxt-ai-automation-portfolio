# Ask Don AI Agent Workflow Spec

This document maps the current `Ask Don Chat` workflow to a replacement design that uses the native n8n `AI Agent` node.

Use this as the build target for the external workflow at:

- `D:\Code\Codex\n8n-codex-project-generator\projects\don-puerto-ai-portfolio-rag\workflows\ask-don-chat\workflow.json`

## Goal

Replace the current manual prompt-building flow with a native AI Agent architecture where:

- Nuxt sends `prompt`, `systemPrompt`, `portfolioContext`, and `knowledgeContext`
- Supabase RAG still retrieves relevant knowledge chunks
- the AI Agent node owns the system instruction and final reasoning
- the workflow returns strict JSON back to Nuxt
- no local app code authors the semantic answer

## Current workflow summary

The live workflow is currently:

1. `Receive Public Chat Request`
2. `Normalize Public Chat Payload`
3. `Load Requested Chat Setting`
4. `Load Default Chat Setting`
5. `Wait For Settings Queries`
6. `Resolve Active Chat Setting`
7. `Request OpenRouter Query Embedding`
8. `Request Supabase Chunk Matches`
9. `Prepare Grounded Chat Context`
10. `Route OpenRouter Provider`
11. `Build OpenRouter Request (OpenRouter|Claude|OpenAI)`
12. `Request OpenRouter Chat Completion`
13. `Parse Chat Model Response`
14. `Build Display Blocks And Sections`
15. `Format Portfolio Chat Response`

Main problem:
- the workflow is still building prompts in Code nodes and calling chat completions manually
- `systemPrompt` from Nuxt is not owned by a native AI Agent node
- the no-context fallback is too rigid and can fight valid `portfolioContext`

## Target workflow

Recommended replacement flow:

1. `Receive Public Chat Request`
2. `Normalize Public Chat Payload`
3. `Load Requested Chat Setting`
4. `Load Default Chat Setting`
5. `Wait For Settings Queries`
6. `Resolve Active Chat Setting`
7. `Request Query Embedding`
8. `Request Supabase Chunk Matches`
9. `Prepare Grounded Chat Context`
10. `Build Agent Input`
11. `Ask Don AI Agent`
12. `Parse Agent JSON Output`
13. `Build Display Blocks And Sections`
14. `Format Portfolio Chat Response`

## Node-by-node migration map

### Keep with minor changes

`Receive Public Chat Request`
- Keep as webhook trigger.
- Path remains `/webhook/ask-don`.

`Normalize Public Chat Payload`
- Keep.
- Expand it to preserve:
  - `prompt`
  - `intent`
  - `agentId`
  - `attachments`
  - `portfolioContext`
  - `knowledgeContext`
  - `systemPrompt`
  - `path`
  - `source`
  - `triggeredAt`
  - `userAgent`

`Load Requested Chat Setting`
- Keep.
- Continue reading from `ai_settings`.

`Load Default Chat Setting`
- Keep.
- Continue reading from `ai_settings`.

`Wait For Settings Queries`
- Keep.
- Same merge behavior.

`Resolve Active Chat Setting`
- Keep, but simplify output for the agent.
- It should resolve:
  - `resolvedAgentId`
  - `provider`
  - `model`
  - `temperature`
  - `maxTokens`
  - `retrievalTopK`
  - `similarityThreshold`
  - `systemPrompt`

`Request Query Embedding`
- Keep current embeddings step.
- Rename from `Request OpenRouter Query Embedding` to provider-neutral naming.

`Request Supabase Chunk Matches`
- Keep.
- Same `match_documents` RPC.

`Prepare Grounded Chat Context`
- Keep.
- This remains the right place to create:
  - `hasContext`
  - `retrievedChunkCount`
  - `sourceCount`
  - `sources`
  - `contextText`

`Build Display Blocks And Sections`
- Keep.
- This is presentational formatting, not reasoning.

`Format Portfolio Chat Response`
- Keep.
- Continue returning the Nuxt response shape.

### Remove completely

Remove these nodes:

- `Route OpenRouter Provider`
- `Route Claude Provider`
- `Route OpenAI Provider`
- `Build OpenRouter Request (OpenRouter)`
- `Build OpenRouter Request (Claude)`
- `Build OpenRouter Request (OpenAI)`
- `Request OpenRouter Chat Completion`
- `Parse Chat Model Response`

Why:
- these are all part of the manual prompt assembly and direct HTTP completion pattern
- the AI Agent node should replace this whole branch

### Add new nodes

Add these nodes:

`Build Agent Input`
- Type: `Set` or `Code`
- Responsibility:
  - compose one compact user message for the AI Agent
  - pass forward metadata for formatting and response

Suggested output fields:

```json
{
  "agentSystemPrompt": "string",
  "agentUserMessage": "string",
  "prompt": "string",
  "intent": "prompt",
  "provider": "openrouter",
  "model": "string",
  "resolvedAgentId": "string",
  "temperature": 0.3,
  "maxTokens": 900,
  "sources": [],
  "sourceCount": 0,
  "retrievedChunkCount": 0,
  "contextText": "string"
}
```

`Ask Don AI Agent`
- Type: native n8n `AI Agent`
- Responsibility:
  - use the system prompt directly
  - reason over the retrieval context
  - produce strict JSON only

`Parse Agent JSON Output`
- Type: `Code` or structured parser follow-up
- Responsibility:
  - safely read the agent output
  - normalize into:
    - `answer`
    - `sections`

## AI Agent configuration

### System prompt source

The AI Agent system instruction should come from a merged prompt:

1. `systemPrompt` sent by Nuxt
2. appended global behavior rules

Use the version defined in:

- [ask-don-ai-agent-node-setup.md](/D:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/docs/n8n/ask-don-ai-agent-node-setup.md)

### User input to the agent

Use one composed message:

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

### Expected output from the AI Agent

The agent must return valid JSON only:

```json
{
  "answer": "string",
  "sections": []
}
```

No code fences.
No markdown tables.
No explanatory wrapper text.

## Transport recommendation

For the agent’s underlying chat model:

- use the model resolved from `ai_settings`
- keep model switching dynamic via the existing `provider` and `model` fields
- if the n8n AI Agent node cannot dynamically swap providers cleanly in one node, create one AI Agent node per provider and route into:
  - `Ask Don Agent (OpenRouter)`
  - `Ask Don Agent (Claude)`
  - `Ask Don Agent (OpenAI)`

This is still better than manual HTTP prompt builders because:
- each branch uses a native agent runtime
- the system prompt stays first-class
- reasoning remains inside the agent node

## Retrieval behavior rules

The new workflow should keep these rules:

- retrieved context is preferred for specific factual answers
- `portfolioContext` is still valid grounding for Don Puerto identity, background, services, and positioning
- `knowledgeContext.available = true` must prevent “no indexed knowledge” claims
- if no retrieved chunk is relevant, the agent should answer from verified `portfolioContext` when possible
- if the answer is absent from both `portfolioContext` and RAG context, the agent should say it is not recorded in the knowledge base

## Response contract back to Nuxt

The final response shape should remain:

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

Change from old workflow:
- `transport` should become `agent` instead of the old manual-completion label

## Recommended implementation order

1. Duplicate the current workflow and rename it to a draft version.
2. Remove the provider-routing and manual completion nodes.
3. Keep webhook, settings lookup, embeddings, retrieval, and formatter.
4. Add `Build Agent Input`.
5. Add the native `AI Agent` node.
6. Add `Parse Agent JSON Output`.
7. Reconnect formatter nodes.
8. Test greetings, background questions, education questions, and knowledge-base questions.
9. Validate that age questions do not trigger guessing.

## Smoke test checklist

Use these test prompts after rebuilding:

- `hello`
- `tell me about Don Puerto`
- `what is Don Puerto's background`
- `where did Don Puerto study`
- `how old is Don Puerto now`
- `what stack does Don Puerto use`
- `what services does Don Puerto offer`

Expected behavior:

- greetings are short and warm
- profile questions use verified context only
- age is not guessed
- no “upload a file first” message when valid `portfolioContext` already answers the question
- response JSON stays stable for Nuxt

## Final instruction

For this workflow and future assistant workflows:

- prefer native `AI Agent` nodes over manual prompt construction in Code nodes
- keep retrieval and formatting outside the agent
- keep reasoning and answer generation inside the agent
- do not let app-side code author the semantic reply when the user is talking to the assistant
