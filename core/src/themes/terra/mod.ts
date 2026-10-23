import { defineCollection } from "../define-collection.ts";

import blackAtomTerraSpringDark from "./black-atom-terra-spring-dark.ts";
import blackAtomTerraSpringLight from "./black-atom-terra-spring-light.ts";
import blackAtomTerraSummerDark from "./black-atom-terra-summer-dark.ts";
import blackAtomTerraSummerLight from "./black-atom-terra-summer-light.ts";
import blackAtomTerraFallDark from "./black-atom-terra-fall-dark.ts";
import blackAtomTerraFallLight from "./black-atom-terra-fall-light.ts";
import blackAtomTerraWinterDark from "./black-atom-terra-winter-dark.ts";
import blackAtomTerraWinterLight from "./black-atom-terra-winter-light.ts";

export default defineCollection({
    meta: { key: "terra", label: "TERRA", order: 2 },
    themes: {
        "black-atom-terra-spring-dark": {
            meta: { name: "Spring Dark", appearance: "dark", status: "release" },
            colors: blackAtomTerraSpringDark,
        },
        "black-atom-terra-spring-light": {
            meta: { name: "Spring Light", appearance: "light", status: "release" },
            colors: blackAtomTerraSpringLight,
        },
        "black-atom-terra-summer-dark": {
            meta: { name: "Summer Dark", appearance: "dark", status: "release" },
            colors: blackAtomTerraSummerDark,
        },
        "black-atom-terra-summer-light": {
            meta: { name: "Summer Light", appearance: "light", status: "release" },
            colors: blackAtomTerraSummerLight,
        },
        "black-atom-terra-fall-dark": {
            meta: { name: "Fall Dark", appearance: "dark", status: "release" },
            colors: blackAtomTerraFallDark,
        },
        "black-atom-terra-fall-light": {
            meta: { name: "Fall Light", appearance: "light", status: "release" },
            colors: blackAtomTerraFallLight,
        },
        "black-atom-terra-winter-dark": {
            meta: { name: "Winter Dark", appearance: "dark", status: "release" },
            colors: blackAtomTerraWinterDark,
        },
        "black-atom-terra-winter-light": {
            meta: { name: "Winter Light", appearance: "light", status: "release" },
            colors: blackAtomTerraWinterLight,
        },
    },
});
