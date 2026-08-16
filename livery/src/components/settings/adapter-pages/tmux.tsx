import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    DraftField,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** tmux — linked provisioning, source-file points at the managed themes
    dir; the active theme is selected via a regex-patched line. */
export function TmuxSettings(
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
                appName="tmux"
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
                {editableFields.has("themes_path") && (
                    <DraftField
                        label="THEMES_PATH"
                        optional
                        note="WHERE THEME FILES LIVE"
                        value={appConfig.themes_path ?? ""}
                        onCommit={(value) => onFieldCommit("themes_path", value)}
                        pathKind="directory"
                        onPickPath={onPickPath}
                    />
                )}
                {editableFields.has("match_pattern") && (
                    <DraftField
                        label="MATCH_PATTERN"
                        note="REGEX — FINDS THE THEME LINE"
                        value={appConfig.match_pattern ?? ""}
                        onCommit={(value) => onFieldCommit("match_pattern", value)}
                    />
                )}
                {editableFields.has("replace_template") && (
                    <DraftField
                        label="REPLACE_TEMPLATE"
                        note="REPLACES THE MATCHED LINE"
                        value={appConfig.replace_template ?? ""}
                        onCommit={(value) => onFieldCommit("replace_template", value)}
                    />
                )}
                {(editableFields.has("match_pattern") || editableFields.has("replace_template")) &&
                    (
                        <p className={styles.fieldGridNote}>
                            Template variables: {"{themeKey}"} · {"{themesPath}"} ·{" "}
                            {"{collectionKey}"} · {"{appearance}"}
                        </p>
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
                Keep a source-file line in tmux.conf pointing at ~/.config/tmux/themes.
            </PrerequisiteNote>
        </div>
    );
}
