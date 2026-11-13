import { ContrastGrade } from "#/components/contrast-grade/index.ts";
import styles from "./contrast-legend.module.css";

const grades = [
    { ratio: 7, meaning: "7:1 and up, comfortable for any text" },
    { ratio: 4.5, meaning: "4.5:1, fine for body text" },
    { ratio: 3, meaning: "3:1, only for large text and UI marks" },
    { ratio: 2, meaning: "under 3:1, hard to read" },
];

/** What each contrast grade means, with the grades drawn as they appear on the page. */
export function ContrastLegend() {
    return (
        <ul data-component="ContrastLegend" className={styles.root}>
            {grades.map((grade) => (
                <li key={grade.ratio} className={styles.item}>
                    <ContrastGrade ratio={grade.ratio} />
                    <span>{grade.meaning}</span>
                </li>
            ))}
            <li className={styles.item}>
                <ContrastGrade ratio={1} isLine />
                <span>Borders and guides, drawn and not read, so not graded</span>
            </li>
        </ul>
    );
}
