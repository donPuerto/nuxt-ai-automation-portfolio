# Don Puerto AI Portfolio Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the catalog-style homepage with an AI-first Don Puerto landing experience that keeps the discovery call modal, renders Claude-style answers in a single canvas, and expands workflow product cards in place.

**Architecture:** Keep content and persona data centralized in `shared/`, build the homepage from focused global UI components, and put an AI adapter behind a small server boundary so the UI can start with local intent responses and later switch to Anthropic without rewriting the page. The homepage remains a single surface: prompt always visible, answer canvas updates in place, project/product actions stay inside the canvas except checkout which opens a new tab.

**Tech Stack:** Nuxt 4, Vue 3, Tailwind CSS v4, local shadcn-nuxt/Reka UI wrappers, motion-v for animation, existing Retell discovery modal, future Anthropic API integration.

---

## File map

### Shared content and knowledge
- Modify: `shared/pages/index.ts`
  - Replace catalog homepage meta/copy with AI-home meta and prompt suggestions.
- Create: `shared/pages/ai-portfolio.ts`
  - Source of truth for homepage identity, marquee items, navigator intents, prompt suggestions, and response-section labels.
- Modify: `shared/personal-info.ts`
  - Ensure Don Puerto identity data needed by the homepage is centralized.
- Create: `shared/knowledge/index.ts`
  - Barrel for Don Puerto knowledge exports.
- Create: `shared/knowledge/about.ts`
  - First-person resume/about facts and guardrail-safe identity content.
- Create: `shared/knowledge/services.ts`
  - Services, custom-build offers, and discovery-call prompts.
- Create: `shared/knowledge/skills.ts`
  - Skills snapshot and “Fun” answers.
- Create: `shared/knowledge/projects.ts`
  - Normalized AI-facing project summaries built from existing catalog/project data.
- Modify: `shared/index.ts`
  - Export new AI homepage and knowledge modules.

### Homepage UI shell
- Modify: `app/pages/index.vue`
  - Replace catalog sections with the new AI-first homepage composition.
- Create: `app/components/global/ai-portfolio/AiPortfolioShell.vue`
  - Main layout wrapper for initial state + answer canvas state.
- Create: `app/components/global/ai-portfolio/AiPortfolioAvatar.vue`
  - Stylized portrait shell, hover motion hooks, idle animation container.
- Create: `app/components/global/ai-portfolio/AiPortfolioMarquee.vue`
  - Running left-to-right category strip with click-to-intent behavior.
- Create: `app/components/global/ai-portfolio/AiPortfolioNavigator.vue`
  - Me / Projects / Skills / Fun / Discovery Call row.
- Create: `app/components/global/ai-portfolio/AiPortfolioPrompt.vue`
  - Prompt input with rotating suggestions and submit handling.
- Create: `app/components/global/ai-portfolio/AiPortfolioCanvas.vue`
  - Large answer surface for text + structured cards.
- Create: `app/components/global/ai-portfolio/index.ts`
  - Barrel for the new homepage components.

### Result rendering inside the canvas
- Create: `app/components/global/ai-portfolio/AiPortfolioResponseSection.vue`
  - Shared section shell inside the canvas.
- Create: `app/components/global/ai-portfolio/AiPortfolioProjectGrid.vue`
  - Visual project card list rendered below Claude’s answer.
- Create: `app/components/global/ai-portfolio/AiPortfolioProjectCard.vue`
  - Compact project result card.
- Create: `app/components/global/ai-portfolio/AiPortfolioExpandedProject.vue`
  - Product-style expanded block with YouTube link and CTAs.
- Reuse/modify if helpful: `app/components/global/catalog/CatalogVideoEmbed.vue`
  - Only if it fits the inline YouTube preview cleanly.

### State and AI adapter
- Create: `app/composables/useAiPortfolio.ts`
  - Homepage state machine: prompt, active intent, loading, answer payload, expanded project, prompt suggestion rotation.
- Create: `server/api/portfolio-assistant/respond.post.ts`
  - Claude-ready response endpoint. Starts with local knowledge/intents; keeps response schema stable for later Anthropic calls.
- Create: `server/utils/portfolio-assistant/build-response.ts`
  - Map user prompt or navigator intent to structured payload from knowledge files.
- Create: `server/utils/portfolio-assistant/types.ts`
  - Shared response schema used by server + client.

### Existing discovery call integration
- Modify: `app/components/global/call/DiscoveryCallButton.vue`
  - Support the new nav-triggered entrypoint if a prop or slimmer trigger layout is needed.

### Optional config for live Claude later
- Modify: `.env.example`
  - Add placeholder env vars for Anthropic API key/feature flag if the adapter is being prepared now.
- Modify: `nuxt.config.ts`
  - Add runtime config only if the implementation includes a live API toggle.

---

## Implementation notes before coding

- Keep `shared/` as the source of truth for copy, persona, and knowledge-oriented content.
- Do not hardcode Don Puerto facts in Vue components.
- Reuse existing local UI wrappers from `app/components/ui/` and patterns from `app/components/global/`.
- Keep the top-right theme switcher intact.
- Keep `DiscoveryCallButton` as the centered Retell modal. It is not part of the answer canvas.
- Treat the AI response as structured data, not raw HTML.
- The first implementation should be usable even before Anthropic credentials are available.

---

## Chunk 1: Content and response schema foundation

### Task 1: Define homepage content and intents in `shared/`

**Files:**
- Create: `shared/pages/ai-portfolio.ts`
- Modify: `shared/pages/index.ts`
- Modify: `shared/personal-info.ts`
- Modify: `shared/index.ts`

- [ ] **Step 1: Create the homepage content contract**

Add a typed export in `shared/pages/ai-portfolio.ts` for:

```ts
export type AiPortfolioNavIntent = 'me' | 'projects' | 'skills' | 'fun' | 'discovery-call'

export type AiPortfolioMarqueeItem = {
  id: string
  label: string
  description: string
  prompt: string
}
```

Also add centralized values for:
- name line: `Hey, I'm Don Puerto`
- descriptor: `Workflow Builder and Automation Specialist`
- prompt suggestions
- nav items
- marquee items

- [ ] **Step 2: Update homepage meta copy to match the redesign**

Replace the current catalog metadata in `shared/pages/index.ts` with AI-home wording so `app/pages/index.vue` does not keep stale SEO labels like “Automation Projects Catalog”.

- [ ] **Step 3: Export the new content through the shared barrel**

Update `shared/index.ts` so the new AI-home content can be imported from `@@/shared` without deep relative paths.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint shared/pages/ai-portfolio.ts shared/pages/index.ts shared/personal-info.ts shared/index.ts`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add shared/pages/ai-portfolio.ts shared/pages/index.ts shared/personal-info.ts shared/index.ts
git commit -m "feat: add ai portfolio content contract"
```

### Task 2: Create Don Puerto knowledge modules for AI answers

**Files:**
- Create: `shared/knowledge/about.ts`
- Create: `shared/knowledge/services.ts`
- Create: `shared/knowledge/skills.ts`
- Create: `shared/knowledge/projects.ts`
- Create: `shared/knowledge/index.ts`
- Modify: `shared/index.ts`

- [ ] **Step 1: Create normalized knowledge modules**

Split the knowledge by responsibility:
- `about.ts` for first-person identity and resume facts
- `services.ts` for services and offer framing
- `skills.ts` for capabilities + fun facts
- `projects.ts` for AI-facing project summaries derived from existing project/catalog data

Use stable typed exports such as:

```ts
export type PortfolioKnowledgeProject = {
  slug: string
  title: string
  categoryLabel: string
  summary: string
  youtubeUrl?: string
  instantAccessUrl?: string
  customBuildAvailable: boolean
}
```

- [ ] **Step 2: Reuse existing project data instead of duplicating it**

Build `shared/knowledge/projects.ts` from existing `shared/catalog` and `shared/projects` data where possible. The goal is a normalized AI view, not a second project database.

- [ ] **Step 3: Export the knowledge barrel**

Expose `shared/knowledge/index.ts` through `shared/index.ts`.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint shared/knowledge/*.ts shared/index.ts`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add shared/knowledge shared/index.ts
git commit -m "feat: add don puerto knowledge modules"
```

---

## Chunk 2: AI homepage shell

### Task 3: Replace the catalog homepage with the AI-first shell

**Files:**
- Modify: `app/pages/index.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioShell.vue`
- Create: `app/components/global/ai-portfolio/index.ts`

- [ ] **Step 1: Create a dedicated shell component**

`AiPortfolioShell.vue` should own the page composition order:
- top-right theme switcher remains available via existing navigation/layout
- avatar block
- identity block
- marquee
- navigator
- prompt
- answer canvas slot/state

- [ ] **Step 2: Replace the catalog sections in `app/pages/index.vue`**

Remove the current catalog hero, category list, featured projects grid, and CTA sections from `app/pages/index.vue`.

Import the new AI shell and wire SEO metadata from the new centralized home copy.

- [ ] **Step 3: Keep the route-level file small**

`app/pages/index.vue` should become a thin page that imports shared content/state and renders `AiPortfolioShell`.

- [ ] **Step 4: Verify the page compiles**

Run: `npx eslint app/pages/index.vue app/components/global/ai-portfolio/AiPortfolioShell.vue app/components/global/ai-portfolio/index.ts`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add app/pages/index.vue app/components/global/ai-portfolio/AiPortfolioShell.vue app/components/global/ai-portfolio/index.ts
git commit -m "feat: replace catalog homepage with ai shell"
```

### Task 4: Build the identity, marquee, nav, and prompt primitives

**Files:**
- Create: `app/components/global/ai-portfolio/AiPortfolioAvatar.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioMarquee.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioNavigator.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioPrompt.vue`
- Modify: `app/components/global/ai-portfolio/index.ts`

- [ ] **Step 1: Build the avatar component with placeholder motion hooks**

Use a stylized portrait container with:
- idle float/breathing motion
- subtle hover response
- no giant marketing headline

The first pass can use a placeholder portrait asset/container if the final portrait asset is not ready yet.

- [ ] **Step 2: Build the left-to-right marquee**

Implement a thin animated strip that loops category items and supports click events.
Each click should emit an intent payload or prompt string instead of navigating.

- [ ] **Step 3: Build the navigator row**

Create a component that renders:
- `Me`
- `Projects`
- `Skills`
- `Fun`
- `Discovery Call`

The first four should emit intents; `Discovery Call` should open `DiscoveryCallButton`.

- [ ] **Step 4: Build the prompt input**

Implement rotating suggestion text that:
- cycles only when the field is empty
- stops when typing
- resumes when cleared
- supports submit via Enter and an action button

- [ ] **Step 5: Run focused verification**

Run: `npx eslint app/components/global/ai-portfolio/*.vue app/components/global/ai-portfolio/index.ts`
Expected: no lint errors

- [ ] **Step 6: Commit**

```bash
git add app/components/global/ai-portfolio/*.vue app/components/global/ai-portfolio/index.ts
git commit -m "feat: add ai homepage interactive primitives"
```

---

## Chunk 3: Canvas state and product-style results

### Task 5: Create the homepage state model and response schema

**Files:**
- Create: `app/composables/useAiPortfolio.ts`
- Create: `server/utils/portfolio-assistant/types.ts`

- [ ] **Step 1: Define the shared response schema**

Create stable types for the canvas payload, for example:

```ts
export type PortfolioAssistantResponse = {
  answer: string
  sections: Array<
    | { type: 'projects'; title: string; projectSlugs: string[] }
    | { type: 'services'; title: string; itemIds: string[] }
    | { type: 'skills'; title: string; itemIds: string[] }
    | { type: 'cta'; action: 'discovery-call' | 'instant-access' }
  >
}
```

- [ ] **Step 2: Build the composable state machine**

`useAiPortfolio.ts` should own:
- active prompt text
- loading state
- current response payload
- expanded project slug
- prompt rotation lifecycle
- navigator/marquee click helpers

- [ ] **Step 3: Keep canvas state reusable**

Do not bury answer state inside `app/pages/index.vue`. The composable should let the shell, prompt, marquee, and navigator coordinate cleanly.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint app/composables/useAiPortfolio.ts server/utils/portfolio-assistant/types.ts`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add app/composables/useAiPortfolio.ts server/utils/portfolio-assistant/types.ts
git commit -m "feat: add ai portfolio state and response schema"
```

### Task 6: Build the answer canvas and project result rendering

**Files:**
- Create: `app/components/global/ai-portfolio/AiPortfolioCanvas.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioResponseSection.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioProjectGrid.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioProjectCard.vue`
- Create: `app/components/global/ai-portfolio/AiPortfolioExpandedProject.vue`
- Optional modify: `app/components/global/catalog/CatalogVideoEmbed.vue`

- [ ] **Step 1: Build the single-answer canvas shell**

The canvas should:
- stay hidden/quiet until the first response
- keep the prompt visible outside/above it
- render one polished answer, not a threaded chat log

- [ ] **Step 2: Render visual project cards below the answer**

Create a dedicated project grid/result card pair that feels product-oriented rather than case-study oriented.

- [ ] **Step 3: Add in-place expansion below the answer**

Clicking a project card should expand a product block below the answer, not navigate away.
The expanded block should include:
- title
- visual/thumbnail
- short summary
- YouTube demo link or inline preview
- quick value bullets
- `Get Instant Access`
- `Request Custom Version`

- [ ] **Step 4: Make `Get Instant Access` open a new tab**

Use the existing access-page route, but open it in a new tab so the AI canvas remains intact.

- [ ] **Step 5: Run focused verification**

Run: `npx eslint app/components/global/ai-portfolio/*.vue app/components/global/catalog/CatalogVideoEmbed.vue`
Expected: no lint errors

- [ ] **Step 6: Commit**

```bash
git add app/components/global/ai-portfolio/*.vue app/components/global/catalog/CatalogVideoEmbed.vue
git commit -m "feat: render ai canvas and project product cards"
```

---

## Chunk 4: AI adapter, discovery-call integration, and final verification

### Task 7: Add a Claude-ready server adapter with local knowledge responses first

**Files:**
- Create: `server/api/portfolio-assistant/respond.post.ts`
- Create: `server/utils/portfolio-assistant/build-response.ts`
- Optional modify: `nuxt.config.ts`
- Optional modify: `.env.example`

- [ ] **Step 1: Implement a local-response adapter first**

Create `build-response.ts` to map prompt text or known intents (`me`, `projects`, marquee categories, etc.) onto the structured response schema using `shared/knowledge`.

This first pass should not require live Anthropic credentials.

- [ ] **Step 2: Expose the adapter through a server route**

`respond.post.ts` should accept a prompt or intent payload and return the structured response used by the canvas.

- [ ] **Step 3: Prepare for Anthropic without blocking the UI**

If adding live Claude later, add a small feature flag/runtime config boundary rather than hardwiring Anthropic calls into the page component.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint server/api/portfolio-assistant/respond.post.ts server/utils/portfolio-assistant/*.ts nuxt.config.ts .env.example`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add server/api/portfolio-assistant/respond.post.ts server/utils/portfolio-assistant .env.example nuxt.config.ts
git commit -m "feat: add portfolio assistant response adapter"
```

### Task 8: Hook the new homepage controls into Discovery Call and final page behavior

**Files:**
- Modify: `app/components/global/call/DiscoveryCallButton.vue`
- Modify: `app/components/global/ai-portfolio/AiPortfolioNavigator.vue`
- Modify: `app/components/global/ai-portfolio/AiPortfolioShell.vue`
- Modify: `app/pages/index.vue`

- [ ] **Step 1: Reuse the existing Retell modal instead of re-implementing it**

Wire the new `Discovery Call` navigator action to the existing centered discovery-call modal flow.

- [ ] **Step 2: Keep the page in one surface**

Confirm the homepage never route-jumps for content exploration. Only:
- Discovery Call opens a modal
- Get Instant Access opens a new tab

- [ ] **Step 3: Add manual browser checks**

Run: `npm run dev`
Check manually:
- default page loads with avatar, name, marquee, nav, prompt
- marquee items are clickable
- navigator intents update the answer canvas
- project cards render below the answer
- clicking a project expands below the answer
- `Get Instant Access` opens a new tab
- `Discovery Call` opens the Retell modal
- prompt suggestions rotate only when empty

- [ ] **Step 4: Run full verification**

Run: `npx eslint .`
Expected: PASS

Run: `npx nuxt typecheck`
Expected: PASS

Run: `npm run build`
Expected: PASS (note any existing non-blocking Nuxt/Tailwind sourcemap warnings separately)

- [ ] **Step 5: Commit**

```bash
git add app/pages/index.vue app/components/global/call/DiscoveryCallButton.vue app/components/global/ai-portfolio/*.vue
git commit -m "feat: connect ai homepage to discovery call and assistant flow"
```

---

## Final review checklist

- [ ] Homepage no longer presents the catalog-first layout.
- [ ] Don Puerto is the first thing visitors see.
- [ ] Prompt stays visible before and after answers.
- [ ] Navigator and marquee feed the same canvas response flow.
- [ ] Discovery Call remains a centered Retell modal.
- [ ] Project exploration stays in the same canvas.
- [ ] Checkout opens in a new tab.
- [ ] Don Puerto facts remain centralized in `shared/`.
- [ ] No blocking lint, typecheck, or build errors remain.

---

## Notes for implementation

- Build the homepage against the local response adapter first. That gets the UX live without waiting on Anthropic credentials.
- Once the interaction model is stable, swap the adapter’s internal response builder to Anthropic while keeping the same response schema.
- If the portrait asset is not ready, implement the motion-capable avatar shell first and drop in the final illustrated asset afterward.
