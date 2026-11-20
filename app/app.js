// Leonida Trophy Guide — boot, render, filters and the detail panel.
// Data: app/data/trophies.json (official names, descriptions and grades,
// plus this guide's own-word how-tos and sources). Progress: tracker.js.
// Roadmap: roadmap.js.
import { readProgress, writeProgress, downloadProgress, parseProgressFile } from './tracker.js';
import { ROADMAP, buildRoadmap } from './roadmap.js';

const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  side: 'Side quests',
  'open-world': 'Open world',
  money: 'Money',
  completion: '100% completion',
  online: 'Online',
};

const SOURCE_LINKS = [
  ['Official trophy list (PSN) via Exophase & PSNProfiles — as reported by planetgta6.com', 'https://www.planetgta6.com/en/gta-6-trophies/'],
  ['Push Square — GTA 6 Trophy Guide & Roadmap', 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap'],
  ['KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap', 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/'],
  ['gamemapa.com — All 55 GTA 6 Trophies', 'https://gamemapa.com/en/gta-6/guides/gta-6-trophy-achievement-list/'],
  ['Insider Gaming — Complete GTA 6 Trophy List', 'https://insider-gaming.com/complete-gta-6-trophy-list-how-to-get-all-trophies-achievements/'],
];

const params = new URLSearchParams(location.search);
const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
const knownIds = new Set(byId.keys());

const getEl = (id) => document.getElementById(id);
const listEl = getEl('trophyList');
const detailEl = getEl('trophyDetail');

let earned = readProgress();
for (const raw of (params.get('earned') ?? '').split(',')) {
  const id = Number(raw.trim());
  if (byId.has(id)) earned.add(id);
}
let selected = null;
let kindFilter = KIND_LABELS[params.get('filter')] ? params.get('filter') : 'all';
let gradeFilter = 'all';
let searchText = '';
let hideSpoilers = params.get('spoiler') !== 'off';
let earnedOnly = false;

function isSpoilerHidden(trophy) {
  return trophy.hidden && hideSpoilers && !earned.has(trophy.id);
}

function shownName(trophy) {
  return isSpoilerHidden(trophy) ? 'Hidden trophy' : trophy.name;
}

function shownDescription(trophy) {
  return isSpoilerHidden(trophy)
    ? 'Hidden on PlayStation until earned. Turn spoilers off, or earn it, to reveal it.'
    : trophy.description;
}

function kindMatches(trophy) {
  if (kindFilter === 'all') return true;
  if (kindFilter === 'online') return false;
  if (kindFilter === 'missable') return trophy.missable !== 'no';
  return trophy.kind === kindFilter;
}

function filteredTrophies() {
  const needle = searchText.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (!kindMatches(trophy)) return false;
    if (gradeFilter !== 'all' && trophy.grade !== gradeFilter) return false;
    if (earnedOnly && !earned.has(trophy.id)) return false;
    if (needle && !(trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase().includes(needle)) return false;
    return true;
  });
}

function renderProgress() {
  const done = trophies.filter((trophy) => earned.has(trophy.id)).length;
  getEl('progressFill').style.width = `${(done / trophies.length) * 100}%`;
  getEl('progressText').textContent = `${done} of ${trophies.length} earned — ${trophies.length - done} to go`;
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) if (earned.has(trophy.id)) byGrade[trophy.grade] += 1;
  getEl('progressByGrade').textContent =
    `Earned: ${byGrade.platinum} platinum · ${byGrade.gold} gold · ${byGrade.silver} silver · ${byGrade.bronze} bronze (of 1 platinum, 2 gold, 6 silver, 46 bronze)`;
}

function renderKindButtons() {
  const wrap = getEl('kindButtons');
  wrap.replaceChildren();
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kind-btn';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(kindFilter === key));
    button.addEventListener('click', () => {
      kindFilter = key;
      renderAll();
    });
    wrap.append(button);
  }
}

function makePill(text, extraClass) {
  const pill = document.createElement('span');
  pill.className = `pill${extraClass ? ` ${extraClass}` : ''}`;
  pill.textContent = text;
  return pill;
}

function renderList() {
  const shown = filteredTrophies();
  listEl.replaceChildren();
  getEl('onlineEmpty').hidden = kindFilter !== 'online';
  getEl('visibleCount').textContent = kindFilter === 'online'
    ? 'Showing 0 trophies — there are no online trophies in this game.'
    : `Showing ${shown.length} of ${trophies.length} trophies`;
  getEl('kindNote').textContent = kindFilter === 'missable'
    ? 'Missable filter: 1 community-reported risk + story trophies whose missable status is still unconfirmed. No verified missable list exists yet.'
    : '';
  for (const trophy of shown) {
    const row = document.createElement('li');
    if (earned.has(trophy.id)) row.classList.add('earned');
    if (selected === trophy.id) row.classList.add('selected');

    const head = document.createElement('div');
    head.className = 'row-head';
    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.checked = earned.has(trophy.id);
    tick.setAttribute('aria-label', `Mark ${shownName(trophy)} as earned`);
    tick.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(trophy);
    });
    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = shownName(trophy);
    const badge = document.createElement('span');
    badge.className = `grade grade-${trophy.grade}`;
    badge.textContent = trophy.grade;
    head.append(tick, name, badge);

    const desc = document.createElement('p');
    desc.className = 'row-desc';
    desc.textContent = shownDescription(trophy);

    const tags = document.createElement('div');
    tags.className = 'row-tags';
    tags.append(makePill(KIND_LABELS[trophy.kind] ?? trophy.kind));
    if (trophy.count) {
      tags.append(makePill(trophy.count_total ? `${trophy.count} of ${trophy.count_total}` : `×${trophy.count}`));
    }
    if (trophy.missable === 'reported') {
      tags.append(makePill('Possibly missable — see guide', 'pill-warn'));
    } else if (trophy.missable === 'unconfirmed') {
      tags.append(makePill('Missable status unconfirmed', 'pill-warn'));
    }
    if (trophy.hidden) tags.append(makePill('Hidden on PSN', 'pill-spoiler'));

    row.append(head, desc, tags);
    row.addEventListener('click', () => {
      selected = trophy.id;
      renderAll();
    });
    listEl.append(row);
  }
}

function renderDetail() {
  const trophy = byId.get(selected) ?? trophies[0];
  selected = trophy.id;
  detailEl.replaceChildren();
  const hidden = isSpoilerHidden(trophy);

  const badge = document.createElement('span');
  badge.className = `grade grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  const heading = document.createElement('h2');
  heading.textContent = shownName(trophy);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description: “${shownDescription(trophy)}”`;
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `Kind: ${KIND_LABELS[trophy.kind] ?? trophy.kind} · Difficulty: ${trophy.difficulty} · Time: ${trophy.time}`;
  const warn = document.createElement('p');
  warn.className = 'meta';
  if (trophy.missable !== 'no') warn.classList.add('meta-warn');
  warn.textContent = trophy.missable === 'reported'
    ? 'Missable warning: one spot in this set is reported missable by the community (unconfirmed). Do it early and keep a manual save.'
    : trophy.missable === 'unconfirmed'
      ? 'Missable status: unconfirmed — no verified missable list exists yet. Keep a manual save before big story missions.'
      : 'Missable: no — you can earn this at any time.';
  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'How to unlock it';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden ? 'Hidden until earned — turn spoilers off to read the guide.' : trophy.guide;
  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  const sourceList = document.createElement('ul');
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    item.textContent = source;
    sourceList.append(item);
  }
  const earnRow = document.createElement('label');
  earnRow.className = 'mark-earned';
  const tick = document.createElement('input');
  tick.type = 'checkbox';
  tick.checked = earned.has(trophy.id);
  tick.addEventListener('change', () => toggleEarned(trophy));
  earnRow.append(tick, document.createTextNode(earned.has(trophy.id) ? 'Earned — ticked off' : 'Mark as earned'));
  detailEl.append(badge, heading, official, meta, warn, guideHeading, guide, sourcesHeading, sourceList, earnRow);
}

function renderSources() {
  const list = getEl('sourceList');
  list.replaceChildren();
  for (const [label, href] of SOURCE_LINKS) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = href;
    link.rel = 'noopener';
    link.textContent = label;
    item.append(link);
    list.append(item);
  }
}

function toggleEarned(trophy) {
  if (earned.has(trophy.id)) earned.delete(trophy.id);
  else earned.add(trophy.id);
  writeProgress(earned);
  renderAll();
}

function renderAll() {
  renderProgress();
  renderKindButtons();
  renderList();
  renderDetail();
  buildRoadmap(getEl('roadmapList'), earned);
}

getEl('searchInput').addEventListener('input', (event) => {
  searchText = event.target.value;
  renderList();
});
getEl('gradeFilter').addEventListener('change', (event) => {
  gradeFilter = event.target.value;
  renderList();
});
getEl('spoilerToggle').checked = hideSpoilers;
getEl('spoilerToggle').addEventListener('change', (event) => {
  hideSpoilers = event.target.checked;
  renderAll();
});
getEl('earnedOnlyToggle').addEventListener('change', (event) => {
  earnedOnly = event.target.checked;
  renderList();
});
getEl('exportBtn').addEventListener('click', () => downloadProgress(earned));
getEl('importInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    earned = await parseProgressFile(file, knownIds);
    writeProgress(earned);
    renderAll();
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
  event.target.value = '';
});
getEl('clearBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    writeProgress(earned);
    renderAll();
  }
});

renderSources();
const openId = Number(params.get('open'));
if (byId.has(openId)) selected = openId;
renderAll();
// Compact view (?view=list): skip the header and roadmap, start at the tracker.
if (params.get('view') === 'list' || location.hash === '#list') {
  document.querySelector('.top').style.display = 'none';
  document.querySelector('.roadmap').style.display = 'none';
}
