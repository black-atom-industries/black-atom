/**
 * Modal dialog frame (e.g. the f-key filter popup). Strong border,
 * subtle surface, no backdrop blur, no shadow — the page behind dims to 30%.
 */
export interface DialogProps {
    title: string;
    /** Right-side header hint. Default "esc CLOSE". */
    hint?: string;
    /** Footer left slot, e.g. live result count "12 THEMES MATCH". */
    footerLeft?: React.ReactNode;
    /** Footer right slot, e.g. key vocabulary. */
    footerRight?: React.ReactNode;
    children: React.ReactNode;
    style?: React.CSSProperties;
}
