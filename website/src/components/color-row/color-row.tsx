import { ColorSource } from "#/components/color-source/index.ts";
import { ContrastGrade } from "#/components/contrast-grade/index.ts";
import styles from "./color-row.module.css";

type Props = {
    name: string;
    /** The color that carries the text, and its hex value. */
    color: string;
    /** The background the color is read on. */
    on: string;
    ratio: number;
    /** The color's path in the theme, to name where it comes from. */
    path?: string;
};

/** A text color drawn on its background, with its name, hex value, source and contrast grade. */
export function ColorRow({ name, color, on, ratio, path }: Props) {
    return (
        <div data-component="ColorRow" className={styles.root}>
            <span aria-hidden="true" className={styles.sample} style={{ color, background: on }}>
                Aa
            </span>
            <span className={styles.text}>
                <span className={styles.name}>{name}</span>
                <span className={styles.meta}>
                    <span>{color}</span>
                    {path !== undefined && <ColorSource path={path} />}
                </span>
            </span>
            <ContrastGrade ratio={ratio} />
        </div>
    );
}
