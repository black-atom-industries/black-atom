import type { ReactElement } from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "cva";
import styles from "./pager.module.css";

const linkVariants = cva({
    base: styles.link,
    variants: {
        isNext: { false: null, true: styles.next },
    },
});

export type PagerLink = {
    label: string;
    title: string;
    /** The link element, such as a router `<Link>`. */
    render: ReactElement;
};

function PagerItem({ link, isNext }: { link: PagerLink; isNext: boolean }) {
    return useRender({
        defaultTagName: "a",
        render: link.render,
        props: {
            className: linkVariants({ isNext }),
            children: (
                <>
                    <span className={styles.label}>{link.label}</span>
                    <b className={styles.title}>{link.title}</b>
                </>
            ),
        },
    });
}

type Props = {
    label: string;
    previous: PagerLink;
    next: PagerLink;
};

export function Pager({ label, previous, next }: Props) {
    return (
        <nav data-component="Pager" className={styles.root} aria-label={label}>
            <PagerItem link={previous} isNext={false} />
            <PagerItem link={next} isNext />
        </nav>
    );
}
