/**
 * Theme color display. Colors here are CONTENT (raw palette values),
 * the one sanctioned place for saturated color.
 */
export interface SwatchProps {
    /** band = full-width labeled bar (accents); cell = grid swatch + hex; pips = 7px mini row (list rows). */
    variant?: "band" | "cell" | "pips";
    /** The color (band/cell). */
    color?: string;
    /** Band label, e.g. "ACCENT · BURGUNDY". */
    label?: string;
    /** Hex caption; defaults to color. */
    hex?: string;
    /** Provenance tag on bands, e.g. "DERIVED FROM PALETTE.RED" for themes without defined accents. */
    tag?: string;
    /** Colors for variant="pips". */
    colors?: string[];
    style?: React.CSSProperties;
}
