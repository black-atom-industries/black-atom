import { cva } from "cva";
import styles from "./disclosure-panel.module.css";

export const disclosurePanelVariants = cva({
    base: styles.root,
    variants: {
        expanded: {
            true: styles.expanded,
            false: "",
        },
    },
    defaultVariants: {
        expanded: false,
    },
});

type Props = {
    expanded?: boolean;
    /** Header row content (name, path, StatusPip…). The ⏎ EXPAND/COLLAPSE hint is added automatically. */
    header: React.ReactNode;
    /** Interactive control(s) rendered BESIDE the expand button (e.g. a
        Toggle) — never inside it: nested buttons are invalid HTML and
        WebKit drops mouse activation on them. */
    leading?: React.ReactNode;
    /** Expanded body (field grid + actions). */
    children?: React.ReactNode;
    onToggle?: () => void;
    className?: string;
};

/**
 * Expandable bordered panel — the composable settings-row primitive; one
 * per adapter, no per-tool layouts. Header row is a button so expand/collapse
 * is keyboard-addressable; body renders only while expanded, transitioning
 * within --ba-duration-3 (240ms max), no entrance animation.
 *
 * Spec: docs/design-system/reference/components/containers/DisclosurePanel.jsx
 */
export function DisclosurePanel(
    { expanded = false, header, leading, children, onToggle, className }: Props,
) {
    return (
        <div
            data-component="disclosure-panel"
            className={disclosurePanelVariants({ expanded, className })}
        >
            <div className={styles.headerRow}>
                {leading}
                <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={onToggle}
                    className={styles.header}
                >
                    {header}
                    <span className={styles.hint}>⏎ {expanded ? "COLLAPSE" : "EXPAND"}</span>
                </button>
            </div>
            {expanded ? <div className={styles.body}>{children}</div> : null}
        </div>
    );
}
