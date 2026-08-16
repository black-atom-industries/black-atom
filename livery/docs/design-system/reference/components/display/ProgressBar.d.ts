/**
 * 3px determinate progress bar. No indeterminate spinners exist in this system.
 */
export interface ProgressBarProps {
    /** 0–100. */
    value?: number;
    intent?: "positive" | "negative";
    style?: React.CSSProperties;
}
