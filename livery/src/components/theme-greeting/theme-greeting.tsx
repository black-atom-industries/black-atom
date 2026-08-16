import { Button } from "../primitives/button/button.tsx";
import { AdapterStatusRow } from "../primitives/adapter-status-row/adapter-status-row.tsx";
import { toAdapterRowStatus } from "../apply-rail/index.ts";
import { type DownloadRowResult, hasDownloadErrors } from "../../lib/theme-downloads.ts";
import styles from "./theme-greeting.module.css";

type Props = {
    /** Downloadable adapters, for the body copy. */
    adapterCount: number;
    /** Per-adapter rows once a pass started; null before the first run. */
    results: DownloadRowResult[] | null;
    downloading: boolean;
    onDownload: () => void;
    /** Persistent escape for hand-managed setups. */
    onContinueWithout: () => void;
};

/**
 * First-launch greeting shown before anything else when no theme files were
 * ever downloaded (and the user hasn't dismissed it) — the opening scene the
 * future setup wizard (#35) plugs into. Datasheet voice, every action names
 * its key, downloads report per-adapter like the apply rail.
 */
export function ThemeGreeting(
    { adapterCount, results, downloading, onDownload, onContinueWithout }: Props,
) {
    const failed = hasDownloadErrors(results);
    const settled = results != null && !downloading;

    return (
        <div data-component="theme-greeting" className={styles.root}>
            <div className={styles.eyebrow}>FIRST RUN · 0 THEME FILES ON DISK</div>
            <div className={styles.headline}>STOCK THE HANGAR</div>
            <p className={styles.body}>
                Livery repaints your tools by pointing them at Black Atom theme files on disk. None
                are present yet — download every collection for{" "}
                {adapterCount > 0 ? `all ${adapterCount} supported adapters` : "every adapter"}{" "}
                into ~/.config/black-atom/themes. Safe to re-run anytime from settings.
            </p>
            {results && (
                <div className={styles.rows}>
                    {results.map((result) => (
                        <AdapterStatusRow
                            key={result.app}
                            name={result.app}
                            status={toAdapterRowStatus(result)}
                            durationMs={result.duration_ms}
                            message={result.message}
                        />
                    ))}
                </div>
            )}
            <div className={styles.actions}>
                <Button intent="primary" hotkey="⏎" onClick={onDownload} disabled={downloading}>
                    {downloading
                        ? "DOWNLOADING…"
                        : settled && failed
                        ? "RETRY DOWNLOAD"
                        : "DOWNLOAD THEMES"}
                </Button>
                <Button hotkey="esc" onClick={onContinueWithout} disabled={downloading}>
                    CONTINUE WITHOUT
                </Button>
            </div>
        </div>
    );
}
