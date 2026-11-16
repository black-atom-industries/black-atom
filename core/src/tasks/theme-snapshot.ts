/**
 * Prints the theme catalog as it was at a git revision, as JSON keyed by theme key.
 *
 * Usage:
 *   node core/src/tasks/theme-snapshot.ts HEAD
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const revision = process.argv[2] ?? "HEAD";

const sha = execFileSync("git", ["rev-parse", "--short", revision], { cwd: ROOT })
    .toString()
    .trim();
const dir = path.join(ROOT, "tmp/theme-snapshots", sha);
if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    const archive = execFileSync("git", ["archive", sha, "core/src", ":(exclude)*.test.ts"], {
        cwd: ROOT,
    });
    execFileSync("tar", ["-x", "-C", dir], { input: archive });
}

const { themeCatalog } = await import(
    pathToFileURL(path.join(dir, "core/src/themes/catalog.ts")).href
);
process.stdout.write(JSON.stringify(themeCatalog));
