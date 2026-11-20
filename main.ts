// Leonida Trophy Guide — entrypoint for make.fun's gta6-trophy-guide-01.
// Node 22, standard library only. It hands the guide in: it copies this
// repository's app/ (the offline guide) and screenshots/ (four renders of
// it) into the output directory and writes dossier.json there, using the
// vendored make.fun library so the scorer can rebuild the same dossier
// byte for byte from the same files.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The guide itself is plain static files: app/index.html opens in desktop
// Chrome from any static server, works with the network off, and keeps its
// trophy data in app/data/trophies.json (55 trophies, each with its official
// name, description and grade, a guide in our own words, and its sources).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The scorer's own caps, as the kit's RULES.txt states them: at most 4
// screenshots of 256 KiB each, at most 993 files / 48 MiB under app/, and
// a dossier text of at most 160 KiB. We check the cheap ones ourselves
// before the library does, so a mistake fails here with a plain message.
const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 262144;
const MAX_APP_FILES = 993;
const MAX_APP_BYTES = 50331648;
const DOSSIER_TEXT_MAX_BYTES = 163840;

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function countAppFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countAppFiles(path);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(path).size;
    } else {
      throw new Error(`app/ holds a non-file entry: ${path}`);
    }
  }
  return { files, bytes };
}

function checkInputs() {
  const appDir = join(repoRoot, "app");
  const shotsDir = join(repoRoot, "screenshots");
  if (!existsSync(join(appDir, "index.html"))) throw new Error("app/index.html is missing");
  if (!existsSync(join(appDir, "data", "trophies.json"))) throw new Error("app/data/trophies.json is missing");
  const app = countAppFiles(appDir);
  if (app.files > MAX_APP_FILES) throw new Error(`app/ holds ${app.files} files, over the ${MAX_APP_FILES} cap`);
  if (app.bytes > MAX_APP_BYTES) throw new Error(`app/ is ${app.bytes} bytes, over the ${MAX_APP_BYTES} cap`);
  if (!existsSync(shotsDir)) throw new Error("screenshots/ is missing");
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith("."));
  if (shots.length < 3 || shots.length > MAX_SCREENSHOTS) {
    throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);
  }
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > MAX_SCREENSHOT_BYTES) throw new Error(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
  }
}

function handIn() {
  checkInputs();
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
  mkdirSync(join(outDir, "screenshots"), { recursive: true });
  cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });
  const dossier = buildDossier(outDir, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SCREENSHOT_BYTES },
    app_max_files: MAX_APP_FILES,
    app_max_bytes: MAX_APP_BYTES,
  });
  writeFileSync(join(outDir, "dossier.json"), dossier);
  const shots = readdirSync(join(outDir, "screenshots")).filter((name) => !name.startsWith("."));
  const app = countAppFiles(join(outDir, "app"));
  console.log(
    `Handed in: app/ (${app.files} files, ${app.bytes} bytes), ` +
      `screenshots/ (${shots.length}: ${shots.join(", ")}), ` +
      `dossier.json (${dossier.length} bytes) -> ${outDir}`,
  );
}

handIn();
