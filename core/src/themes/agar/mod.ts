import { defineCollection } from "../define-collection.ts";

import blackAtomAgarLight from "./black-atom-agar-light.ts";

export default defineCollection({
    meta: { key: "agar", label: "AGAR", order: 8 },
    themes: {
        "black-atom-agar-light": {
            meta: { name: "Light", appearance: "light", status: "development" },
            colors: blackAtomAgarLight,
        },
    },
});
