// Progress store: earned trophies live in localStorage only, on the reader's
// own machine. Nothing leaves the browser except when the reader presses
// Export, which downloads a plain JSON file they can carry elsewhere.

export const PROGRESS_KEY = "leonida-trophy-progress-v1";
export const SPOILER_KEY = "leonida-trophy-spoilers-v1";

// A dozen trophies the "Try sample progress" button ticks, so a first-time
// reader can see the tracker, the bar and the filters working before they
// have earned anything themselves. Cleared by "Clear all".
export const SAMPLE_EARNED = [
  "just-like-paradise",
  "paradise-lost",
  "t-ass-drug-money",
  "vice-city-baby",
  "trust",
  "master-of-none",
  "baited-my-tackle",
  "stick-fiddler",
  "whip-it-good",
  "treat-yo-self",
  "on-the-spot",
  "cunning-stunts",
];

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort()));
  } catch {
    // Private mode or a full store: the page still works, it just forgets.
  }
}

export function loadSpoilerPref() {
  try {
    return localStorage.getItem(SPOILER_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSpoilerPref(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? "1" : "0");
  } catch {
    // See saveProgress.
  }
}

export function downloadProgress(earned, total) {
  const payload = {
    app: "Leonida Trophy Guide",
    game: "Grand Theft Auto VI",
    platform: "PlayStation 5",
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    total,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gta6-trophy-progress.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readProgressFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error("No earned list in that file.");
        resolve(new Set(ids.filter((x) => typeof x === "string")));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("That file is not trophy progress."));
      }
    };
    reader.readAsText(file);
  });
}
