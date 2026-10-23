import styles from "./meta-list.module.css";

export type MetaItem = {
    label: string;
    isStrong?: boolean;
};

export function MetaList({ items }: { items: readonly MetaItem[] }) {
    return (
        <ul data-component="MetaList" className={styles.root}>
            {items.map((item) => (
                <li key={item.label}>{item.isStrong ? <b>{item.label}</b> : item.label}</li>
            ))}
        </ul>
    );
}
