// Earned-trophy state for the tracker. Everything lives in the browser's
// localStorage under one key; export writes a JSON file and import reads it
// back. Nothing is sent anywhere — the guide works with the network off.
export const PROGRESS_KEY = 'gta6-trophy-guide-progress-v2';
export const EXPORT_FILENAME = 'gta6-trophy-progress.json';

// Read the saved set of earned trophy ids. A missing, corrupt or
// wrong-shaped value is treated as empty rather than crashing the page.
export function readProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((v) => Number.isInteger(v)));
  } catch {
    return new Set();
  }
}

// Persist the earned set, ids sorted so the stored file is stable.
export function writeProgress(earned) {
  const ids = [...earned].filter((v) => Number.isInteger(v)).sort((a, b) => a - b);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
}

// Download the earned ids as a JSON file the import below can read back.
export function downloadProgress(earned) {
  const payload = JSON.stringify(
    { game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) },
    null,
    2,
  );
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  link.click();
  URL.revokeObjectURL(url);
}

// Read an exported progress file and return its earned-id set. Unknown ids
// are dropped when the caller passes the trophy list's ids; without it they
// are kept, so an export from a newer list still imports.
export async function parseProgressFile(file, knownIds) {
  const parsed = JSON.parse(await file.text());
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('That file does not hold a trophy list.');
  const wanted = ids.filter((v) => Number.isInteger(v));
  const kept = knownIds ? wanted.filter((v) => knownIds.has(v)) : wanted;
  return new Set(kept);
}
