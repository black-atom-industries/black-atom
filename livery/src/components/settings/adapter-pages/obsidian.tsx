import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import { ConfigFolderList } from "./config-folder-list.tsx";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** Obsidian uses linked provisioning for each configured config folder. */
export function ObsidianSettings({
    appConfig,
    detected,
    onToggleEnabled,
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
                appName="obsidian"
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
                Add config folders, then run SET UP. Livery applies the theme to each configured
                folder.
            </PrerequisiteNote>
        </div>
    );
}
