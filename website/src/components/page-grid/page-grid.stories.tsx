import preview from "#/storybook/preview.tsx";
import { Panel } from "#/components/panel/index.ts";
import { Text } from "#/components/text/index.ts";
import { PageGrid } from "./page-grid.tsx";

const meta = preview.meta({
    title: "Layout/PageGrid",
    component: PageGrid,
    args: {
        children: ["Definition", "Tokens", "Tools"].map((label) => (
            <Panel key={label}>
                <Text>{label}</Text>
            </Panel>
        )),
    },
});

export const Two = meta.story();

export const Three = meta.story({ args: { columns: "three" } });

export const Four = meta.story({ args: { columns: "four" } });
