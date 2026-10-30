import { z } from "zod";

/** `theme` belongs to the root route, which tints the site; `key` picks the one theme to show. */
export const themeLabSearch = z.object({
    key: z.string().optional(),
    base: z.string().optional(),
});
