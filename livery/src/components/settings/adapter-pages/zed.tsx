import { ActionRow, AdapterHeader, ClassDefinition, DraftField } from "../adapter-shared/index.ts";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** zed — linked provisioning, patches the JSONC settings theme key(s)
    structurally; no regex fields to offer. */
export function ZedSettings(
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
                appName="zed"
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
        </div>
    );
}
