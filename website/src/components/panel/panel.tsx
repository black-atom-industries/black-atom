import type { ReactNode } from "react";
import { cva, type VariantProps } from "cva";
import styles from "./panel.module.css";

const panelVariants = cva({
    base: styles.root,
    variants: {
        variant: {
            card: null,
            /** Sits behind text that lies directly on the background scene. */
            backdrop: styles.backdrop,
            /** Hero text set straight on the scene, over the hero's fade. */
            hero: styles.hero,
        },
        /** Shrinks to its content instead of filling the row. */
        isFitted: { true: styles.fitted },
    },
});

type Props = VariantProps<typeof panelVariants> & { children: ReactNode };

export function Panel({ variant = "card", isFitted = false, children }: Props) {
    return (
        <div data-component="Panel" className={panelVariants({ variant, isFitted })}>
            {children}
        </div>
    );
}
