// GTA VI trophy guide — the entrypoint (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html, style.css,
// app.js, tracker.js, roadmap.js and the trophy data in
// app/data/trophies.json. Any static file server can host it and it works
// with the network off. This program is the handover: it copies app/ and
// screenshots/ from beside this file into the output directory and writes
// dossier.json there with the vendored make.fun library, exactly as the
// scorer rebuilds it. vendor/makefun-frontend.ts is the kit's copy and must
// stay unchanged.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The guide and its screenshots are the entry: refuse to hand in an empty
// output rather than silently producing one. A missing folder means the
// build ran from the wrong directory.
for (const folder of ['app', 'screenshots']) {
  if (!existsSync(join(repoRoot, folder))) {
    throw new Error(`missing ${folder}/ beside main.ts — run from the repository root`);
  }
}

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
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Post-write check: the dossier is the entry's hand-in, so confirm it landed
// and report its size alongside the screenshot count.
const dossierSize = statSync(dossierPath).size;
const shotNames = readdirSync(join(outputDir, 'screenshots')).filter((name) => !name.startsWith('.'));
console.log(`wrote ${outputDir} — app/ + ${shotNames.length} screenshots + dossier.json (${dossierSize} bytes)`);
