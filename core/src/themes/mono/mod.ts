import { defineCollection } from "../define-collection.ts";

import blackAtomMonoDark from "./black-atom-mono-dark.ts";
import blackAtomMonoLight from "./black-atom-mono-light.ts";
import blackAtomMonoDimmedDark from "./black-atom-mono-dimmed-dark.ts";
import blackAtomMonoDimmedLight from "./black-atom-mono-dimmed-light.ts";

export default defineCollection({
    meta: { key: "mono", label: "Mono", order: 6 },
    themes: {
        "black-atom-mono-dark": {
            meta: { name: "Dark", appearance: "dark", status: "release" },
            colors: blackAtomMonoDark,
        },
        "black-atom-mono-light": {
            meta: { name: "Light", appearance: "light", status: "release" },
            colors: blackAtomMonoLight,
        },
        "black-atom-mono-dimmed-dark": {
            meta: { name: "Dimmed Dark", appearance: "dark", status: "release" },
            colors: blackAtomMonoDimmedDark,
        },
        "black-atom-mono-dimmed-light": {
            meta: { name: "Dimmed Light", appearance: "light", status: "release" },
            colors: blackAtomMonoDimmedLight,
        },
    },
});
