import type { ReactNode } from "react";
import { cva, type VariantProps } from "cva";
import styles from "./demo.module.css";

const demoVariants = cva({
    base: styles.root,
    variants: {
        layout: { row: styles.row, stacked: styles.stacked },
    },
});

type Props = VariantProps<typeof demoVariants> & {
    kicker: string;
    title: string;
    body: ReactNode;
    /** The clip or screen, usually a `MediaFrame`. */
    media: ReactNode;
};

/** A clip with its explanation: beside it in a row, or under it when stacked. */
export function Demo({ kicker, title, body, media, layout = "row" }: Props) {
    return (
        <article data-component="Demo" className={demoVariants({ layout })}>
            <div className={styles.text}>
                <p className={styles.kicker}>{kicker}</p>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.body}>{body}</p>
            </div>
            <div className={styles.media}>{media}</div>
        </article>
    );
}
