import { formatOklch } from "#/lib/format-oklch.ts";
import { ContrastGrade } from "#/components/contrast-grade/index.ts";
import styles from "./token-card.module.css";

type Props = {
    name: string;
    /** The token's hex color. */
    color: string;
    /** The background the token is drawn on, when it is a foreground. */
    on?: string;
    purpose: string;
    ratio?: number;
    isLine?: boolean;
};

/** One theme token: its swatch, name, value, purpose and, for text, its contrast grade. */
export function TokenCard({ name, color, on, purpose, ratio, isLine = false }: Props) {
    const swatchStyle = on === undefined ? { background: color } : { color, background: on };
    const swatchText = on === undefined ? null : isLine ? "│" : "Aa";

    return (
        <div data-component="TokenCard" className={styles.root}>
            <span aria-hidden="true" className={styles.swatch} style={swatchStyle}>
                {swatchText}
            </span>
            <div className={styles.text}>
                <span className={styles.name}>{name}</span>
                <span className={styles.value}>
                    {color} · {formatOklch(color)}
                </span>
                <span className={styles.purpose}>{purpose}</span>
            </div>
            {ratio !== undefined && <ContrastGrade ratio={ratio} isLine={isLine} />}
        </div>
    );
}
