# Convene Floor Plan Redesign — Meta-Aware Plan

> **This document knows what it is.**
> Living plan for rebuilding the Convene floor plan tool from "dashboard with a map" to "map app with a detail panel." Self-documenting, session-resumable, decision-logged. Orchestrates 5 agents across 4 phases with explicit dependency gates.

---

## Source Principles

| Source | Key Concept |
|--------|-------------|
| Google Maps | Never cover the spatial canvas. Sidebar pushes, doesn't overlay. Three-state bottom sheet on mobile. |
| Airbnb map+list | Two-way binding: same visual indicator on both surfaces. Warmth from spacing and restraint, not color saturation. |
| Figma properties panel | Panel is always present — populated or empty. No show/hide jank. |
| DoorDash card hierarchy | 16px body minimum. 8px spacing grid. Progressive disclosure across 3 tiers. |
| Beautiful-First Design System | Fraunces for warmth, Source Sans for clarity. Earth tones as grounding palette. Spring animations, never linear. Progress rings validated. No gamification. |
| Biophilic design research | Warmth = generous spacing + organic curves + warm shadows + restrained accent color. Not: texture everywhere, asymmetric borders, painting everything terracotta. |

---

## Current Reality

**Context:** Single-file HTML app (~2300 lines), vanilla JS, SVG floor plan, localStorage state. No build system. No framework. One data file. The constraint is that changes must remain in this single-file architecture — no React rewrite, no build step.

| What Persists | What's Ephemeral |
|---------------|------------------|
| `index.html` — the entire app | Agent session memory |
| `data/g2-conference.js` — event data (do NOT modify) | Real-time reasoning between agents |
| `DESIGN-RESEARCH-BRIEF.md` — all research findings | Intermediate agent outputs before merge |
| `MULTIAGENT-IMPROVEMENT-PROMPT.md` — original diagnosis | |
| localStorage checklist state (must not break) | |

**Critical constraint:** Agents 2–4 work on the **same file**. The original plan had 3 parallel agents (Color, Layout, Interaction) all editing `index.html`. This creates merge conflicts. The redesign below fixes this with a sequential core phase and parallel polish phase that targets non-overlapping sections.

---

## Phases

### ✅ Phase 0: Research & Diagnosis (Complete)
- [x] Full read and diagnosis of `index.html` (MULTIAGENT-IMPROVEMENT-PROMPT.md)
- [x] Research: Google Maps, DoorDash, Airbnb, Figma, venue tools (DESIGN-RESEARCH-BRIEF.md)
- [x] Biophilic/warm UI patterns research
- [x] Identify 5 core moves: sidebar expansion, sizing, animation coordination, color split, zoom cap

### 🔄 Phase 1: Architect Contract (Sequential — Agent 0)
**Gate:** Produces the remediation contract. No code. All decisions.

- [ ] Agent 0 reads: `index.html`, `g2-conference.js`, `DESIGN-RESEARCH-BRIEF.md`, `beautiful-first-design/SKILL.md`
- [ ] Agent 0 produces `REMEDIATION-CONTRACT.md` with:
  - [ ] Revised `:root` CSS custom properties (full replacement block)
  - [ ] DOM structure sketch for sidebar expansion (two states: collapsed 280px, expanded 420px)
  - [ ] Zoom constraint formula (min viewBox 400×350, or attention-dimming alternative)
  - [ ] Animation timing chart (parallel, not sequential — all starting at t=0)
  - [ ] Font size scale (12px floor) and spacing scale (8px base grid)
  - [ ] Color split: structural (warm earth) vs. data (moss/slate/terracotta) vs. accent (warm peach)
  - [ ] Mobile bottom-sheet behavior spec
  - [ ] Per-task agent assignment with explicit "do not touch" boundaries
- [ ] Human review of contract before proceeding

**Agent 0 Prompt:**
```
You are the design architect for a Convene floor plan tool (single-file HTML, ~2300 lines).

Read ALL of these files in order:
1. index.html — the entire app
2. data/g2-conference.js — the event data
3. DESIGN-RESEARCH-BRIEF.md — comprehensive research findings
4. beautiful-first-design SKILL.md — the design system

Your job is to produce a REMEDIATION CONTRACT. No code. Only decisions.

The research brief identifies 5 core moves. For EACH move, produce:
1. THE DECISION — what specifically changes, with exact values
2. THE CONSTRAINT — what must not break
3. THE IMPLEMENTATION SEQUENCE — which phase handles it

REQUIRED DELIVERABLES IN THE CONTRACT:

A. REVISED :root BLOCK
Write the complete replacement CSS custom properties. Use these specific palettes:
- Structural: earth tones (--room-empty: #f0ece8 through --room-dense: #b49068)
- Data: --status-set: #4a6b5c (earth-moss), --status-test: #8a919e (cool-400), --status-ready: #c4704b (warm-500)
- Accent: --accent: #d4846a (warm-300) for selection/hover only
- Type scale: --type-xs through --type-xl (12px floor)
- Spacing scale: --space-2xs through --space-xl
- Easing: --ease-smooth, --ease-spring (0.34, 1.56, 0.64, 1), --ease-settle

B. SIDEBAR EXPANSION SPEC
The room overlay MUST be removed. The sidebar becomes the single detail surface.
Spec must include:
- Collapsed state: width, what's shown, transition duration
- Expanded state: width, what's shown, transition origin
- How grid-template-columns animates between states
- How content populates (staggered fade, 50-80ms intervals)
- Mobile behavior: bottom sheet with peek/intermediate/expanded

C. ZOOM CONSTRAINT
Choose one of:
- OPTION A: Cap viewBox at min 400×350, keep zoom but soften
- OPTION B: No viewBox zoom. Dim unselected rooms to 30%, glow selected.
- OPTION C: Hybrid — gentle pan-to-center at current zoom + dimming
Justify the choice. Provide the formula.

D. ANIMATION TIMING CHART
Show the selection flow as a timeline:
  t=0: [what starts]
  t=Xms: [what starts]
  ...
  t=Yms: [everything settled]
Same for deselection. Total must be ≤400ms for selection, ≤500ms for deselection.

E. AGENT BOUNDARIES
Define exactly what each implementing agent owns:
- Phase 2 (Structure Agent): HTML changes, CSS layout, CSS sizing — operates on the FULL file
- Phase 3a (Color Agent): CSS color properties ONLY — operates on a section extracted from Phase 2 output
- Phase 3b (Motion Agent): JS functions ONLY — operates on <script> block extracted from Phase 2 output
- Phase 4 (Warmth Agent): CSS refinements only — operates on final merged file

For each agent, list:
- MUST CHANGE: [specific selectors / functions]
- MUST NOT TOUCH: [specific selectors / functions]
- DEPENDS ON: [which prior agent's output]
```

---

### 🔲 Phase 2: Core Restructure (Sequential — Agent 1: Structure)
**Gate:** Requires completed, human-approved contract from Phase 1.
**Output:** The restructured `index.html` with new DOM, sizing, and spacing. Colors still placeholder. Animations still rough.

- [ ] [D] Remove `.room-overlay` element and all overlay CSS
- [ ] [D] Restructure `.detail-panel` sidebar with two states (collapsed/expanded)
- [ ] [D] Add CSS transition on `.plan-layout` grid-template-columns
- [ ] [D] Apply font size floor (12px minimum for all HTML elements)
- [ ] [D] Apply spacing scale (8px base grid)
- [ ] [D] Increase checkbox hit targets (20px boxes, 44px touch areas)
- [ ] [D] Increase SVG label sizes (10px minimum)
- [ ] [D] Increase status bar height (5px → 8px) or convert to badge
- [ ] [D] Increase progress ring size (36px → 42px)
- [ ] [D] Add room affordance to SVG (subtle inner shadow or rounded treatment for i1+)
- [ ] [D] Update `selectRoom()` to expand sidebar instead of showing overlay
- [ ] [D] Update `clearSelection()` to collapse sidebar instead of hiding overlay
- [ ] [D] Remove `showRoomOverlay()` and `hideRoomOverlay()` functions
- [ ] [D] Merge `renderRoomDetail()` and `renderRoomDetailCompact()` into single function with expanded/collapsed modes
- [ ] Verify: all checkbox interactions still work with localStorage
- [ ] Verify: pull sheet tab still renders correctly
- [ ] Verify: search still works (results in sidebar, not overlay)

**Agent 1 Prompt (Structure):**
```
You are implementing the structural redesign of a Convene floor plan tool.

Read the REMEDIATION CONTRACT (provided as context) — it contains all decisions.
Read index.html — the file you will modify.

YOUR SCOPE: HTML structure, CSS layout rules, CSS sizing, and the JS functions
that directly manage the overlay/sidebar. You are producing the FOUNDATION
that two subsequent agents will refine (Color Agent edits CSS colors,
Motion Agent edits JS animation timing).

CRITICAL CHANGES:
1. REMOVE the room overlay system entirely:
   - Delete the .room-overlay CSS block
   - Delete showRoomOverlay() and hideRoomOverlay() functions
   - Delete the overlay DOM creation in those functions

2. RESTRUCTURE the sidebar (.detail-panel):
   - Two states: collapsed (~280px) and expanded (~420px)
   - Collapsed: room name, type badge, progress bars, notes (current compact view)
   - Expanded: full categorized checklist with Set/Test checkboxes
   - Transition via CSS on grid-template-columns + content fade
   - Add a .sidebar-expanded class to .plan-layout when a room is selected

3. MERGE renderRoomDetail() and renderRoomDetailCompact() into one function
   that renders the FULL checklist in the sidebar (not a compact summary).
   The sidebar IS the detail view now.

4. UPDATE selectRoom():
   - Remove setTimeout for overlay
   - Add .sidebar-expanded class to .plan-layout
   - Call the merged render function directly

5. UPDATE clearSelection():
   - Remove .sidebar-expanded class
   - Clear sidebar content
   - (Don't worry about animation timing — Motion Agent handles that)

6. APPLY SIZING from the contract:
   - Font size floor: 12px minimum for ALL HTML elements
   - Spacing: 8px base grid per the contract's spacing scale
   - Checkboxes: 20px with 44px touch target wrapper
   - Progress rings: 42px diameter
   - Status bars: 8px height
   - SVG labels: 10px minimum

CONSTRAINTS:
- DO NOT change color values (leave current colors — Color Agent handles that)
- DO NOT change animation durations/curves (leave current — Motion Agent handles)
- DO NOT modify StateManager or data layer functions
- DO NOT change the SVG room positions/sizes or viewBox
- DO NOT modify g2-conference.js
- The file must remain a single self-contained HTML file
- All existing keyboard shortcuts must continue working
- localStorage state must remain compatible

OUTPUT: The complete modified index.html file.
```

---

### 🔲 Phase 3: Parallel Polish (Agents 2 + 3 — run simultaneously)
**Gate:** Requires completed Phase 2 output (restructured `index.html`).
**Method:** Extract the `<style>` block and `<script>` block from the Phase 2 output. Give one to each agent. They cannot conflict because they edit non-overlapping sections.

#### Phase 3a: Color Agent (Agent 2)

- [ ] [P] Replace `:root` custom properties with contract's revised block
- [ ] [P] Update `.room.i0` through `.room.i4` to use earth-tone intensity ramp
- [ ] [P] Create setup-mode intensity ramp (moss green, distinct from gear)
- [ ] [P] Create test-mode intensity ramp (cool slate, distinct from both)
- [ ] [P] Separate room-type badges from data palette (warm tones for badges)
- [ ] [P] Update selected/hover room states to use `--accent` (warm peach)
- [ ] [P] Update legend swatches to match new ramps
- [ ] [P] Update day-tab active state to warm accent
- [ ] [P] Update progress ring strokes to new data colors
- [ ] [P] Add warm dual-layer shadow to `.plan-card` and `.detail-panel`
- [ ] [P] Verify print styles still work with new colors

**Agent 2 Prompt (Color):**
```
You are implementing the color system redesign for a Convene floor plan tool.

You receive TWO inputs:
1. The REMEDIATION CONTRACT — contains the exact color decisions
2. The <style> block extracted from the Phase 2 restructured index.html

YOUR SCOPE: CSS custom properties and color-related style rules ONLY.
You output a REPLACEMENT <style> block.

DELIVERABLES:
1. Replace the ENTIRE :root block with the contract's revised version
2. Update intensity ramp classes (.room.i0 through .room.i4):
   - Gear mode: earth tones (--room-empty through --room-dense)
   - Setup mode: moss green ramp (visually distinct from gear)
   - Test mode: cool slate ramp (visually distinct from both)
3. Room-type badges (.dt-meeting, .dt-studio, .dt-service, .dt-gallery):
   use warm/earth tones that DON'T collide with set/test data colors
4. Selection states: .room.selected and .room:hover use --accent (warm peach)
5. Day-tab .active: use --accent, not teal
6. Progress rings: set=--status-set, test=--status-test, ready=--status-ready
7. Card shadows: dual-layer warm shadows per the research brief
8. Legend swatches: match the new ramps

CONSTRAINTS:
- Do NOT change any selectors, class names, or HTML structure
- Do NOT change layout properties (width, height, padding, margin, grid, flex)
- Do NOT change font-size, font-family, or spacing values
- Do NOT change transition durations or animation keyframes
- Do NOT change @media queries
- Only modify: color, background, background-color, border-color, fill, stroke,
  box-shadow, opacity (on color-related elements), and CSS custom property values

OUTPUT: The complete replacement <style> block, with comments marking each change.
```

#### Phase 3b: Motion Agent (Agent 3)

- [ ] [P] Implement zoom cap (min viewBox per contract decision) or attention-dimming
- [ ] [P] Coordinate selection timeline (highlight + sidebar + zoom all at t=0)
- [ ] [P] Stagger deselection sequence (content fade → sidebar collapse → zoom-out)
- [ ] [P] Remove `roomPulse` animation, replace with static treatment
- [ ] [P] Add spring easing to sidebar expansion
- [ ] [P] Add staggered content reveal (50-80ms intervals) on sidebar populate
- [ ] [P] Smooth search dim/match transitions (200ms)
- [ ] [P] Reduce zoom duration (500ms → 350ms)
- [ ] [P] Fix ring bump animation to use spring curve

**Agent 3 Prompt (Motion):**
```
You are implementing the motion and interaction redesign for a Convene floor plan tool.

You receive TWO inputs:
1. The REMEDIATION CONTRACT — contains exact timing decisions
2. The <script> block extracted from the Phase 2 restructured index.html

YOUR SCOPE: JavaScript functions and CSS @keyframes ONLY.
You output a REPLACEMENT <script> block + any new @keyframes to add to <style>.

DELIVERABLES:
1. ZOOM: Implement the contract's zoom decision (cap, dimming, or hybrid).
   If capping: add minimum viewBox constraint in zoomToRoom().
   If dimming: add dim/glow logic in selectRoom(), remove viewBox animation.

2. SELECTION TIMELINE (per contract's timing chart):
   - All visual changes start at t=0
   - Room highlight + sidebar expansion + zoom/dim begin simultaneously
   - Content populates with staggered fade (50-80ms intervals between items)
   - Total time to settled: ≤400ms

3. DESELECTION TIMELINE:
   - t=0: Sidebar content fades out (150ms)
   - t=100: Sidebar collapses (250ms)
   - t=150: Zoom-out or un-dim begins (350ms)
   - t=200: Room highlight fades (200ms)
   - Total: ≤500ms

4. KILL AMBIENT PULSE:
   - Remove roomPulse keyframes
   - Remove animation assignment on .room.i3, .room.i4
   - (Static treatment handled by Color Agent via CSS)

5. SEARCH SMOOTHING:
   - .search-dim opacity transition: add 200ms ease
   - .search-match stroke transition: add 200ms ease

6. SPRING EASING:
   - Sidebar expansion: cubic-bezier(0.34, 1.56, 0.64, 1)
   - Checkbox pop: same spring curve
   - Progress ring bump: same spring curve

CONSTRAINTS:
- DO NOT modify StateManager or localStorage logic
- DO NOT modify data layer functions (getRoomDay, flattenItems, countItems, etc.)
- DO NOT modify event data or DOM structure
- DO NOT change color values (leave them as-is for Color Agent)
- Keyboard shortcuts (1-4, Escape, Tab/Enter) must remain
- URL hash system must remain functional
- Checklist checkbox handlers must still sync state

OUTPUT: The complete replacement <script> block + list of new @keyframes.
```

---

### 🔲 Phase 4: Integration & Warmth (Sequential — Agent 4: Merge + Polish)
**Gate:** Requires both Phase 3a and 3b outputs.

- [ ] [D] Merge Color Agent's `<style>` block into Phase 2 HTML
- [ ] [D] Merge Motion Agent's `<script>` block into merged file
- [ ] [D] Insert any new `@keyframes` from Motion Agent into `<style>`
- [ ] [D] Apply warmth refinements:
  - [ ] Expand Fraunces usage to section headers (`.detail-section-label`)
  - [ ] Increase body line-height from 1.55 to 1.6
  - [ ] Add subtle background grain (CSS noise pattern at 1.5% opacity)
  - [ ] Verify warm shadows render correctly
- [ ] [D] Conflict resolution: check for selector collisions between agents
- [ ] [D] Verify mobile responsive still works (<860px)
- [ ] [D] Verify print styles still work

**Agent 4 Prompt (Merge + Warmth):**
```
You are merging three agent outputs and applying final warmth polish
to a Convene floor plan tool.

You receive:
1. The REMEDIATION CONTRACT
2. The Phase 2 output (restructured index.html — full file)
3. The Phase 3a output (Color Agent's replacement <style> block)
4. The Phase 3b output (Motion Agent's replacement <script> block + new @keyframes)
5. DESIGN-RESEARCH-BRIEF.md — the original research
6. beautiful-first-design SKILL.md — the design system

YOUR JOB:
1. MERGE: Replace the <style> block in the Phase 2 file with the Color Agent's output.
   Insert the Motion Agent's <script> block. Add any new @keyframes to <style>.

2. CONFLICT CHECK: Look for:
   - Color Agent changed a selector that Motion Agent also references
   - Timing values that assume different DOM structure
   - CSS transitions that fight JS-applied inline styles
   - Mobile breakpoint styles that conflict with new layout

3. WARMTH POLISH (only after merge is clean):
   - Expand Fraunces to .detail-section-label font-family
   - Bump body line-height from 1.55 → 1.6
   - Add CSS background noise grain to body (1.5% opacity, don't use an image file —
     use a CSS radial-gradient trick or SVG data URI)
   - Verify dual-layer warm shadows look good on both .plan-card and .detail-panel

4. REGRESSION CHECK: Mentally trace these user flows:
   - Load page → rooms colored with earth-tone ramp → sidebar empty
   - Click "Hall" → sidebar expands with checklist → room highlighted
   - Check "Mixer" set box → progress ring updates → status bar grows
   - Press "2" → switches to 2/10 → room states update → sidebar re-renders
   - Type "zoom" in search → rooms dim except matches → results in sidebar
   - Click search result → sidebar shows that room → search clears
   - Press Escape → sidebar collapses → all rooms normal
   - Navigate to #hall → room auto-selects on load
   - Switch to Pull Sheet tab → aggregated view renders
   - Toggle legend to "Setup" mode → rooms recolor with moss ramp

5. DESIGN SYSTEM CHECK: Verify against beautiful-first-design SKILL.md:
   - Fraunces for display, Source Sans for UI, Source Code Pro for data ✓
   - No emojis in UI ✓
   - No gamification language ✓
   - Spring animations, not linear ✓
   - Progress rings, not bars (keep existing rings) ✓

OUTPUT: The final, complete, merged index.html file ready for use.
List any unresolved conflicts at the top as comments.
```

---

### 🔲 Phase 5: Verification (Sequential — Agent 5)
**Gate:** Requires Phase 4 output.

- [ ] Side-by-side visual diff (before/after screenshots)
- [ ] All 10 user flows from Phase 4 tested
- [ ] localStorage state migration test (old state still loads)
- [ ] Mobile responsive test (< 860px)
- [ ] Print stylesheet test
- [ ] Accessibility: tab navigation, ARIA labels, focus states
- [ ] Performance: no jank on day switching with many rooms
- [ ] Color contrast: WCAG AA on all text

**Agent 5 Prompt (Verification):**
```
You are verifying the redesigned Convene floor plan tool.

You receive:
1. The ORIGINAL index.html (before any changes)
2. The FINAL index.html (after all agent work)
3. The REMEDIATION CONTRACT
4. The DESIGN-RESEARCH-BRIEF.md

Run these verification checks:

1. FUNCTIONAL: Open the final file. Trace ALL of these flows:
   - Page load → correct room rendering
   - Room click → sidebar expands with full checklist
   - Checkbox toggle → progress ring + status bar + room state all update
   - Day switch (all 4 days) → everything re-renders
   - Search → dim/highlight → click result → room selects
   - Escape → clean deselection with staggered animation
   - Deep link #hall → auto-select on load
   - Pull Sheet tab → aggregated gear list
   - Legend mode toggle (Gear/Setup/Test) → room colors change distinctly
   - Mobile viewport → layout adapts (no overlay, sidebar below)

2. REGRESSION: Compare before/after for these specific things:
   - localStorage key format hasn't changed
   - Keyboard shortcuts 1-4, Escape, Tab, Enter all work
   - Hash URLs still parse correctly
   - Print stylesheet still hides non-essential elements

3. DESIGN COMPLIANCE:
   - No font below 12px in HTML (SVG labels may go to 10px)
   - No spacing below 6px
   - Touch targets ≥ 44px
   - Color contrast ≥ 4.5:1 for all text on backgrounds
   - Structural colors (earth tones) are distinct from data colors
   - Single accent color for selection (not reused for data)

4. PERFORMANCE:
   - No layout thrashing on day switch
   - CSS transitions don't trigger repaint storms
   - SVG manipulation doesn't cause jank

OUTPUT: A PASS/FAIL report with specific issues found.
If FAIL: list exactly what needs fixing and which agent should fix it.
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-02-07 | Kill room overlay, expand sidebar | Google Maps/Figma pattern: never cover spatial canvas. Research unanimous. |
| 2025-02-07 | 12px font floor | DoorDash, Airbnb, Google Maps all floor at 11-12px. Current 7px is unreadable. |
| 2025-02-07 | Sequential Phase 2 before parallel Phase 3 | Original plan had 3 parallel agents all editing index.html → merge conflicts. Structure must settle before color/motion can be applied. |
| 2025-02-07 | Earth-tone intensity ramp instead of opacity ramp | Opacity ramp invisible at low end. Value-based ramp (distinct lightness steps) always readable. |
| 2025-02-07 | Spring easing for sidebar | Biophilic research: slight overshoot (1.56 > 1.0) makes things feel like they "land." Matches warm aesthetic. |
| | | |

---

## Validation Checklist

| Principle | How to Verify | Automated? |
|-----------|---------------|------------|
| No overlay covers floor plan | Search for `.room-overlay` in final CSS — should not exist | ✓ grep |
| Font floor ≥ 12px | grep for `font-size:` and check all values | ✓ grep + parse |
| Spacing floor ≥ 6px | grep for `gap:`, `padding:`, `margin:` values | ✓ grep + parse |
| Touch targets ≥ 44px | Check `.check-box` dimensions + wrapper | Manual |
| Single accent color | grep for `--accent` usage — should only appear on selection/hover | ✓ grep |
| Data colors distinct | Visual check: set (moss) vs test (slate) vs ready (terracotta) | Manual |
| Spring easing used | grep for `cubic-bezier(0.34, 1.56` | ✓ grep |
| No ambient pulse | grep for `roomPulse` — should not exist | ✓ grep |
| Staggered deselection | Read clearSelection() — should have setTimeout stagger | Manual |
| localStorage compatible | Load page with old state, verify checkboxes restore | Manual |

---

## Claims Requiring Verification

| Claim | Source | Status |
|-------|--------|--------|
| 12px is the minimum legible font size | DoorDash/Airbnb/Google Maps research | ✓ Verified (WCAG recommends 12px+) |
| Spring easing (overshoot > 1.0) feels warmer | Biophilic UI research | 🔍 Unverified — test subjectively |
| Earth-tone ramp is more readable than opacity ramp | Design brief hypothesis | 🔍 Unverified — test visually |
| Sidebar expansion won't cause layout jank | Architecture decision | 🔍 Unverified — test with CSS transition on grid |
| Bottom sheet works on mobile without a library | Google Maps pattern | 🔍 Unverified — may need touch event handling |

---

## Execution Flow Diagram

```
PHASE 1 ─────────────────────────────────────────────────────
│ Agent 0 (Opus): Architect
│ Input:  index.html + g2-conference.js + DESIGN-RESEARCH-BRIEF.md
│ Output: REMEDIATION-CONTRACT.md
│ Gate:   Human approves contract
│
PHASE 2 ─────────────────────────────────────────────────────
│ Agent 1 (Sonnet): Structure
│ Input:  Contract + index.html
│ Output: Restructured index.html (new DOM, sizing, spacing)
│ Gate:   Sidebar expands/collapses, overlay removed, sizing correct
│
PHASE 3 ────────────── PARALLEL ──────────────────────────────
│                │                        │
│  Agent 2 (Sonnet): Color      Agent 3 (Sonnet): Motion
│  Input: Contract +            Input: Contract +
│         <style> from Ph2             <script> from Ph2
│  Output: New <style>          Output: New <script> + @keyframes
│                │                        │
PHASE 4 ─────────────────────────────────────────────────────
│ Agent 4 (Sonnet): Merge + Warmth
│ Input:  Contract + Ph2 HTML + Ph3a <style> + Ph3b <script>
│ Output: Final merged index.html with warmth polish
│
PHASE 5 ─────────────────────────────────────────────────────
│ Agent 5 (Opus): Verification
│ Input:  Original index.html + Final index.html + Contract
│ Output: PASS/FAIL report
│ Gate:   All flows pass → ship. Any FAIL → route back to responsible agent.
```

---

## Agent Model Assignments

| Agent | Role | Model | Reasoning |
|-------|------|-------|-----------|
| Agent 0 | Architect | **Opus** | Strategy, cross-cutting decisions, no code |
| Agent 1 | Structure | **Sonnet** | Heavy implementation, DOM + CSS + JS restructuring |
| Agent 2 | Color | **Sonnet** | CSS-only changes, systematic but straightforward |
| Agent 3 | Motion | **Sonnet** | JS animation logic, timing coordination |
| Agent 4 | Merge + Warmth | **Sonnet** | Integration work, polish, conflict resolution |
| Agent 5 | Verification | **Opus** | Judgment-heavy, regression testing, design compliance |

---

## Session Protocols

### Session Start
1. Check `FLOORPLAN-REDESIGN-state.json` for current phase and next action
2. Read this plan's Phase section — find the first unchecked `[ ]` item
3. If starting a new agent: provide it with all listed inputs
4. If resuming mid-phase: read the agent's last output and continue

### Session End
1. Check off completed items in this plan
2. Log any decisions that deviated from the contract in Decision Log
3. Update `FLOORPLAN-REDESIGN-state.json`
4. Note: which agent runs next? What inputs does it need?

### If an Agent Fails
1. Identify the specific failure (merge conflict, broken flow, design violation)
2. Route back to the responsible agent with the failure description
3. Do NOT ask a different agent to fix another agent's scope
4. Update Decision Log with the failure and resolution

---

## Running This in Claude Code / Cowork

**In Claude Code (recommended):**
```bash
# Phase 1: Architect
claude --model opus "Read these files and produce REMEDIATION-CONTRACT.md: [paste Agent 0 prompt]"

# Phase 2: Structure (after human review of contract)
claude "Read REMEDIATION-CONTRACT.md and index.html. [paste Agent 1 prompt]"

# Phase 3: Extract sections, run in parallel
# (manually extract <style> and <script> from Phase 2 output)
claude "Here is the <style> block. [paste Agent 2 prompt]" &
claude "Here is the <script> block. [paste Agent 3 prompt]" &
wait

# Phase 4: Merge
claude "Merge these outputs. [paste Agent 4 prompt]"

# Phase 5: Verify
claude --model opus "Verify this file. [paste Agent 5 prompt]"
```

**In Cowork:**
Run each phase as a separate conversation. Copy outputs between sessions. The state file tracks where you are. Each agent prompt is self-contained — paste it with the required inputs.

**In a single long session:**
Use the Task tool to spawn subagents. Phase 1 first, then Phase 2, then Phases 3a+3b in parallel via two simultaneous Task calls, then Phase 4, then Phase 5.

---

## Notes

- The data file (`g2-conference.js`) is NEVER modified by any agent. It's read-only context.
- The `StateManager` localStorage format must remain backward-compatible. Old checklist state must load correctly in the redesigned app.
- If the mobile bottom-sheet proves too complex for vanilla JS, an acceptable fallback is: on mobile, the sidebar goes full-width below the floor plan (current behavior) but with the new expanded checklist content instead of the overlay.
- The "background grain" warmth touch should be tested — if it causes visual noise on the SVG floor plan, restrict it to the body background only, not cards.
