// Watch RADAR's entrypoint (Node 22, standard library only): radar-2.
//
// It reads the sealed snapshot at /input/snapshot.json (or --input <file|dir>), scores every
// pre-token protocol the watchlist rule keeps with the model in lib/model.ts, writes the ranked
// board to /output/board.json, writes the dashboard's data beside the page as data.js, copies this
// repository's dashboard/ and screenshots/ to /output, and writes /output/dossier.json with the
// vendored make.fun library. The run is deterministic: same snapshot in, same bytes out.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const here = fileURLToPath(new URL('.', import.meta.url));

/** The caps the scorer holds the dossier to (reference/gate.json). */
const TEXT_MAX_BYTES = 65_536;
const SCREENSHOT_MAX = 4;
const SCREENSHOT_MAX_BYTES = 524_288;
const DASHBOARD_MAX_FILES = 400;
const DASHBOARD_MAX_BYTES = 4_194_304;
const IMAGE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;

/** --name <value> out of the arguments, or the fallback. */
function flag(name: string, fallback: string): string {
  const at = process.argv.indexOf(`--${name}`);
  if (at >= 0 && at + 1 < process.argv.length) return process.argv[at + 1]!;
  const withEquals = process.argv.find((a) => a.startsWith(`--${name}=`));
  return withEquals === undefined ? fallback : withEquals.slice(name.length + 3);
}

/** Stop the run with a clear message on stderr and a non-zero exit. */
function fail(message: string): never {
  process.stderr.write(`watch radar: ${message}\n`);
  process.exit(1);
}

// Build guard: the entry is not shippable without its sealed input, its entry point, or the three
// screenshots the judge reads, so fail loudly here instead of producing an /output that looks
// complete but has no data or nothing to show.
const inputArg = flag('input', '/input');
const snapshotPath = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
if (!existsSync(snapshotPath)) {
  fail(`no snapshot at ${snapshotPath}: pass --input <snapshot.json|directory> or mount the sealed /input`);
}
const dashboardDir = join(here, 'dashboard');
const pagePath = join(dashboardDir, 'index.html');
if (!existsSync(pagePath)) {
  fail(`no dashboard entry point at ${pagePath}: the repository must carry dashboard/index.html`);
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) {
  fail(`no screenshots/ directory at ${shotsDir}: hand in 3, the board, a detail view and a filtered view`);
}
const out = flag('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const snapshot = parseSnapshot(readFileSync(snapshotPath, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const issue = boardIssue(board, snapshot);
if (issue !== null) fail(`the model wrote a board the gate refuses: ${issue}`);
if (radar.rows.length !== board.length) fail('the dashboard data and the board disagree on row count');

/** Walk a copied tree and total its files and bytes, for the build summary. */
function treeTotals(root: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const info = statSync(path);
      if (info.isDirectory()) walk(path);
      else {
        files += 1;
        bytes += info.size;
      }
    }
  };
  if (existsSync(root)) walk(root);
  return { files, bytes };
}

/** Copy one directory's regular files into `to`, skipping names that start with a dot. */
function copyDir(from: string, to: string): string[] {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copied: string[] = [];
  for (const name of readdirSync(from)) {
    if (name.startsWith('.')) continue;
    const path = join(from, name);
    if (!statSync(path).isFile()) continue;
    copyFileSync(path, join(to, name));
    copied.push(name);
  }
  return copied;
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(out, 'data.js'), dataScript(radar));

copyDir(dashboardDir, join(out, 'dashboard'));
const shots = copyDir(shotsDir, join(out, 'screenshots'));
if (shots.length !== 3) {
  fail(`screenshots/ holds ${shots.length} image${shots.length === 1 ? '' : 's'}: hand in exactly 3, the board, a detail view and a filtered view`);
}
for (const name of shots) {
  if (!IMAGE_NAME.test(name)) {
    fail(`screenshots/${name}: a name is letters, digits and . _ -, 1 to 128 characters`);
  }
  const size = statSync(join(out, 'screenshots', name)).size;
  if (size > SCREENSHOT_MAX_BYTES) {
    fail(`screenshots/${name} is ${size} bytes, over the ${SCREENSHOT_MAX_BYTES} a screenshot may hold`);
  }
}

// The dossier is written last: the scorer rebuilds it from this /output and compares bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    dashboard: { max_files: DASHBOARD_MAX_FILES, max_bytes: DASHBOARD_MAX_BYTES },
  }),
);

// Build summary: what the grader will receive, and the dossier's fingerprint.
const dashTotals = treeTotals(join(out, 'dashboard'));
const shotTotals = treeTotals(join(out, 'screenshots'));
const dossierBytes = readFileSync(join(out, 'dossier.json'));
const dossierSha = createHash('sha256').update(dossierBytes).digest('hex');
const boardBytes = statSync(join(out, 'board.json')).size;
const watchlistCovered = board.filter((r) => r.watchlist).length;
process.stdout.write(
  `watch radar: ${snapshot.protocols.length} protocols in the snapshot, ${snapshot.watchlist.length} on the watchlist, ${board.length} rows scored (${watchlistCovered} watchlist, ${board.length - watchlistCovered} early, ${radar.live_size} live set aside)\n` +
    `watch radar: board.json ${board.length} rows (${boardBytes} bytes), dashboard ${dashTotals.files} files (${dashTotals.bytes} bytes), screenshots ${shotTotals.files} images (${shotTotals.bytes} bytes)\n` +
    `watch radar: dossier.json sha256: ${dossierSha}\n`,
);
