# Convene Floor Plan — Multi-Agent Improvement Prompt

## Diagnosis: What Feels Wonky

After a full read of `index.html` (2340 lines) and `data/g2-conference.js`, here's what's off — grouped by the three things you named.

### Colors

**The teal is doing too much semantic work.** `#2a9d8f` is simultaneously: room fill intensity, "Set" checkboxes, active tab backgrounds, progress ring, search count text, hover borders, and room strokes on partial progress. When one color encodes 7 different meanings, nothing reads clearly.

**The intensity ramp is invisible at the low end.** `i0` through `i2` use fills at 0%, 10%, 20% opacity on a cream background. On most monitors, `i1` and `i2` are indistinguishable. The rooms look "empty" even when they have gear.

**Gear/Setup/Test mode colors are too similar.** Teal (`#2a9d8f`) vs green (`#2eba8e`) vs blue (`#4a8fd4`) — the teal and green are nearly the same hue. When toggling legend modes, the visual change is so subtle you can't tell anything happened.

**Room-type badges collide with the data palette.** `dt-meeting` is sage, `dt-studio` is slate — the same colors used for Set/Test status. The badge on a studio room looks like a "Test" indicator.

### Look/Feel

**The room overlay covers the floor plan.** When you select a room, a glassmorphism overlay (`position: absolute; inset: 1.5rem`) appears over the SVG — hiding the very map you want to reference. The sidebar shows a stripped-down "compact" view of the same data. So you get the full checklist in the wrong place and the summary in the right place.

**Font sizes are unreadable.** The floor plan uses: `.44rem` (check labels), `.54rem` (tags), `.58rem` (ring labels), `.62rem` (legend). That's 7px, 8.5px, 9px, 10px. Below legibility thresholds, especially on non-retina displays.

**The SVG rooms are bare rectangles with no affordance.** There's nothing — no icon, no shadow, no rounded treatment, no hover preview — that signals "this is interactive." Just faintly colored rectangles with cursor: pointer.

**Status bars are invisible.** The 5px tall set/test bars at the bottom of each room are unreadable at full zoom-out. They're a great concept with zero visual presence.

### Interactivity

**The zoom-to-room is disorienting.** Small rooms (Miller at 70×42) zoom to an extreme level where the room fills the entire viewport. Combined with the 500ms cubic animation, it feels nauseating. There's no max-zoom constraint or mini-map to maintain spatial context.

**The 350ms delay before overlay creates a dead zone.** You click → zoom starts (500ms) → overlay appears (350ms after click). For ~350ms you're staring at a zooming, empty plan. Then the overlay slides in and covers what just zoomed.

**Escape/deselect fires everything at once.** Close overlay + deselect room + zoom out + update sidebar + update hash. Five cascading state changes with no visual stagger = jarring.

**The `roomPulse` animation creates restlessness.** Rooms with intensity 3-4 have `animation: roomPulse 4s infinite` — a constant subtle glow. On a floor plan with 4-5 active rooms, that's 4-5 things subtly breathing, competing for attention.

---

## Multi-Agent Prompt

### Agent 0: Architect (Opus) — runs first, produces the contract

```
You are the design architect for a Convene floor plan tool (single-file HTML, ~2300 lines).

Read the entire `index.html` and `data/g2-conference.js`. Then read the beautiful-first-design SKILL.md for design system context.

Your job is to produce a REMEDIATION CONTRACT — a structured document that three implementing agents will follow. Do not write code. Write decisions.

The tool has these diagnosed issues:

COLOR SYSTEM:
- Teal #2a9d8f is overloaded (7 semantic uses)
- Intensity ramp i0-i2 is invisible (too-low opacity on cream)
- Gear/Setup/Test modes are near-indistinguishable (teal vs green)
- Room-type badges collide with Set/Test status colors

SPATIAL/VISUAL:
- Room overlay covers the floor plan on selection
- Font sizes go as low as 0.44rem (7px), below legibility
- SVG rooms have no interactive affordance
- Status bars (5px) are invisible at default zoom

INTERACTIVITY:
- Zoom-to-room has no max-zoom cap, gets extreme on small rooms
- 350ms dead zone between click and overlay
- Escape fires 5 state changes simultaneously
- roomPulse on i3/i4 creates competing ambient motion

For each issue, produce:
1. THE DECISION — what specifically changes (e.g., "Replace room overlay with sidebar expansion" or "Cap viewBox zoom at 300×260 minimum")
2. THE CONSTRAINT — what must not break (e.g., "Checklist checkboxes must remain functional and sync with localStorage state")
3. THE AGENT ASSIGNMENT — which implementing agent handles it (Color, Layout, or Interaction)

Also produce:
- A revised CSS custom properties block (the full `:root` replacement)
- A DOM structure sketch for the new sidebar behavior (if overlay is being removed/relocated)
- A zoom constraint formula

Format as a markdown document with clear sections per agent.
```

### Agent 1: Color Agent (Sonnet) — parallel with Agent 2 and 3

```
You are implementing color system fixes for a Convene floor plan tool.

Read the REMEDIATION CONTRACT from Agent 0 (provided as context).
Read the beautiful-first-design SKILL.md for the design system palette.

Your scope is CSS custom properties and any color-related class modifications in <style>. You do NOT touch JS logic, DOM structure, or layout.

Specific deliverables:
1. Replace the `:root` custom properties block with the revised one from the contract
2. Update the intensity ramp classes (.room.i0 through .room.i4) for each mode (gear/setup/test) to use distinguishable, higher-contrast fills
3. Separate the room-type badge palette from the status palette — room types should use warm/earth tones from the design system, not the data-viz colors
4. Update legend swatch classes (.sw-0 through .sw-4) to match the new ramp
5. Ensure the selected/hover room states use a distinct treatment (not just "more teal")

Constraints:
- The class names (.room.i0, .dt-meeting, etc.) must not change — only their visual properties
- CSS transitions must remain on .room elements
- Print styles must still work
- All colors must have sufficient contrast on --ground (#f8f6f3) background

Output: The complete revised <style> block, clearly annotated with what changed and why.
```

### Agent 2: Layout Agent (Sonnet) — parallel with Agent 1 and 3

```
You are implementing layout and spatial fixes for a Convene floor plan tool.

Read the REMEDIATION CONTRACT from Agent 0 (provided as context).

Your scope is CSS layout rules and HTML structure changes. You do NOT rewrite JS functions, but you may change element IDs/classes if the contract specifies it.

Specific deliverables:
1. ROOM OVERLAY → SIDEBAR EXPANSION: Remove or repurpose the room overlay. Instead, the detail panel sidebar should expand to show the full checklist when a room is selected. The floor plan should remain visible and interactive. (Follow the contract's DOM sketch.)
2. FONT SIZE FLOOR: No element in the app should render below 0.625rem (10px). Audit every font-size declaration. The check-labels (.check-label at 0.44rem) need to be legible.
3. SVG ROOM AFFORDANCE: Add a subtle inner shadow, rounded-corner treatment, or icon to rooms that have gear (i1+). Empty rooms (i0) should look visually distinct from active rooms — not just "lighter teal."
4. STATUS BAR VISIBILITY: Increase status bars from 5px to 8px height, or replace with a small badge/pip approach that reads at default zoom.
5. DETAIL PANEL SCROLL: When sidebar shows full checklist, ensure it scrolls independently with a visible scrollbar or fade indicator.

Constraints:
- The grid layout (1fr 380px) may be adjusted but must remain two-column on desktop
- Mobile responsive (@media 860px) must still work
- The SVG viewBox (0 0 860 750) must not change
- Room rectangles' positions/sizes must not change (they map to real floor plans)

Output: Modified HTML structure + CSS rules, annotated.
```

### Agent 3: Interaction Agent (Sonnet) — parallel with Agent 1 and 2

```
You are implementing interactivity fixes for a Convene floor plan tool.

Read the REMEDIATION CONTRACT from Agent 0 (provided as context).

Your scope is the <script> block — JS functions and animation logic. You may add CSS keyframe animations but should not restructure HTML.

Specific deliverables:
1. ZOOM CAP: In zoomToRoom(), add a minimum viewBox size constraint (e.g., min width 300, min height 260). Small rooms should zoom in proportionally but never to extreme close-up. Add an ease-out that decelerates smoothly.
2. REMOVE OVERLAY DELAY: If the contract removes the room overlay, strip the setTimeout(..., 350) in selectRoom(). If overlay is kept, make it appear immediately with a fade-in instead of waiting.
3. STAGGER DESELECTION: In clearSelection(), sequence the state changes:
   - Frame 1: Fade overlay out (200ms)
   - Frame 2: Start zoom-out (300ms)
   - Frame 3: Update sidebar to empty state
   Instead of firing everything simultaneously.
4. KILL AMBIENT PULSE: Remove the roomPulse animation on .room.i3 and .room.i4. Replace with a static visual treatment (e.g., slightly thicker stroke, subtle shadow) that communicates "heavy load" without constant motion.
5. SMOOTH SEARCH TRANSITIONS: The search dim/match states (.search-dim, .search-match) should transition smoothly. Currently opacity snaps to 0.2. Add a 200ms transition.

Constraints:
- StateManager and localStorage persistence must not change
- All data layer functions (getRoomDay, flattenItems, countItems, etc.) must not change
- Keyboard shortcuts (1-4 for days, Escape, Tab/Enter for rooms) must remain
- The URL hash system must remain functional
- checklist check-box click handlers must still fire toggle + update all dependent views

Output: Modified JS functions only, annotated with what changed and why.
```

### Agent 4: Verifier (Opus) — runs last

```
You are verifying the combined output of three implementing agents against the original REMEDIATION CONTRACT.

You receive:
- The original index.html (before)
- The three agent outputs (Color, Layout, Interaction)
- The remediation contract

Your job:
1. MERGE CHECK: Identify any conflicts between the three outputs (e.g., Agent 2 changed a class name that Agent 1's CSS targets)
2. REGRESSION CHECK: Verify that all constraints from each agent's brief are satisfied
3. FUNCTIONAL CHECK: Trace through these user flows and confirm they still work:
   - Load page → rooms render with correct intensity for default day
   - Click room → zoom + detail appears → check a box → progress ring updates
   - Switch day → room states update → pull sheet updates
   - Type in search → rooms dim/highlight → click result → room selects
   - Press Escape → clean deselection
   - Deep link via #hall → room auto-selects on load
4. DESIGN SYSTEM CHECK: Confirm colors align with beautiful-first-design SKILL.md palettes
5. Produce a MERGE DOCUMENT with the final combined code, plus a list of any issues found

Output: The final merged index.html, or a list of conflicts that need human resolution.
```

---

## Execution Order

```
Agent 0 (Architect/Opus)
    ↓ produces contract
    ↓
┌───────────┬───────────┬──────────────┐
│ Agent 1   │ Agent 2   │ Agent 3      │
│ Color     │ Layout    │ Interaction  │
│ (Sonnet)  │ (Sonnet)  │ (Sonnet)     │
└─────┬─────┴─────┬─────┴──────┬───────┘
      └───────────┼────────────┘
                  ↓
           Agent 4 (Verifier/Opus)
                  ↓
            Final merged file
```

## Running This in Cowork / Claude Code

In Claude Code, you can approximate this by running Agent 0 first, then spawning Agents 1–3 as parallel Task agents with the contract as context, then running Agent 4 to merge. In Cowork, you'd run each prompt sequentially, pasting the contract output into each subsequent agent's context window.

The key constraint: **Agents 1–3 must not see each other's output.** They work from the contract only. This prevents cascading assumptions and keeps changes orthogonal. Agent 4 is the only one that sees all three outputs together.
