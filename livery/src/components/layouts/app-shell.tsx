import type { ReactNode } from "react";
import styles from "./app-shell.module.css";

interface AppShellProps {
    /** Slot rendered in the top header bar. */
    header?: ReactNode;
    /** Slot rendered above the footer for progress indication. */
    progress?: ReactNode;
    /** Slot rendered in the bottom footer bar. */
    footer?: ReactNode;
    /** Main content area. */
    children: ReactNode;
}

/**
 * App.Shell — Outer application chrome.
 *
 * Composes header, main content, progress bar, and footer into a full-height
 * flex column with 1px borders between sections. All styling lives in the
 * CSS module; routes that use this component carry zero direct styles.
 */
export function AppShell({ header, progress, footer, children }: AppShellProps) {
    return (
        <div data-layout="app-shell" className={styles.root}>
            {header && <header className={styles.header}>{header}</header>}
            <main className={styles.main}>{children}</main>
            {progress && <div className={styles.progress}>{progress}</div>}
            {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
    );
}
