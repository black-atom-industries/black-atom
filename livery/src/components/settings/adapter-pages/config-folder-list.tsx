import { findConfigFolderVerification } from "../adapter-shared/index.ts";
import { Button } from "../../primitives/button/button.tsx";
import type { AdapterPageProps } from "./types.ts";
import styles from "./adapter-page.module.css";

type ConfigFolderListProps = Pick<
    AdapterPageProps,
    "onAddConfigFolder" | "onRemoveConfigFolder" | "configFoldersSaving" | "verifyPathResult"
> & {
    configFolders: string[];
};

/** The configured config folders of an app configured by config folders, each removable. */
export function ConfigFolderList({
    configFolders,
    onAddConfigFolder,
    onRemoveConfigFolder,
    configFoldersSaving,
    verifyPathResult,
}: ConfigFolderListProps) {
    return (
        <>
            <div className={styles.fieldGridNote}>
                CONFIG FOLDERS · {configFolders.length} CONFIGURED
            </div>
            {configFolders.map((config_folder) => {
                const verification = findConfigFolderVerification(verifyPathResult, config_folder);
                return (
                    <div className={styles.configFolderRow} key={config_folder}>
                        <span className={styles.configFolderPath}>
                            {config_folder}
                            {verification && (
                                <small>· {verification.exists ? "VERIFIED" : "NOT FOUND"}</small>
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
        </>
    );
}
