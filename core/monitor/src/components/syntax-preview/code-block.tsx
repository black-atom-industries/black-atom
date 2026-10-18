import type { ReactNode } from "react";
import styles from "./code-block.module.css";

type Props = {
    children: ReactNode;
};

export function CodeBlock({ children }: Props) {
    return (
        <code className={styles.codeBlock} data-component="CodeBlock">
            {children}
        </code>
    );
}
