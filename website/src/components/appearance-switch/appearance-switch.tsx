import { useRender } from "@base-ui/react/use-render";
import type * as Theme from "@black-atom/core";
import { cva } from "cva";
import type { ReactElement } from "react";
import styles from "./appearance-switch.module.css";

const optionVariants = cva({
    base: styles.option,
    variants: {
        isActive: { false: null, true: styles.active },
    },
});

type Option = {
    label: string;
    isActive: boolean;
    /** The variant's theme. Without it the option is unavailable. */
    theme?: Theme.Definition;
    /** The element that links to the variant, such as `<a href="…" />`. */
    render?: ReactElement;
};

type Props = {
    label: string;
    options: readonly Option[];
};

type Bar = { color: string; width: number };

function thumbnailRows(theme: Theme.Definition): readonly (readonly Bar[])[] {
    const { syntax } = theme;
    return [
        [
            { color: syntax.keyword.default, width: 14 },
            { color: syntax.func.default, width: 24 },
            { color: syntax.punctuation.default, width: 10 },
        ],
        [
            { color: "transparent", width: 8 },
            { color: syntax.string.default, width: 28 },
            { color: syntax.number.default, width: 10 },
        ],
        [{ color: syntax.comment.default, width: 40 }],
    ];
}

function Thumbnail({ theme }: { theme: Theme.Definition | undefined }) {
    if (theme === undefined) {
        return <span aria-hidden="true" className={styles.emptyThumb} />;
    }
    return (
        <span
            aria-hidden="true"
            className={styles.thumb}
            style={{ background: theme.ui.bg.default, borderColor: theme.ui.fg.border }}
        >
            {thumbnailRows(theme).map((row, rowIndex) => (
                <span key={rowIndex} className={styles.row}>
                    {row.map((bar, index) => (
                        <i
                            key={index}
                            className={styles.bar}
                            style={{ background: bar.color, width: bar.width }}
                        />
                    ))}
                </span>
            ))}
        </span>
    );
}

function SwitchItem({ label, isActive, theme, render }: Option) {
    const isLink = theme !== undefined && render !== undefined;
    return useRender({
        render: isLink ? render : <button type="button" disabled />,
        props: {
            className: optionVariants({ isActive }),
            "aria-current": isActive ? "true" : undefined,
            children: (
                <>
                    <Thumbnail theme={theme} />
                    <span className={styles.label}>{label}</span>
                </>
            ),
        },
    });
}

/** Picks between the variants of one theme: a thumbnail of each, linked or unavailable. */
export function AppearanceSwitch({ label, options }: Props) {
    return (
        <div
            role="group"
            aria-label={label}
            data-component="AppearanceSwitch"
            className={styles.root}
        >
            {options.map((option) => (
                <SwitchItem key={option.label} {...option} />
            ))}
        </div>
    );
}
