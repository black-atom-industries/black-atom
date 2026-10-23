import type { RichTextSegment } from "#/components/rich-text/index.ts";

const highlightSections = ["Themes", "Livery", "Core"] as const;

export type HighlightSection = (typeof highlightSections)[number];

export type Highlight = {
    /** The heading text, with `code` spans as mono segments. */
    title: RichTextSegment[];
    /** The product subheading the item sits under. Without one, it counts for every product. */
    section?: HighlightSection;
};

function toSection(title: string): HighlightSection | undefined {
    return highlightSections.find((section) => section === title);
}

function toSegments(title: string): RichTextSegment[] {
    return title
        .split(/`([^`]+)`/)
        .map((part, index) => (index % 2 === 1 ? { mono: part } : part))
        .filter((segment) => segment !== "");
}

/** The text of segments, without markup. */
export function plainText(segments: readonly RichTextSegment[]): string {
    return segments
        .map((segment) => (typeof segment === "string" ? segment : Object.values(segment).join("")))
        .join("");
}

/**
 * The items of a release body's `### Highlights`. Each `#### ` heading is an item, except a product
 * subheading (`#### Themes`, `#### Livery`, `#### Core`), whose `##### ` headings are its items.
 */
export function parseHighlights(body: string): Highlight[] {
    const highlights: Highlight[] = [];
    let isInHighlights = false;
    let isInFence = false;
    let section: HighlightSection | undefined;

    for (const line of body.split("\n")) {
        if (/^\s*(```|~~~)/.test(line)) {
            isInFence = !isInFence;
            continue;
        }
        if (isInFence) continue;

        if (line.trim() === "### Highlights") {
            isInHighlights = true;
            continue;
        }
        if (!isInHighlights) continue;
        if (line.startsWith("### ") || line.startsWith("## ")) break;

        if (line.startsWith("#### ")) {
            const title = line.slice(5).trim();
            section = toSection(title);
            if (section === undefined) highlights.push({ title: toSegments(title) });
        } else if (line.startsWith("##### ") && section !== undefined) {
            highlights.push({ title: toSegments(line.slice(6).trim()), section });
        }
    }

    return highlights;
}

/** Highlight titles that count for a product shown under the given subheadings. */
export function highlightsFor(
    highlights: readonly Highlight[],
    sections: readonly HighlightSection[],
): RichTextSegment[][] {
    return highlights
        .filter(
            (highlight) => highlight.section === undefined || sections.includes(highlight.section),
        )
        .map((highlight) => highlight.title);
}
