import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    DraftField,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** obsidian — linked provisioning, points at the vault's
    appearance.json; no regex fields to offer. */
export function ObsidianSettings(
    {
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
    }: AdapterPageProps,
) {
    return (
        <div className={styles.root}>
            <AdapterHeader
                appName="obsidian"
                appConfig={appConfig}
                detected={detected}
                onToggleEnabled={onToggleEnabled}
                verifyPathResult={verifyPathResult}
            />
            <div className={styles.fieldGrid}>
                {editableFields.has("config_path") && (
                    <DraftField
                        label="CONFIG_PATH"
                        note="THE FILE LIVERY PATCHES"
                        value={appConfig.config_path}
                        onCommit={(value) => onFieldCommit("config_path", value)}
                        inputRef={firstFieldRef}
                        pathKind="file"
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
                Point CONFIG_PATH at your vault's .obsidian/appearance.json, then run SET UP.
            </PrerequisiteNote>
        </div>
    );
}
