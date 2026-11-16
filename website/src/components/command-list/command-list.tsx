import styles from "./command-list.module.css";

export type Command = {
    command: string;
    description: string;
};

export function CommandList({ commands }: { commands: readonly Command[] }) {
    return (
        <dl data-component="CommandList" className={styles.root}>
            {commands.map((entry) => (
                <div key={entry.command} className={styles.row}>
                    <dt>
                        <code className={styles.command}>{entry.command}</code>
                    </dt>
                    <dd className={styles.description}>{entry.description}</dd>
                </div>
            ))}
        </dl>
    );
}
