import type { ReactNode } from "react";
import type { ThemeVar } from "#/lib/theme-vars.ts";
import styles from "./theme-scope.module.css";

type Props = {
    /** The theme everything inside renders in, from `themeToCustomProperties`. */
    vars: Record<ThemeVar, string>;
    children: ReactNode;
};

/** A panel that renders its content in another theme than the page's. */
export function ThemeScope({ vars, children }: Props) {
    return (
        <div data-component="ThemeScope" className={styles.root} style={vars}>
            {children}
        </div>
    );
}
