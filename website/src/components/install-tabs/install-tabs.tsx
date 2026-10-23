import { Tabs } from "@base-ui/react/tabs";
import { CodeBlock, type CodeLine } from "#/components/code-block/index.ts";
import styles from "./install-tabs.module.css";

export type InstallMethod = {
    id: string;
    label: string;
    lines: readonly CodeLine[];
    note?: string;
    /** Announced but not available yet: the tab shows and stays disabled. */
    isSoon?: boolean;
};

type Props = {
    methods: readonly InstallMethod[];
    /** Accessible name of the tab list. */
    label: string;
    soonLabel: string;
};

export function InstallTabs({ methods, label, soonLabel }: Props) {
    const available = methods.filter((method) => !method.isSoon);

    return (
        <Tabs.Root
            data-component="InstallTabs"
            className={styles.root}
            defaultValue={available[0]?.id}
        >
            <Tabs.List className={styles.list} aria-label={label}>
                {methods.map((method) => (
                    <Tabs.Tab
                        key={method.id}
                        value={method.id}
                        disabled={method.isSoon}
                        className={styles.tab}
                    >
                        {method.label}
                        {method.isSoon && <em className={styles.soon}>{soonLabel}</em>}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
            {available.map((method) => (
                <Tabs.Panel key={method.id} value={method.id} className={styles.panel}>
                    <CodeBlock lines={method.lines} isWrapped />
                    {method.note !== undefined && <p className={styles.note}>{method.note}</p>}
                </Tabs.Panel>
            ))}
        </Tabs.Root>
    );
}
