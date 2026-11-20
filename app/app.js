// Leonida Trophy Guide: loads the trophy data and the roadmap, renders the
// checklist, and keeps the reader's progress in localStorage. No network
// request is made at run time beyond fetching this app's own two JSON files
// from the same server it was served from.

import { renderChecklist, renderDrawer, GRADE_LABELS } from "./lib/cards.js";
import { renderStages, renderChecklist100 } from "./lib/roadmap.js";
import {
  loadProgress,
  saveProgress,
  loadSpoilerPref,
  saveSpoilerPref,
  downloadProgress,
  readProgressFile,
  SAMPLE_EARNED,
} from "./lib/store.js";

const $ = (id) => document.getElementById(id);

const state = {
  trophies: [],
  roadmap: null,
  sourceUrls: {},
  earned: loadProgress(),
  hideSpoilers: loadSpoilerPref(),
  view: "checklist",
  query: "",
  kind: "all",
  grade: "all",
  show: "all",
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function trophyMatches(trophy) {
  const earned = state.earned.has(trophy.id);
  if (state.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  if (state.kind !== "all" && trophy.kind !== state.kind) return false;
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;
  if (state.show === "earned" && !earned) return false;
  if (state.show === "unearned" && earned) return false;
  if (state.show === "missable" && !trophy.missable) return false;
  if (state.show === "unconfirmed" && trophy.status !== "unconfirmed") return false;
  return true;
}

function renderAll() {
  const visible = state.trophies.filter(trophyMatches);
  renderChecklist($("trophyList"), visible, state.earned, state.hideSpoilers, openDrawer, toggleEarned);
  const total = state.trophies.length;
  const earnedCount = state.earned.size;
  $("earnedCount").textContent = String(earnedCount);
  $("progressBar").setAttribute("aria-valuenow", String(earnedCount));
  $("progressFill").style.width = total ? `${Math.round((earnedCount / total) * 100)}%` : "0%";
  const byGrade = {};
  for (const trophy of state.trophies) {
    if (state.earned.has(trophy.id)) byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  }
  $("gradeCounts").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => `${byGrade[g] || 0} ${GRADE_LABELS[g].toLowerCase()}`)
    .join(" · ");
  $("resultCount").textContent =
    visible.length === total
      ? `${total} trophies. Tick a card to mark it earned; click a card to read its guide.`
      : `${visible.length} of ${total} trophies match these filters.`;
  $("checklistView").hidden = state.view !== "checklist";
  $("roadmapView").hidden = state.view !== "roadmap";
  $("tabChecklist").classList.toggle("active", state.view === "checklist");
  $("tabRoadmap").classList.toggle("active", state.view === "roadmap");
}

function setView(view) {
  state.view = view === "roadmap" ? "roadmap" : "checklist";
  renderAll();
}

function openDrawer(trophyId) {
  const trophy = state.trophies.find((t) => t.id === trophyId);
  if (!trophy) return;
  renderDrawer($("drawerBody"), trophy, state.sourceUrls);
  $("drawer").hidden = false;
}

function closeDrawer() {
  $("drawer").hidden = true;
}

function toggleEarned(trophyId, earned) {
  if (earned) state.earned.add(trophyId);
  else state.earned.delete(trophyId);
  saveProgress(state.earned);
  renderAll();
}

function applyHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.get("view") === "roadmap") setView("roadmap");
  if (params.get("filter")) {
    const value = params.get("filter");
    if (["all", "earned", "unearned", "missable", "unconfirmed"].includes(value)) {
      state.show = value;
      $("stateFilter").value = value;
    }
  }
  if (params.get("kind")) {
    const value = params.get("kind");
    if ([...$("kindFilter").options].some((o) => o.value === value)) {
      state.kind = value;
      $("kindFilter").value = value;
    }
  }
  renderAll();
  const open = params.get("open");
  if (open) openDrawer(open);
}

function wireEvents() {
  $("searchBox").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderAll();
  });
  $("kindFilter").addEventListener("change", (event) => {
    state.kind = event.target.value;
    renderAll();
  });
  $("gradeFilter").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderAll();
  });
  $("stateFilter").addEventListener("change", (event) => {
    state.show = event.target.value;
    renderAll();
  });
  $("spoilerToggle").addEventListener("change", (event) => {
    state.hideSpoilers = event.target.checked;
    saveSpoilerPref(state.hideSpoilers);
    renderAll();
  });
  $("tabChecklist").addEventListener("click", () => setView("checklist"));
  $("tabRoadmap").addEventListener("click", () => setView("roadmap"));
  $("drawerClose").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });
  $("exportBtn").addEventListener("click", () => downloadProgress(state.earned, state.trophies.length));
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const imported = await readProgressFile(file);
      const known = new Set(state.trophies.map((t) => t.id));
      state.earned = new Set([...imported].filter((id) => known.has(id)));
      saveProgress(state.earned);
      renderAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "That file could not be imported.");
    }
    event.target.value = "";
  });
  $("sampleBtn").addEventListener("click", () => {
    state.earned = new Set(SAMPLE_EARNED);
    saveProgress(state.earned);
    renderAll();
  });
  $("clearBtn").addEventListener("click", () => {
    state.earned = new Set();
    saveProgress(state.earned);
    renderAll();
  });
  window.addEventListener("hashchange", applyHash);
}

function renderSources(listEl, sources) {
  listEl.replaceChildren();
  for (const source of sources) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = source.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = source.name;
    li.appendChild(a);
    listEl.appendChild(li);
  }
}

async function boot() {
  wireEvents();
  $("spoilerToggle").checked = state.hideSpoilers;
  const [trophyData, roadmapData] = await Promise.all([
    loadJson("data/trophies.json"),
    loadJson("data/roadmap.json"),
  ]);
  state.trophies = trophyData.trophies;
  state.roadmap = roadmapData;
  for (const source of trophyData.sources || []) state.sourceUrls[source.name] = source.url;
  renderStages($("stageList"), roadmapData.stages);
  renderChecklist100($("checklistBody"), roadmapData.checklist100);
  renderSources($("sourceList"), trophyData.sources || []);
  if (new URLSearchParams(location.search).get("sample") === "1") {
    state.earned = new Set(SAMPLE_EARNED);
  }
  applyHash();
}

boot().catch((err) => {
  $("resultCount").textContent = `The guide data could not be loaded: ${err.message}`;
});
