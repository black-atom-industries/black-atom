import { useState } from "react";
import { ActionRow, AdapterHeader, ClassDefinition, DraftField } from "../adapter-shared/index.ts";
import { NvimSettingsPanel } from "../nvim-settings-panel/index.ts";
import type { NvimSettings as NvimPluginSettings } from "../../../bindings.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** nvim — linked provisioning, patches a colorscheme line via regex. */
export function NvimSettings(
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
        onWriteNvimSettings,
        writingNvimSettings,
        nvimSettingsResult,
    }: AdapterPageProps,
) {
    // The adapters route remounts this page on every adapter switch, so the
    // draft starts from the saved settings each time it appears.
    const saved = appConfig.settings ?? null;
    const [draft, setDraft] = useState<NvimPluginSettings | null>(saved);
    const settings = draft ?? saved;
    const dirty = settings !== null && saved !== null &&
        JSON.stringify(settings) !== JSON.stringify(saved);

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
                        value={appConfig.config_path ?? ""}
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
                {editableFields.has("settings_path") && (
                    <DraftField
                        label="SETTINGS_PATH"
                        note="LUA FILE FOR THE MANAGED OPTIONS BLOCK"
                        value={appConfig.settings_path ?? ""}
                        onCommit={(value) => onFieldCommit("settings_path", value)}
                        pathKind="file"
                        onPickPath={onPickPath}
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
            {settings && onWriteNvimSettings && (
                <NvimSettingsPanel
                    settings={settings}
                    dirty={dirty}
                    saving={writingNvimSettings ?? false}
                    resultMessage={nvimSettingsResult?.message ?? undefined}
                    resultFailed={nvimSettingsResult?.status === "error"}
                    onChange={setDraft}
                    onSave={() => onWriteNvimSettings(settings)}
                    onReset={() => setDraft(saved)}
                />
            )}
            <ClassDefinition provisioning="linked" />
        </div>
    );
}
