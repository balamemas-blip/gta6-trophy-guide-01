// GTA VI trophy guide: entrypoint (Node 22, standard library only).
//
// The guide itself is plain static files in app/ — index.html, style.css,
// app.js and the trophy data in app/data/trophies.json — so any static file
// server can host it and it works with the network off. This program is the
// handover: it copies app/ and screenshots/ from beside this file into the
// output directory and writes dossier.json there with the vendored make.fun
// library, exactly as the scorer rebuilds it. vendor/makefun-frontend.ts is
// the kit's copy and must stay unchanged.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly rather than handing in an empty output: the guide and its
// screenshots are the entry, and a missing folder means the build ran in
// the wrong directory.
for (const needed of ['app', 'screenshots']) {
  if (!existsSync(join(here, needed))) {
    throw new Error(`missing ${needed}/ beside main.ts — run from the repository root`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Caps mirror the gate: at most 4 screenshots of 256 KiB each, app/ at most
// 993 files and directories and 48 MiB, dossier text at most 160 KiB.
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

const shots = readdirSync(join(out, 'screenshots')).filter((f) => !f.startsWith('.'));
console.log(`wrote ${out} — app/ + ${shots.length} screenshots + dossier.json`);
