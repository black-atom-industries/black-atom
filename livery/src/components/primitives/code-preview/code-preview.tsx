import { cva } from "cva";
import styles from "./code-preview.module.css";

export const codePreviewVariants = cva({
    base: styles.root,
});

type Props = {
    /** Pre-colored line segments — compose with `CodeToken`. */
    children: React.ReactNode;
    className?: string;
};

/**
 * Recessed code sample surface. Chrome only — syntax colors are theme
 * content, supplied by the caller as `CodeToken` children, never tokens.
 *
 * Spec: docs/design-system/reference/components/display/CodePreview.jsx
 */
export function CodePreview({ children, className }: Props) {
    return (
        <div data-component="code-preview" className={codePreviewVariants({ className })}>
            {children}
        </div>
    );
}
