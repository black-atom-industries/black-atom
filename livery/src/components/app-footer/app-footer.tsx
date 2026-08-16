import styles from "./app-footer.module.css";

type Props = {
    /** Row of KeyHint elements — the key vocabulary for the current screen. */
    hints: React.ReactNode;
    /** Live status slot, e.g. <StatusPip intent="ok">READY</StatusPip>. */
    status?: React.ReactNode;
    className?: string;
};

/**
 * App footer — every screen ends with its key vocabulary (composed from
 * KeyHint) + a live status slot.
 *
 * Spec: docs/design-system/reference/components/containers/AppFooter.jsx
 */
export function AppFooter({ hints, status, className }: Props) {
    return (
        <div
            data-component="app-footer"
            className={[styles.root, className].filter(Boolean).join(" ")}
        >
            <div className={styles.hints}>{hints}</div>
            {status ? <div className={styles.status}>{status}</div> : null}
        </div>
    );
}
