import preview from "#/storybook/preview.tsx";
import { PlaceholderSlot } from "./placeholder-slot.tsx";

const meta = preview.meta({
    title: "Components/PlaceholderSlot",
    component: PlaceholderSlot,
    args: { label: "[Portrait or workspace photo]" },
    render: (args) => (
        <div style={{ maxWidth: 360 }}>
            <PlaceholderSlot {...args} />
        </div>
    ),
});

export const Default = meta.story();
