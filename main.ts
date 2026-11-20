// GTA VI trophy guide — the entrypoint (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html, style.css,
// app.js, tracker.js, roadmap.js and the trophy data in
// app/data/trophies.json. Any static file server can host it and it works
// with the network off. This program is the handover: it first checks the
// guide is complete (all 55 trophies with a guide each, 3–4 screenshots
// inside the size cap), then copies app/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there with the
// vendored make.fun library, exactly as the scorer rebuilds it.
// vendor/makefun-frontend.ts is the kit's copy and must stay unchanged.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SHOT_BYTES = 262144;
const EXPECTED_TROPHIES = 55;

// Pre-flight: the guide and its screenshots are the entry, so refuse to
// hand in an incomplete one rather than silently producing a thin dossier.
function checkGuideComplete() {
  for (const folder of ['app', 'screenshots']) {
    if (!existsSync(join(repoRoot, folder))) {
      throw new Error(`missing ${folder}/ beside main.ts — run from the repository root`);
    }
  }
  const data = JSON.parse(readFileSync(join(repoRoot, 'app', 'data', 'trophies.json'), 'utf8'));
  const trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== EXPECTED_TROPHIES) {
    throw new Error(`expected ${EXPECTED_TROPHIES} trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
  }
  for (const trophy of trophies) {
    if (typeof trophy.name !== 'string' || !trophy.name.trim()) {
      throw new Error('a trophy is missing its official name');
    }
    if (typeof trophy.guide !== 'string' || !trophy.guide.trim()) {
      throw new Error(`trophy ${trophy.name} has no guide`);
    }
  }
  const shots = readdirSync(join(repoRoot, 'screenshots')).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`expected 3–4 screenshots, found ${shots.length}`);
  }
  for (const shot of shots) {
    const size = statSync(join(repoRoot, 'screenshots', shot)).size;
    if (size > MAX_SHOT_BYTES) throw new Error(`screenshot ${shot} is ${size} bytes, over the 256 KiB cap`);
  }
  return shots.length;
}

const shotCount = checkGuideComplete();

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

// Caps mirror the gate: at most 4 screenshots of 256 KiB each, app/ at most
// 993 files and directories and 48 MiB, dossier text at most 160 KiB.
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: MAX_SHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Post-write check: the dossier is the entry's hand-in, so confirm it landed
// and report its size alongside the screenshot count.
const dossierSize = statSync(dossierPath).size;
console.log(`wrote ${outputDir} — app/ + ${shotCount} screenshots + dossier.json (${dossierSize} bytes)`);
