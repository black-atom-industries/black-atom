import { SectionHeader } from "../../primitives/section-header/section-header.tsx";
import { Toggle } from "../../primitives/toggle/toggle.tsx";
import { KVRow } from "../../primitives/kv-row/kv-row.tsx";
import { Button } from "../../primitives/button/button.tsx";
import { AdapterStatusRow } from "../../primitives/adapter-status-row/adapter-status-row.tsx";
import { toAdapterRowStatus } from "../../apply-rail/index.ts";
import { type DownloadRowResult, formatFetchedAt } from "../../../lib/theme-downloads.ts";
import { Typo } from "../../typo/index.ts";
import styles from "./general-panel.module.css";

type Props = {
    followOsAppearance: boolean;
    onToggleFollowOsAppearance: () => void;
    liveryVersion: string;
    /** Newest manifest fetch across adapters; null = never synced. */
    themesLastSyncedEpoch: number | null;
    /** Per-adapter rows once a sync started; null before the first run. */
    syncResults: DownloadRowResult[] | null;
    syncing: boolean;
    onSyncThemes: () => void;
    cursored?: boolean;
    className?: string;
};

/**
 * GENERAL panel — BEHAVIOR toggle row(s), THEMES sync section, SYSTEM
 * KVRow section. Only FOLLOW OS APPEARANCE is wired as a toggle; ON PARTIAL
 * FAILURE / APPLY ON SELECT are board-only, no backend support yet.
 */
export function GeneralPanel(
    {
        followOsAppearance,
        onToggleFollowOsAppearance,
        liveryVersion,
        themesLastSyncedEpoch,
        syncResults,
        syncing,
        onSyncThemes,
        cursored,
        className,
    }: Props,
) {
    return (
        <div className={[styles.root, className].filter(Boolean).join(" ")}>
            <SectionHeader>BEHAVIOR</SectionHeader>
            <div className={cursored ? `${styles.row} ${styles.rowCursored}` : styles.row}>
                <Toggle on={followOsAppearance} onChange={onToggleFollowOsAppearance} />
                <div className={styles.rowCopy}>
                    <span className={styles.rowTitle}>FOLLOW OS APPEARANCE</span>
                    <Typo.Small color="hint">
                        Switch between a paired light/dark theme when the OS appearance changes.
                    </Typo.Small>
                </div>
            </div>

            <SectionHeader
                meta={themesLastSyncedEpoch != null
                    ? `LAST SYNCED ${formatFetchedAt(themesLastSyncedEpoch)}`
                    : "NEVER SYNCED"}
            >
                THEMES
            </SectionHeader>
            <div className={styles.row}>
                <Button onClick={onSyncThemes} disabled={syncing}>
                    {syncing ? "SYNCING…" : "SYNC THEMES"}
                </Button>
                <div className={styles.rowCopy}>
                    <span className={styles.rowTitle}>MANAGED THEME FILES</span>
                    <Typo.Small color="hint">
                        Download every adapter's theme files from its Black Atom repo into
                        ~/.config/black-atom/themes.
                    </Typo.Small>
                </div>
            </div>
            {syncResults && (
                <div className={styles.syncRows}>
                    {syncResults.map((result) => (
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

            <SectionHeader>SYSTEM</SectionHeader>
            <div className={styles.system}>
                <KVRow label="LIVERY">{liveryVersion}</KVRow>
            </div>
        </div>
    );
}
