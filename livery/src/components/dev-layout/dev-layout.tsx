import styles from "./dev-layout.module.css";

interface Props {
    nav: React.ReactNode;
    aside: React.ReactNode;
    children: React.ReactNode;
}

export function DevLayout({ nav, aside, children }: Props) {
    return (
        <div data-layout="dev-layout" className={styles.root}>
            <nav className={styles.nav}>{nav}</nav>
            <main className={styles.main}>{children}</main>
            <aside className={styles.aside}>{aside}</aside>
        </div>
    );
}
