import { Button } from "../primitives/button/button.tsx";
import styles from "./empty-state.module.css";

interface EmptyStateProps {
    /** Small chrome line above the headline, e.g. "24 THEMES INDEXED · 0 APPLIED". */
    eyebrow: string;
    /** Display headline, e.g. "PICK A LIVERY, PAINT THE COCKPIT". */
    headline: string;
    /** Sentence-case body copy. */
    body: string;
    onApply?: () => void;
    onOpenSettings?: () => void;
}

/**
 * First-run guidance shown when no adapters are enabled (or config failed
 * to load) — datasheet voice, every action names its key.
 *
 * Spec: docs/design-system/reference/Livery Explorations.dc.html#3d
 */
export function EmptyState({ eyebrow, headline, body, onApply, onOpenSettings }: EmptyStateProps) {
    return (
        <div data-component="empty-state" className={styles.root}>
            <div className={styles.eyebrow}>{eyebrow}</div>
            <div className={styles.headline}>{headline}</div>
            <p className={styles.body}>{body}</p>
            <div className={styles.actions}>
                {onApply && (
                    <Button intent="primary" hotkey="⏎" onClick={onApply}>
                        APPLY SELECTED
                    </Button>
                )}
                {onOpenSettings && (
                    <Button hotkey="s" onClick={onOpenSettings}>CHECK ADAPTERS</Button>
                )}
            </div>
        </div>
    );
}
