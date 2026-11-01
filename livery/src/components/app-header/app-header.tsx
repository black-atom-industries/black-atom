import { isTauri } from "@tauri-apps/api/core";
import styles from "./app-header.module.css";
import { Badge } from "../primitives/badge/badge.tsx";

const hasTrafficLights = isTauri() && navigator.userAgent.includes("Mac");

type Props = {
    /** Product name appended to the wordmark. */
    product?: string;
    /** e.g. "0.3.0". Rendered without a "v" prefix, matched by the spec's "V0.3.0" style hint. */
    version?: string;
    /** Right-side env stats slot, e.g. "24 THEMES · 6 COLLECTIONS · ENV DARK" or "SETTINGS / ADAPTERS". */
    context?: React.ReactNode;
    className?: string;
};

/**
 * App header bar — wordmark (brand dot standing in for the O, the system's
 * sole border-radius exception) + version left, uppercase env context right.
 *
 * The window has no visible title bar, so the header doubles as its drag
 * handle (data-tauri-drag-region only fires on this element itself — the
 * wordmark/context children stay clickable text, the space between drags).
 * On macOS the wordmark starts after the traffic lights that overlay the header.
 *
 * Spec: docs/design-system/reference/components/containers/AppHeader.jsx
 */
export function AppHeader({ product = "LIVERY", version, context, className }: Props) {
    return (
        <div
            data-component="app-header"
            data-tauri-drag-region
            className={[styles.root, hasTrafficLights && styles.trafficLightInset, className]
                .filter(Boolean)
                .join(" ")}
        >
            <div className={styles.wordmarkRow}>
                <span className={styles.wordmark}>
                    BLACK AT
                    <span className={styles.dot} aria-hidden="true" />M {product}
                </span>
                {version ? <span className={styles.version}>V{version}</span> : null}
                {import.meta.env.DEV ? <Badge>Dev</Badge> : null}
            </div>
            {context ? <div className={styles.context}>{context}</div> : null}
        </div>
    );
}
