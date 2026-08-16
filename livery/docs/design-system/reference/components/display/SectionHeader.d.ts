/**
 * Uppercase mono label + hairline rule. The primary structural pattern
 * (datasheet sections, list collection groups).
 */
export interface SectionHeaderProps {
    /** Label, e.g. "PRIMARIES · 12", "JPN — JAPAN (4)". */
    children: React.ReactNode;
    /** Right-aligned meta, e.g. "REV 03". */
    meta?: React.ReactNode;
    style?: React.CSSProperties;
}
