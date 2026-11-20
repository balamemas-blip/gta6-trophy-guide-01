// Leonida Trophy Guide — boot, render, filters and the detail panel.
// Data: app/data/trophies.json (official names, descriptions and grades,
// plus this guide's own-word how-tos and sources). Progress: tracker.js.
// Roadmap: roadmap.js.
import { readProgress, writeProgress, downloadProgress, parseProgressFile } from './tracker.js';
import { ROADMAP, buildRoadmap } from './roadmap.js';

const KIND_NAMES = {
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

const query = new URLSearchParams(location.search);
const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const knownIds = new Set(byId.keys());

const el = (id) => document.getElementById(id);
const listEl = el('trophyRows');
const detailEl = el('trophyDetail');

let earned = readProgress();
for (const raw of (query.get('earned') ?? '').split(',')) {
  const id = Number(raw.trim());
  if (byId.has(id)) earned.add(id);
}
let picked = null;
let kindFilter = KIND_NAMES[query.get('filter')] ? query.get('filter') : 'all';
let gradeFilter = 'all';
let searchText = '';
let hideSpoilers = query.get('spoiler') !== 'off';
let onlyEarned = false;

function spoilerHidden(trophy) {
  return trophy.hidden && hideSpoilers && !earned.has(trophy.id);
}

function displayName(trophy) {
  return spoilerHidden(trophy) ? 'Hidden trophy' : trophy.name;
}

function displayDescription(trophy) {
  return spoilerHidden(trophy)
    ? 'Hidden on PlayStation until earned. Turn spoilers off, or earn it, to reveal it.'
    : trophy.description;
}

function kindMatches(trophy) {
  if (kindFilter === 'all') return true;
  if (kindFilter === 'online') return false;
  if (kindFilter === 'missable') return trophy.missable !== 'no';
  return trophy.kind === kindFilter;
}

function visibleTrophies() {
  const needle = searchText.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!kindMatches(t)) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (onlyEarned && !earned.has(t.id)) return false;
    if (needle && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(needle)) return false;
    return true;
  });
}

function paintMeter() {
  const done = trophies.filter((t) => earned.has(t.id)).length;
  el('meterFill').style.width = `${(done / trophies.length) * 100}%`;
  el('meterLabel').textContent = `${done} of ${trophies.length} earned — ${trophies.length - done} to go`;
  const perGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.id)) perGrade[t.grade] += 1;
  el('meterGrades').textContent =
    `Earned: ${perGrade.platinum} platinum · ${perGrade.gold} gold · ${perGrade.silver} silver · ${perGrade.bronze} bronze (of 1 platinum, 2 gold, 6 silver, 46 bronze)`;
}

function paintChips() {
  const wrap = el('kindChips');
  wrap.replaceChildren();
  for (const [key, label] of Object.entries(KIND_NAMES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(kindFilter === key));
    button.addEventListener('click', () => {
      kindFilter = key;
      paintAll();
    });
    wrap.append(button);
  }
}

function tag(text, className) {
  const span = document.createElement('span');
  span.className = `tag${className ? ` ${className}` : ''}`;
  span.textContent = text;
  return span;
}

function paintList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  el('noOnline').hidden = kindFilter !== 'online';
  el('shownCount').textContent = kindFilter === 'online'
    ? 'Showing 0 trophies — there are no online trophies in this game.'
    : `Showing ${shown.length} of ${trophies.length} trophies`;
  el('filterHint').textContent = kindFilter === 'missable'
    ? 'Missable filter: 1 community-reported risk + story trophies whose missable status is still unconfirmed. No verified missable list exists yet.'
    : '';
  for (const trophy of shown) {
    const row = document.createElement('li');
    if (earned.has(trophy.id)) row.classList.add('earned');
    if (picked === trophy.id) row.classList.add('picked');

    const top = document.createElement('div');
    top.className = 'row-top';
    const tick = document.createElement('input');
    tick.type = 'checkbox';
    tick.checked = earned.has(trophy.id);
    tick.setAttribute('aria-label', `Mark ${displayName(trophy)} as earned`);
    tick.addEventListener('click', (event) => {
      event.stopPropagation();
      flipEarned(trophy);
    });
    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = displayName(trophy);
    const badge = document.createElement('span');
    badge.className = `grade grade-${trophy.grade}`;
    badge.textContent = trophy.grade;
    top.append(tick, name, badge);

    const desc = document.createElement('p');
    desc.className = 'row-desc';
    desc.textContent = displayDescription(trophy);

    const tags = document.createElement('div');
    tags.className = 'row-tags';
    tags.append(tag(KIND_NAMES[trophy.kind] ?? trophy.kind));
    if (trophy.count) {
      tags.append(tag(trophy.count_total ? `${trophy.count} of ${trophy.count_total}` : `×${trophy.count}`));
    }
    if (trophy.missable === 'reported') {
      tags.append(tag('Possibly missable — see guide', 'tag-warn'));
    } else if (trophy.missable === 'unconfirmed') {
      tags.append(tag('Missable status unconfirmed', 'tag-warn'));
    }
    if (trophy.hidden) tags.append(tag('Hidden on PSN', 'tag-spoiler'));

    row.append(top, desc, tags);
    row.addEventListener('click', () => {
      picked = trophy.id;
      paintAll();
    });
    listEl.append(row);
  }
}

function paintDetail() {
  const trophy = byId.get(picked) ?? trophies[0];
  picked = trophy.id;
  detailEl.replaceChildren();
  const hidden = spoilerHidden(trophy);

  const badge = document.createElement('span');
  badge.className = `grade grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  const heading = document.createElement('h2');
  heading.textContent = displayName(trophy);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description: “${displayDescription(trophy)}”`;
  const meta = document.createElement('p');
  meta.className = 'meta-line';
  meta.textContent = `Kind: ${KIND_NAMES[trophy.kind] ?? trophy.kind} · Difficulty: ${trophy.difficulty} · Time: ${trophy.time}`;
  const warn = document.createElement('p');
  warn.className = 'meta-line';
  if (trophy.missable !== 'no') warn.classList.add('warn-line');
  warn.textContent = trophy.missable === 'reported'
    ? 'Missable warning: one spot in this set is reported missable by the community (unconfirmed). Do it early and keep a manual save.'
    : trophy.missable === 'unconfirmed'
      ? 'Missable status: unconfirmed — no verified missable list exists yet. Keep a manual save before big story missions.'
      : 'Missable: no — you can earn this at any time.';
  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'How to unlock it';
  const guide = document.createElement('p');
  guide.className = 'guide-body';
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
  earnRow.className = 'earn-line';
  const tick = document.createElement('input');
  tick.type = 'checkbox';
  tick.checked = earned.has(trophy.id);
  tick.addEventListener('change', () => flipEarned(trophy));
  earnRow.append(tick, document.createTextNode(earned.has(trophy.id) ? 'Earned — ticked off' : 'Mark as earned'));
  detailEl.append(badge, heading, official, meta, warn, guideHeading, guide, sourcesHeading, sourceList, earnRow);
}

function paintSources() {
  const list = el('sourceLinks');
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

function flipEarned(trophy) {
  if (earned.has(trophy.id)) earned.delete(trophy.id);
  else earned.add(trophy.id);
  writeProgress(earned);
  paintAll();
}

function paintAll() {
  paintMeter();
  paintChips();
  paintList();
  paintDetail();
  buildRoadmap(el('roadmapSteps'), earned);
}

el('searchBox').addEventListener('input', (event) => {
  searchText = event.target.value;
  paintList();
});
el('gradeSelect').addEventListener('change', (event) => {
  gradeFilter = event.target.value;
  paintList();
});
el('spoilerSwitch').checked = hideSpoilers;
el('spoilerSwitch').addEventListener('change', (event) => {
  hideSpoilers = event.target.checked;
  paintAll();
});
el('earnedSwitch').addEventListener('change', (event) => {
  onlyEarned = event.target.checked;
  paintList();
});
el('exportButton').addEventListener('click', () => downloadProgress(earned));
el('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    earned = await parseProgressFile(file, knownIds);
    writeProgress(earned);
    paintAll();
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
  event.target.value = '';
});
el('resetButton').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    writeProgress(earned);
    paintAll();
  }
});

paintSources();
const openId = Number(query.get('open'));
if (byId.has(openId)) picked = openId;
paintAll();
// Compact view (?view=list): skip the masthead and roadmap, start at the tracker.
if (query.get('view') === 'list' || location.hash === '#list') {
  document.querySelector('.masthead').style.display = 'none';
  document.querySelector('.roadmap-block').style.display = 'none';
}
