import { Slider } from "@base-ui/react/slider";
import styles from "./range-field.module.css";

type Props = {
    label: string;
    /** Shown next to the label, such as `96 BPM`. */
    valueText: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onValueChange: (value: number) => void;
};

export function RangeField({ label, valueText, value, min, max, step = 1, onValueChange }: Props) {
    return (
        <Slider.Root
            data-component="RangeField"
            className={styles.root}
            value={value}
            min={min}
            max={max}
            step={step}
            onValueChange={onValueChange}
        >
            <div className={styles.head}>
                <Slider.Label className={styles.label}>{label}</Slider.Label>
                <span className={styles.label}>{valueText}</span>
            </div>
            <Slider.Control className={styles.control}>
                <Slider.Track className={styles.track}>
                    <Slider.Indicator className={styles.indicator} />
                    <Slider.Thumb className={styles.thumb} aria-valuetext={valueText} />
                </Slider.Track>
            </Slider.Control>
        </Slider.Root>
    );
}
