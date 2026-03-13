# Convene Floor Plan Tool

Interactive floor plan viewer for Convene's Willis Tower AV operations. Single-file HTML application with embedded SVG floor plans and vanilla JS interaction. Audience: Convene AV team members who need to see room layouts, equipment assignments, and setup checklists before events.

**Status:** Complete. Deployed internally. $200k phased equipment proposal delivered alongside.

## Architecture

- **Single-file HTML** (`index.html`) — all CSS, JS, and SVG inline
- **Data:** `data/` folder with room configurations, equipment inventory
- **No build step** — edit and deploy directly
- **Design:** Map-app pattern (spatial canvas + sliding detail panel), not dashboard pattern. See `DESIGN-RESEARCH-BRIEF.md` for the full rationale.

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | The application — floor plans, room detail panels, equipment checklists |
| `DESIGN-RESEARCH-BRIEF.md` | Design rationale sourced from Google Maps, Figma, Airbnb patterns |
| `FLOORPLAN-REDESIGN-PLAN.md` | Implementation plan for the redesign |
| `FLOORPLAN-REDESIGN-state.json` | Session state |
| `LIVE-DATA-GUIDE.md` | How to connect to live Convene data sources |
| `scripts/` | Utility scripts for data extraction and validation |

## Constraints

- Convene brand uses **Plex Sans** (IBM) — this is a known exception to the ecosystem Plex ban
- **Teal palette** (`--teal-standard`) per domain detection
- All standard constraints apply: 12px floor, 44px targets, no sharp corners, warm shadows
