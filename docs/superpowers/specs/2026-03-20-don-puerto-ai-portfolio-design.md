# Don Puerto AI Portfolio Redesign Spec

## Goal

Redesign the portfolio into an AI-first personal experience where visitors interact with Don Puerto through a Claude-powered prompt surface instead of browsing a conventional homepage first.

The page should feel like a premium dark AI interface by default, with Don Puerto as the center of the experience. The assistant should answer in first person using injected knowledge about Don Puerto's resume, projects, services, skills, and background.

## Product direction

This is no longer a standard portfolio landing page with hero copy, category grids, and static section browsing. The new experience should behave like a personal AI workspace:

- Visitors see Don Puerto first.
- Visitors prompt the site naturally.
- Claude responds from Don Puerto's knowledge base.
- The frontend renders visual project cards and supporting content inside the same answer canvas.
- Discovery Call remains a separate centered popup because it is tied to the Retell flow.

## Core experience

### Initial state

On first load, the homepage should stay minimal and identity-first:

- animated stylized portrait of Don Puerto
- `Hey, I'm Don Puerto`
- descriptor: `Workflow Builder and Automation Specialist`
- a thin running marquee above the navigator
- a navigator row
- a single prompt input with rotating prompt suggestions

There should be no large marketing headline and no default center content panel. The page should feel quiet, premium, and waiting for interaction.

### Prompt behavior

The input remains visible at all times. Placeholder suggestions rotate when the field is empty. Once the user types, the rotation stops. If the field becomes empty again, rotation resumes.

Default prompt suggestions should be in the style of:

- `Ask about my projects, workflows, or services...`
- `Show me the workflows available for instant access...`
- `What custom solutions can you build?...`
- `Tell me about your automation experience...`

### Response behavior

When the user submits a prompt, the homepage center area transforms into a large answer canvas. The experience should not navigate away or "go back home." The input remains available so the user can keep asking follow-up questions in the same surface.

The answer canvas should feel like a polished single-answer surface, not a support-style threaded chat log.

## AI behavior

### Voice and identity

Claude should answer in first person as Don Puerto.

The assistant should:

- speak in first person
- stay factual and grounded in provided knowledge
- avoid inventing projects, clients, or credentials
- remain warm, professional, and product-aware
- guide users toward projects, workflow access, custom services, or discovery calls when relevant

### Knowledge source

Claude should answer from an injected knowledge base about Don Puerto. The knowledge base should include at minimum:

- resume / work history
- bio / about information
- projects
- services
- skills
- workflow/product availability
- discovery call context

The existing local content system such as `shared/projects` can contribute project knowledge, but the AI should be designed around Don Puerto as the primary subject, not around project files alone.

## Navigator behavior

The navigator remains visible in the initial state and should use:

- `Me`
- `Projects`
- `Skills`
- `Fun`
- `Discovery Call`

Clicking `Me`, `Projects`, `Skills`, or `Fun` should not open static panels directly. Instead, each item should trigger a Claude prompt or internal intent so Claude answers from the knowledge base in the same answer canvas.

`Discovery Call` is the exception. It should open the centered Retell modal, not the canvas.

## Running marquee

Above the navigator, the page should display a horizontally moving running strip, not a rotating card.

This marquee should surface categories or themes such as:

- Content Creation & Social Media
- Sales & Lead Generation
- Appointments & Customer Support
- Productivity & Admin
- AI Agents & Internal Tools
- CRM & Follow-up Automation

These items should be clickable.

Clicking a marquee item should:

- trigger a Claude intent for that category
- return a Claude explanation in the answer canvas
- render matching project cards below the response

This should stay inside the same page and same canvas.

## Project presentation

### Project cards in the answer canvas

Claude should not generate raw HTML cards directly. Claude should produce answer content plus structured result data, and the frontend should render visual project cards using that data.

When Claude recommends projects, the answer canvas should show:

- short Don Puerto answer text
- visual project cards underneath

### Expanded project behavior

Clicking a project card should not navigate away from the page. Instead, the selected project should expand inside the same canvas below Claude's answer.

The expanded project block should feel like a product card, not a mini case study.

Recommended content inside the expanded product card:

- project title
- visual thumbnail
- short product summary
- YouTube demo link or embedded preview
- quick value bullets
- CTA row

### Expanded project actions

- `Get Instant Access`
- `Request Custom Version`

`Get Instant Access` should open the existing access/checkout page in a new tab so the visitor does not lose the main AI portfolio experience.

## Discovery Call behavior

Discovery Call remains a centered popup modal because it is tied to Retell and should stay separate from content exploration.

The modal should continue to:

- request mic access
- show live state
- allow device selection
- manage start, mute, and end controls

The modal should not become part of the answer canvas.

## Visual direction

### Default theme

The portfolio should default to a dark premium AI interface.

The existing top-right theme switcher remains available so users can still switch mode or accents, but the default mood should remain dark and immersive.

### Avatar

The avatar should be a stylized human portrait of Don Puerto inspired by memoji-like character design, but not a literal Apple memoji copy.

The avatar should feel like:

- clearly Don Puerto
- stylized and modern
- subtly animated
- trustworthy rather than cartoonish

Recommended motion:

- idle float / breathing motion
- slight hover response to cursor
- optional speaking pulse later when Claude answers

## Layout summary

### Default page

- top-right theme switcher
- centered avatar
- name and descriptor
- running marquee
- navigator row
- prompt input with rotating suggestions

### After interaction

- input remains available
- answer canvas appears in the center area
- Claude answer appears first
- structured project cards render below
- selected project expands below the answer in the same canvas

## Non-goals for this redesign

The redesign should explicitly avoid:

- conventional hero headline blocks
- catalog-first homepage structure
- route-based navigation for every content interaction
- generic chatbot styling
- project exploration that breaks the AI surface

## Implementation implications

This redesign will require:

- replacing the current homepage structure
- adding an AI prompt and response canvas state model
- defining structured Claude response types
- rendering projects, services, and CTAs from structured output
- preserving the Retell discovery call modal as a separate centered flow
- preparing a Don Puerto-specific knowledge base and prompt

## Open items for implementation planning

The following still need to be formalized in the implementation plan:

- exact structured response schema for Claude
- source-of-truth files for Don Puerto knowledge outside project data
- avatar asset strategy
- marquee component behavior and click handling
- answer canvas component breakdown
- project expansion state model
- Claude prompt and guardrails
