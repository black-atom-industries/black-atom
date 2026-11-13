/** Chroma under which a color is treated as neutral, so its hue is meaningless. */
const neutralChroma = 0.002;

function linearChannel(hex: string, start: number): number {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** A `#rrggbb` color as `oklch(L C H)`: lightness and chroma to two and three places, hue in degrees. */
export function formatOklch(hex: string): string {
    const red = linearChannel(hex, 1);
    const green = linearChannel(hex, 3);
    const blue = linearChannel(hex, 5);

    const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
    const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
    const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);

    const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const greenRed = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const blueYellow = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

    const chroma = Math.hypot(greenRed, blueYellow);
    const hue =
        chroma < neutralChroma
            ? 0
            : ((Math.atan2(blueYellow, greenRed) * 180) / Math.PI + 360) % 360;

    return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(3)} ${Math.round(hue)})`;
}
