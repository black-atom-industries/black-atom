import type * as Theme from "@black-atom/core";

/** What each UI token is for, one sentence per token. */
export const uiTokenPurpose = {
    bg: {
        default: "Default background",
        panel: "Sidebars and the status line",
        float: "Floating windows and popups",
        active: "Active elements such as the cursor line or the active tab",
        disabled: "Disabled interactive elements",
        hover: "Hover state of interactive elements",
        selection: "Visual selection",
        search: "Search matches",
        contrast: "Inverted background",
        negative: "Errors",
        warn: "Warnings",
        info: "Information",
        hint: "Hints",
        positive: "Success",
        add: "Added lines",
        delete: "Deleted lines",
        modify: "Modified lines",
    },
    fg: {
        default: "Default text",
        subtle: "Secondary text such as line numbers",
        accent: "Links and text that needs to stand out",
        disabled: "Disabled text",
        border: "Idle borders, separators and guide lines",
        contrast: "Text on inverted backgrounds",
        negative: "Error text",
        warn: "Warning text",
        info: "Information text",
        hint: "Hint text",
        positive: "Success text",
        add: "Added marks",
        delete: "Deleted marks",
        modify: "Modified marks",
    },
} as const satisfies {
    bg: Record<keyof Theme.Ui["bg"], string>;
    fg: Record<keyof Theme.Ui["fg"], string>;
};
