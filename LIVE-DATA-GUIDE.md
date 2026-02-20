# Live Data Pipeline — How It Works

The floor plan can run in two modes: **offline** (bundled data file) or **live** (Google Sheet as the source of truth). This doc explains the live mode — how the team edits data, how it reaches the browser, and what happens when things go wrong.

## Architecture

```
Google Sheet (team edits)
    |
    v
Apps Script doGet()  ──>  JSON API endpoint
    |
    v
Browser fetches on load + polls every 30s
    |
    v
GitHub Pages hosts the static HTML
    |
    v
Bundled data/g2-conference.js as offline fallback
```

## The Google Sheet

Four tabs, one per data type:

| Tab | What it holds | Who edits it |
|-----|--------------|--------------|
| **Event** | Event name, venue, address, day list, day labels, default day | Garen (setup) |
| **Rooms** | Room ID, display name, type, crew assignment, tags | Garen / AV lead |
| **Items** | Every piece of gear: room, day, category, name, qty, location, source, notes, flags | AV crew |
| **Schedule** | Per room per day: notes, whether it uses default items, whether it's active | Garen / AV lead |

### Seeding the sheet

The `scripts/seed-sheet.py` script reads the existing `data/g2-conference.js` and generates 4 TSV files. Import each into the corresponding Google Sheets tab via File > Import > paste TSV.

```bash
python3 scripts/seed-sheet.py
# Produces: scripts/event.tsv, rooms.tsv, items.tsv, schedule.tsv
```

### How items work

- Items with `day = *` are **default items** for that room (apply to every active day).
- Items with a specific day (e.g. `2/12`) **override** the defaults for that day only.
- If a schedule entry has `active = N`, the room shows "no gear" for that day regardless of items.

### Tags format

The `tags` column uses pipe-separated `type:value` pairs:

```
crew:V1: Emmett|crew:A1: Danny|zoom:Zoom|vendor:Hartford
```

This becomes: `[["crew","V1: Emmett"],["crew","A1: Danny"],["zoom","Zoom"],["vendor","Hartford"]]`

## The Apps Script API

`scripts/Code.gs` is a Google Apps Script web app deployed from the Google Sheet.

### Setup

1. Open the Google Sheet
2. Extensions > Apps Script
3. Replace `Code.gs` contents with `scripts/Code.gs`
4. Deploy > New deployment > Web app
5. Execute as: **Me** (your Google account)
6. Access: **Anyone with the link** (no login required to read)
7. Copy the deployment URL

### What it returns

A JSON object matching the exact shape the floor plan expects:

```json
{
  "event": { "name": "...", "venue": "...", "days": [...], "dayLabels": {...}, "defaultDay": "..." },
  "rooms": {
    "hall": { "name": "Hall (Combined)", "type": "meeting", "crew": "...", "tags": [...], "defaultItems": {...}, "schedule": {...} },
    ...
  },
  "_meta": { "generatedAt": "2026-02-20T..." }
}
```

### Updating after sheet changes

If you change the **structure** of the Apps Script (not the sheet data), you need to create a **new deployment version** for the changes to take effect. Data changes in the sheet are picked up automatically — no redeployment needed.

## Connecting the Floor Plan

In `index.html`, set the `LIVE_API_URL` constant to your Apps Script deployment URL:

```js
const LIVE_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Leave it empty (`''`) to stay in offline mode with bundled data.

## What the browser does

### On page load

1. Renders immediately using bundled `data/g2-conference.js` (instant, no network wait)
2. If `LIVE_API_URL` is set, fetches from the API
3. On success: overwrites `EVENT_DATA`, re-renders all views, shows green "Live" indicator
4. On failure: tries localStorage cache (amber "Cached"), or keeps bundled data (red "Offline")

### Polling

- **Tab visible:** fetches every 30 seconds
- **Tab hidden:** fetches every 2 minutes (saves quota + battery)
- **Tab re-focused:** fetches immediately

### Change detection

The browser hashes each API response with `JSON.stringify()`. If the hash matches the previous fetch, nothing re-renders. This means:

- Editing a cell the floor plan doesn't currently display? No flicker.
- Scroll position and selected room are preserved across updates.
- Only actual data changes trigger a re-render + toast notification.

## The live indicator

In the toolbar, after the search box:

| Dot color | Label | Meaning |
|-----------|-------|---------|
| Green | Live | Last fetch succeeded. Data is current. |
| Amber | Cached | API unreachable. Using last-known-good data from localStorage. |
| Red | Offline | No API configured, or no cache available. Using bundled data file. |

## Failure modes

| Scenario | What happens | User sees |
|----------|-------------|-----------|
| API down | Falls back to localStorage cache | Amber dot, data from last successful fetch |
| API down + no cache | Keeps bundled JS data | Red dot, original data |
| API slow (>10s) | Request aborted, tries cache | Amber or red dot |
| Sheet has bad data | Apps Script returns `{ error: "..." }` | Treated as fetch failure, falls back |
| CORS issue | Shouldn't happen (Apps Script sets CORS headers) | Fetch error, falls back |

## GitHub Pages deployment

The `.github/workflows/deploy.yml` workflow deploys the entire repo root to GitHub Pages on every push to `main`.

**URL:** `https://salttymalty.github.io/convene-floorplan/`

To update the live site: push to main. The workflow runs in ~20 seconds.

## Typical workflow

1. **Before the event:** Garen seeds the Google Sheet from JS data, deploys Apps Script, sets `LIVE_API_URL`
2. **During setup:** AV crew opens the GitHub Pages URL on tablets/phones. Edits to the Google Sheet (gear changes, crew reassignments, schedule notes) appear on all devices within 30 seconds.
3. **During the event:** The floor plan stays open on tech tables. Checklist progress is per-device (localStorage), but the underlying data (what gear goes where) stays in sync via the sheet.
4. **After the event:** The Google Sheet becomes the record of what was actually deployed. The bundled JS file can be updated from the sheet for archival.

## Editing the sheet vs. editing the JS file

| | Google Sheet | `data/g2-conference.js` |
|---|---|---|
| Who can edit | Anyone with sheet access | Anyone who can push to git |
| Propagation | ~30 seconds to all browsers | Requires git push + page reload |
| Best for | Live event ops, real-time changes | Development, archival, offline use |
| Requires | Apps Script deployed, internet | Nothing (works offline) |

Both are valid sources of truth. The sheet is primary during events. The JS file is primary during development and for offline/fallback use.
