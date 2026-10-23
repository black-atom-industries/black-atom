import { themeCatalog } from "@black-atom/core";
import preview from "#/storybook/preview.tsx";
import { Text } from "#/components/text/index.ts";
import { themeToCustomProperties } from "#/lib/theme-vars.ts";
import { ThemeScope } from "./theme-scope.tsx";

const meta = preview.meta({
    title: "Layout/ThemeScope",
    component: ThemeScope,
    args: {
        vars: themeToCustomProperties(themeCatalog["black-atom-jpn-koyo-dark"]),
        children: <Text>Rendered in Koyo Dark, whatever the page wears.</Text>,
    },
});

export const Default = meta.story();
