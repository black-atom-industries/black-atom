import type { ReactNode } from "react";
import styles from "./step-list.module.css";

export type Step = {
    title: string;
    body: ReactNode;
};

export function StepList({ steps }: { steps: readonly Step[] }) {
    return (
        <ol data-component="StepList" className={styles.root}>
            {steps.map((step, index) => (
                <li key={step.title} className={styles.step}>
                    <span aria-hidden="true" className={styles.number}>
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className={styles.content}>
                        <h3 className={styles.title}>{step.title}</h3>
                        <p className={styles.body}>{step.body}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
