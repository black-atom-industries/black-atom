import { defineCollection } from "../define-collection.ts";

import blackAtomTr1000Dark from "./black-atom-tr-1000-dark.ts";
import blackAtomTr1000Light from "./black-atom-tr-1000-light.ts";

export default defineCollection({
    meta: { key: "tr-1000", label: "TR-1000", order: 7 },
    themes: {
        "black-atom-tr-1000-dark": {
            meta: { name: "Dark", appearance: "dark", status: "release" },
            colors: blackAtomTr1000Dark,
        },
        "black-atom-tr-1000-light": {
            meta: { name: "Light", appearance: "light", status: "release" },
            colors: blackAtomTr1000Light,
        },
    },
});
