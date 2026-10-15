import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    DraftField,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import { ConfigFolderList } from "./config-folder-list.tsx";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** Claude Code — merged provisioning. Livery copies the unpacked theme to
 * themes/black-atom.json in each configured config folder on every switch. */
export function ClaudeCodeSettings({
    appConfig,
    editableFields,
    detected,
    onToggleEnabled,
    onFieldCommit,
    firstFieldRef,
    onPickPath,
    onAddConfigFolder,
    onRemoveConfigFolder,
    configFoldersSaving,
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
                appName="claude-code"
                appConfig={appConfig}
                detected={detected}
                onToggleEnabled={onToggleEnabled}
                verifyPathResult={verifyPathResult}
            />
            <div className={styles.fieldGrid}>
                <ConfigFolderList
                    configFolders={appConfig.config_folders ?? []}
                    onAddConfigFolder={onAddConfigFolder}
                    onRemoveConfigFolder={onRemoveConfigFolder}
                    configFoldersSaving={configFoldersSaving}
                    verifyPathResult={verifyPathResult}
                />
                {editableFields.has("themes_path") && (
                    <DraftField
                        label="THEMES_PATH"
                        optional
                        note="WHERE THEME FILES LIVE"
                        value={appConfig.themes_path ?? ""}
                        onCommit={(value) => onFieldCommit("themes_path", value)}
                        inputRef={firstFieldRef}
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
                After the first apply, select Black Atom in /theme once per config folder. Restart
                Claude Code first if its themes folder did not exist before.
            </PrerequisiteNote>
        </div>
    );
}
