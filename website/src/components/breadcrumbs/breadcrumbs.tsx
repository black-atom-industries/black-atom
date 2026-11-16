import type { ReactElement } from "react";
import { useRender } from "@base-ui/react/use-render";
import styles from "./breadcrumbs.module.css";

export type Crumb = {
    label: string;
    /** The link element; the last crumb, the current page, has none. */
    render?: ReactElement;
};

function CrumbLink({ crumb }: { crumb: Crumb }) {
    return useRender({
        defaultTagName: "a",
        render: crumb.render,
        props: { className: styles.link, children: crumb.label },
    });
}

export function Breadcrumbs({ label, crumbs }: { label: string; crumbs: readonly Crumb[] }) {
    return (
        <nav data-component="Breadcrumbs" aria-label={label}>
            <ol className={styles.root}>
                {crumbs.map((crumb) => (
                    <li key={crumb.label} className={styles.crumb}>
                        {crumb.render === undefined ? (
                            <span aria-current="page">{crumb.label}</span>
                        ) : (
                            <CrumbLink crumb={crumb} />
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
