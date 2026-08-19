import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    DraftField,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** Herdr — merged provisioning. Livery reads the unpacked TOML fragment and replaces only the
 * marked theme block in config.toml on every switch. */
export function HerdrSettings(
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
                appName="herdr"
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
                        note="WHERE THEME FRAGMENTS LIVE"
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
            <ClassDefinition provisioning="merged" />
            <PrerequisiteNote>
                Existing theme tables must be inside the BLACK ATOM LIVERY THEME markers before the
                first apply.
            </PrerequisiteNote>
        </div>
    );
}
