#!/usr/bin/env python3
"""
seed-sheet.py — Extract EVENT_DATA from g2-conference.js into 4 TSV files.

Reads the nested JS data object and flattens it into tab-separated files
suitable for pasting into Google Sheets:

  event.tsv    — single row: event metadata
  rooms.tsv    — one row per room: id, name, type, crew, tags
  items.tsv    — one row per item: room, day, category, item fields
  schedule.tsv — one row per room+day: room, day, notes, flags

Usage:
  python3 scripts/seed-sheet.py

Output goes to scripts/ alongside this file.
"""

import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
JS_PATH = os.path.join(ROOT_DIR, 'data', 'g2-conference.js')
OUT_DIR = SCRIPT_DIR


def read_js_data(path):
    """Read g2-conference.js and extract EVENT_DATA as a Python dict.

    Strategy: strip the JS wrapper, convert JS object syntax to JSON,
    then parse. Handles trailing commas, single-line comments, and
    unquoted keys — the three things that make JS objects not-quite-JSON.
    """
    with open(path, 'r') as f:
        text = f.read()

    # Extract the object between `const EVENT_DATA = {` and the final `};`
    m = re.search(r'const\s+EVENT_DATA\s*=\s*\{', text)
    if not m:
        print('ERROR: Could not find EVENT_DATA in', path, file=sys.stderr)
        sys.exit(1)

    # Find the matching closing brace
    start = m.start() + len('const EVENT_DATA = ')
    depth = 0
    end = start
    for i in range(start, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    obj_text = text[start:end]

    # Remove single-line comments (// ...)
    obj_text = re.sub(r'//[^\n]*', '', obj_text)

    # Remove multi-line comments (/* ... */)
    obj_text = re.sub(r'/\*.*?\*/', '', obj_text, flags=re.DOTALL)

    # Quote unquoted keys: word characters before a colon
    # But not inside strings — simple approach works for this data shape
    obj_text = re.sub(r"(?<=[{,\n])\s*(\w+)\s*:", r' "\1":', obj_text)

    # Convert single quotes to double quotes (JS allows both)
    obj_text = re.sub(r"'([^']*)'", r'"\1"', obj_text)

    # Remove trailing commas before } or ]
    obj_text = re.sub(r',\s*([}\]])', r'\1', obj_text)

    # Handle unicode escapes that Python's json doesn't need conversion for
    # The \u2013 en-dashes in the JS are already valid JSON unicode escapes

    try:
        data = json.loads(obj_text)
    except json.JSONDecodeError as e:
        # Dump context around error for debugging
        pos = e.pos if hasattr(e, 'pos') else 0
        snippet = obj_text[max(0, pos - 80):pos + 80]
        print(f'JSON parse error at position {pos}:', file=sys.stderr)
        print(f'  {e}', file=sys.stderr)
        print(f'  Context: ...{snippet}...', file=sys.stderr)
        sys.exit(1)

    return data


def write_tsv(filename, headers, rows):
    """Write a TSV file with headers and rows."""
    path = os.path.join(OUT_DIR, filename)
    with open(path, 'w') as f:
        f.write('\t'.join(headers) + '\n')
        for row in rows:
            f.write('\t'.join(str(v) for v in row) + '\n')
    print(f'  {filename}: {len(rows)} row(s)')


def export_event(data):
    """Export event metadata as a single-row TSV."""
    ev = data['event']
    headers = ['event_name', 'venue', 'address', 'days', 'day_labels', 'default_day']
    days_str = '|'.join(ev['days'])
    labels_str = '|'.join(f"{k}:{v}" for k, v in ev['dayLabels'].items())
    rows = [[ev['name'], ev['venue'], ev['address'], days_str, labels_str, ev['defaultDay']]]
    write_tsv('event.tsv', headers, rows)


def format_tags(tags):
    """Convert tags array to pipe-separated type:value pairs."""
    if not tags:
        return ''
    return '|'.join(f"{t[0]}:{t[1]}" for t in tags)


def export_rooms(data):
    """Export room metadata (no items or schedule)."""
    headers = ['room_id', 'name', 'type', 'crew', 'tags']
    rows = []
    for room_id, room in data['rooms'].items():
        rows.append([
            room_id,
            room.get('name', ''),
            room.get('type', ''),
            room.get('crew', ''),
            format_tags(room.get('tags', [])),
        ])
    write_tsv('rooms.tsv', headers, rows)


def export_items(data):
    """Export all items, flattened: one row per item.

    For defaultItems, day is '*' (meaning "applies to all active days").
    For day-specific items, day is the day key (e.g. '2/12').
    """
    headers = ['room_id', 'day', 'category', 'name', 'qty', 'location',
               'source', 'note', 'flag', 'sort_order']
    rows = []

    for room_id, room in data['rooms'].items():
        # Default items
        default_items = room.get('defaultItems', {})
        sort_idx = 0
        for cat, items in default_items.items():
            for item in items:
                rows.append([
                    room_id, '*', cat,
                    item.get('name', ''),
                    item.get('qty', 1),
                    item.get('loc', ''),
                    item.get('src', ''),
                    item.get('note', ''),
                    item.get('flag', ''),
                    sort_idx,
                ])
                sort_idx += 1

        # Day-specific items (override defaultItems for that day)
        schedule = room.get('schedule', {})
        for day_key, day_data in schedule.items():
            if 'items' not in day_data:
                continue  # Falls back to defaultItems — no override
            day_items = day_data['items']
            if not day_items:
                continue  # Explicitly empty — no items this day
            day_sort = 0
            for cat, items in day_items.items():
                for item in items:
                    rows.append([
                        room_id, day_key, cat,
                        item.get('name', ''),
                        item.get('qty', 1),
                        item.get('loc', ''),
                        item.get('src', ''),
                        item.get('note', ''),
                        item.get('flag', ''),
                        day_sort,
                    ])
                    day_sort += 1

    write_tsv('items.tsv', headers, rows)


def export_schedule(data):
    """Export schedule entries: one row per room+day."""
    headers = ['room_id', 'day', 'notes', 'use_default_items', 'active']
    rows = []

    for room_id, room in data['rooms'].items():
        schedule = room.get('schedule', {})
        has_defaults = bool(room.get('defaultItems'))

        for day_key, day_data in schedule.items():
            has_explicit_items = 'items' in day_data
            explicit_items_empty = has_explicit_items and not day_data['items']

            # Determine if this day uses default items
            if has_explicit_items:
                use_defaults = False
            else:
                use_defaults = has_defaults

            # Active = has any gear (either defaults or explicit items)
            active = use_defaults or (has_explicit_items and not explicit_items_empty)

            rows.append([
                room_id,
                day_key,
                day_data.get('notes', ''),
                'Y' if use_defaults else 'N',
                'Y' if active else 'N',
            ])

    write_tsv('schedule.tsv', headers, rows)


def main():
    print(f'Reading {JS_PATH}...')
    data = read_js_data(JS_PATH)

    room_count = len(data['rooms'])
    print(f'Found {room_count} rooms, {len(data["event"]["days"])} days.\n')
    print('Exporting TSV files:')

    export_event(data)
    export_rooms(data)
    export_items(data)
    export_schedule(data)

    print(f'\nDone. Files written to {OUT_DIR}/')


if __name__ == '__main__':
    main()
