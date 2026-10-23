import styles from "./release-list.module.css";

export type Release = {
    version: string;
    date: string;
    /** Shown when releases of several products share one list. */
    product?: string;
    highlights: readonly string[];
};

type Props = {
    title: string;
    releases: readonly Release[];
};

export function ReleaseList({ title, releases }: Props) {
    return (
        <section data-component="ReleaseList" className={styles.root}>
            <h3 className={styles.title}>{title}</h3>
            {releases.map((release) => (
                <article
                    key={`${release.product ?? ""}${release.version}`}
                    className={styles.release}
                >
                    <div className={styles.version}>
                        <b>{release.version}</b>
                        <span className={styles.caption}>{release.date}</span>
                        {release.product !== undefined && (
                            <span className={styles.product}>{release.product}</span>
                        )}
                    </div>
                    <ul className={styles.highlights}>
                        {release.highlights.map((highlight) => (
                            <li key={highlight}>{highlight}</li>
                        ))}
                    </ul>
                </article>
            ))}
        </section>
    );
}
