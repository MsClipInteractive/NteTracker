// ============================================================
// Configuration
// Adjust DAILY_RESET_HOUR_UTC if the game's reset time changes.
// 4 = 04:00 UTC = 12:00 CST (standard NtE reset time)
// ============================================================

const DAILY_RESET_HOUR_UTC = 4;

// Bi-weekly (Monday) reference anchor: 2026-01-05 – "Pink Paws Heist"
// BIWEEKLY_REF_KEY  – used for period-index calculation (adjusted midnight UTC)
// BIWEEKLY_REF_WALL – actual wall-clock moment of that reset (includes DAILY_RESET_HOUR_UTC offset)
const BIWEEKLY_REF_KEY = new Date('2026-01-05T00:00:00Z');
const BIWEEKLY_REF_WALL = new Date('2026-01-05T04:00:00Z');

// Bi-weekly (Thursday) reference anchor: 2026-06-04 – "Beyond the Rails - Prime Circle"
const BIWEEKLY_THU_REF_KEY = new Date('2026-06-04T00:00:00Z');
const BIWEEKLY_THU_REF_WALL = new Date('2026-06-04T04:00:00Z');

// ============================================================
// Quest data
// To add/remove quests, edit the `quests` arrays below.
// ============================================================

const CATEGORIES = [
  {
    id: 'daily',
    label: 'Daily',
    resetType: 'daily',
    color: '#7c3aed',
    quests: [
      'Nacupeda\'s Pool wish',
      'Apartment Beetle Coin box',
      'Apartment Hamster Ball (Module)',
      'Bonds leveled (gifts) (10/10)',
      'Complete Daily Date (cinema)',
      'Check \'The Cafe by Origen\'',
      'Character Pixels (energy) spent',
      'Daily Quests (Annulith)',
      'Daily Quests (Battlepass)',
      'Bagel interactions (View 5 posts, like 3 posts, comment on 3 posts)',
    ],
  },
  {
    id: 'weekly',
    label: 'Weekly',
    resetType: 'weekly',
    color: '#0d9488',
    quests: [
      'Auction House',
      'Realm of Greed (Mammon)',
      'Apartment loot cloud anomaly',
      'City Stamina (energy) spent',
      'Special weekly delivery (reset at 23:00 CEST)',
      'Anomaly Pilgrimage (Weekly Boss)',
      'Weekly Quests (Battlepass)',
    ],
  },
  {
    id: 'biweekly',
    label: 'Bi-Weekly (Monday)',
    resetType: 'biweekly',
    color: '#ea580c',
    quests: [
      'Pink Paws Heist',
    ],
  },
  {
    id: 'biweekly-thu',
    label: 'Bi-Weekly (Thursday)',
    resetType: 'biweekly-thu',
    color: '#ea580c',
    quests: [
      'Beyond the Rails - Prime Circle',
    ],
  },
];

// ============================================================
// Reset key helpers
// Each helper returns a string/number that is the same for the
// entire current reset period. If it differs from the stored
// value, the period has rolled over and checks are cleared.
// ============================================================

/**
 * Returns the current "game day" as YYYY-MM-DD.
 * Before DAILY_RESET_HOUR_UTC UTC the previous day's key is returned,
 * because the daily reset has not happened yet.
 */
function getGameDayKey(now = new Date()) {
  const adjusted = new Date(now.getTime() - DAILY_RESET_HOUR_UTC * 3_600_000);
  return adjusted.toISOString().slice(0, 10);
}

/**
 * Returns the Monday date (YYYY-MM-DD) that started the current game week.
 * The weekly reset also happens at DAILY_RESET_HOUR_UTC UTC on Monday.
 */
function getGameWeekKey(now = new Date()) {
  const adjusted = new Date(now.getTime() - DAILY_RESET_HOUR_UTC * 3_600_000);
  const day = adjusted.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysToLastMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(adjusted);
  monday.setUTCDate(adjusted.getUTCDate() - daysToLastMonday);
  return monday.toISOString().slice(0, 10);
}

/**
 * Returns an integer index for the current bi-weekly period (Monday reset).
 * Reference anchor: 2026-01-05 00:00 UTC (adjusted midnight = 04:00 UTC real time).
 * Every 14 days the index increments by 1.
 */
function getGameBiweeklyKey(now = new Date()) {
  const REFERENCE = BIWEEKLY_REF_KEY;
  const adjusted = new Date(now.getTime() - DAILY_RESET_HOUR_UTC * 3_600_000);
  const daysSinceRef = (adjusted.getTime() - REFERENCE.getTime()) / 86_400_000;
  return Math.floor(daysSinceRef / 14);
}

/**
 * Returns an integer index for the current bi-weekly period (Thursday reset).
 * Reference anchor: 2026-06-04 00:00 UTC (adjusted midnight = 04:00 UTC real time).
 * Every 14 days the index increments by 1.
 */
function getGameBiweeklyThuKey(now = new Date()) {
  const adjusted = new Date(now.getTime() - DAILY_RESET_HOUR_UTC * 3_600_000);
  const daysSinceRef = (adjusted.getTime() - BIWEEKLY_THU_REF_KEY.getTime()) / 86_400_000;
  return Math.floor(daysSinceRef / 14);
}

function getCurrentKey(resetType) {
  if (resetType === 'daily') return getGameDayKey();
  if (resetType === 'weekly') return getGameWeekKey();
  if (resetType === 'biweekly') return String(getGameBiweeklyKey());
  if (resetType === 'biweekly-thu') return String(getGameBiweeklyThuKey());
  return '';
}

/**
 * Returns the Date of the next reset for the given reset type.
 */
function getNextResetDate(resetType, now = new Date()) {
  if (resetType === 'daily') {
    const next = new Date(now);
    next.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  if (resetType === 'weekly') {
    const next = new Date(now);
    next.setUTCHours(DAILY_RESET_HOUR_UTC, 0, 0, 0);
    const day = next.getUTCDay(); // 0=Sun, 1=Mon
    const daysToAdd = day === 1 ? (next <= now ? 7 : 0) : (8 - day) % 7 || 7;
    next.setUTCDate(next.getUTCDate() + daysToAdd);
    return next;
  }
  if (resetType === 'biweekly') {
    const currentKey = getGameBiweeklyKey(now);
    return new Date(BIWEEKLY_REF_WALL.getTime() + (currentKey + 1) * 14 * 86_400_000);
  }
  if (resetType === 'biweekly-thu') {
    const currentKey = getGameBiweeklyThuKey(now);
    return new Date(BIWEEKLY_THU_REF_WALL.getTime() + (currentKey + 1) * 14 * 86_400_000);
  }
  return null;
}

/**
 * Formats the next reset time for display.
 * Daily: local HH:mm. Weekly/Bi-Weekly: relative Xd Yh.
 */
function formatNextReset(resetType, now = new Date()) {
  const next = getNextResetDate(resetType, now);
  if (!next) return '';
  const diffMs = next - now;
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ============================================================
// localStorage helpers
// ============================================================

function storageKey(categoryId, suffix) {
  return `nte_${categoryId}_${suffix}`;
}

function loadChecks(categoryId) {
  try {
    const raw = localStorage.getItem(storageKey(categoryId, 'checks'));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChecks(categoryId, checks) {
  localStorage.setItem(storageKey(categoryId, 'checks'), JSON.stringify(checks));
}

function loadLastReset(categoryId) {
  return localStorage.getItem(storageKey(categoryId, 'lastReset'));
}

function saveLastReset(categoryId, key) {
  localStorage.setItem(storageKey(categoryId, 'lastReset'), String(key));
}

// ============================================================
// Auto-reset on period rollover
// ============================================================

function checkAndAutoReset(category) {
  const currentKey = getCurrentKey(category.resetType);
  if (loadLastReset(category.id) !== currentKey) {
    saveChecks(category.id, {});
    saveLastReset(category.id, currentKey);
  }
}

// ============================================================
// Rendering
// ============================================================

function renderAll() {
  const container = document.getElementById('categories');
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    checkAndAutoReset(cat);
    container.appendChild(buildCard(cat));
  });

  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('de-DE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
}

function buildCard(category) {
  const checks = loadChecks(category.id);
  const total = category.quests.length;
  const done = Object.values(checks).filter(Boolean).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  const card = document.createElement('section');
  card.className = 'card';
  card.style.setProperty('--accent', category.color);

  // Header
  const header = document.createElement('div');
  header.className = 'card-header';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = category.label;

  const nextReset = document.createElement('span');
  nextReset.className = 'card-progress card-next-reset';
  nextReset.title = 'Nächster Reset';
  nextReset.textContent = `↻ ${formatNextReset(category.resetType)}`;

  const progress = document.createElement('span');
  progress.className = 'card-progress';
  progress.textContent = `${done} / ${total}`;

  const resetBtn = document.createElement('button');
  resetBtn.className = 'reset-btn';
  resetBtn.title = 'Manuell zurücksetzen';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', () => onManualReset(category.id));

  header.appendChild(title);
  header.appendChild(nextReset);
  header.appendChild(progress);
  header.appendChild(resetBtn);

  // Progress bar
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  fill.style.width = `${pct}%`;
  bar.appendChild(fill);

  // Quest list
  const list = document.createElement('ul');
  list.className = 'quest-list';

  category.quests.forEach((quest, i) => {
    const li = document.createElement('li');
    li.className = 'quest-item' + (checks[i] ? ' checked' : '');

    const label = document.createElement('label');
    const inputId = `${category.id}-quest-${i}`;
    label.htmlFor = inputId;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = inputId;
    checkbox.checked = !!checks[i];
    checkbox.addEventListener('change', e => onCheck(category.id, i, e.target.checked));

    const span = document.createElement('span');
    span.className = 'quest-label';
    span.textContent = quest;

    label.appendChild(checkbox);
    label.appendChild(span);
    li.appendChild(label);
    list.appendChild(li);
  });

  card.appendChild(header);
  card.appendChild(bar);
  card.appendChild(list);
  return card;
}

// ============================================================
// Event handlers
// ============================================================

function onCheck(categoryId, index, checked) {
  const checks = loadChecks(categoryId);
  checks[index] = checked;
  saveChecks(categoryId, checks);
  renderAll();
}

function onManualReset(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  saveChecks(categoryId, {});
  saveLastReset(categoryId, getCurrentKey(cat.resetType));
  renderAll();
}

// ============================================================
// Init
// ============================================================

document.addEventListener('DOMContentLoaded', renderAll);
