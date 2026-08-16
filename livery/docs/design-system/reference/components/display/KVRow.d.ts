/**
 * Datasheet key-value row: label left, value right.
 */
export interface KVRowProps {
    /** Uppercase key, e.g. "COLLECTION". */
    label: string;
    children: React.ReactNode;
    /** Tint the value, e.g. "■ SYNCED" positive. */
    intent?: "positive" | "warn" | "negative";
    style?: React.CSSProperties;
}
