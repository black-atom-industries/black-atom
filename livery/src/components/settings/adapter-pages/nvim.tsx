import { useState } from "react";
import { ActionRow, AdapterHeader, ClassDefinition } from "../adapter-shared/index.ts";
import { NvimSettingsPanel } from "../nvim-settings-panel/index.ts";
import type { NvimSettings as NvimPluginSettings } from "../../../bindings.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** nvim — linked provisioning without a config pointer. The plugin reads the theme and options
    from Livery's config, so this page has no paths to set. */
export function NvimSettings({
    appConfig,
    detected,
    onToggleEnabled,
    onSetUp,
    setUpResult,
    onVerifyPath,
    verifyPathResult,
    linkable,
    onLinkThemes,
    linkThemesResult,
    onTestApply,
    testApplyResult,
    onSaveNvimSettings,
    savingNvimSettings,
    nvimSettingsResult,
}: AdapterPageProps) {
    // The adapters route remounts this page on every adapter switch, so the
    // draft starts from the saved settings each time it appears.
    const saved = appConfig.settings ?? null;
    const [draft, setDraft] = useState<NvimPluginSettings | null>(saved);
    const settings = draft ?? saved;
    const dirty =
        settings !== null && saved !== null && JSON.stringify(settings) !== JSON.stringify(saved);

    return (
        <div className={styles.root}>
            <AdapterHeader
                appName="nvim"
                appConfig={appConfig}
                detected={detected}
                onToggleEnabled={onToggleEnabled}
                verifyPathResult={verifyPathResult}
            />
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
            {settings && onSaveNvimSettings && (
                <NvimSettingsPanel
                    settings={settings}
                    dirty={dirty}
                    saving={savingNvimSettings ?? false}
                    resultMessage={nvimSettingsResult?.message ?? undefined}
                    resultFailed={nvimSettingsResult?.status === "error"}
                    onChange={setDraft}
                    onSave={() => onSaveNvimSettings(settings)}
                    onReset={() => setDraft(saved)}
                />
            )}
            <ClassDefinition provisioning="linked" />
        </div>
    );
}
