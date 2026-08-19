import {
    ActionRow,
    AdapterHeader,
    ClassDefinition,
    findConfigFolderVerification,
    PrerequisiteNote,
} from "../adapter-shared/index.ts";
import { Button } from "../../primitives/button/button.tsx";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

/** Obsidian uses linked provisioning for each configured config folder. */
export function ObsidianSettings(
    {
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
                <div className={styles.fieldGridNote}>
                    CONFIG FOLDERS · {appConfig.config_folders?.length ?? 0} CONFIGURED
                </div>
                {(appConfig.config_folders ?? []).map((config_folder) => {
                    const verification = findConfigFolderVerification(
                        verifyPathResult,
                        config_folder,
                    );
                    return (
                        <div className={styles.configFolderRow} key={config_folder}>
                            <span className={styles.configFolderPath}>
                                {config_folder}
                                {verification && (
                                    <small>
                                        · {verification.exists ? "VERIFIED" : "NOT FOUND"}
                                    </small>
                                )}
                            </span>
                            <Button
                                className={styles.configFolderRemove}
                                intent="ghost"
                                onClick={() => onRemoveConfigFolder?.(config_folder)}
                                disabled={configFoldersSaving}
                            >
                                REMOVE
                            </Button>
                        </div>
                    );
                })}
                <Button
                    className={styles.configFolderAdd}
                    intent="secondary"
                    onClick={onAddConfigFolder}
                    disabled={configFoldersSaving}
                >
                    {configFoldersSaving ? "SAVING…" : "+ ADD CONFIG FOLDER"}
                </Button>
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
