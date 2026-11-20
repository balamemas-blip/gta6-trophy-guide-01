// Leonida Trophy Guide — boot, render, filters and the detail panel.
// Data: app/data/trophies.json (official names, descriptions, grades plus
// this guide's own-word how-tos and sources). Progress: tracker.js.
import { loadEarned, saveEarned, exportEarned, importEarnedFile } from './tracker.js';
import { renderRoadmap } from './roadmap.js';

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
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

let earned = loadEarned();
if (params.get('earned')) {
  for (const id of params.get('earned').split(',')) {
    const t = trophies.find((x) => String(x.id) === id.trim());
    if (t) earned.add(t.name);
  }
}

let selected = null;
let kind = params.get('filter') && KIND_LABELS[params.get('filter')] ? params.get('filter') : 'all';
let grade = 'all';
let query = '';
let hideSpoilers = params.get('spoiler') !== 'off';
let earnedOnly = false;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detail');

function isHiddenFromReader(t) {
  return t.hidden && hideSpoilers && !earned.has(t.name);
}

function visibleName(t) {
  return isHiddenFromReader(t) ? 'Hidden trophy' : t.name;
}

function visibleDescription(t) {
  return isHiddenFromReader(t) ? 'Hidden on PlayStation until earned. Turn spoilers off, or earn it, to reveal it.' : t.description;
}

function matchesKind(t) {
  if (kind === 'all') return true;
  if (kind === 'online') return false;
  if (kind === 'missable') return t.missable !== 'no';
  return t.kind === kind;
}

function filteredTrophies() {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!matchesKind(t)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (earnedOnly && !earned.has(t.name)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderProgress() {
  const done = trophies.filter((t) => earned.has(t.name)).length;
  $('progressFill').style.width = `${(done / trophies.length) * 100}%`;
  $('progressText').textContent = `${done} of ${trophies.length} earned — ${trophies.length - done} to go`;
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.name)) counts[t.grade]++;
  $('gradeCounts').textContent = `Earned: ${counts.platinum} platinum · ${counts.gold} gold · ${counts.silver} silver · ${counts.bronze} bronze (of 1 platinum, 2 gold, 6 silver, 46 bronze)`;
}

function renderChips() {
  const wrap = $('kindFilters');
  wrap.replaceChildren();
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = label;
    b.setAttribute('aria-pressed', String(kind === key));
    b.addEventListener('click', () => {
      kind = key;
      render();
    });
    wrap.append(b);
  }
}

function renderList() {
  const shown = filteredTrophies();
  listEl.replaceChildren();
  $('emptyState').hidden = kind !== 'online';
  $('listCount').textContent = kind === 'online'
    ? 'Showing 0 trophies — there are no online trophies in this game.'
    : `Showing ${shown.length} of ${trophies.length} trophies`;
  $('filterNote').textContent = kind === 'missable'
    ? 'Missable filter: 1 community-reported risk + story trophies whose missable status is still unconfirmed. No verified missable list exists yet.'
    : '';
  for (const t of shown) {
    const li = document.createElement('li');
    if (earned.has(t.name)) li.classList.add('earned');
    if (selected === t.name) li.classList.add('selected');
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${visibleName(t)} as earned`);
    box.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEarned(t);
    });
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = visibleName(t);
    const gradeBadge = document.createElement('span');
    gradeBadge.className = `grade grade-${t.grade}`;
    gradeBadge.textContent = t.grade;
    head.append(box, name, gradeBadge);
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = visibleDescription(t);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = KIND_LABELS[t.kind] ?? t.kind;
    tags.append(kindTag);
    if (t.missable === 'reported') {
      const m = document.createElement('span');
      m.className = 'tag tag-missable';
      m.textContent = '⚠ Possibly missable — see guide';
      tags.append(m);
    } else if (t.missable === 'unconfirmed') {
      const m = document.createElement('span');
      m.className = 'tag tag-missable';
      m.textContent = 'Missable status unconfirmed';
      tags.append(m);
    }
    if (t.hidden) {
      const s = document.createElement('span');
      s.className = 'tag tag-spoiler';
      s.textContent = 'Hidden on PSN';
      tags.append(s);
    }
    li.append(head, desc, tags);
    li.addEventListener('click', () => {
      selected = t.name;
      render();
    });
    listEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.name === selected) ?? trophies[0];
  selected = t.name;
  detailEl.replaceChildren();
  const hidden = isHiddenFromReader(t);
  const h = document.createElement('h2');
  h.textContent = visibleName(t);
  const badge = document.createElement('span');
  badge.className = `grade grade-${t.grade}`;
  badge.textContent = t.grade;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description: “${visibleDescription(t)}”`;
  const meta = document.createElement('p');
  meta.textContent = `Kind: ${KIND_LABELS[t.kind] ?? t.kind} · Difficulty: ${t.difficulty} · Time: ${t.time}`;
  const miss = document.createElement('p');
  miss.textContent = t.missable === 'reported'
    ? '⚠ Missable warning: one spot in this set is reported missable by the community (unconfirmed). Do it early and keep a manual save.'
    : t.missable === 'unconfirmed'
      ? 'Missable status: unconfirmed — no verified missable list exists yet. Keep a manual save before big story missions.'
      : 'Missable: no — you can earn this at any time.';
  const guideTitle = document.createElement('h3');
  guideTitle.textContent = 'How to unlock it';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden ? 'Hidden until earned — turn spoilers off to read the guide.' : t.guide;
  const srcTitle = document.createElement('h3');
  srcTitle.textContent = 'Sources';
  const srcList = document.createElement('ul');
  for (const s of t.sources) {
    const li = document.createElement('li');
    li.textContent = s;
    srcList.append(li);
  }
  const earnRow = document.createElement('label');
  earnRow.className = 'earn-row';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.addEventListener('change', () => toggleEarned(t));
  earnRow.append(box, document.createTextNode(earned.has(t.name) ? 'Earned — ticked off' : 'Mark as earned'));
  detailEl.append(badge, h, official, meta, miss, guideTitle, guide, srcTitle, srcList, earnRow);
}

function toggleEarned(t) {
  if (earned.has(t.name)) earned.delete(t.name);
  else earned.add(t.name);
  saveEarned(earned);
  render();
}

function renderSources() {
  const ul = $('sourceList');
  ul.replaceChildren();
  for (const [label, href] of SOURCE_LINKS) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.rel = 'noopener';
    a.textContent = label;
    li.append(a);
    ul.append(li);
  }
}

function render() {
  renderProgress();
  renderChips();
  renderList();
  renderDetail();
}

$('search').addEventListener('input', (e) => {
  query = e.target.value;
  renderList();
});
$('gradeFilter').addEventListener('change', (e) => {
  grade = e.target.value;
  renderList();
});
$('spoilerToggle').checked = hideSpoilers;
$('spoilerToggle').addEventListener('change', (e) => {
  hideSpoilers = e.target.checked;
  render();
});
$('earnedOnly').addEventListener('change', (e) => {
  earnedOnly = e.target.checked;
  renderList();
});
$('exportBtn').addEventListener('click', () => exportEarned(earned));
$('importInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    earned = await importEarnedFile(file);
    saveEarned(earned);
    render();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveEarned(earned);
    render();
  }
});

renderRoadmap($('roadmapList'));
renderSources();
if (params.get('open')) {
  const t = trophies.find((x) => String(x.id) === params.get('open'));
  if (t) selected = t.name;
}
render();
// Deep link for screenshots and sharing: ?view=list jumps to the checklist.
if (params.get('view') === 'list' || location.hash === '#list') {
  document.body.classList.add('compact');
}
