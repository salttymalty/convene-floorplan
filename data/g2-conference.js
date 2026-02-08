/* ═══════════════════════════════════════════════════════
   G2 Conference — Convene Willis Tower
   Event data for floor plan + setup checklist.

   EDITING GUIDE:
   - Each room has a `schedule` with per-day entries.
   - If a room's gear is the same every active day, put it
     in `defaultItems` and only specify `notes` per day.
   - A day entry with `items: {}` means "explicitly no gear."
   - A day entry with NO `items` key falls back to `defaultItems`.
   - A room with only `schedule: { default: { ... } }` uses
     that for every day.

   ITEM FORMAT:
   Each item is an object: { name, qty, loc, src, note, flag }
   - name: display name
   - qty:  count (default 1)
   - loc:  location in room (e.g. 'Tech Table')
   - src:  source/vendor (e.g. 'Convene', 'Hartford', 'Client')
   - note: extra context
   - flag: urgent note (rendered in red)
   ═══════════════════════════════════════════════════════ */

const EVENT_DATA = {
  event: {
    name: 'G2 Conference',
    venue: 'Convene Willis Tower',
    address: '233 S Wacker Dr, Floor 3 · Chicago 60606',
    days: ['2/9', '2/10', '2/11', '2/12'],
    dayLabels: {
      '2/9':  'Sun · Load-In',
      '2/10': 'Mon · Day 1',
      '2/11': 'Tue · Day 2',
      '2/12': 'Wed · Day 3',
    },
    defaultDay: '2/10',
  },

  rooms: {

    /* ── HALL (Combined) ────────────────────────── */
    'hall': {
      name: 'Hall (Combined)',
      type: 'meeting',
      crew: 'V1 Emmett, A1 Danny',
      tags: [['crew','V1: Emmett'],['crew','A1: Danny'],['zoom','Zoom'],['vendor','Hartford']],
      defaultItems: {
        audio: [
          { name: 'Mixer', qty: 1, loc: 'Tech Table', src: 'Convene' },
          { name: 'Microphone HH', qty: 5, loc: 'Tech Table' },
          { name: 'Microphone LAV', qty: 1, loc: 'Tech Table' },
          { name: 'DI', qty: 3, note: 'Content PlaybackPro + audio playback' },
          { name: 'Audio Playback Laptop', qty: 1, loc: 'Tech Table', note: 'PlaybackPro for V1' },
          { name: 'Aux Out → BM Web Presenter', qty: 1, loc: 'Tech Table' },
        ],
        video: [
          { name: 'Switcher', qty: 1, loc: 'Tech Table' },
          { name: 'Confidence Monitor', qty: 2, loc: 'Downstage', note: 'PGM and Notes' },
          { name: 'Playback Pro', qty: 1, loc: 'Tech Table', note: 'A1 — VOGs, walk-up music' },
          { name: 'PTZ Camera', qty: 1, loc: 'Back of Room', src: 'Hartford', flag: 'Hartford tripod + spider pod' },
          { name: 'BlackMagic Web Presenter', qty: 1, loc: 'Tech Table' },
          { name: 'PGM Out → BM Web Presenter', qty: 1, loc: 'Tech Table' },
        ],
        control: [
          { name: 'Stream Deck', qty: 1, loc: 'Tech Table', note: '2 pres laptops + 1 PlaybackPro' },
          { name: 'PTZ Controller', qty: 1, loc: 'Tech Table', src: 'Hartford', note: 'Skye 2/10 only. Wide static rest.' },
          { name: 'Speaker Timer', qty: 1, loc: 'Downstage' },
        ],
        presentation: [
          { name: 'Laptop (Client)', qty: 2, loc: 'Tech Table', src: 'Client', note: 'Content + notes' },
          { name: 'Zoom Laptop', qty: 1, loc: 'Tech Table' },
        ],
      },
      schedule: {
        '2/9':  { notes: 'Load-in + tech check 3p–5p.' },
        '2/10': { notes: 'Combined config. VOG recordings.' },
        '2/11': { notes: 'Combined config. VOG recordings.' },
        '2/12': { notes: 'Hall North only — south gets own rig.' },
      },
    },

    /* ── HALL SOUTH ──────────────────────────────── */
    'hall-s': {
      name: 'Hall South',
      type: 'meeting',
      tags: [['day','2/12 only']],
      schedule: {
        '2/9':  { notes: 'Not in use.', items: {} },
        '2/10': { notes: 'Part of Hall Combined.', items: {} },
        '2/11': { notes: 'Part of Hall Combined.', items: {} },
        '2/12': {
          notes: 'No Zoom. Simplified setup.',
          items: {
            audio: [
              { name: 'Mixer', qty: 1, loc: 'Tech Table' },
              { name: 'Microphone LAV', qty: 1, loc: 'Tech Table' },
            ],
            cables: [
              { name: 'HDMI', qty: 1, loc: 'Podium' },
            ],
            presentation: [
              { name: 'Laptop (Client)', qty: 1, loc: 'Podium', src: 'Client' },
            ],
            control: [
              { name: 'Perfect Cue (small)', qty: 1, loc: 'Podium' },
            ],
          },
        },
      },
    },

    /* ── HUB ─────────────────────────────────────── */
    'hub': {
      name: 'Hub',
      type: 'meeting',
      tags: [['zoom','Zoom'],['day','2/11–12']],
      defaultItems: {
        audio: [
          { name: 'Mixer', qty: 1, loc: 'Tech Table' },
          { name: 'Microphone LAV', qty: 1, loc: 'Tech Table', note: 'Possible add — check w/ Vince' },
        ],
        video: [
          { name: 'Zoom Laptop', qty: 1, note: 'Runs Zoom + shared content' },
          { name: 'BlackMagic Web Presenter', qty: 1, note: 'Console audio + room cam' },
          { name: 'Built-In Room Camera', qty: 1 },
        ],
      },
      schedule: {
        '2/9':  { notes: 'Not in use.', items: {} },
        '2/10': { notes: 'Not in use.', items: {} },
        '2/11': { notes: 'May add mic on site — notify Vince.' },
        '2/12': { notes: 'May add mic on site — notify Vince.' },
      },
    },

    /* ── FORUM (Combined) ────────────────────────── */
    'forum': {
      name: 'Forum (Combined)',
      type: 'meeting',
      crew: 'V1 Skye, A1 Garen',
      tags: [['crew','V1: Skye'],['crew','A1: Garen'],['zoom','Zoom'],['day','2/11']],
      defaultItems: {
        audio: [
          { name: 'Mixer', qty: 1, loc: 'Tech Table' },
          { name: 'Microphone HH', qty: 2, loc: 'Tech Table' },
          { name: 'Microphone LAV', qty: 1, loc: 'Tech Table' },
        ],
        presentation: [
          { name: 'Laptop (Client)', qty: 1, loc: 'Tech Table', src: 'Client' },
        ],
        control: [
          { name: 'Perfect Cue', qty: 1, loc: 'Tech Table', note: 'Syncs Zoom + content' },
        ],
        video: [
          { name: 'Built-In Room Camera', qty: 1, loc: 'Back of Room' },
          { name: 'Zoom Laptop', qty: 1, loc: 'Tech Table', note: 'Shares PPT w/ audio' },
          { name: 'BlackMagic Web Presenter', qty: 1, loc: 'Tech Table', note: 'Aux audio + room cam' },
        ],
      },
      schedule: {
        '2/9':  { notes: 'Not in use.', items: {} },
        '2/10': { notes: 'Combined config.' },
        '2/11': { notes: 'Combined config.' },
        '2/12': { notes: 'Forum North only — divides N/S.' },
      },
    },

    /* ── FORUM SOUTH ─────────────────────────────── */
    'forum-s': {
      name: 'Forum South',
      type: 'meeting',
      schedule: {
        '2/10': { notes: 'Part of Forum Combined.', items: {} },
        '2/11': { notes: 'Part of Forum Combined.', items: {} },
        default: { notes: 'No gear assigned.', items: {} },
      },
    },

    /* ── WACKER STUDIO ───────────────────────────── */
    'wacker-st': {
      name: 'Wacker Studio',
      type: 'studio',
      tags: [['zoom','Zoom'],['day','2/11–12']],
      defaultItems: {
        audio: [
          { name: 'Mixer', qty: 1 },
          { name: 'Boundary Mic', qty: 4, note: 'Spread around room' },
          { name: 'Aux Out → BlackMagic', qty: 1 },
        ],
        video: [
          { name: 'Zoom Laptop', qty: 1, note: 'Shares content + audio' },
          { name: 'BlackMagic Web Presenter', qty: 1, note: 'Room audio + Vaddio HDMI' },
          { name: 'Vaddio Camera', qty: 1, note: 'SR corner on tripod' },
        ],
      },
      schedule: {
        '2/9':  { notes: 'Not in use.', items: {} },
        '2/10': { notes: 'Not in use.', items: {} },
        '2/11': { notes: 'Zoom room.' },
        '2/12': { notes: 'Zoom room.' },
      },
    },

    /* ── ADAMS STUDIO ────────────────────────────── */
    'adams-st': {
      name: 'Adams Studio',
      type: 'studio',
      tags: [['zoom','Zoom'],['day','2/11–12']],
      defaultItems: {
        audio: [
          { name: 'Mixer', qty: 1 },
          { name: 'Boundary Mic', qty: 4, note: 'Spread around room' },
          { name: 'Aux Out → BlackMagic', qty: 1 },
        ],
        video: [
          { name: 'Zoom Laptop', qty: 1, note: 'Shares content + audio' },
          { name: 'BlackMagic Web Presenter', qty: 1, note: 'Room audio + Vaddio HDMI' },
          { name: 'Vaddio Camera', qty: 1, note: 'SR corner on tripod' },
        ],
      },
      schedule: {
        '2/9':  { notes: 'Not in use.', items: {} },
        '2/10': { notes: 'Not in use.', items: {} },
        '2/11': { notes: 'Zoom room.' },
        '2/12': { notes: 'Zoom room.' },
      },
    },

    /* ── ELEVATOR BANK HALLWAY ───────────────────── */
    'elev': {
      name: 'Elevator Bank Hallway',
      type: 'service',
      defaultItems: {
        cables: [
          { name: 'Extension Cord', qty: 1, note: 'Power to Reg Desk' },
          { name: 'Power Strip', qty: 1 },
        ],
      },
      schedule: {
        '2/9':  { notes: 'Not in use.', items: {} },
        '2/10': { notes: 'Registration desk power.' },
        '2/11': { notes: 'Registration desk power.' },
        '2/12': { notes: 'Registration desk power.' },
      },
    },

    /* ── BOARDROOMS ──────────────────────────────── */
    'khan':     { name: 'Khan Boardroom',     type: 'studio',  schedule: { default: { notes: 'No gear assigned.', items: {} } } },
    'olmstead': { name: 'Olmstead Boardroom',  type: 'studio',  schedule: { default: { notes: 'No gear assigned.', items: {} } } },
    'farrand':  { name: 'Farrand Boardroom',   type: 'studio',  schedule: { default: { notes: 'No gear assigned.', items: {} } } },
    'miller':   { name: 'Miller Boardroom',    type: 'studio',  schedule: { default: { notes: 'No gear assigned.', items: {} } } },

    /* ── GALLERIES ───────────────────────────────── */
    'adams-g':    { name: 'Adams Gallery',    type: 'gallery', schedule: { default: { notes: 'No gear assigned.', items: {} } } },
    'wacker-g':   { name: 'Wacker Gallery',   type: 'gallery', schedule: { default: { notes: 'No gear assigned.', items: {} } } },
    'jackson-g':  { name: 'Jackson Gallery',  type: 'gallery', schedule: { default: { notes: 'No gear assigned.', items: {} } } },
    'franklin-g': { name: 'Franklin Gallery', type: 'gallery', schedule: { default: { notes: 'No gear assigned.', items: {} } } },

    /* ── SERVICE ─────────────────────────────────── */
    'green': { name: 'Green Room', type: 'service', schedule: { default: { notes: 'Talent / speaker holding.', items: {} } } },
  },
};
