import type { InstallMethod } from "#/components/install-tabs/index.ts";
import type { RichTextSegment } from "#/components/rich-text/index.ts";
import type { HighlightSection } from "#/lib/highlights.ts";

/** Copy with inline keys, code and placeholders, rendered by `RichText`. */
type RichText = readonly RichTextSegment[];

export const productKeys = ["black-atom", "livery", "iter", "radar"] as const;

type ProductKey = (typeof productKeys)[number];

type Feature = {
    title: string;
    body: RichText;
};

type Demo = {
    kicker: string;
    title: string;
    body: RichText;
    media: { src: string; alt: string; width: number; height: number };
};

type Keymap = {
    title: string;
    rows: readonly { keys: readonly string[]; label: string }[];
    note: string;
};

export type Product = {
    key: ProductKey;
    name: string;
    /** Position in the site's numbering, such as `02`. */
    number: string;
    kicker: string;
    tagline?: string;
    lead: RichText;
    /** Meta description of the product's page. */
    description: string;
    /** Short pitch on the studio page. */
    summary: RichText;
    /** Where it runs, in one line, for the studio page. */
    platform: string;
    /** Requirements and licence under the hero pitch. */
    facts: readonly string[];
    repoUrl: string;
    /**
     * What the changelog reads: the GitHub repository, the paths its commits are filtered by (all
     * commits when empty), and the release highlight subheadings that belong to the product.
     */
    changelog: {
        repo: string;
        paths: readonly string[];
        sections: readonly HighlightSection[];
    };
    install: { note?: string; methods: readonly InstallMethod[] };
    steps?: { id: string; title: string; items: readonly Feature[] };
    keymap?: Keymap;
    demos?: { layout: "rows" | "grid"; items: readonly Demo[] };
    features?: readonly Feature[];
    /** Accessible description of the hero illustration. */
    artLabel?: string;
};
