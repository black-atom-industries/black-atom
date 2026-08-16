import { cva, type VariantProps } from "cva";
import styles from "./status-pip.module.css";

export const statusPipVariants = cva({
    base: styles.root,
    variants: {
        intent: {
            ok: styles.intentOk,
            running: styles.intentRunning,
            pending: styles.intentPending,
            warn: styles.intentWarn,
            error: styles.intentError,
            off: styles.intentOff,
        },
    },
    defaultVariants: {
        intent: "ok",
    },
});

type Props = VariantProps<typeof statusPipVariants> & {
    /** Label, e.g. "SYNCED 8/8", "nvim". Omit for pip-only. */
    children?: React.ReactNode;
    className?: string;
};

/**
 * Square status pip (8px) + mono label — the system's only status
 * indicator. Pips are never round.
 *
 * `pending` renders hollow (border only); all other intents fill solid.
 *
 * Spec: docs/design-system/reference/components/display/StatusPip.jsx
 */
export function StatusPip({ intent, children, className }: Props) {
    return (
        <span data-component="status-pip" className={statusPipVariants({ intent, className })}>
            <span className={styles.pip} />
            {children}
        </span>
    );
}
