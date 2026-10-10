/**
 * Black Atom Kagi — Post-Generate Assembly
 *
 * Writes one self-contained custom CSS per theme pair to `themes/<collection>/`:
 * the shared `styles/base.css`, then the light and the dark color fragment that
 * the template rendered into `fragments/<collection>/`. A pair is the themes whose
 * keys differ only in their `-light`/`-dark` suffix; a theme without a
 * counterpart ships alone.
 *
 * Called by Core after generation.
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";

const base = await readFile("styles/base.css", "utf8");

await rm("themes", { recursive: true, force: true });

let count = 0;
for (const collection of await readdir("fragments", { withFileTypes: true })) {
    if (!collection.isDirectory()) continue;

    const pairs = new Map<string, { light?: string; dark?: string }>();
    for (const entry of await readdir(`fragments/${collection.name}`, { withFileTypes: true })) {
        const match = entry.name.match(/^black-atom-(.+)-(light|dark)\.css$/);
        if (!match) continue;
        const [, name, appearance] = match;
        const pair = pairs.get(name) ?? {};
        pair[appearance as "light" | "dark"] = `fragments/${collection.name}/${entry.name}`;
        pairs.set(name, pair);
    }

    await mkdir(`themes/${collection.name}`, { recursive: true });
    for (const [name, { light, dark }] of pairs) {
        const fragments = [];
        for (const file of [light, dark]) {
            if (file) fragments.push((await readFile(file, "utf8")).trimEnd());
        }
        const labels = fragments.map((fragment) =>
            fragment.match(/^\/\* (.+) for Kagi \*\//)?.[1] ?? name
        );
        const header = [
            "/*",
            ...labels.map((label) => ` * ${label}`),
            " *",
            " * Paste this whole file into https://kagi.com/settings/custom_css",
            " */",
        ].join("\n");
        const parts = [header, base.trimEnd(), ...fragments];
        await writeFile(
            `themes/${collection.name}/black-atom-${name}.css`,
            parts.join("\n\n") + "\n",
        );
        count++;
    }
}

console.log(`Assembled ${count} Kagi themes in themes/`);
