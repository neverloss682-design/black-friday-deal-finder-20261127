// Friday Radar — black-friday-deal-finder-01 entry program.
//
// What this program does, and nothing else: it hands the site in. It copies
// the static site (app/) and the screenshots (screenshots/) from this
// repository into the output directory, then writes dossier.json there with
// buildDossier from the vendored make.fun library (vendor/makefun-frontend.ts,
// the kit's copy, unchanged). The site itself is plain files under app/ —
// index.html, style.css, main.js and data.js — with no build step, and the
// screenshots are real renders of that site in a browser.
//
// How to run it outside the grader:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output (MAKEFUN_OUTPUT_DIR unset).
// Node 22+, standard library only. Both runs must write the same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));

// The grader gives us a writable /output; anywhere else, MAKEFUN_OUTPUT_DIR
// stands in for it. The default is the absolute path /output, never relative.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The gate's caps for this competition, from the kit's RULES.txt: at most 4
// screenshots of at most 256 KiB each, app/ at most 993 files and 16 MiB,
// and the dossier text at most 160 KiB.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

function copyTree(source, destination) {
  cpSync(source, destination, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, "app"), join(outputDir, "app"));

mkdirSync(join(outputDir, "screenshots"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  copyTree(join(repoRoot, "screenshots"), join(outputDir, "screenshots"));
}

// dossier.json is byte for byte what the vendored library writes from the
// files just copied — the gate rebuilds it with its own copy and compares.
writeFileSync(
  join(outputDir, "dossier.json"),
  buildDossier(outputDir, DOSSIER_OPTIONS),
);
