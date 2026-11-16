import { Kbd } from "#/components/kbd/index.ts";
import styles from "./rich-text.module.css";

/** A `placeholder` marks a fact still to be filled in and shows highlighted. */
export type RichTextSegment = string | { kbd: string } | { mono: string } | { placeholder: string };

/** Inline copy with keys, code and placeholders; renders as text inside its parent. */
export function RichText({ segments }: { segments: readonly RichTextSegment[] }) {
    return segments.map((segment, index) => {
        if (typeof segment === "string") return segment;
        if ("kbd" in segment) return <Kbd key={index}>{segment.kbd}</Kbd>;
        if ("mono" in segment) {
            return (
                <code key={index} className={styles.mono}>
                    {segment.mono}
                </code>
            );
        }
        return (
            <mark key={index} className={styles.placeholder}>
                {segment.placeholder}
            </mark>
        );
    });
}
