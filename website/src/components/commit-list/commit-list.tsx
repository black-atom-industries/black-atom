import styles from "./commit-list.module.css";

export type Commit = {
    sha: string;
    message: string;
    date: string;
    href?: string;
};

type Props = {
    title: string;
    commits: readonly Commit[];
};

export function CommitList({ title, commits }: Props) {
    return (
        <section data-component="CommitList" className={styles.root}>
            <h3 className={styles.title}>
                <i aria-hidden="true" className={styles.live} />
                {title}
            </h3>
            <ul className={styles.list}>
                {commits.map((commit) => (
                    <li key={commit.sha} className={styles.commit}>
                        <code className={styles.sha}>{commit.sha}</code>
                        {commit.href === undefined ? (
                            <span>{commit.message}</span>
                        ) : (
                            <a href={commit.href}>{commit.message}</a>
                        )}
                        <span className={styles.date}>{commit.date}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
