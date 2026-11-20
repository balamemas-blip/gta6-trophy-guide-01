// Trophy cards and the guide drawer: everything the reader sees of one
// trophy, from its official name and description to its guide and sources.

export const GRADE_LABELS = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };
export const KIND_LABELS = {
  story: "Story",
  side: "Side characters",
  collectible: "Collectibles",
  activity: "Activities",
  robbery: "Robberies",
  money: "Money & property",
  mischief: "Open-world mischief",
  completion: "Completion",
};

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function targetText(trophy) {
  if (!trophy.target) return "";
  const { need, of } = trophy.target;
  if (typeof need === "number" && need >= 1000) return `Target: ${need.toLocaleString("en-US")}`;
  if (typeof of === "number") return `Target: ${need} of ${of}`;
  return "";
}

function chipsFor(trophy, earned) {
  const chips = [`<span class="chip ${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>`];
  chips.push(`<span class="chip kind">${KIND_LABELS[trophy.kind] || trophy.kind}</span>`);
  if (trophy.hidden) chips.push(`<span class="chip hidden">Hidden on PSN</span>`);
  if (trophy.missable) chips.push(`<span class="chip missable">Potentially missable</span>`);
  if (trophy.status === "unconfirmed") chips.push(`<span class="chip unconfirmed">Unconfirmed</span>`);
  if (earned) chips.push(`<span class="chip">Earned</span>`);
  return chips.join("");
}

// A hidden story trophy stays masked while spoilers are hidden and it is
// not yet earned: the reader sees only that a hidden trophy exists.
export function displayName(trophy, hideSpoilers, earned) {
  if (hideSpoilers && trophy.hidden && !earned) return "Hidden trophy";
  return trophy.name;
}

export function displayDescription(trophy, hideSpoilers, earned) {
  if (hideSpoilers && trophy.hidden && !earned) return "Hidden on PlayStation until earned.";
  return trophy.description;
}

export function cardElement(trophy, earned, hideSpoilers, onOpen, onToggle) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card" + (earned ? " earned" : "");
  button.dataset.trophyId = trophy.id;
  const target = targetText(trophy);
  button.innerHTML =
    `<span class="card-top">` +
    `<input type="checkbox" ${earned ? "checked" : ""} aria-label="Mark ${escapeHtml(displayName(trophy, hideSpoilers, earned))} as earned">` +
    `<h3>${escapeHtml(displayName(trophy, hideSpoilers, earned))}</h3></span>` +
    `<span class="chips">${chipsFor(trophy, earned)}</span>` +
    `<p class="desc">${escapeHtml(displayDescription(trophy, hideSpoilers, earned))}</p>` +
    (target ? `<p class="target">${escapeHtml(target)}</p>` : "");
  const box = button.querySelector('input[type="checkbox"]');
  box.addEventListener("click", (event) => {
    event.stopPropagation();
    onToggle(trophy.id, box.checked);
  });
  button.addEventListener("click", (event) => {
    if (event.target === box) return;
    onOpen(trophy.id);
  });
  li.appendChild(button);
  return li;
}

export function renderChecklist(listEl, trophies, earned, hideSpoilers, onOpen, onToggle) {
  listEl.replaceChildren();
  for (const trophy of trophies) {
    listEl.appendChild(cardElement(trophy, earned.has(trophy.id), hideSpoilers, onOpen, onToggle));
  }
}

function sourceLinks(trophy, sourceUrls) {
  const names = trophy.sources && trophy.sources.length ? trophy.sources : ["Push Square"];
  return names
    .map((name) => {
      const url = sourceUrls[name];
      return url
        ? `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a></li>`
        : `<li>${escapeHtml(name)}</li>`;
    })
    .join("");
}

export function renderDrawer(bodyEl, trophy, sourceUrls) {
  const target = targetText(trophy);
  const warn =
    trophy.status === "unconfirmed"
      ? `<p class="warn danger-box"><strong>UNCONFIRMED.</strong> No guide has verified how this trophy pops yet. The method in this guide is the best current reading, not a confirmed fact — do not burn hours on it until two guides agree.</p>`
      : "";
  const missable =
    trophy.missable
      ? `<p class="warn"><strong>Potentially missable.</strong> This is the one trophy the guides flag: do the balcony meditation with Lucia in Chapter 1, before the chapter ends.</p>`
      : "";
  bodyEl.innerHTML =
    `<div class="chips">${chipsFor(trophy, false)}</div>` +
    `<h2>${escapeHtml(trophy.name)}</h2>` +
    `<p class="desc">&ldquo;${escapeHtml(trophy.description)}&rdquo;</p>` +
    (target ? `<p class="target">${escapeHtml(target)}</p>` : "") +
    warn + missable +
    `<h4>Guide</h4><p class="guide">${escapeHtml(trophy.guide)}</p>` +
    `<h4>Sources</h4><ul>${sourceLinks(trophy, sourceUrls)}</ul>` +
    `<h4>Roadmap</h4><p class="muted">Stage ${trophy.roadmap} of the platinum roadmap. Kind: ${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}.</p>`;
}
