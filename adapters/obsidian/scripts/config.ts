/**
 * Build configuration for Black Atom Obsidian theme.
 */
export const config = {
    paths: {
        themes: "themes",
        styles: "styles",
        get ui() {
            return this.styles + "/ui";
        },
        output: "theme.css",
    },

    styleSettingsSections: {
        variants: {
            name: "Black Atom \:\: Variants",
            id: "black-atom-variants",
        },
        ui: {
            name: "Black Atom \:\: UI",
            id: "black-atom-ui",
        },
    },
} as const;
