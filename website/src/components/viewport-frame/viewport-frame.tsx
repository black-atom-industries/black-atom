import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
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
    const isScrolled = useIsScrolledPast(0);
    const isNearTop = !useIsScrolledPast(LABEL_SCROLL_SHARE);
    const topRef = useRef<HTMLDivElement>(null);
    useHeaderHeight(topRef);

    return (
        <div data-component="ViewportFrame" className={styles.root}>
            <div className={styles.frame}>
                <div ref={topRef} className={styles.top} data-scrolled={isScrolled || undefined}>
                    {header}
                </div>
                <div className={styles.bottom} data-scrolled={isScrolled || undefined}>
                    {dock}
                </div>
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

/** Whether the page has scrolled further than `share` of the viewport height. */
function useIsScrolledPast(share: number) {
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
        const update = () => setIsPast(scrollY > innerHeight * share);
        update();
        addEventListener("scroll", update, { passive: true });
        return () => removeEventListener("scroll", update);
    }, [share]);

    return isPast;
}

/** Publishes the header row's height as `--ba-header-height`, so anchor jumps land below it. */
function useHeaderHeight(ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const element = ref.current;
        if (element === null) return;

        const root = document.documentElement;
        const observer = new ResizeObserver(() => {
            root.style.setProperty("--ba-header-height", `${element.offsetHeight}px`);
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
            root.style.removeProperty("--ba-header-height");
        };
    }, [ref]);
}
