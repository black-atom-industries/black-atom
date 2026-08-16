import type { ReactNode } from "react";

import classes from "./typo.module.css";

type Props =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"p">, "color" | "children">;

type HeadingProps =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"h1">, "color" | "children">;

type CodeProps =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"code">, "color" | "children">;

type MarkProps =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"mark">, "color" | "children">;

type ListProps =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"ol">, "color" | "children">;

type BQProps =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"blockquote">, "color" | "children">;

type SmallProps =
    & { children: ReactNode; color?: TypoColor }
    & Omit<React.ComponentProps<"small">, "color" | "children">;

function H1({ children, color = "default", ...rest }: HeadingProps) {
    return (
        <h1 data-component="Typo.H1" data-color={color} className={classes.TypoH1} {...rest}>
            {children}
        </h1>
    );
}
H1.displayName = "Typo.H1";

function H2({ children, color = "default", ...rest }: HeadingProps) {
    return (
        <h2 data-component="Typo.H2" data-color={color} className={classes.TypoH2} {...rest}>
            {children}
        </h2>
    );
}
H2.displayName = "Typo.H2";

function H3({ children, color = "default", ...rest }: HeadingProps) {
    return (
        <h3 data-component="Typo.H3" data-color={color} className={classes.TypoH3} {...rest}>
            {children}
        </h3>
    );
}
H3.displayName = "Typo.H3";

function H4({ children, color = "default", ...rest }: HeadingProps) {
    return (
        <h4 data-component="Typo.H4" data-color={color} className={classes.TypoH4} {...rest}>
            {children}
        </h4>
    );
}
H4.displayName = "Typo.H4";

function P({ children, color = "default", ...rest }: Props) {
    return (
        <p data-component="Typo.P" data-color={color} className={classes.TypoP} {...rest}>
            {children}
        </p>
    );
}
P.displayName = "Typo.P";

function Lead({ children, color = "subtle", ...rest }: Props) {
    return (
        <p data-component="Typo.Lead" data-color={color} className={classes.TypoLead} {...rest}>
            {children}
        </p>
    );
}
Lead.displayName = "Typo.Lead";

function Small({ children, color = "hint", ...rest }: SmallProps) {
    return (
        <small
            data-component="Typo.Small"
            data-color={color}
            className={classes.TypoSmall}
            {...rest}
        >
            {children}
        </small>
    );
}
Small.displayName = "Typo.Small";

function Blockquote({ children, color = "hint", ...rest }: BQProps) {
    return (
        <blockquote
            data-component="Typo.Blockquote"
            data-color={color}
            className={classes.TypoBlockquote}
            {...rest}
        >
            {children}
        </blockquote>
    );
}
Blockquote.displayName = "Typo.Blockquote";

function InlineCode({ children, color = "default", ...rest }: CodeProps) {
    return (
        <code
            data-component="Typo.InlineCode"
            data-color={color}
            className={classes.TypoInlineCode}
            {...rest}
        >
            {children}
        </code>
    );
}
InlineCode.displayName = "Typo.InlineCode";

function Highlight({ children, color = "default", ...rest }: MarkProps) {
    return (
        <mark
            data-component="Typo.Highlight"
            data-color={color}
            className={classes.TypoHighlight}
            {...rest}
        >
            {children}
        </mark>
    );
}
Highlight.displayName = "Typo.Highlight";

function OrderedList({ children, color = "default", ...rest }: ListProps) {
    return (
        <ol
            data-component="Typo.OrderedList"
            data-color={color}
            className={classes.TypoOrderedList}
            {...rest}
        >
            {children}
        </ol>
    );
}
OrderedList.displayName = "Typo.OrderedList";

function UnorderedList({ children, color = "default", ...rest }: ListProps) {
    return (
        <ul
            data-component="Typo.UnorderedList"
            data-color={color}
            className={classes.TypoUnorderedList}
            {...rest}
        >
            {children}
        </ul>
    );
}
UnorderedList.displayName = "Typo.UnorderedList";

/**
 * Typography primitives. Exposed as a namespace (`Typo.H1`, `Typo.P`, ...) rather
 * than flat exports — typography is a tight conceptual cluster and dot-notation
 * reads better at call sites that mix many of these together.
 */
export const Typo = {
    H1,
    H2,
    H3,
    H4,
    P,
    Lead,
    Small,
    Blockquote,
    InlineCode,
    Highlight,
    OrderedList,
    UnorderedList,
} as const;

/** All available color variants for data-color attribute. */
export const typoColors = [
    "default",
    "subtle",
    "hint",
    "accent",
    "contrast",
    "disabled",
    "positive",
    "negative",
    "warn",
    "info",
] as const;

export type TypoColor = typeof typoColors[number];

/** Font families available in the typography system (for documentation / dev). */
export const typoFonts = ["heading", "body", "mono"] as const;
export type TypoFont = typeof typoFonts[number];
