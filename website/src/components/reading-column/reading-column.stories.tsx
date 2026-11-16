import preview from "#/storybook/preview.tsx";
import { Heading } from "#/components/heading/index.ts";
import { Stack } from "#/components/stack/index.ts";
import { Text } from "#/components/text/index.ts";
import { ReadingColumn } from "./reading-column.tsx";

const meta = preview.meta({
    title: "Layout/ReadingColumn",
    component: ReadingColumn,
    args: {
        children: ["Hosting", "Fonts"].map((title) => (
            <Stack key={title} gap="sm">
                <Heading variant="title" render={<h2 />}>
                    {title}
                </Heading>
                <Text tone="subtle">
                    Fonts are served from this site. No requests go to Google or other font
                    services.
                </Text>
            </Stack>
        )),
    },
});

export const Default = meta.story();
