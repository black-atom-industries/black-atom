import { defineCollection } from "../define-collection.ts";

import blackAtomJpnKoyoDark from "./black-atom-jpn-koyo-dark.ts";
import blackAtomJpnKoyoLight from "./black-atom-jpn-koyo-light.ts";
import blackAtomJpnMurasakiDark from "./black-atom-jpn-murasaki-dark.ts";
import blackAtomJpnMurasakiLight from "./black-atom-jpn-murasaki-light.ts";
import blackAtomJpnTsukiDark from "./black-atom-jpn-tsuki-dark.ts";
import blackAtomJpnSanshokuDark from "./black-atom-jpn-sanshoku-dark.ts";
import blackAtomJpnSanshokuLight from "./black-atom-jpn-sanshoku-light.ts";

export default defineCollection({
    meta: { key: "jpn", label: "JPN", order: 3 },
    themes: {
        "black-atom-jpn-koyo-dark": {
            meta: { name: "Koyo Dark", appearance: "dark", status: "release" },
            colors: blackAtomJpnKoyoDark,
        },
        "black-atom-jpn-koyo-light": {
            meta: { name: "Koyo Light", appearance: "light", status: "release" },
            colors: blackAtomJpnKoyoLight,
        },
        "black-atom-jpn-murasaki-dark": {
            meta: { name: "Murasaki Dark", appearance: "dark", status: "release" },
            colors: blackAtomJpnMurasakiDark,
        },
        "black-atom-jpn-murasaki-light": {
            meta: { name: "Murasaki Light", appearance: "light", status: "development" },
            colors: blackAtomJpnMurasakiLight,
        },
        "black-atom-jpn-tsuki-dark": {
            meta: { name: "Tsuki Dark", appearance: "dark", status: "release" },
            colors: blackAtomJpnTsukiDark,
        },
        "black-atom-jpn-sanshoku-dark": {
            meta: { name: "Sanshoku Dark", appearance: "dark", status: "development" },
            colors: blackAtomJpnSanshokuDark,
        },
        "black-atom-jpn-sanshoku-light": {
            meta: { name: "Sanshoku Light", appearance: "light", status: "development" },
            colors: blackAtomJpnSanshokuLight,
        },
    },
});
