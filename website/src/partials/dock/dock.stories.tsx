import { expect, screen, within } from "storybook/test";
import preview from "#/storybook/preview.tsx";
import { SoundPanel } from "#/partials/sound-panel/index.ts";
import { ThemePanel } from "#/partials/theme-panel/index.ts";
import { Dock } from "./dock.tsx";

const meta = preview.meta({
    title: "Partials/Dock",
    component: Dock,
    parameters: {
        layout: "fullscreen",
        // Fixed positioning needs its own iframe on the docs page.
        docs: { story: { inline: false, iframeHeight: "720px" } },
    },
    args: {
        themeLabel: "Theme",
        closeLabel: "Close",
        themePanel: (
            <ThemePanel themeKey="black-atom-default-dark" sharePath="/" onSelect={() => {}} />
        ),
    },
    render: (args) => (
        <div style={{ minHeight: "100vh" }}>
            <Dock {...args} />
        </div>
    ),
});

export const ThemeOnly = meta.story();

export const WithSound = meta.story({
    args: {
        soundLabel: "Sound",
        soundPanel: (
            <SoundPanel
                settings={{ isOn: false, volume: 60, isHeartbeatOn: true, bpm: 96, vinyl: 30 }}
                onChange={() => {}}
            />
        ),
    },
});

export const OpensOnePanelAtATime = meta.story({
    args: WithSound.input.args,
    play: async ({ canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole("button", { name: "Theme" }));
        const themeDialog = await screen.findByRole("dialog", { name: "Theme" });
        await expect(within(themeDialog).getByRole("button", { name: "Next theme" })).toBeVisible();

        await userEvent.click(canvas.getByRole("button", { name: "Sound" }));
        await expect(await screen.findByRole("dialog", { name: "Sound" })).toBeVisible();
        await expect(screen.queryByRole("dialog", { name: "Theme" })).not.toBeInTheDocument();
    },
});
