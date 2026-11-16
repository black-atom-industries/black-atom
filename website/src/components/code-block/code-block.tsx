import { cva } from "cva";
import styles from "./code-block.module.css";

export type CodeLine = {
    /** Shown dimmed and left out of a text selection, such as `$ `. */
    prompt?: string;
    text: string;
    /** Trailing text in the accent colour. */
    accent?: string;
    comment?: string;
};

const codeBlockVariants = cva({
    base: styles.root,
    variants: {
        isWrapped: { false: styles.scroll, true: styles.wrapped },
    },
});

type Props = {
    lines: readonly CodeLine[];
    /** Wrap long lines instead of scrolling sideways. */
    isWrapped?: boolean;
};

export function CodeBlock({ lines, isWrapped = false }: Props) {
    return (
        <div
            data-component="CodeBlock"
            className={codeBlockVariants({ isWrapped })}
            tabIndex={isWrapped ? undefined : 0}
        >
            {lines.map((line) => (
                <code key={line.text} className={styles.line}>
                    {line.prompt !== undefined && (
                        <span className={styles.prompt}>{line.prompt}</span>
                    )}
                    {line.text}
                    {line.accent !== undefined && <b className={styles.accent}>{line.accent}</b>}
                    {line.comment !== undefined && (
                        <span className={styles.comment}>{line.comment}</span>
                    )}
                </code>
            ))}
        </div>
    );
}
