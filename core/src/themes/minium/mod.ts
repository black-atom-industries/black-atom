import { defineCollection } from "../define-collection.ts";

import blackAtomMiniumSiennaDark from "./black-atom-minium-sienna-dark.ts";
import blackAtomMiniumSiennaLight from "./black-atom-minium-sienna-light.ts";
import blackAtomMiniumViridianDark from "./black-atom-minium-viridian-dark.ts";
import blackAtomMiniumViridianLight from "./black-atom-minium-viridian-light.ts";

export default defineCollection({
    meta: { key: "minium", label: "Minium", order: 5 },
    themes: {
        "black-atom-minium-sienna-dark": {
            meta: { name: "Sienna Dark", appearance: "dark", status: "development" },
            colors: blackAtomMiniumSiennaDark,
        },
        "black-atom-minium-sienna-light": {
            meta: { name: "Sienna Light", appearance: "light", status: "development" },
            colors: blackAtomMiniumSiennaLight,
        },
        "black-atom-minium-viridian-dark": {
            meta: { name: "Viridian Dark", appearance: "dark", status: "development" },
            colors: blackAtomMiniumViridianDark,
        },
        "black-atom-minium-viridian-light": {
            meta: { name: "Viridian Light", appearance: "light", status: "development" },
            colors: blackAtomMiniumViridianLight,
        },
    },
});
