import type { ReactNode } from "react";
import { cva } from "cva";
import styles from "./data-table.module.css";

const cellVariants = cva({
    variants: {
        tone: { default: null, mono: styles.mono, subtle: styles.subtle },
    },
});

export type Column = {
    label: string;
    tone?: "default" | "mono" | "subtle";
};

type Props = {
    /** Accessible name of the table. */
    label: string;
    columns: readonly Column[];
    rows: readonly { key: string; cells: readonly ReactNode[] }[];
};

/** Scrolls sideways on its own when it is wider than the page. */
export function DataTable({ label, columns, rows }: Props) {
    return (
        <div
            data-component="DataTable"
            className={styles.root}
            role="region"
            aria-label={label}
            tabIndex={0}
        >
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.label} scope="col">
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            {row.cells.map((cell, index) => (
                                <td
                                    key={columns[index]?.label ?? index}
                                    className={cellVariants({ tone: columns[index]?.tone })}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
