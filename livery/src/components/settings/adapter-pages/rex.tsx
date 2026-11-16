import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    DraftField,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** Rex — linked provisioning without a config pointer. The Ghostty themes are linked without
    their extension, and every apply hands the linked file to Rex's own import. */
export function RexSettings({
    appConfig,
    editableFields,
    detected,
    onToggleEnabled,
    onFieldCommit,
    firstFieldRef,
    onPickPath,
    onSetUp,
    setUpResult,
    onVerifyPath,
    verifyPathResult,
    linkable,
    onLinkThemes,
    linkThemesResult,
    onTestApply,
    testApplyResult,
}: AdapterPageProps) {
    return (
        <div className={styles.root}>
            <AdapterHeader
                appName="rex"
                appConfig={appConfig}
                detected={detected}
                onToggleEnabled={onToggleEnabled}
                verifyPathResult={verifyPathResult}
            />
            <div className={styles.fieldGrid}>
                {editableFields.has("config_path") && (
                    <DraftField
                        label="CONFIG_PATH"
                        note="THE REX COMMAND LIVERY RUNS"
                        value={appConfig.config_path ?? ""}
                        onCommit={(value) => onFieldCommit("config_path", value)}
                        inputRef={firstFieldRef}
                        pathKind="file"
                        onPickPath={onPickPath}
                    />
                )}
                {editableFields.has("themes_path") && (
                    <DraftField
                        label="THEMES_PATH"
                        optional
                        note="WHERE THE THEME LINKS LIVE"
                        value={appConfig.themes_path ?? ""}
                        onCommit={(value) => onFieldCommit("themes_path", value)}
                        pathKind="directory"
                        onPickPath={onPickPath}
                    />
                )}
            </div>
            <ActionRow
                onSetUp={onSetUp}
                setUpResult={setUpResult}
                onVerifyPath={onVerifyPath}
                verifyPathResult={verifyPathResult}
                linkable={linkable}
                onLinkThemes={onLinkThemes}
                linkThemesResult={linkThemesResult}
                onTestApply={onTestApply}
                testApplyResult={testApplyResult}
            />
            <ClassDefinition provisioning="linked" />
            <PrerequisiteNote>
                Keep Rex open with Remote Control on (Settings → Rex Server). Each apply also sets
                Rex to the theme's light or dark appearance, so Rex stops following the system.
            </PrerequisiteNote>
        </div>
    );
}
