import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "#/components/button/index.ts";
import { DockPanel } from "#/components/dock-panel/index.ts";
import { DockRail } from "#/components/dock-rail/index.ts";
import { Swatch } from "#/components/swatch/index.ts";
import { SpeakerIcon } from "#/icons/speaker-icon.tsx";

type PanelId = "theme" | "sound";

type Props = {
    themeLabel: string;
    themePanel: ReactNode;
    /** Without a sound panel the dock shows only the theme button. */
    soundLabel?: string;
    soundPanel?: ReactNode;
    closeLabel: string;
};

export function Dock({ themeLabel, themePanel, soundLabel, soundPanel, closeLabel }: Props) {
    const [openPanel, setOpenPanel] = useState<PanelId | null>(null);

    function handleOpenChange(panel: PanelId, isOpen: boolean) {
        setOpenPanel((current) => (isOpen ? panel : current === panel ? null : current));
    }

    return (
        <DockRail>
            <Dialog.Root
                modal={false}
                open={openPanel === "theme"}
                onOpenChange={(isOpen) => handleOpenChange("theme", isOpen)}
            >
                <Dialog.Trigger render={<Button variant="square" aria-label={themeLabel} />}>
                    <Swatch size="icon" color="var(--ba-accent)" />
                </Dialog.Trigger>
                <DockPanel title={themeLabel} closeLabel={closeLabel}>
                    {themePanel}
                </DockPanel>
            </Dialog.Root>
            {soundPanel !== undefined && soundLabel !== undefined && (
                <Dialog.Root
                    modal={false}
                    open={openPanel === "sound"}
                    onOpenChange={(isOpen) => handleOpenChange("sound", isOpen)}
                >
                    <Dialog.Trigger render={<Button variant="square" aria-label={soundLabel} />}>
                        <SpeakerIcon />
                    </Dialog.Trigger>
                    <DockPanel title={soundLabel} closeLabel={closeLabel}>
                        {soundPanel}
                    </DockPanel>
                </Dialog.Root>
            )}
        </DockRail>
    );
}
