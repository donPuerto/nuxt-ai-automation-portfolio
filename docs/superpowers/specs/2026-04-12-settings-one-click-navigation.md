# Settings One-Click Navigation (Workspace)

Date: 2026-04-12

## Issue
From the workspace chat screen, clicking `Settings` changed the URL to `/settings?section=general` but sometimes still showed the prompt UI until refresh or second click.

## Root Cause
Client-side route transitions could be swallowed/stale in this specific composition:
- sidebar/menu items rendered through wrapper components (`SidebarMenuButton as-child`)
- dropdown settings actions using `@select` handlers
- `ChatShell` prompt/settings mode controlled by reactive state during transition

In this state, a soft navigation updated URL/history but the visible layout could remain on prompt mode.

## Resolution Applied
Use hard link navigation for Settings entry points in workspace UI:
- Use `<a href="/settings?section=general">` for Settings in:
  - sidebar navigation
  - prompt navigation strip
  - profile dropdown menu

Also keep `ChatShell` route-aware for mode resolution as a fallback guard.

## Why this works
A hard navigation guarantees a fresh render path and avoids stale in-memory router state for this edge case.

## Regression Rule
For Settings navigation in workspace surfaces, prefer direct anchor navigation unless we explicitly validate a router-only path that is stable in first-click tests.

## Verification Checklist
1. Open `/`
2. Click `Settings` once from each entry point:
   - left sidebar
   - prompt nav strip
   - profile dropdown
3. Confirm immediate Settings UI render (not just URL change).
4. Confirm no refresh required.

## Additional Issue: Blank-then-data flash

### Symptom
Settings could briefly appear blank before data loads, then populate after refresh-like behavior.

### Root Cause
useUserSettings.loadSettings() runs on onMounted, so initial render could happen before initialization completes.
The template previously only checked loading, not initialized, allowing a transient empty state.

### Fix
Gate rendering with a bootstrap condition:
- isSettingsBootstrapping = loading || !initialized`n- show skeleton while bootstrapping

### Rule
For settings/account pages using client-side profile fetches, never render editable sections until initialization has completed.
