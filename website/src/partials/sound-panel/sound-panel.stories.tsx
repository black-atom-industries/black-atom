import { useState } from "react";
import { expect, fn } from "storybook/test";
import preview from "#/storybook/preview.tsx";
import { SoundPanel, type SoundSettings } from "./sound-panel.tsx";

const settings: SoundSettings = {
    isOn: false,
    volume: 60,
    isHeartbeatOn: true,
    bpm: 96,
    vinyl: 30,
};

const meta = preview.meta({
    title: "Partials/SoundPanel",
    component: SoundPanel,
    args: { settings, onChange: fn() },
    render: (args) => {
        const [current, setCurrent] = useState(args.settings);
        return (
            <div style={{ maxWidth: 380 }}>
                <SoundPanel
                    settings={current}
                    onChange={(patch) => {
                        setCurrent((previous) => ({ ...previous, ...patch }));
                        args.onChange(patch);
                    }}
                />
            </div>
        );
    },
});

export const Default = meta.story();

export const TogglesSound = meta.story({
    play: async ({ canvas, userEvent, args }) => {
        const soundscape = canvas.getByRole("button", { name: "Soundscape on / off" });
        const heartbeat = canvas.getByRole("button", { name: "Heartbeat on / off" });

        await userEvent.click(soundscape);
        await expect(args.onChange).toHaveBeenLastCalledWith({ isOn: true });
        await expect(soundscape).toHaveAttribute("aria-pressed", "true");

        await userEvent.click(heartbeat);
        await expect(args.onChange).toHaveBeenLastCalledWith({ isHeartbeatOn: false });
        await expect(heartbeat).toHaveAttribute("aria-pressed", "false");
    },
});

export const MovesASlider = meta.story({
    play: async ({ canvas, userEvent, args }) => {
        const tempo = canvas.getByRole("slider", { name: "Tempo" });

        tempo.focus();
        await userEvent.keyboard("{ArrowRight}");

        await expect(args.onChange).toHaveBeenLastCalledWith({ bpm: 97 });
        await expect(canvas.getByText("97 BPM")).toBeVisible();
    },
});
