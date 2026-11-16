import type { ReactNode } from "react";
import { cva } from "cva";
import type { ThemeVar } from "#/lib/theme-vars.ts";
import styles from "./theme-card.module.css";

const cardVariants = cva({
    base: styles.root,
    variants: {
        isWorn: { false: null, true: styles.worn },
    },
});

const swatchVars = [
    "--ba-c-red",
    "--ba-c-yellow",
    "--ba-c-green",
    "--ba-c-cyan",
    "--ba-c-blue",
    "--ba-c-magenta",
    "--ba-accent",
    "--ba-fg",
] as const satisfies readonly ThemeVar[];

type Props = {
    name: string;
    appearance: string;
    shortKey: string;
    /** The card's own theme, from `themeToCustomProperties`. Everything inside renders in it. */
    vars: Record<ThemeVar, string>;
    isWorn?: boolean;
    actions: ReactNode;
};

export function ThemeCard({ name, appearance, shortKey, vars, isWorn = false, actions }: Props) {
    return (
        <article data-component="ThemeCard" className={cardVariants({ isWorn })} style={vars}>
            <h4 className={styles.name}>
                <span>{name}</span>
                <span className={styles.subtle}>{appearance}</span>
            </h4>
            <div aria-hidden="true" className={styles.swatches}>
                {swatchVars.map((name) => (
                    <i key={name} style={{ background: `var(${name})` }} />
                ))}
            </div>
            <code aria-hidden="true" className={styles.sample}>
                <span className={styles.keyword}>local</span>{" "}
                <span className={styles.func}>theme</span> ={" "}
                <span className={styles.string}>"{shortKey}"</span>
            </code>
            <div className={styles.actions}>{actions}</div>
        </article>
    );
}
