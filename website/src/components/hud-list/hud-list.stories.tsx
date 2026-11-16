import preview from "#/storybook/preview.tsx";
import { HudList } from "./hud-list.tsx";

const meta = preview.meta({
    title: "Components/HudList",
    component: HudList,
    args: {
        groups: [
            [
                { key: "%", file: "src/app.ts", isCurrent: true },
                { key: "o", file: "src/app.test.ts" },
            ],
            [
                { key: "a", file: "src/router.ts" },
                { key: "s", file: "src/store.ts" },
            ],
            [{ key: "1", file: "package.json", isRecent: true }],
        ],
    },
});

export const Default = meta.story();
