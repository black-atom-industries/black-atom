import { Fragment } from "react";
import { useColorSource } from "#/hooks/use-color-source.ts";
import type { SourceLine } from "#/lib/describe-source.ts";
import styles from "./color-source.module.css";

type Props = {
    /** The color's path in the theme, such as `feedback.success`. */
    path: string;
};

/** The slots of a source, each linking to its swatch on the page. */
export function SourcePaths({ source }: { source: SourceLine }) {
    const joiner = source.label === "is" ? " = " : " + ";

    return source.paths.map((path, index) => (
        <Fragment key={path}>
            {index > 0 && joiner}
            <a className={styles.link} href={`#${path}`}>
                {path}
            </a>
        </Fragment>
    ));
}

/** Where a theme color comes from, as one `is` or `from` line. */
export function ColorSource({ path }: Props) {
    const source = useColorSource(path);
    if (source === undefined) return null;

    return (
        <span data-component="ColorSource" className={styles.root}>
            <span className={styles.label}>{source.label}</span>
            {" "}
            <SourcePaths source={source} />
        </span>
    );
}
