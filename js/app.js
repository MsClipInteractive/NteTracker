// ============================================================
// Configuration
// Adjust DAILY_RESET_HOUR_UTC if the game's reset time changes.
// 5 = 05:00 UTC = 13:00 CST (standard NtE reset time)
// ============================================================

const DAILY_RESET_HOUR_UTC = 5;

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
      'Apartment NPC interaction',
      'Bonds leveled (gifts) (10/10)',
      'Complete Daily Date (cinema)',
      'Check \'The Cafe by Origen\'',
      'Character Pixels (energy) spent',
      'Daily Quests (Annulith)',
      'Daily Quests (Battlepass)',
      'Chiz fonds generated',
      'Bonds fortune',
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
      'Anomaly Pilgrimage (Weekly Boss)',
      'Weekly Quests (Battlepass)',
    ],
  },
  {
    id: 'biweekly',
    label: 'Bi-Weekly',
    resetType: 'biweekly',
    color: '#ea580c',
    quests: [
      'Beyond the Rails - Prime Circle',
      'Pink Paws Heist',
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
 * Returns an integer index for the current bi-weekly period.
 * Reference anchor: 2026-01-05 05:00 UTC (a known Monday reset).
 * Every 14 days the index increments by 1.
 */
function getGameBiweeklyKey(now = new Date()) {
  const REFERENCE = new Date('2026-01-05T05:00:00Z');
  const adjusted = new Date(now.getTime() - DAILY_RESET_HOUR_UTC * 3_600_000);
  const daysSinceRef = (adjusted.getTime() - REFERENCE.getTime()) / 86_400_000;
  return Math.floor(daysSinceRef / 14);
}

function getCurrentKey(resetType) {
  if (resetType === 'daily') return getGameDayKey();
  if (resetType === 'weekly') return getGameWeekKey();
  if (resetType === 'biweekly') return String(getGameBiweeklyKey());
  return '';
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

  const progress = document.createElement('span');
  progress.className = 'card-progress';
  progress.textContent = `${done} / ${total}`;

  const resetBtn = document.createElement('button');
  resetBtn.className = 'reset-btn';
  resetBtn.title = 'Manuell zurücksetzen';
  resetBtn.textContent = '↺';
  resetBtn.addEventListener('click', () => onManualReset(category.id));

  header.appendChild(title);
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
