import { ContrastGrade } from "#/components/contrast-grade/index.ts";
import styles from "./color-row.module.css";

type Props = {
    name: string;
    /** The color that carries the text, and its hex value. */
    color: string;
    /** The background the color is read on. */
    on: string;
    ratio: number;
};

/** A text color drawn on its background, with its name, hex value and contrast grade. */
export function ColorRow({ name, color, on, ratio }: Props) {
    return (
        <div data-component="ColorRow" className={styles.root}>
            <span aria-hidden="true" className={styles.sample} style={{ color, background: on }}>
                Aa
            </span>
            <span className={styles.name}>{name}</span>
            <span className={styles.hex}>{color}</span>
            <ContrastGrade ratio={ratio} />
        </div>
    );
}
