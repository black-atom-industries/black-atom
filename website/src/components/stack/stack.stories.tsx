import preview from "#/storybook/preview.tsx";
import { Button } from "#/components/button/index.ts";
import { Stack } from "./stack.tsx";

const meta = preview.meta({
    title: "Layout/Stack",
    component: Stack,
    args: {
        children: (
            <>
                <Button variant="cta">Install</Button>
                <Button>The loop</Button>
                <Button render={<a href="#github" />}>GitHub ↗</Button>
            </>
        ),
    },
});

export const Column = meta.story({ args: { gap: "sm", align: "start" } });

export const Row = meta.story({ args: { direction: "row", gap: "xl", isWrapped: true } });

export const Divided = meta.story({
    args: { direction: "row", gap: "md", justify: "between", isDivided: true },
});
