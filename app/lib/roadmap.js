// The platinum roadmap: four stages in order, plus the full 100% Completion
// checklist that A Long Road asks for.

export function renderStages(listEl, stages) {
  listEl.replaceChildren();
  for (const stage of stages) {
    const li = document.createElement("li");
    const title = document.createElement("h3");
    const step = document.createElement("span");
    step.className = "step";
    step.textContent = `Stage ${stage.id}`;
    title.append(step, document.createTextNode(stage.title));
    const hours = document.createElement("p");
    hours.className = "hours";
    hours.textContent = `${stage.hours} hours`;
    const summary = document.createElement("p");
    summary.textContent = stage.summary;
    const trophies = document.createElement("p");
    trophies.className = "trophies";
    trophies.textContent = `Trophies: ${stage.trophies}`;
    li.append(title, hours, summary, trophies);
    listEl.appendChild(li);
  }
}

export function renderChecklist100(tbodyEl, items) {
  tbodyEl.replaceChildren();
  for (const item of items) {
    const row = document.createElement("tr");
    const what = document.createElement("td");
    what.textContent = item.what;
    const need = document.createElement("td");
    need.textContent = item.need;
    row.append(what, need);
    tbodyEl.appendChild(row);
  }
}
