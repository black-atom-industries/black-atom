/**
 * Bordered uppercase tag. mini = single-letter list-row tag (D/L).
 */
export interface BadgeProps {
    size?: "default" | "mini";
    children: React.ReactNode;
    style?: React.CSSProperties;
}
