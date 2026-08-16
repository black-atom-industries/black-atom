/**
 * Command-line search prompt. Searches names only; filters live in chips/dialog.
 * @startingPoint section="Forms" subtitle="» prompt with block caret and n/m counter" viewport="700x80"
 */
export interface PromptProps {
    /** Current query. Empty string renders the placeholder. */
    value?: string;
    placeholder?: string;
    /** Match counter, e.g. "2/24". */
    count?: string;
    /** Focused/typing state: positive border + block caret. */
    focused?: boolean;
    style?: React.CSSProperties;
}
