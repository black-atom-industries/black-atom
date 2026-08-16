import { cva } from "cva";
import { Progress } from "@base-ui/react/progress";
import type { UpdateResult } from "../../../lib/updaters.ts";
import { getProgressState } from "../../../lib/progress.ts";
import styles from "./progress-bar.module.css";

const indicatorVariants = cva({
    base: styles.indicator,
    variants: {
        status: {
            idle: styles.indicatorIdle,
            running: styles.indicatorRunning,
            done: styles.indicatorDone,
            error: styles.indicatorError,
        },
    },
});

interface ProgressBarProps {
    results: UpdateResult[];
}

/**
 * 3px determinate progress bar — width-only fill transition, intent colors
 * via `--ba-color-fg-*`. No indeterminate spinners exist in this system.
 * Driven by real updater state via `getProgressState`.
 *
 * Spec: docs/design-system/reference/components/display/ProgressBar.jsx
 */
export function ProgressBar({ results }: ProgressBarProps) {
    const { value, completedCount, total, currentLabel, status, totalDurationMs } =
        getProgressState(results);

    const labelText = status === "running" && currentLabel
        ? `Applying ${currentLabel}...`
        : status === "done"
        ? "Done"
        : status === "error"
        ? "Completed with errors"
        : "Waiting...";

    return (
        <Progress.Root
            data-component="progress-bar"
            className={styles.root}
            value={value}
            max={100}
        >
            <Progress.Label className={styles.label}>
                {labelText}
            </Progress.Label>
            <span className={styles.counter}>
                {completedCount} / {total}
                {totalDurationMs != null && status !== "running" ? ` (${totalDurationMs}ms)` : ""}
            </span>
            <Progress.Track className={styles.track}>
                <Progress.Indicator
                    className={indicatorVariants({ status })}
                />
            </Progress.Track>
        </Progress.Root>
    );
}
