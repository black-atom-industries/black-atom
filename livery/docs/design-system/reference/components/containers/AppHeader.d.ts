/**
 * App header bar: wordmark + version left, uppercase context right.
 */
export interface AppHeaderProps {
    /** Product name appended to the wordmark. Default "LIVERY". */
    product?: string;
    /** e.g. "V0.3.0". */
    version?: string;
    /** Right-side context, e.g. "24 THEMES · 6 COLLECTIONS · ENV DARK" or "SETTINGS / ADAPTERS". */
    context?: React.ReactNode;
    style?: React.CSSProperties;
}
