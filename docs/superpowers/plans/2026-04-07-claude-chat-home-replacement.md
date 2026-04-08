# Claude Chat Home Replacement Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/` AI portfolio homepage with a Claude-inspired chat shell that mirrors the Nuxt UI chat template structure while staying fully in this repo's Nuxt 4 + shadcn-vue component system.

**Architecture:** Rebuild the homepage around a shadcn-vue sidebar app shell, a centered composer, and a conversation-ready main panel. Keep content and model metadata in `shared/`, preserve the repo's theme/layout controls where safe, and map the Claude/TweakCN design tokens into the existing Tailwind v4 theme pipeline instead of introducing a second styling system.

**Tech Stack:** Nuxt 4, Vue 3 with `<script setup lang="ts">`, Tailwind CSS v4, shadcn-vue, local `app/components/ui` wrappers, Reka UI primitives, `@nuxt/fonts`/local self-hosted fonts, existing color mode/theme composables.

---

## File map

### Theme and font foundation
- Modify: `app/assets/css/tailwind.css`
  - Replace or extend the root token set with the Claude/TweakCN palette, sidebar tokens, radii, shadows, and semantic surface colors.
- Modify: `app/assets/css/fonts.css`
  - Register the new local font faces and map them to `--font-sans`, `--font-serif`, and `--font-mono`.
- Create: `public/fonts/claude/`
  - Store locally hosted font binaries used by the new shell.
- Modify: `shared/themes/index.ts`
  - Add a Claude/TweakCN-compatible theme entry if the theme switcher needs to recognize the new palette.
- Modify: `app/composables/` theme-related files as needed
  - Only if the existing theme selector requires registration changes for the new theme.

### Shared data for the chat shell
- Create: `shared/pages/chat-home.ts`
  - Source of truth for greeting copy, composer placeholder text, quick actions, sidebar sections, and login CTA labels.
- Create: `shared/catalog/chat-models.ts`
  - Centralized model dropdown items, icons, and default selection.
- Modify: `shared/index.ts`
  - Export the new chat-home and model metadata.
- Modify: `shared/pages/index.ts`
  - Replace homepage SEO/meta copy to match the new Claude-style chat experience.

### Homepage shell and layout
- Modify: `app/pages/index.vue`
  - Replace the current AI portfolio landing composition with the new chat app shell.
- Create: `app/components/global/chat-home/ChatHomeShell.vue`
  - Root app shell that composes sidebar, mobile drawer behavior, top navbar, main panel, and prompt dock.
- Create: `app/components/global/chat-home/ChatHomeSidebar.vue`
  - Desktop sidebar built from shadcn-vue `sidebar-03` structure adapted to repo conventions.
- Create: `app/components/global/chat-home/ChatHomeSidebarFooter.vue`
  - Bottom login/user panel inside the sidebar.
- Create: `app/components/global/chat-home/ChatHomeNavbar.vue`
  - Mobile/compact top bar with sidebar trigger and theme control.
- Create: `app/components/global/chat-home/index.ts`
  - Barrel export for the new homepage shell components.

### Composer and chat controls
- Create: `app/components/global/chat-home/ChatPromptShell.vue`
  - Claude-style composer wrapper with header slot for attachments and footer controls.
- Create: `app/components/global/chat-home/ChatPromptTextarea.vue`
  - Textarea logic with Enter-to-submit and auto-resize behavior.
- Create: `app/components/global/chat-home/ChatPromptAttachments.vue`
  - Selected file chips/preview row above the composer when attachments exist.
- Create: `app/components/global/chat-home/ChatPromptClipButton.vue`
  - Clip/upload trigger button.
- Create: `app/components/global/chat-home/ChatPromptModelSelect.vue`
  - shadcn-vue select/dropdown for models.
- Create: `app/components/global/chat-home/ChatPromptSubmitButton.vue`
  - Circular arrow-up button with ready/loading/disabled states.

### Main panel content
- Create: `app/components/global/chat-home/ChatHomeGreeting.vue`
  - Greeting/title area for the empty state.
- Create: `app/components/global/chat-home/ChatHomeQuickActions.vue`
  - Prompt suggestion pills under the composer.
- Create: `app/components/global/chat-home/ChatThreadSurface.vue`
  - Main message/content surface used after the first interaction.
- Create: `app/components/global/chat-home/ChatSidebarHistory.vue`
  - Sidebar navigation/history list and "new chat" action.

### State and client logic
- Create: `app/composables/useChatHome.ts`
  - Shared state for sidebar open/collapse, prompt text, selected model, fake/history items, quick actions, and empty-vs-conversation mode.
- Create: `app/composables/useChatComposer.ts`
  - Attachment management, auto-resize, submit guard, and prompt helper logic.
- Create: `app/composables/useChatModels.ts`
  - Thin model selector state wrapper backed by `shared/catalog/chat-models.ts`.

### Optional auth integration layer
- Modify: existing auth/session-aware component(s) if available
  - Reuse current session data for the sidebar footer if auth already exists.
- Otherwise create: `app/components/global/chat-home/ChatSidebarLoginCard.vue`
  - Guest-only login CTA block for the sidebar footer.

---

## Implementation notes before coding

- Use Vue Composition API with `<script setup lang="ts">` for every new Vue file.
- Prefer local wrappers under `app/components/ui/` over raw primitives in feature code.
- Use `npx shadcn-vue@latest add sidebar-03` as the starting sidebar pattern, then adapt it instead of copying the raw registry code blindly.
- Keep the homepage route thin. Put orchestration in composables and feature components.
- Do not hardcode homepage copy or model names directly in components when they belong in `shared/`.
- Preserve the repo's global theme/layout controls unless a specific control becomes incompatible with the new shell.
- Treat font installation as local asset work. The CSS token snippet you provided defines stacks, not actual font files.
- The first pass can use placeholder chat history/messages and a local prompt loop. Real model backends can come later if needed.

---

## Chunk 1: Theme and local font foundation

### Task 1: Map the Claude/TweakCN token set into the repo theme layer

**Files:**
- Modify: `app/assets/css/tailwind.css`
- Modify: `shared/themes/index.ts`
- Modify: theme-related composables only if required by the current selector flow

- [ ] **Step 1: Read the current theme pipeline before editing**

Inspect:
- `app/assets/css/tailwind.css`
- `shared/themes/index.ts`
- any composable currently responsible for active theme selection

Confirm where theme names, CSS imports, and token sets are registered.

- [ ] **Step 2: Add the Claude/TweakCN token set to the Tailwind v4 theme file**

Merge the provided token structure into `app/assets/css/tailwind.css`:
- `:root` light tokens
- `.dark` tokens
- `@theme inline` semantic mappings
- `@layer base` default body/background/border behavior

Also preserve existing required utilities/imports already used elsewhere in the repo.

- [ ] **Step 3: Register the theme if the selector depends on explicit theme metadata**

If `shared/themes/index.ts` or related composables maintain a list of available themes, add a Claude/TweakCN entry without breaking the existing switcher.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint app/assets/css/tailwind.css shared/themes/index.ts`
Expected: no lint/config parsing issues from touched files

- [ ] **Step 5: Commit**

```bash
git add app/assets/css/tailwind.css shared/themes/index.ts
git commit -m "feat: add claude tweakcn theme tokens"
```

### Task 2: Install and wire local fonts for the new shell

**Files:**
- Create: `public/fonts/claude/*`
- Modify: `app/assets/css/fonts.css`
- Modify: `app/assets/css/tailwind.css`

- [ ] **Step 1: Identify the actual font files to self-host**

Determine the font family intended by the TweakCN export/design reference.
If the design reference only implies Claude-style typography but does not supply exact files, choose the intended local family and collect:
- sans file(s)
- serif file(s) if used
- mono file(s) if needed

- [ ] **Step 2: Add the font binaries to the repo**

Place the local font files under:

```text
public/fonts/claude/
```

Use a predictable naming scheme so CSS references stay stable.

- [ ] **Step 3: Define `@font-face` rules and token mapping**

Update `app/assets/css/fonts.css` to:
- register each local face
- set `font-display: swap`
- map the families into `--font-sans`, `--font-serif`, and `--font-mono`

Ensure `tailwind.css` consumes those variables through the existing `@theme inline` mappings.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint app/assets/css/fonts.css app/assets/css/tailwind.css`
Expected: no lint/config issues

- [ ] **Step 5: Commit**

```bash
git add public/fonts/claude app/assets/css/fonts.css app/assets/css/tailwind.css
git commit -m "feat: self-host claude chat fonts"
```

---

## Chunk 2: Shared content contracts and chat state

### Task 3: Centralize homepage copy and model metadata

**Files:**
- Create: `shared/pages/chat-home.ts`
- Create: `shared/catalog/chat-models.ts`
- Modify: `shared/pages/index.ts`
- Modify: `shared/index.ts`

- [ ] **Step 1: Create a `chat-home` content module**

Add typed exports for:
- hero/greeting text
- composer placeholder
- quick action prompts
- sidebar section labels
- login/footer labels

Example types:

```ts
export type ChatQuickAction = {
  id: string
  label: string
  prompt: string
  icon?: string
}
```

- [ ] **Step 2: Create a centralized model catalog**

Add typed model metadata such as:

```ts
export type ChatModelOption = {
  id: string
  label: string
  description?: string
  icon?: string
  available?: boolean
}
```

Use this as the source for the model dropdown.

- [ ] **Step 3: Update the homepage SEO copy**

Replace the old homepage meta/SEO copy in `shared/pages/index.ts` so it describes the new Claude-style chat experience.

- [ ] **Step 4: Export the new modules**

Expose both modules through `shared/index.ts`.

- [ ] **Step 5: Run focused verification**

Run: `npx eslint shared/pages/chat-home.ts shared/catalog/chat-models.ts shared/pages/index.ts shared/index.ts`
Expected: no lint errors

- [ ] **Step 6: Commit**

```bash
git add shared/pages/chat-home.ts shared/catalog/chat-models.ts shared/pages/index.ts shared/index.ts
git commit -m "feat: add shared chat home content and model metadata"
```

### Task 4: Build the core chat-home composables

**Files:**
- Create: `app/composables/useChatHome.ts`
- Create: `app/composables/useChatComposer.ts`
- Create: `app/composables/useChatModels.ts`

- [ ] **Step 1: Define the top-level shell state**

`useChatHome.ts` should own:
- sidebar open state for mobile
- collapsed state for desktop if needed
- prompt string
- empty state vs conversation state
- quick action execution
- lightweight local history items

- [ ] **Step 2: Extract composer-specific behavior**

`useChatComposer.ts` should own:
- textarea auto-resize
- selected attachments
- file removal
- submit readiness
- Enter vs Shift+Enter handling

- [ ] **Step 3: Keep model state isolated**

`useChatModels.ts` should expose:
- current model
- list of models
- optional label/icon helpers

- [ ] **Step 4: Run focused verification**

Run: `npx eslint app/composables/useChatHome.ts app/composables/useChatComposer.ts app/composables/useChatModels.ts`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add app/composables/useChatHome.ts app/composables/useChatComposer.ts app/composables/useChatModels.ts
git commit -m "feat: add chat home composables"
```

---

## Chunk 3: Shell structure and sidebar migration

### Task 5: Add the shadcn-vue sidebar foundation and adapt it to this repo

**Files:**
- Create/modify: files added by `npx shadcn-vue@latest add sidebar-03`
- Modify: any generated sidebar support files under `app/components/ui/`
- Modify: `components.json` only if the generator changes it

- [ ] **Step 1: Review current UI components before generation**

Inspect:
- `app/components/ui/`
- `components.json`
- any existing sidebar-related files

Make sure generated files will not overwrite unrelated local wrappers unexpectedly.

- [ ] **Step 2: Add the Vue sidebar template**

Run:

```bash
npx shadcn-vue@latest add sidebar-03
```

If the generator prompts for file creation or updates, review carefully and avoid replacing unrelated custom files.

- [ ] **Step 3: Normalize the generated code to repo conventions**

After generation:
- verify imports use `@/components/ui` and `@/lib/utils`
- ensure new files use `<script setup lang="ts">` if applicable
- fix any generated naming/composition mismatches
- keep semantic tokens instead of one-off colors

- [ ] **Step 4: Run focused verification**

Run: `npx eslint app/components/ui`
Expected: no new lint errors from generated sidebar files

- [ ] **Step 5: Commit**

```bash
git add app/components/ui components.json
git commit -m "feat: add shadcn vue sidebar foundation"
```

### Task 6: Build the homepage shell around the sidebar pattern

**Files:**
- Modify: `app/pages/index.vue`
- Create: `app/components/global/chat-home/ChatHomeShell.vue`
- Create: `app/components/global/chat-home/ChatHomeSidebar.vue`
- Create: `app/components/global/chat-home/ChatHomeSidebarFooter.vue`
- Create: `app/components/global/chat-home/ChatHomeNavbar.vue`
- Create: `app/components/global/chat-home/ChatSidebarHistory.vue`
- Create: `app/components/global/chat-home/index.ts`

- [ ] **Step 1: Create a feature folder for the new homepage**

Create:

```text
app/components/global/chat-home/
```

Keep responsibilities split by shell, sidebar, footer, navbar, and history.

- [ ] **Step 2: Implement the shell container**

`ChatHomeShell.vue` should compose:
- desktop sidebar
- mobile drawer/sidebar
- optional top navbar
- main panel surface
- prompt placement

This component should stay focused on layout and composition, not low-level prompt logic.

- [ ] **Step 3: Implement the sidebar and footer**

Translate the Nuxt UI chat template structure into shadcn-vue:
- logo/title at top
- new chat action
- chat/history list in the middle
- login/user section pinned to the bottom

The mobile experience should use the same sidebar content in drawer form.

- [ ] **Step 4: Replace the homepage route**

Update `app/pages/index.vue` to become a thin route that:
- imports shared content
- wires meta/SEO
- renders `ChatHomeShell`

- [ ] **Step 5: Run focused verification**

Run: `npx eslint app/pages/index.vue app/components/global/chat-home/*.vue app/components/global/chat-home/index.ts`
Expected: no lint errors

- [ ] **Step 6: Commit**

```bash
git add app/pages/index.vue app/components/global/chat-home
git commit -m "feat: replace home route with chat shell layout"
```

---

## Chunk 4: Composer, quick actions, and conversation surface

### Task 7: Build the Claude-style composer controls

**Files:**
- Create: `app/components/global/chat-home/ChatPromptShell.vue`
- Create: `app/components/global/chat-home/ChatPromptTextarea.vue`
- Create: `app/components/global/chat-home/ChatPromptAttachments.vue`
- Create: `app/components/global/chat-home/ChatPromptClipButton.vue`
- Create: `app/components/global/chat-home/ChatPromptModelSelect.vue`
- Create: `app/components/global/chat-home/ChatPromptSubmitButton.vue`

- [ ] **Step 1: Build the composer wrapper**

`ChatPromptShell.vue` should provide:
- rounded composer container
- optional attachment row
- textarea area
- footer controls row

Match the Claude/TweakCN spacing and visual density using semantic tokens.

- [ ] **Step 2: Implement the clip/upload control**

Create a clip button that:
- opens file picker
- passes files into `useChatComposer`
- visually matches the shell

Use existing button/dropdown primitives where possible.

- [ ] **Step 3: Implement the model selector**

Create a shadcn-vue select or dropdown-based selector fed by `useChatModels`.
Keep the UI compact and mobile-safe.

- [ ] **Step 4: Implement the circular submit button**

Create the arrow-up submit button with:
- disabled state when prompt is empty
- loading state when submitting
- keyboard submission support from the textarea

- [ ] **Step 5: Run focused verification**

Run: `npx eslint app/components/global/chat-home/ChatPrompt*.vue`
Expected: no lint errors

- [ ] **Step 6: Commit**

```bash
git add app/components/global/chat-home/ChatPrompt*.vue
git commit -m "feat: add claude style chat composer"
```

### Task 8: Build the empty state, quick actions, and thread surface

**Files:**
- Create: `app/components/global/chat-home/ChatHomeGreeting.vue`
- Create: `app/components/global/chat-home/ChatHomeQuickActions.vue`
- Create: `app/components/global/chat-home/ChatThreadSurface.vue`
- Modify: `app/components/global/chat-home/ChatHomeShell.vue`

- [ ] **Step 1: Build the initial empty state**

Render:
- greeting/title
- optional descriptive copy
- centered composer
- quick action chips

This should feel close to the Nuxt UI template structure while using your theme.

- [ ] **Step 2: Add quick action prompts**

Quick action chips should:
- come from `shared/pages/chat-home.ts`
- populate/submit the composer on click
- wrap cleanly on mobile

- [ ] **Step 3: Build the conversation surface**

`ChatThreadSurface.vue` should support the first post-empty-state UI.
For this phase it can render a lightweight local thread/messages surface rather than a full backend chat implementation.

- [ ] **Step 4: Run focused verification**

Run: `npx eslint app/components/global/chat-home/*.vue`
Expected: no lint errors

- [ ] **Step 5: Commit**

```bash
git add app/components/global/chat-home/*.vue
git commit -m "feat: add chat home empty state and thread surface"
```

---

## Chunk 5: Integration, mobile behavior, and final verification

### Task 9: Connect the shell to theme controls and sidebar footer auth state

**Files:**
- Modify: `app/components/global/chat-home/ChatHomeShell.vue`
- Modify: `app/components/global/chat-home/ChatHomeSidebarFooter.vue`
- Modify: current theme selector/user-session integration points as needed

- [ ] **Step 1: Reuse the existing theme/color mode behavior**

Do not reimplement color mode from scratch.
Wire the current repo behavior into the new shell so the Claude/TweakCN palette still respects light/dark mode.

- [ ] **Step 2: Add the sidebar footer login/user state**

If session data already exists, show a signed-in summary block.
Otherwise show a guest login CTA pinned to the bottom of the sidebar, matching the chat template layout requirement.

- [ ] **Step 3: Verify desktop and mobile shell behavior**

Check:
- desktop sidebar fixed/collapsible behavior
- mobile sidebar drawer open/close
- bottom footer visibility in both modes
- composer responsiveness

- [ ] **Step 4: Commit**

```bash
git add app/components/global/chat-home/*.vue
git commit -m "feat: wire chat shell theme and sidebar footer state"
```

### Task 10: Run end-to-end verification and fix actionable issues

**Files:**
- Modify any touched files needed to resolve verification issues

- [ ] **Step 1: Run lint**

Run: `npx eslint .`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `npx nuxt typecheck`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Run manual UI verification**

Run: `npm run dev`

Verify manually:
- `/` renders the new chat shell
- desktop sidebar shows logo/history/new chat/login footer
- mobile sidebar opens and closes correctly
- composer shows clip button, model dropdown, and arrow-up submit
- prompt submit transitions from empty state into thread surface
- theme looks correct in both light and dark modes
- locally hosted fonts load without network dependency

- [ ] **Step 5: Fix any blocking issues found during verification**

Resolve actionable lint, type, build, and UI regressions before calling the work complete.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: finalize claude chat home replacement"
```

---

## Final review checklist

- [ ] The old `/` homepage experience has been replaced.
- [ ] The new shell uses shadcn-vue patterns, not `@nuxt/ui` components.
- [ ] `sidebar-03` was used as the sidebar foundation and adapted safely.
- [ ] The sidebar includes a bottom login/user area.
- [ ] Mobile behavior works with a drawer-style sidebar.
- [ ] The composer includes a clip/upload control.
- [ ] The composer includes a model dropdown.
- [ ] The composer includes a circular arrow-up submit button.
- [ ] Claude/TweakCN token styling is mapped into the repo's existing Tailwind v4 theme system.
- [ ] Fonts are self-hosted locally and wired through CSS variables.
- [ ] No blocking lint, typecheck, or build errors remain.

---

## Notes for implementation

- The Nuxt UI chat repo should be treated as a structural reference, not as code to paste directly.
- The generated shadcn-vue sidebar should be reviewed immediately after generation because the Vue CLI here does not support `--dry-run`.
- If the exact TweakCN font family still needs to be identified from the design source, resolve that before finalizing `fonts.css`; do not leave the shell on generic system fonts if the requirement is to copy the font locally.
