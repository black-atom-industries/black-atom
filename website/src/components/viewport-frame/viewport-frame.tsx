import { useEffect, useState, type ReactNode } from "react";
import styles from "./viewport-frame.module.css";

type Props = {
    /** Sits along the top edge, inside the frame. */
    header: ReactNode;
    /** Sits in the bottom-right corner, inside the frame. */
    dock: ReactNode;
    /**
     * The page's heading, set into the bottom edge (the left edge on narrow screens). It fades into
     * the rule once the page scrolls past its first screen.
     */
    label?: string;
};

/** Share of the viewport height scrolled before the edge label gives way to the rule. */
const LABEL_SCROLL_SHARE = 0.3;

/**
 * A cornered frame fixed to the viewport. The header and the dock live inside it, so their spacing
 * comes from `--ba-frame-inset` and `--ba-frame-gap` alone.
 */
export function ViewportFrame({ header, dock, label }: Props) {
    const isNearTop = useIsNearTop();

    return (
        <div data-component="ViewportFrame" className={styles.root}>
            <div className={styles.frame}>
                <div className={styles.top}>{header}</div>
                <div className={styles.bottom}>{dock}</div>
                <div className={styles.edge}>
                    <span className={styles.rule} aria-hidden />
                    {label !== undefined && (
                        <span className={styles.label} data-shown={isNearTop || undefined}>
                            <h1 className={styles.text}>{label}</h1>
                        </span>
                    )}
                    <span className={styles.rule} aria-hidden />
                </div>
            </div>
        </div>
    );
}

function useIsNearTop() {
    const [isNearTop, setIsNearTop] = useState(true);

    useEffect(() => {
        const update = () => setIsNearTop(scrollY < innerHeight * LABEL_SCROLL_SHARE);
        update();
        addEventListener("scroll", update, { passive: true });
        return () => removeEventListener("scroll", update);
    }, []);

    return isNearTop;
}
