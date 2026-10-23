import type { ReactNode } from "react";
import styles from "./feature-grid.module.css";

export type Feature = {
    title: string;
    body: ReactNode;
};

export function FeatureGrid({ features }: { features: readonly Feature[] }) {
    return (
        <ul data-component="FeatureGrid" className={styles.root}>
            {features.map((feature) => (
                <li key={feature.title} className={styles.feature}>
                    <h4 className={styles.title}>{feature.title}</h4>
                    <p className={styles.body}>{feature.body}</p>
                </li>
            ))}
        </ul>
    );
}
