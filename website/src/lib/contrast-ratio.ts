/** Linear light of one sRGB channel of a `#rrggbb` color. */
function linearChannel(hex: string, start: number): number {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
    return (
        0.2126 * linearChannel(hex, 1) +
        0.7152 * linearChannel(hex, 3) +
        0.0722 * linearChannel(hex, 5)
    );
}

/** WCAG 2.1 contrast ratio of two `#rrggbb` colors, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
    const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
}
