import { useEffect, useState } from "react";
import { Button } from "../../primitives/button/button.tsx";
import { TextInput } from "../../primitives/text-input/text-input.tsx";
import styles from "./adapter-shared.module.css";

export type PathKind = "file" | "directory";

type Props = {
    label: string;
    value: string;
    optional?: boolean;
    note?: string;
    onCommit: (value: string) => void;
    inputRef?: React.RefObject<HTMLInputElement>;
    pathKind?: PathKind;
    onPickPath?: (kind: PathKind) => Promise<string | null>;
};

/**
 * TextInput with per-field draft state — persists through the whole-Config
 * save mutation on Enter or blur, not on every keystroke.
 *
 * Escape hierarchy: while a field is focused/dirty, Escape reverts the
 * draft to the last saved value and stops propagation — it does NOT bubble
 * to the route's Escape handler. A second Escape (field is clean, focus
 * left the input) reaches the route, which navigates back.
 */
export function DraftField(
    { label, value, optional, note, onCommit, inputRef, pathKind, onPickPath }: Props,
) {
    const [draft, setDraft] = useState(value);
    const [focused, setFocused] = useState(false);
    const [picking, setPicking] = useState(false);

    // Config prop changed underneath us (e.g. save from another field
    // resolved, or the page was reopened) — resync the draft.
    useEffect(() => {
        setDraft(value);
    }, [value]);

    function commit() {
        setFocused(false);
        if (draft !== value) onCommit(draft);
    }

    const editing = focused || draft !== value;

    async function pickPath() {
        if (!pathKind || !onPickPath || picking) return;
        setPicking(true);
        try {
            const selectedPath = await onPickPath(pathKind);
            if (selectedPath !== null) {
                setDraft(selectedPath);
                setFocused(false);
                onCommit(selectedPath);
            }
        } finally {
            setPicking(false);
        }
    }

    return (
        <div className={styles.fieldWithPicker}>
            <TextInput
                label={label}
                optional={optional}
                note={note}
                value={draft}
                editing={editing}
                hint={editing ? "⏎ SAVE · esc REVERT" : undefined}
                onChange={setDraft}
                onFocus={() => setFocused(true)}
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        event.currentTarget.blur();
                    } else if (event.key === "Escape") {
                        if (draft !== value) {
                            // Dirty: first Escape reverts and stays put —
                            // swallow it before the route-level Escape
                            // hotkey (navigate back) can see it.
                            event.preventDefault();
                            event.stopPropagation();
                            setDraft(value);
                        } else {
                            // Clean: nothing left to revert, hand off to the
                            // route's Escape handler.
                            event.currentTarget.blur();
                        }
                    }
                }}
                inputRef={inputRef}
            />
            {pathKind && onPickPath
                ? (
                    <Button
                        intent="secondary"
                        onClick={() => void pickPath()}
                        disabled={picking}
                    >
                        {picking ? "OPENING…" : "USE FINDER"}
                    </Button>
                )
                : null}
        </div>
    );
}
