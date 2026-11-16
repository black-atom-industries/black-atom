import type { ReactNode } from "react";
import { RichText, type RichTextSegment } from "#/components/rich-text/index.ts";
import styles from "./release-list.module.css";

export type Release = {
    version: string;
    date?: string;
    /** Shown when releases of several products share one list. */
    product?: string;
    /** Each highlight is a title with inline code spans. */
    highlights: readonly (readonly RichTextSegment[])[];
};

type Props = {
    title: string;
    releases: readonly Release[];
    /** Shown in place of the list when there are no releases. */
    emptyText?: ReactNode;
    /** Level of the list title in the page outline. */
    headingLevel?: 2 | 3;
};

export function ReleaseList({ title, releases, emptyText, headingLevel = 3 }: Props) {
    const Title = headingLevel === 2 ? "h2" : "h3";
    return (
        <section data-component="ReleaseList" className={styles.root}>
            <Title className={styles.title}>{title}</Title>
            {releases.length === 0 && emptyText !== undefined && (
                <p className={styles.empty}>{emptyText}</p>
            )}
            {releases.map((release) => (
                <article
                    key={`${release.product ?? ""}${release.version}`}
                    className={styles.release}
                >
                    <div className={styles.version}>
                        <b>{release.version}</b>
                        {release.date !== undefined && (
                            <span className={styles.caption}>{release.date}</span>
                        )}
                        {release.product !== undefined && (
                            <span className={styles.product}>{release.product}</span>
                        )}
                    </div>
                    <ul className={styles.highlights}>
                        {release.highlights.map((highlight, index) => (
                            <li key={index}>
                                <RichText segments={highlight} />
                            </li>
                        ))}
                    </ul>
                </article>
            ))}
        </section>
    );
}
