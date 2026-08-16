type Props = {
    /** Raw palette hex, e.g. "#C46A5A". Content, not a token. */
    color: string;
    children: React.ReactNode;
};

/**
 * Inline syntax-colored span for `CodePreview` content.
 *
 * Convention: comments = mid primary, keywords = red, functions = blue,
 * strings = green, types = yellow.
 */
export function CodeToken({ color, children }: Props) {
    return <span style={{ color }}>{children}</span>;
}
