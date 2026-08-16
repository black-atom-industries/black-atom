import { SectionHeader } from "../../primitives/section-header/section-header.tsx";
import { Toggle } from "../../primitives/toggle/toggle.tsx";
import { KVRow } from "../../primitives/kv-row/kv-row.tsx";
import { Typo } from "../../typo/index.ts";
import styles from "./general-panel.module.css";

type Props = {
    followOsAppearance: boolean;
    onToggleFollowOsAppearance: () => void;
    liveryVersion: string;
    cursored?: boolean;
    className?: string;
};

/**
 * GENERAL panel — BEHAVIOR toggle row(s) and the SYSTEM KVRow section. Only
 * FOLLOW OS APPEARANCE is wired as a toggle; ON PARTIAL FAILURE / APPLY ON
 * SELECT are board-only, no backend support yet.
 */
export function GeneralPanel(
    {
        followOsAppearance,
        onToggleFollowOsAppearance,
        liveryVersion,
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

            <SectionHeader>SYSTEM</SectionHeader>
            <div className={styles.system}>
                <KVRow label="LIVERY">{liveryVersion}</KVRow>
            </div>
        </div>
    );
}
