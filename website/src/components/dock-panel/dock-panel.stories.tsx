import { Dialog } from "@base-ui/react/dialog";
import preview from "#/storybook/preview.tsx";
import { Text } from "#/components/text/index.ts";
import { DockPanel } from "./dock-panel.tsx";

const meta = preview.meta({
    title: "Components/DockPanel",
    component: DockPanel,
    parameters: {
        layout: "fullscreen",
        // Fixed positioning needs its own iframe on the docs page.
        docs: { story: { inline: false, iframeHeight: "360px" } },
    },
    args: { title: "Theme", closeLabel: "Close", children: <Text>Panel content</Text> },
    render: (args) => (
        <Dialog.Root defaultOpen modal={false}>
            <DockPanel {...args} />
        </Dialog.Root>
    ),
});

export const Open = meta.story();
