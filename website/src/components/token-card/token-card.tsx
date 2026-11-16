import { useColorSource } from "#/hooks/use-color-source.ts";
import { formatOklch } from "#/lib/format-oklch.ts";
import { ContrastGrade } from "#/components/contrast-grade/index.ts";
import { SourcePaths } from "#/components/color-source/index.ts";
import styles from "./token-card.module.css";

type Props = {
    name: string;
    /** The token's hex color. */
    color: string;
    /** The background the token is drawn on, when it is a foreground. */
    on?: string;
    purpose: string;
    /** The color's path in the theme, to name where it comes from. */
    path?: string;
    ratio?: number;
    isLine?: boolean;
};

/** One theme token: its swatch, name, purpose, value, source and, for text, its contrast grade. */
export function TokenCard({ name, color, on, purpose, path, ratio, isLine = false }: Props) {
    const source = useColorSource(path);
    const swatchStyle = on === undefined ? { background: color } : { color, background: on };
    const swatchText = on === undefined ? null : isLine ? "│" : "Aa";

    return (
        <div data-component="TokenCard" className={styles.root}>
            <span aria-hidden="true" className={styles.swatch} style={swatchStyle}>
                {swatchText}
            </span>
            <div className={styles.text}>
                <div className={styles.header}>
                    <span className={styles.name}>{name}</span>
                    {ratio !== undefined && <ContrastGrade ratio={ratio} isLine={isLine} />}
                </div>
                <span className={styles.purpose}>{purpose}</span>
                <dl className={styles.data}>
                    <dt className={styles.label}>value</dt>
                    <dd className={styles.value}>
                        {color} · {formatOklch(color)}
                    </dd>
                    {source !== undefined && (
                        <>
                            <dt className={styles.label}>{source.label}</dt>
                            <dd className={styles.source}>
                                <SourcePaths source={source} />
                            </dd>
                        </>
                    )}
                </dl>
            </div>
        </div>
    );
}
