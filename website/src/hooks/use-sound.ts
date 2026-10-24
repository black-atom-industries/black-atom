import { useEffect, useRef } from "react";
import type * as Theme from "@black-atom/core";
import { useSelector } from "@tanstack/react-store";
import { soundEngine } from "#/audio/engine.ts";
import { themeRoot, type ThemeRoot } from "#/audio/soundscape.ts";
import { soundStore, type SoundSettings } from "#/stores/sound.ts";

function warn(error: unknown) {
    console.warn("[sound] could not start", error);
}

/** A page counts as touched once the visitor has clicked or typed on it; only then may audio start. */
function hasUserActivation(): boolean {
    return navigator.userActivation?.hasBeenActive ?? false;
}

/**
 * Drives the sound engine from the stored settings. A remembered "on" starts on the visitor's
 * first click or key press, since browsers allow audio only after one.
 */
export function useSound({ theme }: { theme: Theme.Definition }) {
    const settings = useSelector(soundStore);
    const rootRef = useRef<ThemeRoot>(undefined);
    const isWanted = settings.isOn;

    useEffect(() => {
        soundEngine.setVolume(settings.volume / 100);
        soundEngine.setParams({
            heartbeat: settings.isHeartbeatOn,
            bpm: settings.bpm,
            vinyl: settings.vinyl / 100,
        });
    }, [settings.volume, settings.isHeartbeatOn, settings.bpm, settings.vinyl]);

    useEffect(() => {
        const root = themeRoot(theme.meta.key, theme.meta.appearance, rootRef.current);
        rootRef.current = root;
        soundEngine.setTheme(root);
    }, [theme.meta.key, theme.meta.appearance]);

    useEffect(() => {
        if (!isWanted) {
            soundEngine.stop();
            return;
        }
        if (hasUserActivation()) {
            soundEngine.start().catch(warn);
            return;
        }
        function handleFirstGesture() {
            soundEngine.start().catch(warn);
        }
        const options = { once: true, capture: true };
        // iOS Safari unlocks audio on `click`, not on `pointerdown`.
        const gestures = ["pointerdown", "keydown", "click"] as const;
        for (const gesture of gestures) {
            document.addEventListener(gesture, handleFirstGesture, options);
        }
        return () => {
            for (const gesture of gestures) {
                document.removeEventListener(gesture, handleFirstGesture, options);
            }
        };
    }, [isWanted]);

    function handleChange(patch: Partial<SoundSettings>) {
        soundStore.setState((previous) => ({ ...previous, ...patch }));
        if (patch.isOn === true) soundEngine.start().catch(warn);
    }

    return {
        settings,
        onChange: handleChange,
    };
}
