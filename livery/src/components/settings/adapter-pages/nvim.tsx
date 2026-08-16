import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    DraftField,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** nvim — external provisioning, patches a colorscheme line via regex. */
export function NvimSettings(
    {
        appConfig,
        editableFields,
        detected,
        onToggleEnabled,
        onFieldCommit,
        firstFieldRef,
        onPickPath,
        onOpenUrl,
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
                appName="nvim"
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
            <ClassDefinition provisioning="external" />
            <PrerequisiteNote
                link={{
                    label: "black-atom-industries/nvim",
                    url: "https://github.com/black-atom-industries/nvim",
                }}
                onOpenUrl={onOpenUrl}
            >
                Install the plugin via your plugin manager and keep a colorscheme line in your
                config.
            </PrerequisiteNote>
        </div>
    );
}
