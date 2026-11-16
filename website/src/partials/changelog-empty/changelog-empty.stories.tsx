import preview from "#/storybook/preview.tsx";
import { ChangelogEmpty } from "./changelog-empty.tsx";

const meta = preview.meta({
    title: "Partials/ChangelogEmpty",
    component: ChangelogEmpty,
    args: { href: "https://github.com/black-atom-industries", hasFailed: false },
});

export const Empty = meta.story();

export const Failed = meta.story({ args: { hasFailed: true } });
