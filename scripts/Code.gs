/**
 * Convene Floor Plan — Google Apps Script API
 *
 * Reads 4 Google Sheets tabs (Event, Rooms, Items, Schedule) and
 * assembles them into the EVENT_DATA shape consumed by index.html.
 *
 * Deployment:
 *   1. Open the Google Sheet → Extensions → Apps Script
 *   2. Paste this entire file into Code.gs
 *   3. Deploy → New deployment → Web app
 *   4. Execute as: Me, Access: Anyone with the link
 *   5. Copy the deployment URL into LIVE_API_URL in index.html
 */

function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var event = readEvent(ss.getSheetByName('Event'));
    var rooms = readRooms(ss.getSheetByName('Rooms'));
    var items = readItems(ss.getSheetByName('Items'));
    var schedule = readSchedule(ss.getSheetByName('Schedule'));

    // Merge items and schedule into rooms
    for (var roomId in items) {
      if (rooms[roomId]) {
        // Items with day='*' are defaultItems
        if (items[roomId]['*']) {
          rooms[roomId].defaultItems = items[roomId]['*'];
          delete items[roomId]['*'];
        }
        // Day-specific items get attached via schedule
      }
    }

    for (var roomId in schedule) {
      if (rooms[roomId]) {
        rooms[roomId].schedule = {};
        for (var day in schedule[roomId]) {
          var entry = schedule[roomId][day];
          var sched = { notes: entry.notes };

          // Attach day-specific items if they exist
          if (items[roomId] && items[roomId][day]) {
            sched.items = items[roomId][day];
          } else if (entry.active === 'N') {
            // Explicitly no items
            sched.items = {};
          }
          // If neither condition: no items key → falls back to defaultItems

          rooms[roomId].schedule[day] = sched;
        }
      }
    }

    var output = {
      event: event,
      rooms: rooms,
      _meta: {
        generatedAt: new Date().toISOString()
      }
    };

    return ContentService
      .createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: e.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Read Event tab → event metadata object.
 *
 * Expected columns: event_name, venue, address, days, day_labels, default_day
 * days: pipe-separated (e.g. "2/9|2/10|2/11|2/12")
 * day_labels: pipe-separated key:value pairs (e.g. "2/9:Sun Load-In|2/10:Mon Day 1")
 */
function readEvent(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return {};

  var headers = rows[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var vals = rows[1];

  var daysRaw = String(vals[headers.indexOf('days')] || '');
  var days = daysRaw.split('|').map(function(d) { return d.trim(); }).filter(Boolean);

  var labelsRaw = String(vals[headers.indexOf('day_labels')] || '');
  var dayLabels = {};
  labelsRaw.split('|').forEach(function(pair) {
    var idx = pair.indexOf(':');
    if (idx > 0) {
      var key = pair.substring(0, idx).trim();
      var val = pair.substring(idx + 1).trim();
      dayLabels[key] = val;
    }
  });

  return {
    name: String(vals[headers.indexOf('event_name')] || ''),
    venue: String(vals[headers.indexOf('venue')] || ''),
    address: String(vals[headers.indexOf('address')] || ''),
    days: days,
    dayLabels: dayLabels,
    defaultDay: String(vals[headers.indexOf('default_day')] || days[0] || '')
  };
}

/**
 * Read Rooms tab → { roomId: { name, type, crew, tags } }
 *
 * Tags column: pipe-separated type:value pairs
 * e.g. "crew:V1: Emmett|crew:A1: Danny|zoom:Zoom"
 * Output: [["crew","V1: Emmett"],["crew","A1: Danny"],["zoom","Zoom"]]
 */
function readRooms(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return {};

  var headers = rows[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var rooms = {};

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var id = String(row[headers.indexOf('room_id')] || '').trim();
    if (!id) continue;

    var tagsRaw = String(row[headers.indexOf('tags')] || '');
    var tags = [];
    if (tagsRaw) {
      tagsRaw.split('|').forEach(function(pair) {
        var idx = pair.indexOf(':');
        if (idx > 0) {
          var type = pair.substring(0, idx).trim();
          var value = pair.substring(idx + 1).trim();
          tags.push([type, value]);
        }
      });
    }

    rooms[id] = {
      name: String(row[headers.indexOf('name')] || ''),
      type: String(row[headers.indexOf('type')] || ''),
      crew: String(row[headers.indexOf('crew')] || ''),
      tags: tags
    };
  }

  return rooms;
}

/**
 * Read Items tab → nested structure grouped by room_id, then day, then category.
 *
 * Returns: { roomId: { day: { category: [items] } } }
 * day='*' means defaultItems.
 */
function readItems(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return {};

  var headers = rows[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var items = {};

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var roomId = String(row[headers.indexOf('room_id')] || '').trim();
    var day = String(row[headers.indexOf('day')] || '*').trim();
    var category = String(row[headers.indexOf('category')] || '').trim();

    if (!roomId || !category) continue;

    if (!items[roomId]) items[roomId] = {};
    if (!items[roomId][day]) items[roomId][day] = {};
    if (!items[roomId][day][category]) items[roomId][day][category] = [];

    var item = {
      name: String(row[headers.indexOf('name')] || ''),
      qty: Number(row[headers.indexOf('qty')] || 1)
    };

    // Only include optional fields if they have values
    var loc = String(row[headers.indexOf('location')] || '').trim();
    var src = String(row[headers.indexOf('source')] || '').trim();
    var note = String(row[headers.indexOf('note')] || '').trim();
    var flag = String(row[headers.indexOf('flag')] || '').trim();

    if (loc) item.loc = loc;
    if (src) item.src = src;
    if (note) item.note = note;
    if (flag) item.flag = flag;

    items[roomId][day][category].push(item);
  }

  return items;
}

/**
 * Read Schedule tab → { roomId: { day: { notes, useDefaultItems, active } } }
 */
function readSchedule(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return {};

  var headers = rows[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var schedule = {};

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var roomId = String(row[headers.indexOf('room_id')] || '').trim();
    var day = String(row[headers.indexOf('day')] || '').trim();

    if (!roomId || !day) continue;

    if (!schedule[roomId]) schedule[roomId] = {};

    schedule[roomId][day] = {
      notes: String(row[headers.indexOf('notes')] || ''),
      useDefaultItems: String(row[headers.indexOf('use_default_items')] || 'N').trim().toUpperCase() === 'Y',
      active: String(row[headers.indexOf('active')] || 'N').trim().toUpperCase()
    };
  }

  return schedule;
}
