# Floor Plan Tool — Design Research Brief

What "seamless and intuitive" actually means, sourced from Google Maps, DoorDash, Airbnb, Figma, and venue tools — filtered through warm/biophilic sensibility.

---

## The Core Problem (in one sentence)

The floor plan tool is architected like a dashboard (rigid grid, overlay panels, uniform spacing, tiny type) when it should be architected like a **map app** (spatial canvas + sliding detail, progressive disclosure, generous sizing, coordinated animations).

---

## 1. ARCHITECTURE: Steal the Google Maps Panel Model

### What they do

Google Maps **never** covers the map with a detail panel. On desktop, the sidebar *pushes* the map right — the map viewport shifts. On mobile, a bottom sheet *overlays* the map but is **non-modal** — you can still pan and zoom behind it.

The panel has three snap points: **peek** (48-56px, just a handle + title), **intermediate** (50% height), and **expanded** (85-90%). Velocity-based dragging between states.

### What this means for the floor plan

**Kill the room overlay.** The current `room-overlay` (glassmorphism, `position: absolute; inset: 1.5rem`) covers the entire floor plan SVG. This is the single biggest source of "wonky" — you click a room to see its gear, and the app hides the room from you.

Instead:

- **Desktop**: The sidebar (currently 380px fixed) should expand smoothly from a summary state to a full checklist state. The floor plan stays visible and interactive. The sidebar is the *only* detail surface.
- **Mobile (<860px)**: Convert the sidebar to a bottom sheet with peek/intermediate/expanded states. The floor plan stays on top, the sheet slides up from below.

The Figma pattern confirms this: their properties panel **never hides or appears** — it's always there, just populated or empty. Selecting something populates it; deselecting empties it. No jarring show/hide.

### Specific changes

```
BEFORE: Click room → zoom to room → 350ms wait → overlay covers SVG → sidebar shows summary
AFTER:  Click room → gentle zoom → sidebar expands to full checklist (simultaneously)
```

The sidebar needs two states:
1. **Collapsed** (~280px): Room name, type badge, progress bars, notes. What the "compact" view currently shows.
2. **Expanded** (~420px): Full categorized checklist with Set/Test checkboxes. What the overlay currently shows.

Transition between them with `transform: translateX()` and content fade (not layout shift). The floor plan grid column adjusts with a smooth CSS transition on `grid-template-columns`.

---

## 2. SIZING: Everything Is Too Small

### The research consensus

Every app studied uses these font size floors:

| Element | Google Maps | DoorDash | Airbnb | Your tool (current) |
|---------|------------|----------|--------|-------------------|
| Primary label | 16-18px | 16-20px | 16-18px | 18.4px (1.15rem) ✓ |
| Secondary info | 14px | 14-16px | 14px | 11.5px (0.72rem) ✗ |
| Meta/caption | 12px | 12-13px | 12px | 7px (0.44rem) ✗ |
| Smallest allowed | 11px | 12px | 12px | 7px ✗ |

**Your font sizes are 40-60% smaller than industry standard.** The check-labels at 0.44rem (7px), tags at 0.54rem (8.6px), legend labels at 0.62rem (9.9px) — all below legibility thresholds.

### The fix (minimum type scale)

```css
--type-xs:    0.75rem;   /* 12px — absolute floor, metadata only */
--type-sm:    0.8125rem; /* 13px — captions, labels */
--type-base:  0.875rem;  /* 14px — body text, item names */
--type-md:    1rem;      /* 16px — section labels, counts */
--type-lg:    1.125rem;  /* 18px — room names, headers */
--type-xl:    1.25rem;   /* 20px — page title */
```

Nothing below 12px. The SVG labels inside the floor plan can go to 10px since they're rendered at SVG scale, but all HTML UI must respect this floor.

### Spacing scale

The current spacing is cramped. DoorDash and Airbnb both use an 8px base grid with generous multiples. But for warmth, the golden ratio spacing from the biophilic research feels better:

```css
--space-2xs:  6px;    /* micro: icon-to-text gaps */
--space-xs:   10px;   /* tight: within compact groups */
--space-sm:   16px;   /* base: standard padding */
--space-md:   24px;   /* comfortable: between sections */
--space-lg:   40px;   /* breathing: major separations */
--space-xl:   64px;   /* page-level spacing */
```

Key changes:
- Checklist row padding: `0.25rem 0.65rem` (4px 10.4px) → `10px 16px`
- Check-box size: `16px` → `20px` (touch target too small)
- Gap between checklist columns: `0.15rem` (2.4px) → `8px`
- Card padding: `1.25rem` (20px) → `24px`
- Section label margin: `0.75rem 0 0.3rem` → `24px 0 10px`

### Touch targets

Material Design minimum: 48×48dp. Apple minimum: 44×44px. Your checkboxes are 16×16px with the label below — the combined target area is maybe 16×24px. That's less than half the minimum.

Fix: Either increase checkbox to 20×20px with a 44×44px hit area, or wrap the entire checklist row as the tap target (the row *is* the checkbox).

---

## 3. INTERACTION TIMING: Coordinate, Don't Cascade

### The Google Maps "seamless" secret

When you click a pin, Google Maps runs **three animations in parallel** with overlapping durations:

```
t=0ms:    Pin grows (150ms) + sheet starts rising (250ms)
t=150ms:  Map begins pan if needed (300ms)
t=200ms:  Sheet reaches intermediate position
t=300ms:  Map finishes pan
t=350ms:  Everything settles — total perceived time: 350ms
```

The key is **overlapping, not sequential**. Your current flow is sequential:

```
t=0ms:    Room gets .selecting class (500ms animation)
t=0ms:    Zoom starts (500ms cubic)
t=350ms:  setTimeout fires → overlay starts appearing (350ms transition)
t=700ms:  Overlay fully visible
           Total perceived time: 700ms, with a 350ms dead zone
```

### The fix

```
t=0ms:    Room highlights (200ms) + sidebar starts expanding (300ms) + gentle zoom begins (400ms)
t=200ms:  Room highlight settles + sidebar content starts fading in (staggered, 50ms intervals)
t=300ms:  Sidebar fully expanded, first items visible
t=400ms:  Zoom settles, all content visible
           Total perceived time: 400ms, no dead zones
```

### Deselection

Current: Everything fires at once (overlay hide + zoom out + sidebar clear + hash update).

Fix: Stagger it.
```
t=0ms:    Sidebar content fades out (150ms)
t=100ms:  Sidebar collapses to default width (250ms)
t=150ms:  Zoom-out begins (350ms)
t=200ms:  Room deselect highlight (200ms)
t=500ms:  Everything settled
```

### Animation curves

Replace the current `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) with something slightly springier for the warm feel:

```css
--ease-out-smooth: cubic-bezier(0.22, 0.61, 0.36, 1);   /* Current, keep for zoom */
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);    /* Slight overshoot — for sidebar, checkboxes */
--ease-settle:     cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Smooth deceleration — for zoom-out */
```

The `--ease-spring` with its slight overshoot (1.56 > 1.0) makes things feel like they "land" rather than "stop." It's the difference between a ball bouncing once vs. a slider snapping to a stop.

---

## 4. THE ZOOM: Cap It, Soften It

### The problem

Small rooms (Miller at 70×42) zoom to a viewBox of ~`-50 -18 190 162`. That's a 4.5× zoom on the SVG. Combined with the 500ms animation, the floor plan feels like it's lunging at you.

### What Google Maps does

Google Maps rarely auto-zooms on pin click. It pans to center the selected pin at the **current zoom level**. Only if the pin is off-screen does it adjust.

### The fix

1. **Cap minimum viewBox dimensions** at something like `400×350` — never zoom past 2× on any room
2. **Don't zoom at all for rooms already visible** — just highlight and pan to center
3. **Reduce zoom duration** to 350ms (from 500ms) with `--ease-settle`
4. **Add a subtle vignette** or dimming to non-selected rooms instead of zooming — this draws attention without disorienting movement

A gentler alternative: instead of viewBox zoom, dim all rooms except the selected one to 30% opacity and add a glow to the selected room. The eye zooms naturally. The SVG doesn't move.

---

## 5. COLOR: Warm the Semantics

### The Airbnb insight

Airbnb uses a single accent color (Rausch pink `#FF5A5F`) for almost nothing — just CTAs. Everything else is grayscale + photography. The warmth comes from the images, spacing, and typography, not from coloring every UI element.

### The floor plan palette problem

The teal `#2a9d8f` is being used as both "brand accent" and "data encoding" and "status indicator." It needs to split into:

**Structural colors** (warm, from beautiful-first-design):
- Room fills: earth tones from `--earth-sand` (#d4c8b8) to `--earth-clay` (#b8a090)
- Room strokes: warm grays
- Backgrounds: `--warm-50` (#fdf8f6)
- Cards: white with warm shadow

**Data colors** (clear, distinct, reserved for meaning):
- Set/Setup progress: `--earth-moss` (#4a6b5c) — a grounded green
- Test progress: `--cool-400` (#8a919e) — a cool slate that's clearly different
- Ready/complete: `--warm-500` (#c4704b) — the terracotta accent, used only for "done"
- Alert/flag: keep `--status-flag` (#d45f47) but make it the *only* red-adjacent color

**Interactive accent** (single color, used sparingly):
- Selected room highlight: `--warm-300` (#d4846a) — warm, distinct from both data colors
- Hover: the same color at 20% opacity
- Active tab: this same warm accent

This way:
- Green means "set up"
- Slate means "tested"
- Terracotta means "ready/complete"
- Warm peach means "selected/active"

Four colors, four meanings. No collisions.

### Intensity ramp

The current ramp uses opacity steps (10%, 20%, 32%, 44%) of a single hue. At low end, they're invisible.

Better approach — a **value ramp** using distinct lightness steps:

```css
/* Gear load intensity — earth tones, not teal */
--room-empty:   #f0ece8;  /* barely there — clearly empty */
--room-light:   #e2d5c8;  /* warm sand — visible step up */
--room-moderate: #d4c0a8; /* clay — clearly populated */
--room-heavy:   #c4a888;  /* rich clay — demanding attention */
--room-dense:   #b49068;  /* deep earth — unmissable */
```

Each step is clearly distinguishable. The progression reads as "filling up" like sediment layers.

---

## 6. WARMTH WITHOUT GIMMICKS

### What actually creates warmth

From the biophilic research, the things that make a data tool feel "like a well-designed coworking space":

1. **Generous line-height** (1.6–1.7 for body text). Your current `line-height: 1.55` is adequate but bumping to 1.6 adds breathing room.

2. **Fraunces doing more work.** Currently Fraunces is only on room names and the page title. Let it carry section headers too — the serif warmth is the single fastest way to de-clinicalize a dashboard.

3. **Warm shadows** instead of gray ones. Change `--shadow: hsla(25, 40%, 30%, 0.08)` to `hsla(25, 40%, 30%, 0.06)` and add a second, wider shadow for depth:
   ```css
   box-shadow:
     0 1px 3px hsla(25, 40%, 30%, 0.06),
     0 8px 24px hsla(25, 30%, 40%, 0.04);
   ```

4. **Subtle background texture.** A barely-perceptible noise grain at 1-1.5% opacity on the page `--ground` background. Makes it feel like paper rather than a screen.

5. **Kill the ambient pulse animation.** Replace with a static warm glow (`box-shadow`) on high-intensity rooms. Constant motion reads as "dashboard alerting" not "warm space."

6. **Staggered content reveals.** When the sidebar populates, items should appear with 50-80ms stagger delays and a slight upward slide — like leaves unfolding, not a data table loading.

### What to avoid

- **Asymmetric border-radius everywhere** (the biophilic research suggests this). Don't. It'll look like a Dribbble concept, not a production tool. Keep `border-radius: 12px` for cards, `8px` for inner elements, `20px` for pills. Consistency IS warmth for a tool people use daily.
- **Texture on interactive elements.** Grain on the page background is fine. Grain on cards, buttons, or the SVG plan would reduce clarity.
- **Warm colors on everything.** The Airbnb lesson: warmth comes from space, type, and restraint, not from painting every surface terracotta.

---

## 7. SPECIFIC COMPONENT REDESIGN NOTES

### Day Switcher
Currently: 0.72rem (11.5px) font, 0.3rem (4.8px) gap, 20px pill radius.
Fix: 0.8125rem (13px) font, 6px gap, same pill shape. Active pill should use `--warm-500` (terracotta) not teal — this is a navigation control, not a data indicator.

### Progress Rings
Currently: 36px diameter, 0.58rem (9.3px) labels.
These are actually fine conceptually (the beautiful-first-design system validates progress rings). But bump to 40-44px diameter and 12px labels. The ring stroke-width (3) can go to 3.5.

### Checklist Rows
Currently: 4-column grid (30px, 30px, 1fr, auto), 0.15rem gap, 0.78rem item names.
Fix: Keep the grid but increase checkbox column to 36px, gap to 8px, item names to 14px. The set/test labels below checkboxes (currently 0.44rem / 7px) should be 11px minimum.

### Legend
Currently: tiny swatches (18×12px), 0.62rem labels.
Fix: 24×14px swatches, 12px labels. The mode toggle buttons (Gear/Setup/Test) should be 13px not 0.58rem (9.3px).

### SVG Room Labels
These render at SVG scale so they're less affected by the HTML type floor. But the `.label-room.xs` at 8.5px and `.label-count` at 9px should come up to 10px minimum. The `.label-sub` at 8px should be 9px.

---

## Summary: Five Moves That Fix "Wonky"

1. **Replace the room overlay with sidebar expansion.** Never cover the spatial canvas. The sidebar is the single detail surface.

2. **Raise the type floor to 12px** and the spacing floor to 8px. Everything grows proportionally. The tool currently reads at ~60% the size it should.

3. **Coordinate animations in parallel, not sequence.** Room highlight + sidebar expand + gentle zoom all start at t=0. No dead zones. 400ms total, not 700ms.

4. **Split the color into structural (warm) and data (clear).** Earth tones for the plan, distinct hues for set/test/ready, single warm accent for selection.

5. **Cap the zoom at 2× and soften the curve.** Or skip the viewBox zoom entirely — dim unselected rooms and glow the selected one instead.

These five changes transform the architecture from "dashboard with a map" to "map with a detail panel" — which is what a floor plan tool actually is.
