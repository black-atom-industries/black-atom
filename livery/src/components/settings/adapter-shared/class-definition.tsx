import type { ThemeProvisioning } from "../../../bindings.ts";
import { provisioningCopy } from "../../../lib/adapter-copy.ts";
import { Badge } from "../../primitives/badge/badge.tsx";
import styles from "./adapter-shared.module.css";

type Props = {
    provisioning: ThemeProvisioning;
};

/** The provisioning class itself: label, class name, definition. Same
    content for every adapter of the same class — adapter-specific setup
    notes live on the page below this, not in here. */
export function ClassDefinition({ provisioning }: Props) {
    return (
        <div className={styles.classDefinition}>
            <div className={styles.classDefinitionHeader}>
                <span className={styles.classDefinitionLabel}>CLASS</span>
                <Badge>{provisioning}</Badge>
            </div>
            <p className={styles.classDescription}>{provisioningCopy[provisioning]}</p>
        </div>
    );
}
