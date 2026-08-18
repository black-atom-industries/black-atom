import { cva, type VariantProps } from "cva";
import { Badge } from "../badge/badge.tsx";
import { Swatch } from "../swatch/swatch.tsx";
import styles from "./list-row.module.css";

export const listRowVariants = cva({
    base: styles.root,
    variants: {
        selected: {
            true: styles.selected,
            false: "",
        },
        dimmed: {
            true: styles.dimmed,
            false: "",
        },
        indented: {
            true: styles.indented,
            false: "",
        },
    },
    defaultVariants: {
        selected: false,
        dimmed: false,
        indented: false,
    },
});

type Props = VariantProps<typeof listRowVariants> & {
    name: string;
    /** Mini palette pip colors (4). Content, not tokens — hidden when dimmed. */
    pips?: string[];
    /** Appearance letter: "D" | "L". */
    appearance?: string;
    /** Content between the name and the pips — e.g. an ACTIVE marker. Sits in
        a fixed-width slot, so pass it on every row of a list that uses it
        (empty where absent) and the pip column stays aligned down the list. */
    leading?: React.ReactNode;
    /** Extra content after the name/pips/appearance — e.g. a status badge. */
    trailing?: React.ReactNode;
    onClick?: () => void;
    /** Root element ref — e.g. to scroll the selected row into view. */
    rootRef?: React.Ref<HTMLDivElement>;
    className?: string;
};

/**
 * Keyboard-list row — cursor slot, name, mini palette pips, appearance tag.
 * Group rows under a SectionHeader per collection.
 *
 * Selection = hint surface + 2px positive left edge + `›` cursor, bold name.
 * `dimmed` marks a query miss — the row stays in place, never removed.
 * `indented` marks a permanent child row (e.g. an adapter under ADAPTERS).
 *
 * Spec: docs/design-system/reference/components/display/ListRow.jsx
 */
export function ListRow(
    {
        selected,
        dimmed,
        indented,
        name,
        pips,
        appearance,
        leading,
        trailing,
        onClick,
        rootRef,
        className,
    }: Props,
) {
    return (
        <div
            data-component="list-row"
            role="option"
            aria-selected={selected}
            tabIndex={0}
            onClick={onClick}
            ref={rootRef}
            className={listRowVariants({ selected, dimmed, indented, className })}
        >
            <span className={styles.cursor}>{selected ? "›" : ""}</span>
            <span className={selected ? `${styles.name} ${styles.nameSelected}` : styles.name}>
                {name}
            </span>
            {leading !== undefined ? <span className={styles.leading}>{leading}</span> : null}
            {pips && !dimmed ? <Swatch variant="pips" colors={pips} /> : null}
            {appearance ? <Badge size="mini">{appearance}</Badge> : null}
            {trailing}
        </div>
    );
}
