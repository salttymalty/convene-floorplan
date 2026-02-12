<script>
'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// StateManager — localStorage wrapper for checklist state
// ══════════════════════════════════════════════════════════════════════════════
const StateManager = {
  _getKey(roomId) {
    return `convene_floor_${roomId}`;
  },
  _itemKey(roomId, itemName, day) {
    return `${roomId}__${day}__${itemName.replace(/\s+/g, '_')}`;
  },

  get(roomId) {
    const key = this._getKey(roomId);
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : {};
  },

  set(roomId, stateObj) {
    const key = this._getKey(roomId);
    localStorage.setItem(key, JSON.stringify(stateObj));
  },

  getItemState(roomId, itemName, day) {
    const state = this.get(roomId);
    const ik = this._itemKey(roomId, itemName, day);
    return state[ik] || { set: false, test: false };
  },

  setItemState(roomId, itemName, day, stateObj) {
    const state = this.get(roomId);
    const ik = this._itemKey(roomId, itemName, day);
    state[ik] = stateObj;
    this.set(roomId, state);
  },

  clear(roomId) {
    const key = this._getKey(roomId);
    localStorage.removeItem(key);
  },

  clearAll() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('convene_floor_')) localStorage.removeItem(k);
    });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Config
// ══════════════════════════════════════════════════════════════════════════════
const FULL_VIEWBOX = { x: 0, y: 0, w: 860, h: 750 };
const ROOM_LABELS = {
  'adams-g': 'Adams Gallery',
  'forum': 'Forum Combined',
  'forum-s': 'Forum South',
  'adams-st': 'Adams Studio',
  'khan': 'Khan',
  'olmstead': 'Olmstead',
  'farrand': 'Farrand',
  'miller': 'Miller',
  'wacker-st': 'Wacker Studio',
  'wacker-g': 'Wacker Gallery',
  'franklin-g': 'Franklin Gallery',
  'elev': 'Elevators',
  'green': 'Green Room',
  'hall': 'Hall Combined',
  'hall-s': 'Hall South',
  'hub': 'Hub',
  'jackson-g': 'Jackson Gallery'
};
const ROOM_TYPES = {
  'adams-g': 'gallery',
  'forum': 'meeting',
  'forum-s': 'meeting',
  'adams-st': 'studio',
  'khan': 'meeting',
  'olmstead': 'meeting',
  'farrand': 'meeting',
  'miller': 'meeting',
  'wacker-st': 'studio',
  'wacker-g': 'gallery',
  'franklin-g': 'gallery',
  'elev': 'service',
  'green': 'service',
  'hall': 'meeting',
  'hall-s': 'meeting',
  'hub': 'meeting',
  'jackson-g': 'gallery'
};
const RING_CIRC = 2 * Math.PI * 17; // Updated for r=17

// ══════════════════════════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════════════════════════
let currentDay = 'all';
let selectedRoom = null;
let currentIntensityMode = 'gear';
let currentView = 'room'; // room, pull, search
let searchResults = [];

const planSvg = document.querySelector('.plan-card svg');
const planLayout = document.querySelector('.plan-layout');
const detailPanel = document.getElementById('detailPanel');
const detailContent = document.getElementById('detailContent');
const detailEmpty = document.getElementById('detailEmpty');

// ══════════════════════════════════════════════════════════════════════════════
// Data Layer
// ══════════════════════════════════════════════════════════════════════════════
function getRoomDay(roomId, day) {
  const data = EVENT_DATA.rooms[roomId];
  if (!data) return null;
  if (day === 'all') return data;
  return data.days && data.days[day] ? { ...data, ...data.days[day] } : null;
}

function flattenItems(roomData) {
  if (!roomData || !roomData.categories) return [];
  const out = [];
  Object.keys(roomData.categories).forEach(catKey => {
    const cat = roomData.categories[catKey];
    (cat.items || []).forEach(it => {
      out.push({ ...it, category: catKey, categoryLabel: cat.label });
    });
  });
  return out;
}

function countItems(roomData) {
  const items = flattenItems(roomData);
  let total = 0;
  items.forEach(it => {
    const q = it.qty || 1;
    total += q;
  });
  return { count: items.length, total };
}

function getIntensity(roomData) {
  if (!roomData) return 0;
  const { total } = countItems(roomData);
  if (total === 0) return 0;
  if (total <= 5) return 1;
  if (total <= 12) return 2;
  if (total <= 25) return 3;
  return 4;
}

function getProgressIntensity(pct) {
  if (pct === 0) return 0;
  if (pct <= 25) return 1;
  if (pct <= 50) return 2;
  if (pct <= 75) return 3;
  return 4;
}

// ══════════════════════════════════════════════════════════════════════════════
// Day Switcher
// ══════════════════════════════════════════════════════════════════════════════
function renderDayTabs() {
  const sw = document.getElementById('daySwitcher');
  if (!EVENT_DATA.days) return;

  const allBtn = document.createElement('button');
  allBtn.className = 'day-tab active';
  allBtn.dataset.day = 'all';
  allBtn.innerHTML = 'All Days';
  allBtn.setAttribute('role', 'tab');
  allBtn.setAttribute('aria-selected', 'true');
  allBtn.onclick = () => setDay('all');
  sw.appendChild(allBtn);

  EVENT_DATA.days.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'day-tab';
    btn.dataset.day = d.id;
    btn.innerHTML = `${d.name}<span class="day-label">${d.date}</span>`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.onclick = () => setDay(d.id);
    sw.appendChild(btn);
  });
}

function setDay(d) {
  if (currentDay === d) return;
  currentDay = d;

  document.querySelectorAll('.day-tab').forEach(btn => {
    const active = btn.dataset.day === d;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });

  updateRoomStates();
  updateProgressRings();

  if (selectedRoom) {
    renderRoomDetailCompact(selectedRoom);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Intensity Mode (Gear / Setup / Test)
// ══════════════════════════════════════════════════════════════════════════════
function setIntensityMode(mode) {
  currentIntensityMode = mode;
  document.querySelectorAll('.legend-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const title = document.getElementById('legendTitle');
  if (mode === 'gear') title.textContent = 'Gear Load';
  else if (mode === 'setup') title.textContent = 'Setup Progress';
  else title.textContent = 'Test Progress';

  updateRoomStates();
}

document.querySelectorAll('.legend-mode-btn').forEach(btn => {
  btn.onclick = () => setIntensityMode(btn.dataset.mode);
});

// ══════════════════════════════════════════════════════════════════════════════
// Room States (fill/stroke based on mode)
// ══════════════════════════════════════════════════════════════════════════════
function updateRoomStates() {
  document.querySelectorAll('.room').forEach(el => {
    const rid = el.dataset.room;
    const data = getRoomDay(rid, currentDay);

    if (!data) {
      el.classList.remove('i0', 'i1', 'i2', 'i3', 'i4');
      el.classList.add('i0');
      return;
    }

    let intensity = 0;
    if (currentIntensityMode === 'gear') {
      intensity = getIntensity(data);
    } else {
      const items = flattenItems(data);
      if (items.length === 0) {
        intensity = 0;
      } else {
        let done = 0;
        items.forEach(it => {
          const s = StateManager.getItemState(rid, it.name, currentDay);
          if (currentIntensityMode === 'setup' && s.set) done++;
          if (currentIntensityMode === 'test' && s.test) done++;
        });
        const pct = Math.round((done / items.length) * 100);
        intensity = getProgressIntensity(pct);
      }
    }

    el.classList.remove('i0', 'i1', 'i2', 'i3', 'i4');
    el.classList.add('i' + intensity);
  });

  updateItemCounts();
  updateAllStatusBars();
}

// ══════════════════════════════════════════════════════════════════════════════
// Item Counts (in SVG)
// ══════════════════════════════════════════════════════════════════════════════
function updateItemCounts() {
  document.querySelectorAll('[data-count-for]').forEach(el => {
    const rid = el.dataset.countFor;
    const data = getRoomDay(rid, currentDay);
    if (!data) {
      el.textContent = '';
      return;
    }
    const { count } = countItems(data);
    el.textContent = count > 0 ? `${count} items` : '';
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SVG Status Bars (per-room mini progress bars)
// ══════════════════════════════════════════════════════════════════════════════
function createRoomStatusBars() {
  const svg = document.querySelector('.plan-card svg');
  if (svg.querySelector('#statusBars')) return;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.id = 'statusBars';

  document.querySelectorAll('.room').forEach(el => {
    const bbox = el.getBBox();
    const rid = el.dataset.room;
    const x = bbox.x + 2;
    const y = bbox.y + bbox.height - 5;
    const w = bbox.width - 4;
    const h = 2;

    const roomG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    roomG.dataset.room = rid;

    const track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.classList.add('status-track-rect');
    track.setAttribute('x', x);
    track.setAttribute('y', y);
    track.setAttribute('width', w);
    track.setAttribute('height', h);
    track.setAttribute('rx', 0.5);
    roomG.appendChild(track);

    const setBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    setBar.classList.add('status-set-rect');
    setBar.dataset.barType = 'set';
    setBar.setAttribute('x', x);
    setBar.setAttribute('y', y);
    setBar.setAttribute('width', 0);
    setBar.setAttribute('height', h);
    setBar.setAttribute('rx', 0.5);
    roomG.appendChild(setBar);

    const testBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    testBar.classList.add('status-test-rect');
    testBar.dataset.barType = 'test';
    testBar.setAttribute('x', x);
    testBar.setAttribute('y', y);
    testBar.setAttribute('width', 0);
    testBar.setAttribute('height', h);
    testBar.setAttribute('rx', 0.5);
    roomG.appendChild(testBar);

    g.appendChild(roomG);
  });

  svg.appendChild(g);
}

function updateAllStatusBars() {
  document.querySelectorAll('#statusBars g').forEach(g => {
    const rid = g.dataset.room;
    updateRoomStatusBars(rid);
  });
}

function updateRoomStatusBars(roomId) {
  const g = document.querySelector(`#statusBars g[data-room="${roomId}"]`);
  if (!g) return;

  const data = getRoomDay(roomId, currentDay);
  if (!data) {
    g.style.opacity = '0';
    return;
  }

  const items = flattenItems(data);
  if (items.length === 0) {
    g.style.opacity = '0';
    return;
  }

  g.style.opacity = '1';

  let setDone = 0, testDone = 0;
  items.forEach(it => {
    const s = StateManager.getItemState(roomId, it.name, currentDay);
    if (s.set) setDone++;
    if (s.test) testDone++;
  });

  const setPct = (setDone / items.length) * 100;
  const testPct = (testDone / items.length) * 100;

  const track = g.querySelector('.status-track-rect');
  const trackW = parseFloat(track.getAttribute('width'));
  const trackX = parseFloat(track.getAttribute('x'));

  const setBar = g.querySelector('[data-bar-type="set"]');
  const testBar = g.querySelector('[data-bar-type="test"]');

  const setW = (setPct / 100) * trackW;
  const testW = (testPct / 100) * trackW;

  setBar.setAttribute('width', setW);
  testBar.setAttribute('x', trackX + setW);
  testBar.setAttribute('width', testW);
}

// ══════════════════════════════════════════════════════════════════════════════
// ViewBox Panning (no zoom, pan only)
// ══════════════════════════════════════════════════════════════════════════════
function animateViewBox(target, duration) {
  const current = {
    x: parseFloat(planSvg.getAttribute('viewBox').split(' ')[0]) || 0,
    y: parseFloat(planSvg.getAttribute('viewBox').split(' ')[1]) || 0,
    w: parseFloat(planSvg.getAttribute('viewBox').split(' ')[2]) || FULL_VIEWBOX.w,
    h: parseFloat(planSvg.getAttribute('viewBox').split(' ')[3]) || FULL_VIEWBOX.h
  };

  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const x = current.x + (target.x - current.x) * ease;
    const y = current.y + (target.y - current.y) * ease;
    const w = current.w + (target.w - current.w) * ease;
    const h = current.h + (target.h - current.h) * ease;

    planSvg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);

    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function zoomOut() {
  animateViewBox(FULL_VIEWBOX, 400);
}

function zoomToRoom(el) {
  const bbox = el.getBBox();
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  const pad = 60;
  const aspect = FULL_VIEWBOX.w / FULL_VIEWBOX.h;

  let targetW = bbox.width + pad * 2;
  let targetH = bbox.height + pad * 2;

  if (targetW / targetH > aspect) {
    targetH = targetW / aspect;
  } else {
    targetW = targetH * aspect;
  }

  targetW = Math.min(targetW, FULL_VIEWBOX.w);
  targetH = Math.min(targetH, FULL_VIEWBOX.h);

  let targetX = cx - targetW / 2;
  let targetY = cy - targetH / 2;

  if (targetX < 0) targetX = 0;
  if (targetY < 0) targetY = 0;
  if (targetX + targetW > FULL_VIEWBOX.w) targetX = FULL_VIEWBOX.w - targetW;
  if (targetY + targetH > FULL_VIEWBOX.h) targetY = FULL_VIEWBOX.h - targetH;

  animateViewBox({ x: targetX, y: targetY, w: targetW, h: targetH }, 500);
}

// ══════════════════════════════════════════════════════════════════════════════
// Room Overlay (modal detail view)
// ══════════════════════════════════════════════════════════════════════════════
let roomOverlay = null;

function showRoomOverlay(roomId) {
  if (!roomOverlay) {
    roomOverlay = document.createElement('div');
    roomOverlay.className = 'room-overlay';
    document.querySelector('.plan-card').appendChild(roomOverlay);
  }

  const data = getRoomDay(roomId, currentDay);
  if (!data) {
    roomOverlay.innerHTML = '<p>No data for this room</p>';
    return;
  }

  const html = renderRoomDetail(roomId, data);
  roomOverlay.innerHTML = html;

  requestAnimationFrame(() => {
    roomOverlay.classList.add('visible');
  });

  const closeBtn = roomOverlay.querySelector('.overlay-close');
  if (closeBtn) {
    closeBtn.onclick = () => hideRoomOverlay();
  }

  bindCheckboxes(roomId);
}

function hideRoomOverlay(immediate = false) {
  if (!roomOverlay) return;
  if (immediate) {
    roomOverlay.classList.remove('visible');
    setTimeout(() => {
      if (roomOverlay && roomOverlay.parentNode) {
        roomOverlay.parentNode.removeChild(roomOverlay);
        roomOverlay = null;
      }
    }, 350);
  } else {
    roomOverlay.classList.remove('visible');
    setTimeout(() => {
      if (roomOverlay && roomOverlay.parentNode) {
        roomOverlay.parentNode.removeChild(roomOverlay);
        roomOverlay = null;
      }
    }, 350);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Room Detail Render (compact for sidebar)
// ══════════════════════════════════════════════════════════════════════════════
function renderRoomDetailCompact(roomId) {
  const data = getRoomDay(roomId, currentDay);
  if (!data) {
    detailContent.style.display = 'none';
    detailEmpty.style.display = 'block';
    return;
  }

  detailEmpty.style.display = 'none';
  detailContent.style.display = 'block';

  const name = ROOM_LABELS[roomId] || roomId;
  const type = ROOM_TYPES[roomId] || 'meeting';
  const { count } = countItems(data);

  const items = flattenItems(data);
  let setDone = 0, testDone = 0;
  items.forEach(it => {
    const s = StateManager.getItemState(roomId, it.name, currentDay);
    if (s.set) setDone++;
    if (s.test) testDone++;
  });
  const setPct = items.length > 0 ? Math.round((setDone / items.length) * 100) : 0;
  const testPct = items.length > 0 ? Math.round((testDone / items.length) * 100) : 0;

  let html = `
    <div class="detail-header">${name}</div>
    <div class="detail-meta">
      <span class="detail-type dt-${type}">${type}</span>
      <span class="detail-count">${count} items</span>
    </div>
  `;

  if (data.tags && data.tags.length > 0) {
    html += '<div class="detail-tags">';
    data.tags.forEach(t => {
      const cls = t.toLowerCase().replace(/\s+/g, '-');
      html += `<span class="detail-tag tag-${cls}">${t}</span>`;
    });
    html += '</div>';
  }

  if (data.crew) {
    html += `<div class="detail-crew">Crew: ${data.crew}</div>`;
  }

  html += `
    <div class="compact-progress">
      <div class="compact-bar">
        <span class="compact-label">Set</span>
        <div class="compact-track">
          <div class="compact-fill" style="width: ${setPct}%; background: var(--status-set);"></div>
        </div>
        <span class="compact-pct">${setPct}%</span>
      </div>
      <div class="compact-bar">
        <span class="compact-label">Test</span>
        <div class="compact-track">
          <div class="compact-fill" style="width: ${testPct}%; background: var(--status-test);"></div>
        </div>
        <span class="compact-pct">${testPct}%</span>
      </div>
    </div>
  `;

  if (data.notes) {
    html += `<div class="detail-note">${data.notes}</div>`;
  }

  detailContent.innerHTML = html;
  detailContent.classList.add('revealing');
  setTimeout(() => detailContent.classList.remove('revealing'), 500);
}

// ══════════════════════════════════════════════════════════════════════════════
// Room Detail Render (full checklist for overlay)
// ══════════════════════════════════════════════════════════════════════════════
function renderRoomDetail(roomId, data) {
  const name = ROOM_LABELS[roomId] || roomId;
  const type = ROOM_TYPES[roomId] || 'meeting';
  const { count } = countItems(data);

  let html = `
    <button class="overlay-close" aria-label="Close">&times;</button>
    <div class="detail-header">${name}</div>
    <div class="detail-meta">
      <span class="detail-type dt-${type}">${type}</span>
      <span class="detail-count">${count} items</span>
    </div>
  `;

  if (data.tags && data.tags.length > 0) {
    html += '<div class="detail-tags">';
    data.tags.forEach(t => {
      const cls = t.toLowerCase().replace(/\s+/g, '-');
      html += `<span class="detail-tag tag-${cls}">${t}</span>`;
    });
    html += '</div>';
  }

  if (data.crew) {
    html += `<div class="detail-crew">Crew: ${data.crew}</div>`;
  }

  if (data.categories) {
    Object.keys(data.categories).forEach(catKey => {
      const cat = data.categories[catKey];
      const catClass = catKey.replace(/_/g, '-');
      html += `<div class="detail-section-label cat-${catClass}">${cat.label}</div>`;

      (cat.items || []).forEach(it => {
        const state = StateManager.getItemState(roomId, it.name, currentDay);
        const setClass = state.set ? 'checked' : '';
        const testClass = state.test ? 'checked' : '';

        html += `
          <div class="checklist-row">
            <div class="check-col">
              <div class="check-box set-box ${setClass}" data-item="${it.name}" data-type="set"></div>
              <span class="check-label lbl-set">Set</span>
            </div>
            <div class="check-col">
              <div class="check-box test-box ${testClass}" data-item="${it.name}" data-type="test"></div>
              <span class="check-label lbl-test">Test</span>
            </div>
            <div class="item-info">
              <div class="item-name">${it.name}</div>
              ${it.model ? `<div class="item-sub">${it.model}</div>` : ''}
              ${it.flag ? `<div class="item-flag">${it.flag}</div>` : ''}
            </div>
            ${it.qty && it.qty > 1 ? `<div class="item-qty">&times;${it.qty}</div>` : '<div></div>'}
          </div>
        `;
      });
    });
  }

  if (data.notes) {
    html += `<div class="detail-note">${data.notes}</div>`;
  }

  return html;
}

// ══════════════════════════════════════════════════════════════════════════════
// Checkbox Binding
// ══════════════════════════════════════════════════════════════════════════════
function bindCheckboxes(roomId) {
  const container = roomOverlay || detailContent;
  container.querySelectorAll('.check-box').forEach(box => {
    box.onclick = (e) => {
      e.stopPropagation();
      const itemName = box.dataset.item;
      const type = box.dataset.type;
      const state = StateManager.getItemState(roomId, itemName, currentDay);

      if (type === 'set') state.set = !state.set;
      if (type === 'test') state.test = !state.test;

      StateManager.setItemState(roomId, itemName, currentDay, state);

      box.classList.toggle('checked');
      box.classList.add('popping');
      setTimeout(() => box.classList.remove('popping'), 300);

      updateRoomStates();
      updateProgressRings();
      updateRoomStatusBars(roomId);

      if (currentIntensityMode === 'setup' || currentIntensityMode === 'test') {
        updateRoomStates();
      }
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Progress Rings
// ══════════════════════════════════════════════════════════════════════════════
function updateProgressRings() {
  let totalItems = 0;
  let setDone = 0;
  let testDone = 0;
  let readyDone = 0;

  Object.keys(EVENT_DATA.rooms).forEach(rid => {
    const data = getRoomDay(rid, currentDay);
    if (!data) return;
    const items = flattenItems(data);
    totalItems += items.length;

    items.forEach(it => {
      const s = StateManager.getItemState(rid, it.name, currentDay);
      if (s.set) setDone++;
      if (s.test) testDone++;
      if (s.set && s.test) readyDone++;
    });
  });

  const setPct = totalItems > 0 ? Math.round((setDone / totalItems) * 100) : 0;
  const testPct = totalItems > 0 ? Math.round((testDone / totalItems) * 100) : 0;
  const readyPct = totalItems > 0 ? Math.round((readyDone / totalItems) * 100) : 0;

  updateRing('ringSet', 'pctSet', setPct);
  updateRing('ringTest', 'pctTest', testPct);
  updateRing('ringReady', 'pctReady', readyPct);
}

function updateRing(ringId, pctId, pct) {
  const ring = document.getElementById(ringId);
  const pctEl = document.getElementById(pctId);
  const offset = RING_CIRC - (pct / 100) * RING_CIRC;
  ring.style.strokeDashoffset = offset;
  pctEl.textContent = `${pct}%`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Room Selection
// ══════════════════════════════════════════════════════════════════════════════
function selectRoom(el) {
  clearSelection(true);

  selectedRoom = el.dataset.room;
  el.classList.add('selected', 'selecting');
  el.setAttribute('aria-selected', 'true');

  setTimeout(() => el.classList.remove('selecting'), 500);

  zoomToRoom(el);
  renderRoomDetailCompact(selectedRoom);

  setTimeout(() => {
    showRoomOverlay(selectedRoom);
  }, 350);

  updateHash();
}

function clearSelection(silent = false) {
  if (!selectedRoom) return;

  const el = document.querySelector(`.room[data-room="${selectedRoom}"]`);
  if (el) {
    el.classList.remove('selected');
    el.classList.add('deselecting');
    el.setAttribute('aria-selected', 'false');
    setTimeout(() => el.classList.remove('deselecting'), 350);
  }

  selectedRoom = null;
  hideRoomOverlay();

  if (!silent) {
    detailContent.style.display = 'none';
    detailEmpty.style.display = 'block';
    zoomOut();
    updateHash();
  }
}

document.querySelectorAll('.room').forEach(el => {
  el.onclick = () => selectRoom(el);
  el.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectRoom(el);
    }
  };
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') clearSelection();
});

// ══════════════════════════════════════════════════════════════════════════════
// Search
// ══════════════════════════════════════════════════════════════════════════════
function searchGear(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];
  Object.keys(EVENT_DATA.rooms).forEach(rid => {
    const data = getRoomDay(rid, currentDay);
    if (!data) return;
    const items = flattenItems(data);
    const matches = items.filter(it => {
      return it.name.toLowerCase().includes(q) ||
             (it.model && it.model.toLowerCase().includes(q)) ||
             (it.flag && it.flag.toLowerCase().includes(q));
    });
    if (matches.length > 0) {
      results.push({ roomId: rid, matches });
    }
  });
  return results;
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value;
  const countEl = document.getElementById('searchCount');

  if (!query) {
    countEl.classList.remove('visible');
    document.querySelectorAll('.room').forEach(r => {
      r.classList.remove('search-dim', 'search-match');
    });
    searchResults = [];
    switchPanel('room');
    return;
  }

  searchResults = searchGear(query);
  const total = searchResults.reduce((sum, r) => sum + r.matches.length, 0);

  countEl.textContent = `${total} found`;
  countEl.classList.add('visible');

  const matchedRooms = new Set(searchResults.map(r => r.roomId));
  document.querySelectorAll('.room').forEach(r => {
    const rid = r.dataset.room;
    if (matchedRooms.has(rid)) {
      r.classList.remove('search-dim');
      r.classList.add('search-match');
    } else {
      r.classList.add('search-dim');
      r.classList.remove('search-match');
    }
  });

  renderSearchResults();
  switchPanel('search');
}

document.getElementById('searchInput').oninput = handleSearch;

function renderSearchResults() {
  const container = document.getElementById('searchResults');
  if (searchResults.length === 0) {
    container.innerHTML = '<div class="detail-empty">No matches found</div>';
    return;
  }

  let html = `<div class="search-results-header">${searchResults.length} rooms with matches</div>`;
  searchResults.forEach(r => {
    const name = ROOM_LABELS[r.roomId] || r.roomId;
    const matchStr = r.matches.map(m => m.name).join(', ');
    html += `
      <div class="search-result-item" data-room="${r.roomId}">
        <span class="search-result-room">${name}</span>
        <div class="search-result-matches">${matchStr}</div>
      </div>
    `;
  });
  container.innerHTML = html;

  container.querySelectorAll('.search-result-item').forEach(item => {
    item.onclick = () => {
      const rid = item.dataset.room;
      const el = document.querySelector(`.room[data-room="${rid}"]`);
      if (el) selectRoom(el);
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Panel Tabs (Room / Pull Sheet)
// ══════════════════════════════════════════════════════════════════════════════
function switchPanel(view) {
  currentView = view;
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });

  document.getElementById('roomView').style.display = view === 'room' ? 'block' : 'none';
  document.getElementById('pullView').style.display = view === 'pull' ? 'block' : 'none';
  document.getElementById('searchResultsView').style.display = view === 'search' ? 'block' : 'none';

  if (view === 'pull') renderPullSheet();
}

document.querySelectorAll('.panel-tab').forEach(tab => {
  tab.onclick = () => switchPanel(tab.dataset.view);
});

// ══════════════════════════════════════════════════════════════════════════════
// Pull Sheet
// ══════════════════════════════════════════════════════════════════════════════
function renderPullSheet() {
  const container = document.getElementById('pullContent');

  const allItems = {};
  Object.keys(EVENT_DATA.rooms).forEach(rid => {
    const data = getRoomDay(rid, currentDay);
    if (!data) return;
    flattenItems(data).forEach(it => {
      const key = it.name + (it.model || '');
      if (!allItems[key]) {
        allItems[key] = { ...it, rooms: [] };
      }
      allItems[key].rooms.push(rid);
    });
  });

  const sorted = Object.values(allItems).sort((a, b) => a.name.localeCompare(b.name));

  let html = `
    <div class="pull-header">
      <div class="pull-title">Pull Sheet</div>
      <div class="pull-stats">${sorted.length} unique items</div>
    </div>
  `;

  sorted.forEach(it => {
    let setAll = true, testAll = true;
    it.rooms.forEach(rid => {
      const s = StateManager.getItemState(rid, it.name, currentDay);
      if (!s.set) setAll = false;
      if (!s.test) testAll = false;
    });

    const setClass = setAll ? 'set-done' : 'partial';
    const testClass = testAll ? 'test-done' : 'partial';

    const roomNames = it.rooms.map(rid => ROOM_LABELS[rid] || rid).join(', ');

    html += `
      <div class="pull-item">
        <div class="pull-check ${setClass}"></div>
        <div class="pull-check ${testClass}"></div>
        <div class="pull-item-name">${it.name}</div>
        <div class="pull-item-rooms">${roomNames}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════════════════════
// Tooltip
// ══════════════════════════════════════════════════════════════════════════════
const tooltip = document.getElementById('tooltip');

function showTooltip(el, text) {
  tooltip.textContent = text;
  tooltip.classList.add('visible');
  positionTooltip(el);
}

function positionTooltip(el) {
  const rect = el.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 8}px`;
  tooltip.style.transform = 'translate(-50%, -100%)';
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

document.querySelectorAll('.room').forEach(el => {
  el.onmouseenter = () => {
    const name = ROOM_LABELS[el.dataset.room] || el.dataset.room;
    showTooltip(el, name);
  };
  el.onmouseleave = hideTooltip;
});

// ══════════════════════════════════════════════════════════════════════════════
// URL Hash
// ══════════════════════════════════════════════════════════════════════════════
function updateHash() {
  const parts = [];
  if (currentDay !== 'all') parts.push(`day=${currentDay}`);
  if (selectedRoom) parts.push(`room=${selectedRoom}`);
  if (currentView !== 'room') parts.push(`view=${currentView}`);
  window.location.hash = parts.join('&');
}

function handleHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const day = params.get('day');
  const room = params.get('room');
  const view = params.get('view');

  if (day && day !== currentDay) setDay(day);
  if (view && view !== currentView) switchPanel(view);
  if (room) {
    const el = document.querySelector(`.room[data-room="${room}"]`);
    if (el) selectRoom(el);
  }
}

window.addEventListener('hashchange', handleHash);

// ══════════════════════════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════════════════════════
function init() {
  renderDayTabs();
  updateRoomStates();
  updateProgressRings();
  createRoomStatusBars();
  updateAllStatusBars();
  handleHash();

  const addr = EVENT_DATA.venue && EVENT_DATA.venue.address ? EVENT_DATA.venue.address : '';
  document.getElementById('venueAddr').textContent = addr;
}

init();
</script>