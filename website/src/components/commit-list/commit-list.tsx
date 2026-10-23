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
    /** Shown in place of the list when there are no commits. */
    emptyText?: string;
    /** Level of the list title in the page outline. */
    headingLevel?: 2 | 3;
};

export function CommitList({ title, commits, emptyText, headingLevel = 3 }: Props) {
    const Title = headingLevel === 2 ? "h2" : "h3";
    return (
        <section data-component="CommitList" className={styles.root}>
            <Title className={styles.title}>
                <i aria-hidden="true" className={styles.live} />
                {title}
            </Title>
            {commits.length === 0 && emptyText !== undefined && (
                <p className={styles.empty}>{emptyText}</p>
            )}
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
